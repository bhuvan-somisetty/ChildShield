import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_colors.dart';
import '../../state/family_controller.dart';

/// ConnectChild — shown to the parent after ParentSetup completes.
/// Displays a 6-digit pairing code that the child enters on their device.
/// Polls every 3 s to detect when the child claims the code, then auto-
/// navigates to /home — matching frontend-v2 ConnectChild.jsx.
class ConnectChildScreen extends StatefulWidget {
  const ConnectChildScreen({super.key});
  @override
  State<ConnectChildScreen> createState() => _ConnectChildScreenState();
}

class _ConnectChildScreenState extends State<ConnectChildScreen>
    with SingleTickerProviderStateMixin {
  String _code = '';
  String? _childId;
  bool _loading = true;
  bool _copied = false;
  bool _connected = false;
  bool _regening = false;
  String? _error;

  Timer? _pollTimer;

  late final AnimationController _pulse = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1600),
  )..repeat(reverse: true);
  late final Animation<double> _pulseOp = Tween<double>(begin: 0.4, end: 0.9)
      .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  static const _prefKey = 'ag_pairing_v2';

  @override
  void initState() {
    super.initState();
    _initCode();
  }

  @override
  void dispose() {
    _pulse.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  // ── Code init: reuse cached childId or create a new pending child ──────────

  Future<void> _initCode() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefKey);
    if (stored != null) {
      final parts = stored.split(':');
      if (parts.length == 2) {
        if (mounted) setState(() { _childId = parts[0]; _code = parts[1]; _loading = false; });
        _startPolling();
        return;
      }
    }
    await _createCode();
  }

  Future<void> _createCode() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final fc = context.read<FamilyController>();
      final r = await fc.createChildWithPairing({
        'name': 'My Child', 'age': 10, 'grade': '', 'school': '', 'emoji': '🧒', 'color': '#10b981',
      });
      final pairing = r['pairing'] as Map<String, dynamic>;
      final child = r['child'] as Map<String, dynamic>;
      final code = pairing['code'] as String;
      final childId = child['id'] as String;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, '$childId:$code');
      if (mounted) setState(() { _code = code; _childId = childId; _loading = false; });
      _startPolling();
    } catch (e) {
      if (mounted) setState(() { _error = 'Could not generate a pairing code. Check your connection and retry.'; _loading = false; });
    }
  }

  Future<void> _regenerate() async {
    if (_regening) return;
    final childId = _childId;
    setState(() { _regening = true; _code = ''; _error = null; });
    _pollTimer?.cancel();
    try {
      final fc = context.read<FamilyController>();
      if (childId == null) { await _createCode(); return; }
      final r = await fc.regeneratePairing(childId);
      final pairing = r['pairing'] as Map<String, dynamic>;
      final child = r['child'] as Map<String, dynamic>;
      final code = pairing['code'] as String;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, '${child['id']}:$code');
      if (mounted) setState(() { _code = code; _childId = child['id'] as String; });
      _startPolling();
    } catch (e) {
      if (mounted) setState(() { _error = 'Could not regenerate code.'; });
    } finally {
      if (mounted) setState(() => _regening = false);
    }
  }

  // ── Polling: check every 3 s if a child has claimed the code ──────────────

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkPairing());
  }

  Future<void> _checkPairing() async {
    if (!mounted || _connected) return;
    try {
      final fc = context.read<FamilyController>();
      await fc.load();
      final active = fc.children.any((c) => c.pairingStatus == 'active' || c.pairingStatus == 'claimed');
      if (active && mounted) {
        _pollTimer?.cancel();
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove(_prefKey);
        setState(() => _connected = true);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) context.go('/home');
        });
      }
    } catch (_) {}
  }

  void _copyCode() {
    Clipboard.setData(ClipboardData(text: _code));
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 16),
              // ── Header ────────────────────────────────────────────────────
              Row(
                children: [
                  GestureDetector(
                    onTap: () => context.go('/home'),
                    child: Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white.withValues(alpha: 0.06),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                      ),
                      child: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Text('Connect Child Device',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 32),
              if (_connected) _buildSuccess() else _buildPairing(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPairing() {
    return Column(
      children: [
        // Shield logo
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              colors: [Color(0x402563EB), Color(0x1A06B6D4)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            border: Border.all(color: const Color(0x4D3B82F6)),
          ),
          child: Center(
            child: SvgPicture.asset('assets/icons/shield.svg', width: 36, height: 36,
              colorFilter: const ColorFilter.mode(Color(0xFF22D3EE), BlendMode.srcIn)),
          ),
        ),
        const SizedBox(height: 22),
        const Text('Connect Your Child\'s Device', textAlign: TextAlign.center,
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
        const SizedBox(height: 10),
        const Text('Have your child open AlphaGuard on their device and enter this code.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
        const SizedBox(height: 32),
        // Code display
        if (_loading)
          const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: CircularProgressIndicator(color: AppColors.cyan))
        else if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 14), textAlign: TextAlign.center),
          )
        else
          _buildCodeDisplay(),
        const SizedBox(height: 28),
        // Waiting indicator
        AnimatedBuilder(
          animation: _pulseOp,
          builder: (_, __) => Opacity(
            opacity: _pulseOp.value,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.cyan)),
              const SizedBox(width: 8),
              const Text('Waiting for child to connect...', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
        const SizedBox(height: 32),
        // Instructions
        _InstructionStep(n: 1, text: "Open AlphaGuard on your child's device"),
        const SizedBox(height: 10),
        _InstructionStep(n: 2, text: 'Select "Connect to Parent" on the role screen'),
        const SizedBox(height: 10),
        _InstructionStep(n: 3, text: 'Enter the 6-digit code shown above'),
        const SizedBox(height: 32),
        // Actions
        Row(children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _regening ? null : _regenerate,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textMuted,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _regening
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textMuted))
                : const Text('New Code', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: ElevatedButton(
              onPressed: () => context.go('/home'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.08),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Skip for now', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _buildCodeDisplay() {
    final digits = _code.isEmpty ? '------' : _code;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: Colors.white.withValues(alpha: 0.04),
            border: Border.all(color: AppColors.cyan.withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.12), blurRadius: 24)],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (int i = 0; i < digits.length; i++) ...[
                if (i == 3) ...[
                  const SizedBox(width: 10),
                  Container(width: 16, height: 2, color: AppColors.textMuted.withValues(alpha: 0.4)),
                  const SizedBox(width: 10),
                ],
                Text(
                  digits[i],
                  style: const TextStyle(
                    fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF22D3EE),
                    letterSpacing: 2, fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
                if (i < digits.length - 1 && i != 2) const SizedBox(width: 6),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: _code.isEmpty ? null : _copyCode,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: (_copied ? const Color(0xFF10B981) : AppColors.cyan).withValues(alpha: 0.15),
              border: Border.all(color: (_copied ? const Color(0xFF10B981) : AppColors.cyan).withValues(alpha: 0.35)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(_copied ? Icons.check : Icons.copy_outlined,
                color: _copied ? const Color(0xFF10B981) : AppColors.cyan, size: 16),
              const SizedBox(width: 6),
              Text(_copied ? 'Copied!' : 'Copy code',
                style: TextStyle(color: _copied ? const Color(0xFF10B981) : AppColors.cyan, fontWeight: FontWeight.w700, fontSize: 13)),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(
      children: [
        const SizedBox(height: 40),
        Container(
          width: 100, height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF10B981).withValues(alpha: 0.15),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.35), blurRadius: 30)],
          ),
          child: const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 50),
        ),
        const SizedBox(height: 24),
        const Text('Child Device Connected!', textAlign: TextAlign.center,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 12),
        const Text('Taking you to the dashboard...', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
        const SizedBox(height: 24),
        const CircularProgressIndicator(color: Color(0xFF10B981)),
      ],
    );
  }
}

// ── Shared sub-widgets ────────────────────────────────────────────────────────

class _InstructionStep extends StatelessWidget {
  const _InstructionStep({required this.n, required this.text});
  final int n;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 26, height: 26,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.cyan.withValues(alpha: 0.12),
          border: Border.all(color: AppColors.cyan.withValues(alpha: 0.30)),
        ),
        child: Center(child: Text('$n', style: const TextStyle(color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w800))),
      ),
      const SizedBox(width: 12),
      Expanded(child: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(text, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.4)),
      )),
    ]);
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_colors.dart';
import '../../state/family_controller.dart';

/// ConnectChild — mandatory step shown to the parent after ParentSetup.
/// The dashboard (/home) is inaccessible until at least one child device pairs.
/// Displays a 6-digit code AND a scannable QR code. Polls every 3 s.
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
  bool _showQr = false;

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
      if (mounted) setState(() {
        _error = 'Could not generate a pairing code. Check your connection and retry.';
        _loading = false;
      });
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

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkPairing());
  }

  Future<void> _checkPairing() async {
    if (!mounted || _connected) return;
    try {
      final fc = context.read<FamilyController>();
      await fc.load();
      final active = fc.children.any((c) =>
          c.pairingStatus == 'active' || c.pairingStatus == 'claimed');
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
              // Header — no close/skip; dashboard requires a connected child
              Row(children: [
                Container(
                  width: 38, height: 38,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: AppColors.cyan.withValues(alpha: 0.12),
                    border: Border.all(color: AppColors.cyan.withValues(alpha: 0.30)),
                  ),
                  child: const Icon(Icons.link, color: AppColors.cyan, size: 20),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Connect Child Device',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white)),
                    Text('Required before accessing dashboard',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ]),
                ),
              ]),
              const SizedBox(height: 28),
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
        const Text("Connect Your Child's Device", textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
        const SizedBox(height: 10),
        const Text('Have your child open AlphaGuard and scan the QR code, or enter the 6-digit code manually.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
        const SizedBox(height: 28),
        if (_loading)
          const Padding(padding: EdgeInsets.symmetric(vertical: 24),
              child: CircularProgressIndicator(color: AppColors.cyan))
        else if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(children: [
              Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 14), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              TextButton(onPressed: _createCode,
                  child: const Text('Retry', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700))),
            ]),
          )
        else ...[
          // Tab: code vs QR
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: Colors.white.withValues(alpha: 0.06),
              border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
            ),
            child: Row(children: [
              Expanded(child: _TabBtn(label: '6-Digit Code', active: !_showQr,
                  onTap: () => setState(() => _showQr = false))),
              Expanded(child: _TabBtn(label: 'QR Code', active: _showQr,
                  onTap: () => setState(() => _showQr = true))),
            ]),
          ),
          const SizedBox(height: 20),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 260),
            child: _showQr ? _buildQrDisplay() : _buildCodeDisplay(),
          ),
        ],
        const SizedBox(height: 28),
        AnimatedBuilder(
          animation: _pulseOp,
          builder: (_, __) => Opacity(
            opacity: _pulseOp.value,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(width: 8, height: 8,
                  decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.cyan)),
              const SizedBox(width: 8),
              const Text('Waiting for child to connect…',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
        const SizedBox(height: 32),
        _InstructionStep(n: 1, text: "Open AlphaGuard on your child's device"),
        const SizedBox(height: 10),
        _InstructionStep(n: 2, text: 'Select "Child" on the role screen'),
        const SizedBox(height: 10),
        _InstructionStep(n: 3, text: 'Tap "Scan QR" or "Enter Code" and pair with the code above'),
        const SizedBox(height: 32),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _regening ? null : _regenerate,
              icon: _regening
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textMuted))
                  : const Icon(Icons.refresh, size: 16),
              label: const Text('New Code', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textMuted,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _copyCode,
              icon: const Icon(Icons.share_outlined, size: 16),
              label: const Text('Share Code', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.cyan,
                side: BorderSide(color: AppColors.cyan.withValues(alpha: 0.35)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _buildCodeDisplay() {
    final digits = _code.isEmpty ? '------' : _code;
    return Column(
      key: const ValueKey('code'),
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: Colors.white.withValues(alpha: 0.04),
            border: Border.all(color: AppColors.cyan.withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.12), blurRadius: 24)],
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            for (int i = 0; i < digits.length; i++) ...[
              if (i == 3) ...[
                const SizedBox(width: 10),
                Container(width: 16, height: 2, color: AppColors.textMuted.withValues(alpha: 0.4)),
                const SizedBox(width: 10),
              ],
              Text(digits[i], style: const TextStyle(
                fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF22D3EE),
                letterSpacing: 2, fontFeatures: [FontFeature.tabularFigures()],
              )),
              if (i < digits.length - 1 && i != 2) const SizedBox(width: 6),
            ],
          ]),
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
                  style: TextStyle(
                      color: _copied ? const Color(0xFF10B981) : AppColors.cyan,
                      fontWeight: FontWeight.w700, fontSize: 13)),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildQrDisplay() {
    return Column(
      key: const ValueKey('qr'),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: Colors.white,
            boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.25), blurRadius: 32)],
          ),
          child: QrImageView(
            data: _code,
            version: QrVersions.auto,
            size: 190,
            backgroundColor: Colors.white,
            eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFF030307)),
            dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square, color: Color(0xFF030307)),
          ),
        ),
        const SizedBox(height: 12),
        Text('Code: $_code',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13,
                fontWeight: FontWeight.w600, letterSpacing: 3)),
        const SizedBox(height: 4),
        const Text('Child scans this QR with their AlphaGuard app',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(children: [
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
      const Text('Taking you to the dashboard…',
          style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
      const SizedBox(height: 24),
      const CircularProgressIndicator(color: Color(0xFF10B981)),
    ]);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _TabBtn extends StatelessWidget {
  const _TabBtn({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(11),
        color: active ? AppColors.cyan.withValues(alpha: 0.15) : Colors.transparent,
        border: Border.all(color: active ? AppColors.cyan.withValues(alpha: 0.35) : Colors.transparent),
      ),
      child: Text(label, textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
              color: active ? AppColors.cyan : AppColors.textMuted)),
    ),
  );
}

class _InstructionStep extends StatelessWidget {
  const _InstructionStep({required this.n, required this.text});
  final int n;
  final String text;

  @override
  Widget build(BuildContext context) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(
      width: 26, height: 26,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.cyan.withValues(alpha: 0.12),
        border: Border.all(color: AppColors.cyan.withValues(alpha: 0.30)),
      ),
      child: Center(child: Text('$n',
          style: const TextStyle(color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w800))),
    ),
    const SizedBox(width: 12),
    Expanded(child: Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(text, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.4)),
    )),
  ]);
}

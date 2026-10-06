import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_colors.dart';
import '../../services/socket/socket_service.dart';
import '../../state/auth_controller.dart';
import '../../state/family_controller.dart';

/// ConnectChild — mandatory step shown to the parent after ParentSetup.
/// The dashboard (/home) is inaccessible until at least one child device pairs.
/// Displays a 6-digit code AND a scannable QR code. Polls every 3 s.
/// Codes expire after 3 minutes — a countdown is shown and a single button
/// regenerates both code and QR.
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
  String? _pairedChildName;
  void Function()? _socketUnsub;

  // Expiration countdown — 3 minutes (180 s)
  static const _expirySeconds = 180;
  int _secondsLeft = _expirySeconds;
  bool _expired = false;
  Timer? _expiryTimer;

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      // Use socket event data directly — no extra API round-trip needed.
      _socketUnsub = context.read<SocketService>().on('pair:active', (data) {
        // ignore: avoid_print
        print('[PAIR] SOCKET RECEIVED pair:active: $data');
        final childData = (data as Map<String, dynamic>?)?['child'] as Map<String, dynamic>?;
        final name = childData?['name'] as String?;
        _onPairActive(name);
      });
      // ignore: avoid_print
      print('[PAIR] SOCKET CONNECTED — listening for pair:active');
    });
  }

  @override
  void dispose() {
    _socketUnsub?.call();
    _pulse.dispose();
    _pollTimer?.cancel();
    _expiryTimer?.cancel();
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
        _startExpiryCountdown();
        return;
      }
    }
    await _createCode();
  }

  Future<void> _createCode() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; _expired = false; });
    _expiryTimer?.cancel();
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
      _startExpiryCountdown();
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
    setState(() { _regening = true; _code = ''; _error = null; _expired = false; });
    _pollTimer?.cancel();
    _expiryTimer?.cancel();
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
      _startExpiryCountdown();
    } catch (e) {
      if (mounted) setState(() { _error = 'Could not regenerate code.'; });
    } finally {
      if (mounted) setState(() => _regening = false);
    }
  }

  void _startExpiryCountdown() {
    _expiryTimer?.cancel();
    if (mounted) setState(() { _secondsLeft = _expirySeconds; _expired = false; });
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _secondsLeft--;
        if (_secondsLeft <= 0) {
          _expired = true;
          _expiryTimer?.cancel();
          _pollTimer?.cancel();
        }
      });
    });
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkPairing());
  }

  Future<void> _onPairActive(String? childName) async {
    if (!mounted || _connected) return;
    // ignore: avoid_print
    print('[PAIR] PARENT UPDATED — child connected: $childName');
    _pollTimer?.cancel();
    _expiryTimer?.cancel();
    _socketUnsub?.call();
    _socketUnsub = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefKey);
    await context.read<AuthController>().markParentPaired();
    // Pre-load family data so parent dashboard has child on first render.
    if (mounted) await context.read<FamilyController>().load();
    if (!mounted) return;
    setState(() {
      _connected = true;
      _pairedChildName = childName;
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) context.go('/home');
    });
  }

  Future<void> _checkPairing() async {
    if (!mounted || _connected) return;
    try {
      final fc = context.read<FamilyController>();
      await fc.load();
      final paired = fc.children.where((c) =>
          c.pairingStatus == 'active' || c.pairingStatus == 'claimed').toList();
      if (paired.isNotEmpty) {
        // ignore: avoid_print
        print('[PAIR] PAIR ACTIVATED — detected via polling');
        await _onPairActive(paired.first.name);
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

  String get _countdownLabel {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
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
            child: SvgPicture.asset('assets/icons/alphaguard_logo.svg', width: 44, height: 44),
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
        else if (_expired)
          _buildExpiredState()
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
        if (!_expired && !_loading) ...[
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
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _regening ? null : _regenerate,
              icon: _regening
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.cyan))
                  : const Icon(Icons.refresh, size: 16),
              label: const Text('Generate New Code & QR', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.cyan,
                side: BorderSide(color: AppColors.cyan.withValues(alpha: 0.35)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCountdown() {
    final urgent = _secondsLeft <= 60;
    final color = urgent ? AppColors.danger : AppColors.textMuted;
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.timer_outlined, color: color, size: 14),
      const SizedBox(width: 5),
      Text(
        'Code expires in $_countdownLabel',
        style: TextStyle(color: color, fontSize: 12.5, fontWeight: FontWeight.w700),
      ),
    ]);
  }

  Widget _buildExpiredState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: AppColors.danger.withValues(alpha: 0.10),
            border: Border.all(color: AppColors.danger.withValues(alpha: 0.30)),
          ),
          child: Column(children: [
            const Icon(Icons.timer_off_outlined, color: AppColors.danger, size: 36),
            const SizedBox(height: 12),
            const Text('Pairing code expired',
                style: TextStyle(color: AppColors.danger, fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('Generate a new code to continue.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13), textAlign: TextAlign.center),
          ]),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _regenerate,
          icon: const Icon(Icons.refresh, size: 16),
          label: const Text('Generate New Code', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyan,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ]),
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
    final name = (_pairedChildName != null && _pairedChildName!.isNotEmpty && _pairedChildName != 'My Child')
        ? _pairedChildName!
        : 'Child';
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
      Text('$name Connected Successfully!', textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)),
      const SizedBox(height: 10),
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: AppColors.cyan.withValues(alpha: 0.08),
          border: Border.all(color: AppColors.cyan.withValues(alpha: 0.25)),
        ),
        child: const Text(
          'Complete permissions on the child device to activate protection.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
        ),
      ),
      const SizedBox(height: 24),
      const Text('Taking you to the dashboard…',
          style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
      const SizedBox(height: 16),
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

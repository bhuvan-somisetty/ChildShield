import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/primary_button.dart';

/// Child device pairing — enter the 6-digit code OR scan the parent's QR.
/// No email/password; the device becomes the child once the code is claimed.
class ChildPairingScreen extends StatefulWidget {
  const ChildPairingScreen({super.key});
  @override
  State<ChildPairingScreen> createState() => _ChildPairingScreenState();
}

class _ChildPairingScreenState extends State<ChildPairingScreen> {
  final _code = TextEditingController();
  bool _useQr = false;
  bool _scanning = false;
  String? _scanError;
  bool _torchOn = false;
  bool _cameraPermissionDenied = false;
  // Name/gender passed from ChildSetupScreen via GoRouter extra
  String? _childName;
  String? _childGender;
  bool _extraRead = false;
  final _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  @override
  void dispose() {
    _code.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _onQrDetected(BarcodeCapture capture) {
    if (_scanning) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;
    final raw = barcode.rawValue?.trim() ?? '';
    // Accept only 6-digit numeric codes
    if (!RegExp(r'^\d{6}$').hasMatch(raw)) {
      setState(() => _scanError = 'Invalid QR code. Make sure you scan AlphaGuard\'s pairing QR.');
      return;
    }
    setState(() { _scanning = true; _scanError = null; });
    _scannerController.stop();
    _code.text = raw;
    // Small delay so the user can see the scanned code before connecting
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) {
        context.read<AuthController>().claimChild(raw, name: _childName, gender: _childGender);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_extraRead) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      _childName = extra?['name'] as String?;
      _childGender = extra?['gender'] as String?;
      _extraRead = true;
    }
    final auth = context.watch<AuthController>();
    final valid = _code.text.trim().length == 6;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: BackButton(onPressed: () => context.pop()),
        actions: _useQr
            ? [
                IconButton(
                  icon: Icon(_torchOn ? Icons.flash_on : Icons.flash_off,
                      color: _torchOn ? AppColors.cyan : AppColors.textMuted),
                  onPressed: () {
                    _scannerController.toggleTorch();
                    setState(() => _torchOn = !_torchOn);
                  },
                ),
              ]
            : null,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  SizedBox(height: context.clampScale(12, 32)),
                  const AppLogo(showName: false),
                  const SizedBox(height: 20),
                  const Text('Connect to your parent',
                      style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
                  const SizedBox(height: 8),
                  const Text("Scan the QR code from your parent's AlphaGuard app, or enter the 6-digit code manually.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.4)),
                  const SizedBox(height: 20),
                  // Mode toggle
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      color: Colors.white.withValues(alpha: 0.06),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                    ),
                    child: Row(children: [
                      Expanded(child: _ModeBtn(label: 'Enter Code', icon: Icons.keyboard_outlined,
                          active: !_useQr, onTap: () {
                            setState(() { _useQr = false; _scanError = null; });
                          })),
                      Expanded(child: _ModeBtn(label: 'Scan QR', icon: Icons.qr_code_scanner,
                          active: _useQr, onTap: () async {
                            final status = await Permission.camera.request();
                            if (!mounted) return;
                            if (status.isPermanentlyDenied || status.isDenied) {
                              setState(() { _useQr = true; _cameraPermissionDenied = true; _scanError = null; _scanning = false; });
                            } else {
                              setState(() { _useQr = true; _cameraPermissionDenied = false; _scanError = null; _scanning = false; });
                              // MobileScanner widget auto-starts when built — no manual start needed
                            }
                          })),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 280),
                      child: _useQr
                          ? _buildQrScanner(auth)
                          : _buildCodeEntry(auth, valid),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Manual code entry ────────────────────────────────────────────────────────

  Widget _buildCodeEntry(AuthController auth, bool valid) {
    return Column(
      key: const ValueKey('code'),
      children: [
        TextField(
          controller: _code,
          autofocus: true,
          onChanged: (_) => setState(() {}),
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 30,
              fontWeight: FontWeight.w900, letterSpacing: 12),
          decoration: const InputDecoration(counterText: '', hintText: '••••••'),
        ),
        if (auth.error != null) ...[
          const SizedBox(height: 8),
          Text(auth.error!, style: const TextStyle(color: AppColors.danger,
              fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
        ],
        const SizedBox(height: 20),
        PrimaryButton(
          label: 'Connect',
          icon: Icons.link,
          loading: auth.busy,
          onPressed: valid ? () => auth.claimChild(_code.text.trim(), name: _childName, gender: _childGender) : null,
        ),
        const SizedBox(height: 16),
        const Text('Ask your parent to open AlphaGuard → Connect a Child Device to get the code.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ],
    );
  }

  // ── QR scanner ───────────────────────────────────────────────────────────────

  Widget _buildQrScanner(AuthController auth) {
    if (_cameraPermissionDenied) return _buildCameraPermissionDenied();
    return Column(
      key: const ValueKey('qr'),
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              children: [
                MobileScanner(
                  controller: _scannerController,
                  onDetect: _scanning ? null : _onQrDetected,
                ),
                // Scan frame overlay
                Center(
                  child: Container(
                    width: 220, height: 220,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.cyan, width: 2.5),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_scanning) ...[
                          const CircularProgressIndicator(color: AppColors.cyan),
                          const SizedBox(height: 12),
                          const Text('Connecting…',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ] else
                          const Text('Point at the QR code\nin your parent\'s app',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_scanError != null || auth.error != null) ...[
          const SizedBox(height: 12),
          Text(
            _scanError ?? auth.error ?? '',
            style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              setState(() { _scanning = false; _scanError = null; });
              _scannerController.start();
            },
            child: const Text('Try Again', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700)),
          ),
        ] else
          const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildCameraPermissionDenied() {
    return Column(
      key: const ValueKey('cam_denied'),
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: AppColors.danger.withValues(alpha: 0.10),
            border: Border.all(color: AppColors.danger.withValues(alpha: 0.30)),
          ),
          child: Column(children: [
            const Icon(Icons.no_photography_outlined, color: AppColors.danger, size: 44),
            const SizedBox(height: 14),
            const Text('Camera Permission Required',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text(
              'AlphaGuard needs camera access to scan the pairing QR code.\n\nPlease allow camera access in Settings.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => openAppSettings(),
              icon: const Icon(Icons.settings_outlined, size: 16),
              label: const Text('Open Settings', style: TextStyle(fontWeight: FontWeight.w800)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.cyan,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () async {
                final status = await Permission.camera.request();
                if (!mounted) return;
                if (status.isGranted) {
                  setState(() => _cameraPermissionDenied = false);
                  // MobileScanner widget auto-starts when newly inserted — no manual start needed
                }
              },
              child: const Text('Try Again', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ],
    );
  }
}

// ── Mode tab button ───────────────────────────────────────────────────────────

class _ModeBtn extends StatelessWidget {
  const _ModeBtn({required this.label, required this.icon, required this.active, required this.onTap});
  final String label;
  final IconData icon;
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
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: active ? AppColors.cyan : AppColors.textMuted, size: 15),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
            color: active ? AppColors.cyan : AppColors.textMuted)),
      ]),
    ),
  );
}

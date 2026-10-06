import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/config/env.dart';
import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api/api_client.dart';
import '../../../services/location/android_agent_bridge.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_card.dart';
import 'child_contacts_screen.dart';

class ChildSettingsScreen extends StatefulWidget {
  const ChildSettingsScreen({super.key});
  @override
  State<ChildSettingsScreen> createState() => _ChildSettingsScreenState();
}

class _ChildSettingsScreenState extends State<ChildSettingsScreen> {
  AndroidAgentStatus? _permStatus;
  bool _loadingPerms = true;

  @override
  void initState() {
    super.initState();
    _loadPerms();
  }

  Future<void> _loadPerms() async {
    final status = await AndroidAgentBridge.getTrackingStatus();
    if (!mounted) return;
    setState(() {
      _permStatus = status;
      _loadingPerms = false;
    });
  }

  Future<void> _requestParentPin() async {
    final pinC = TextEditingController();

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        String? dialogError;
        bool verifying = false;

        Future<void> verify(StateSetter setModal) async {
          final pin = pinC.text.trim();
          if (pin.length != 6) {
            setModal(() => dialogError = 'PIN must be 6 digits');
            return;
          }
          setModal(() { verifying = true; dialogError = null; });
          try {
            final api = context.read<ApiClient>();
            final result = await api.post('/auth/child/verify-parent-pin', body: {'pin': pin});
            final ok = (result as Map<String, dynamic>?)?['ok'] == true;
            if (ok) {
              if (ctx.mounted) Navigator.of(ctx).pop();
              if (mounted) await context.read<AuthController>().logout();
            } else {
              pinC.clear();
              setModal(() { verifying = false; dialogError = 'Incorrect PIN. Try again.'; });
            }
          } catch (_) {
            setModal(() { verifying = false; dialogError = 'Verification failed. Check connection.'; });
          }
        }

        return StatefulBuilder(
          builder: (_, setModal) => AlertDialog(
            backgroundColor: AppColors.bgElevated,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: const Column(
              children: [
                Icon(Icons.lock_rounded, color: AppColors.violet, size: 36),
                SizedBox(height: 10),
                Text(
                  'Parent Authorization Required',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'To sign out from this device, please enter the Parent Security PIN.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.45),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: pinC,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  autofocus: true,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    letterSpacing: 18,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                  decoration: InputDecoration(
                    hintText: '• • • • • •',
                    hintStyle: const TextStyle(letterSpacing: 10, color: AppColors.textMuted, fontSize: 18),
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppColors.violet, width: 1.5),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppColors.danger),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
                    ),
                    errorText: dialogError,
                    errorStyle: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700),
                  ),
                  onSubmitted: (_) { if (!verifying) verify(setModal); },
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: verifying ? null : () => Navigator.of(ctx).pop(),
                child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: verifying ? null : () => verify(setModal),
                child: verifying
                    ? const SizedBox(
                        width: 16, height: 16,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Verify', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final child = auth.child;
    final pairingId = auth.pairingId;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 560 : double.infinity),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                // ── Child Profile ──────────────────────────────────────────
                _Section(label: 'MY PROFILE'),
                AppCard(
                  child: Row(
                    children: [
                      Container(
                        width: 52, height: 52,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: AppColors.cyan.withValues(alpha: 0.15),
                          border: Border.all(color: AppColors.cyan.withValues(alpha: 0.30)),
                        ),
                        child: Center(child: Text(child?.emoji ?? '🧒', style: const TextStyle(fontSize: 26))),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              child?.name ?? 'Me',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                            if (child?.grade != null && (child?.grade?.isNotEmpty ?? false)) ...[
                              const SizedBox(height: 3),
                              Text(
                                '${child?.grade}${child?.school != null && (child?.school?.isNotEmpty ?? false) ? ' · ${child!.school}' : ''}',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── Connected Parent ────────────────────────────────────────
                _Section(label: 'CONNECTION'),
                AppCard(
                  child: Row(
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.link_rounded, color: Color(0xFF10B981), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Protection Active', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
                            if (pairingId != null) ...[
                              const SizedBox(height: 3),
                              Text('Pair ID: ${pairingId.substring(0, 8)}…', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                            ],
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Text('LINKED', style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w900)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── Permission Status ────────────────────────────────────────
                _Section(label: 'PERMISSIONS'),
                AppCard(
                  child: _loadingPerms
                      ? const Center(child: Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(color: AppColors.cyan, strokeWidth: 2),
                        ))
                      : Column(
                          children: [
                            _PermRow('Location', _permStatus?.locationPermission == 'granted'),
                            _PermRow('Background Location', _permStatus?.backgroundLocationPermission == 'granted'),
                            _PermRow('Notifications', _permStatus?.notificationPermission ?? false),
                            _PermRow('Usage Access', _permStatus?.usageAccessPermission == 'granted'),
                            _PermRow('Draw Over Apps', _permStatus?.overlayPermission == 'granted'),
                            _PermRow('Battery Exemption', _permStatus?.isBatteryExempt ?? false),
                            _PermRow('Active Protection', _permStatus?.isTracking ?? false),
                          ],
                        ),
                ),
                const SizedBox(height: 16),

                // ── Emergency Contacts ─────────────────────────────────────
                _Section(label: 'EMERGENCY'),
                AppCard(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChildContactsScreen())),
                  child: const Row(
                    children: [
                      Icon(Icons.phone_rounded, color: Color(0xFF10B981), size: 20),
                      SizedBox(width: 12),
                      Expanded(child: Text('Emergency Contacts', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 14))),
                      Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── App Info ─────────────────────────────────────────────
                _Section(label: 'ABOUT'),
                AppCard(child: Row(children: [
                  const Icon(Icons.shield_outlined, color: AppColors.cyan, size: 20),
                  const SizedBox(width: 10),
                  const Expanded(child: Text('AlphaGuard AI', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14))),
                  Text('v${Env.appVersion}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ])),
                const SizedBox(height: 8),
                AppCard(
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: 'AlphaGuard AI',
                    applicationVersion: 'v${Env.appVersion}',
                    children: const [Text('Family safety platform. Location, SOS and parental controls.', style: TextStyle(fontSize: 13))],
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 20),
                      SizedBox(width: 12),
                      Expanded(child: Text('About AlphaGuard', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 14))),
                      Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // ── Danger zone ────────────────────────────────────────────
                AppCard(
                  onTap: _requestParentPin,
                  child: const Row(children: [
                    Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
                    SizedBox(width: 10),
                    Expanded(child: Text('Sign out of this device', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700, fontSize: 14))),
                    Icon(Icons.chevron_right_rounded, color: AppColors.danger, size: 18),
                  ]),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 4, bottom: 8, top: 4),
    child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
  );
}

class _PermRow extends StatelessWidget {
  const _PermRow(this.label, this.granted);
  final String label;
  final bool granted;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(
      children: [
        Icon(
          granted ? Icons.check_circle_rounded : Icons.cancel_rounded,
          size: 17,
          color: granted ? AppColors.success : AppColors.danger.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5, fontWeight: FontWeight.w600))),
        Text(
          granted ? 'Granted' : 'Denied',
          style: TextStyle(
            color: granted ? AppColors.success : AppColors.textMuted,
            fontSize: 12, fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}

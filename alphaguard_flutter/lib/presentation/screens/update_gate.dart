import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/version_info.dart';
import '../../services/lifecycle/lifecycle_service.dart';
import '../../services/lifecycle/update_service.dart';
import '../widgets/primary_button.dart';

/// Wraps the authenticated app. Consumes the backend version API to:
///   • block the UI for a MANDATORY update (client < minimumVersion)
///   • offer an OPTIONAL update (client < currentVersion, dismissible)
///   • show What's New once after the bundle version changes (just updated)
/// Non-blocking: a failed/slow version check never locks the user out.
class UpdateGate extends StatefulWidget {
  const UpdateGate({super.key, required this.child});
  final Widget child;
  @override
  State<UpdateGate> createState() => _UpdateGateState();
}

class _UpdateGateState extends State<UpdateGate> {
  VersionInfo? _info;
  bool _forced = false;
  bool _showUpdate = false;
  ReleaseNotes? _whatsNew;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final lifecycle = context.read<LifecycleService>();
    final updates = context.read<UpdateService>();
    final prev = lifecycle.consumeVersionChange(); // local "just updated" signal
    final info = await updates.check();
    if (!mounted || info == null) return;
    setState(() {
      _info = info;
      if (info.mandatory) {
        _forced = true;
      } else if (info.updateAvailable && !lifecycle.updateDismissed(info.currentVersion)) {
        _showUpdate = true;
      }
    });
    // What's New after an update (skipped if a mandatory update is pending).
    if (!_forced && prev != null && !lifecycle.whatsNewSeen(_appVersion(info))) {
      setState(() => _whatsNew = info.releaseNotes);
    }
  }

  String _appVersion(VersionInfo info) => info.releaseNotes?.version ?? info.currentVersion;

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      widget.child,
      if (_forced && _info != null) _ForcedSheet(info: _info!),
      if (!_forced && _showUpdate && _info != null)
        _UpdateSheet(
          info: _info!,
          onLater: () {
            context.read<LifecycleService>().dismissUpdate(_info!.currentVersion);
            setState(() => _showUpdate = false);
          },
        ),
      if (!_forced && !_showUpdate && _whatsNew != null)
        _WhatsNewSheet(
          notes: _whatsNew!,
          onClose: () {
            context.read<LifecycleService>().markWhatsNewSeen(_appVersion(_info!));
            setState(() => _whatsNew = null);
          },
        ),
    ]);
  }
}

Widget _notes(ReleaseNotes? n) {
  if (n == null || n.isEmpty) {
    return const Text('General improvements and stability fixes.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13));
  }
  Widget group(String label, List<String> items, Color c) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.only(top: 8, bottom: 4), child: Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w800, fontSize: 12))),
        ...items.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(padding: const EdgeInsets.only(top: 6, right: 8), child: Container(width: 5, height: 5, decoration: BoxDecoration(color: c, shape: BoxShape.circle))),
                Expanded(child: Text(e, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4))),
              ]),
            )),
      ],
    );
  }

  return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    group('New Features', n.added, AppColors.success),
    group('Improvements', n.improved, AppColors.cyan),
    group('Fixes', n.fixed, AppColors.warning),
  ]);
}

class _Sheet extends StatelessWidget {
  const _Sheet({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.75),
        alignment: Alignment.center,
        child: SingleChildScrollView(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 440),
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.circular(26), border: Border.all(color: AppColors.border)),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _ForcedSheet extends StatelessWidget {
  const _ForcedSheet({required this.info});
  final VersionInfo info;
  @override
  Widget build(BuildContext context) => _Sheet(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.system_update, color: AppColors.danger, size: 44),
          const SizedBox(height: 12),
          const Text('Update Required', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
          const SizedBox(height: 8),
          const Text('A newer version is required to keep your family protected. Your data is safe.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.5)),
          const SizedBox(height: 16),
          Align(alignment: Alignment.centerLeft, child: _notes(info.releaseNotes)),
          const SizedBox(height: 20),
          PrimaryButton(label: 'Update Now', icon: Icons.arrow_upward, onPressed: () {/* store deep-link in production */}),
        ]),
      );
}

class _UpdateSheet extends StatelessWidget {
  const _UpdateSheet({required this.info, required this.onLater});
  final VersionInfo info;
  final VoidCallback onLater;
  @override
  Widget build(BuildContext context) => _Sheet(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Icon(Icons.arrow_circle_up, color: AppColors.cyan, size: 40),
          const SizedBox(height: 10),
          Text('Update Available', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 19)),
          Text('Version ${info.currentVersion} is ready', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          _notes(info.releaseNotes),
          const SizedBox(height: 18),
          PrimaryButton(label: 'Update Now', icon: Icons.arrow_upward, onPressed: () {/* store deep-link in production */}),
          const SizedBox(height: 10),
          TextButton(onPressed: onLater, child: const Text('Later', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700))),
        ]),
      );
}

class _WhatsNewSheet extends StatelessWidget {
  const _WhatsNewSheet({required this.notes, required this.onClose});
  final ReleaseNotes notes;
  final VoidCallback onClose;
  @override
  Widget build(BuildContext context) => _Sheet(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Icon(Icons.auto_awesome, color: AppColors.violet, size: 22),
            const SizedBox(width: 10),
            Expanded(child: Text("What's New · v${notes.version}", style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16))),
            IconButton(onPressed: onClose, icon: const Icon(Icons.close, color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 8),
          _notes(notes),
          const SizedBox(height: 18),
          PrimaryButton(label: 'Got it', onPressed: onClose),
        ]),
      );
}

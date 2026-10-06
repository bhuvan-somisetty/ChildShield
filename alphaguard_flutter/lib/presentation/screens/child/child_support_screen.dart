import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/announcement.dart';
import '../../../data/models/changelog_entry.dart';
import '../../../data/repositories/support_repository.dart';
import '../../widgets/app_card.dart';

/// Child Help — announcements, what's new, and how to get help. Reporting an
/// issue is a parent action (server-restricted), so this is read-only help.
class ChildSupportScreen extends StatefulWidget {
  const ChildSupportScreen({super.key});
  @override
  State<ChildSupportScreen> createState() => _ChildSupportScreenState();
}

class _ChildSupportScreenState extends State<ChildSupportScreen> {
  List<Announcement> _ann = [];
  List<ChangelogEntry> _log = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = context.read<SupportRepository>();
    try {
      final a = await repo.announcements();
      final l = await repo.changelog();
      if (!mounted) return;
      setState(() { _ann = a; _log = l; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Help', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    children: [
                      const AppCard(child: Row(children: [
                        Icon(Icons.info_outline, color: AppColors.cyan),
                        SizedBox(width: 10),
                        Expanded(child: Text('Need help with the app? Ask your parent — they can report issues from their AlphaGuard app.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13))),
                      ])),
                      const SizedBox(height: 12),
                      const SectionLabel('Announcements'),
                      if (_ann.isEmpty)
                        const AppCard(child: Text('No announcements.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ..._ann.map((a) => AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(a.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                              if (a.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(a.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
                            ]))),
                      const SizedBox(height: 12),
                      const SectionLabel("What's New"),
                      if (_log.isEmpty)
                        const AppCard(child: Text('Nothing new yet.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ..._log.map((e) => AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('v${e.version}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                              ...e.added.map((x) => Padding(padding: const EdgeInsets.only(top: 4), child: Text('• $x', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)))),
                            ]))),
                      const SizedBox(height: 24),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/support_ticket.dart';
import '../../../data/repositories/support_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/support_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

const _issueTypes = ['bug', 'login', 'pairing', 'location', 'tasks', 'rewards', 'notifications', 'ai_reports', 'performance', 'other'];

/// Help & Support hub — report issue, my tickets, feature requests,
/// announcements, changelog, contact, ratings.
class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<SupportController>(
      create: (ctx) => SupportController(repo: ctx.read<SupportRepository>(), socket: ctx.read<SocketService>())..load(),
      child: const _SupportView(),
    );
  }
}

class _SupportView extends StatelessWidget {
  const _SupportView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<SupportController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 700 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    children: [
                      Row(children: [
                        Expanded(child: PrimaryButton(label: 'Report Issue', icon: Icons.bug_report, onPressed: () => _reportIssue(context, c))),
                        const SizedBox(width: 10),
                        Expanded(child: OutlinedButton.icon(onPressed: () => _requestFeature(context, c), icon: const Icon(Icons.lightbulb_outline, size: 18), label: const Text('Feature'), style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)))),
                      ]),
                      const SizedBox(height: 16),
                      const SectionLabel('My Tickets'),
                      if (c.tickets.isEmpty)
                        const AppCard(child: Text('No tickets yet.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ...c.tickets.map((t) => AppCard(
                              onTap: () => _ticketThread(context, c, t),
                              child: Row(children: [
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('#${t.ticketNumber} · ${t.title}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                                  Text(t.issueType, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                ])),
                                TagChip(label: t.statusLabel, color: t.statusColor),
                              ]),
                            )),
                      const SizedBox(height: 16),
                      const SectionLabel('Feature Requests'),
                      if (c.features.isEmpty)
                        const AppCard(child: Text('No feature requests yet.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ...c.features.map((f) => AppCard(child: Row(children: [
                              Expanded(child: Text(f.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
                              TagChip(label: f.statusLabel, color: AppColors.violet),
                            ]))),
                      const SizedBox(height: 16),
                      const SectionLabel('Announcements'),
                      if (c.announcements.isEmpty)
                        const AppCard(child: Text('No announcements.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ...c.announcements.map((a) => AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(a.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                              if (a.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(a.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
                            ]))),
                      const SizedBox(height: 16),
                      const SectionLabel("What's New"),
                      if (c.changelog.isEmpty)
                        const AppCard(child: Text('No changelog entries.', style: TextStyle(color: AppColors.textMuted)))
                      else
                        ...c.changelog.map((e) => AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('v${e.version}${e.date != null ? ' · ${e.date}' : ''}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                              ...e.added.map((x) => _line('＋', x, AppColors.success)),
                              ...e.improved.map((x) => _line('▲', x, AppColors.cyan)),
                              ...e.fixed.map((x) => _line('✓', x, AppColors.warning)),
                            ]))),
                      const SizedBox(height: 16),
                      const SectionLabel('Contact'),
                      const AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        _Contact(icon: Icons.support_agent, label: 'Support', value: 'support@alphaguard.ai'),
                        SizedBox(height: 8),
                        _Contact(icon: Icons.shield_outlined, label: 'Child safety', value: 'safety@alphaguard.ai'),
                        SizedBox(height: 8),
                        _Contact(icon: Icons.privacy_tip_outlined, label: 'Privacy', value: 'privacy@alphaguard.ai'),
                      ])),
                      const SizedBox(height: 16),
                      const SectionLabel('Rate AlphaGuard'),
                      _Rating(onSubmit: (s) => c.rate(s)),
                      const SizedBox(height: 24),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  static Widget _line(String mark, String text, Color color) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(mark, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
        ]),
      );
}

class _Contact extends StatelessWidget {
  const _Contact({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, color: AppColors.cyan, size: 18),
        const SizedBox(width: 10),
        Text('$label: ', style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
        Expanded(child: SelectableText(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13))),
      ]);
}

class _Rating extends StatefulWidget {
  const _Rating({required this.onSubmit});
  final void Function(int) onSubmit;
  @override
  State<_Rating> createState() => _RatingState();
}

class _RatingState extends State<_Rating> {
  int _stars = 0;
  bool _sent = false;
  @override
  Widget build(BuildContext context) => AppCard(
        child: _sent
            ? const Text('Thanks for your feedback! ⭐', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) => IconButton(
                      onPressed: () {
                        setState(() { _stars = i + 1; _sent = true; });
                        widget.onSubmit(_stars);
                      },
                      icon: Icon(i < _stars ? Icons.star : Icons.star_border, color: AppColors.warning, size: 30),
                    )),
              ),
      );
}

/* ── Forms + thread ──────────────────────────────────────────────────────── */
void _reportIssue(BuildContext context, SupportController c) {
  final title = TextEditingController();
  final desc = TextEditingController();
  var type = 'bug';
  _formSheet(context, 'Report an Issue', [
    TextField(controller: title, autofocus: true, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Short summary')),
    const SizedBox(height: 12),
    StatefulBuilder(builder: (ctx, set) => DropdownButtonFormField<String>(
          value: type,
          dropdownColor: AppColors.surface,
          decoration: const InputDecoration(labelText: 'Type'),
          items: _issueTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
          onChanged: (v) => set(() => type = v ?? type),
        )),
    const SizedBox(height: 12),
    TextField(controller: desc, maxLines: 3, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'What happened?')),
  ], onSubmit: () async {
    if (title.text.trim().isEmpty) return false;
    await c.reportIssue(title: title.text.trim(), issueType: type, description: desc.text.trim());
    return true;
  });
}

void _requestFeature(BuildContext context, SupportController c) {
  final title = TextEditingController();
  final desc = TextEditingController();
  _formSheet(context, 'Request a Feature', [
    TextField(controller: title, autofocus: true, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Feature idea')),
    const SizedBox(height: 12),
    TextField(controller: desc, maxLines: 3, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Describe it (optional)')),
  ], onSubmit: () async {
    if (title.text.trim().isEmpty) return false;
    await c.requestFeature(title: title.text.trim(), description: desc.text.trim());
    return true;
  });
}

void _formSheet(BuildContext context, String title, List<Widget> fields, {required Future<bool> Function() onSubmit}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: Container(
        decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 14),
          ...fields,
          const SizedBox(height: 16),
          PrimaryButton(label: 'Submit', onPressed: () async {
            if (await onSubmit() && ctx.mounted) Navigator.pop(ctx);
          }),
        ]),
      ),
    ),
  );
}

void _ticketThread(BuildContext context, SupportController c, SupportTicket ticket) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _TicketThreadView(repo: c.repo, ticket: ticket),
  );
}

class _TicketThreadView extends StatefulWidget {
  const _TicketThreadView({required this.repo, required this.ticket});
  final SupportRepository repo;
  final SupportTicket ticket;
  @override
  State<_TicketThreadView> createState() => _TicketThreadViewState();
}

class _TicketThreadViewState extends State<_TicketThreadView> {
  final _input = TextEditingController();
  TicketThread? _thread;

  @override
  void initState() {
    super.initState();
    widget.repo.thread(widget.ticket.id).then((t) { if (mounted) setState(() => _thread = t); }).catchError((_) {});
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_input.text.trim().isEmpty) return;
    final t = await widget.repo.comment(widget.ticket.id, _input.text.trim());
    _input.clear();
    if (mounted) setState(() => _thread = t);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.82),
      decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Ticket #${widget.ticket.ticketNumber}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
        Text(widget.ticket.title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const SizedBox(height: 12),
        if (_thread == null)
          const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
        else
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: _thread!.comments.map((m) => Align(
                    alignment: m.authorRole == 'admin' ? Alignment.centerLeft : Alignment.centerRight,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      constraints: const BoxConstraints(maxWidth: 320),
                      decoration: BoxDecoration(color: (m.authorRole == 'admin' ? AppColors.cyan : AppColors.indigo).withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14), border: Border.all(color: (m.authorRole == 'admin' ? AppColors.cyan : AppColors.indigo).withValues(alpha: 0.18))),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(m.authorRole == 'admin' ? 'Support' : 'You', style: TextStyle(color: m.authorRole == 'admin' ? AppColors.cyan : AppColors.indigo, fontSize: 10, fontWeight: FontWeight.w800)),
                        Text(m.body, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13.5)),
                      ]),
                    ),
                  )).toList(),
            ),
          ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: TextField(controller: _input, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Reply…'), onSubmitted: (_) => _send())),
          const SizedBox(width: 8),
          IconButton.filled(onPressed: _send, icon: const Icon(Icons.send), style: IconButton.styleFrom(backgroundColor: AppColors.cyan)),
        ]),
      ]),
    );
  }
}

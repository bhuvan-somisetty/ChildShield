import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/support_ticket.dart';
import '../../../data/repositories/admin_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/admin_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

const _statuses = ['open', 'investigating', 'in_progress', 'waiting_user', 'resolved', 'closed'];
const _priorities = ['low', 'medium', 'high', 'critical'];
const _featureStatuses = ['requested', 'under_review', 'planned', 'in_development', 'released', 'rejected'];

/// Admin support dashboard — ticket management, feature requests, announcement +
/// changelog publishing. Server-gated; non-admins see an access notice.
class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AdminController>(
      create: (ctx) => AdminController(repo: ctx.read<AdminRepository>(), socket: ctx.read<SocketService>())..load(),
      child: const _AdminView(),
    );
  }
}

class _AdminView extends StatelessWidget {
  const _AdminView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<AdminController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 760 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.forbidden
                    ? const Center(child: EmptyState(icon: Icons.lock_outline, title: 'Admin access only', subtitle: 'This area is restricted to AlphaGuard administrators.'))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        children: [
                          _Stats(stats: c.stats),
                          const SizedBox(height: 14),
                          const SectionLabel('Support Tickets'),
                          if (c.tickets.isEmpty)
                            const AppCard(child: Text('No tickets.', style: TextStyle(color: AppColors.textMuted)))
                          else
                            ...c.tickets.map((t) => AppCard(
                                  onTap: () => _ticketDetail(context, c, t),
                                  child: Row(children: [
                                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('#${t.ticketNumber} · ${t.title}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                                      Text('${t.issueType} · ${t.priority}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                    ])),
                                    TagChip(label: t.statusLabel, color: t.statusColor),
                                  ]),
                                )),
                          const SizedBox(height: 16),
                          const SectionLabel('Feature Requests'),
                          if (c.features.isEmpty)
                            const AppCard(child: Text('No feature requests.', style: TextStyle(color: AppColors.textMuted)))
                          else
                            ...c.features.map((f) => AppCard(child: Row(children: [
                                  Expanded(child: Text(f.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
                                  DropdownButton<String>(
                                    value: _featureStatuses.contains(f.status) ? f.status : 'requested',
                                    dropdownColor: AppColors.surface,
                                    underline: const SizedBox.shrink(),
                                    style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700, fontSize: 12),
                                    items: _featureStatuses.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                                    onChanged: (v) { if (v != null) c.updateFeature(f.id, {'status': v}); },
                                  ),
                                ]))),
                          const SizedBox(height: 16),
                          const SectionLabel('Publish'),
                          Row(children: [
                            Expanded(child: OutlinedButton.icon(onPressed: () => _publishAnnouncement(context, c), icon: const Icon(Icons.campaign_outlined, size: 18), label: const Text('Announcement'), style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)))),
                            const SizedBox(width: 10),
                            Expanded(child: OutlinedButton.icon(onPressed: () => _publishChangelog(context, c), icon: const Icon(Icons.new_releases_outlined, size: 18), label: const Text('Changelog'), style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)))),
                          ]),
                          const SizedBox(height: 24),
                        ],
                      ),
          ),
        ),
      ),
    );
  }
}

class _Stats extends StatelessWidget {
  const _Stats({required this.stats});
  final Map<String, dynamic> stats;
  int _v(String k) => (stats[k] is num) ? (stats[k] as num).toInt() : 0;
  @override
  Widget build(BuildContext context) {
    Widget tile(String label, int value, Color color) => Expanded(
          child: AppCard(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('$value', style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 22)),
              Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
            ]),
          ),
        );
    return Row(children: [
      tile('Open', _v('open'), AppColors.blue),
      const SizedBox(width: 8),
      tile('Critical', _v('critical'), AppColors.danger),
      const SizedBox(width: 8),
      tile('Resolved', _v('resolved'), AppColors.success),
    ]);
  }
}

void _ticketDetail(BuildContext context, AdminController c, SupportTicket ticket) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _AdminTicketView(c: c, ticket: ticket),
  );
}

class _AdminTicketView extends StatefulWidget {
  const _AdminTicketView({required this.c, required this.ticket});
  final AdminController c;
  final SupportTicket ticket;
  @override
  State<_AdminTicketView> createState() => _AdminTicketViewState();
}

class _AdminTicketViewState extends State<_AdminTicketView> {
  final _reply = TextEditingController();
  TicketThread? _thread;
  late SupportTicket _ticket = widget.ticket;

  @override
  void initState() {
    super.initState();
    widget.c.repo.ticket(widget.ticket.id).then((t) { if (mounted) setState(() => _thread = t); }).catchError((_) {});
  }

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _setStatus(String s) async {
    await widget.c.updateTicket(_ticket.id, {'status': s});
    if (mounted) setState(() => _ticket = SupportTicket(id: _ticket.id, ticketNumber: _ticket.ticketNumber, title: _ticket.title, status: s, priority: _ticket.priority, issueType: _ticket.issueType));
  }

  Future<void> _setPriority(String p) async {
    await widget.c.updateTicket(_ticket.id, {'priority': p});
    if (mounted) setState(() => _ticket = SupportTicket(id: _ticket.id, ticketNumber: _ticket.ticketNumber, title: _ticket.title, status: _ticket.status, priority: p, issueType: _ticket.issueType));
  }

  Future<void> _send() async {
    if (_reply.text.trim().isEmpty) return;
    final t = await widget.c.repo.reply(_ticket.id, _reply.text.trim());
    _reply.clear();
    if (mounted) setState(() => _thread = t);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.86),
      decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Ticket #${_ticket.ticketNumber}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
        Text(_ticket.title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const SizedBox(height: 10),
        const Text('STATUS', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
        Wrap(spacing: 6, children: _statuses.map((s) => ChoiceChip(
              label: Text(s.replaceAll('_', ' '), style: const TextStyle(fontSize: 11)),
              selected: _ticket.status == s,
              onSelected: (_) => _setStatus(s),
              backgroundColor: AppColors.bg,
              selectedColor: AppColors.cyan.withValues(alpha: 0.25),
            )).toList()),
        const SizedBox(height: 6),
        const Text('PRIORITY', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
        Wrap(spacing: 6, children: _priorities.map((p) => ChoiceChip(
              label: Text(p, style: const TextStyle(fontSize: 11)),
              selected: _ticket.priority == p,
              onSelected: (_) => _setPriority(p),
              backgroundColor: AppColors.bg,
              selectedColor: AppColors.warning.withValues(alpha: 0.25),
            )).toList()),
        const SizedBox(height: 10),
        if (_thread == null)
          const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
        else
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: _thread!.comments.map((m) => Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (m.internal ? AppColors.warning : m.authorRole == 'admin' ? AppColors.cyan : AppColors.indigo).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(m.internal ? 'Internal note' : (m.authorRole == 'admin' ? 'Admin' : 'User'), style: TextStyle(color: m.internal ? AppColors.warning : AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
                      Text(m.body, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13.5)),
                    ]),
                  )).toList(),
            ),
          ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: TextField(controller: _reply, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Reply to user…'), onSubmitted: (_) => _send())),
          const SizedBox(width: 8),
          IconButton.filled(onPressed: _send, icon: const Icon(Icons.send), style: IconButton.styleFrom(backgroundColor: AppColors.cyan)),
        ]),
      ]),
    );
  }
}

void _publishAnnouncement(BuildContext context, AdminController c) {
  final title = TextEditingController();
  final desc = TextEditingController();
  _pubSheet(context, 'Publish Announcement', title, desc, () => c.repo.createAnnouncement(title: title.text.trim(), description: desc.text.trim()));
}

void _publishChangelog(BuildContext context, AdminController c) {
  final version = TextEditingController();
  final added = TextEditingController();
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
          const Text('Publish Changelog', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 14),
          TextField(controller: version, autofocus: true, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Version e.g. 2.2.0')),
          const SizedBox(height: 12),
          TextField(controller: added, maxLines: 3, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'New features (one per line)')),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Publish', onPressed: () async {
            if (version.text.trim().isEmpty) return;
            final items = added.text.split('\n').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
            await c.repo.createChangelog(version: version.text.trim(), added: items);
            if (ctx.mounted) Navigator.pop(ctx);
          }),
        ]),
      ),
    ),
  );
}

void _pubSheet(BuildContext context, String title, TextEditingController titleC, TextEditingController descC, Future<void> Function() onPublish) {
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
          TextField(controller: titleC, autofocus: true, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Title')),
          const SizedBox(height: 12),
          TextField(controller: descC, maxLines: 3, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Message')),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Publish', onPressed: () async {
            if (titleC.text.trim().isEmpty) return;
            await onPublish();
            if (ctx.mounted) Navigator.pop(ctx);
          }),
        ]),
      ),
    ),
  );
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/api/api_client.dart';
import '../../widgets/app_card.dart';

class ChildContactsScreen extends StatefulWidget {
  const ChildContactsScreen({super.key});

  @override
  State<ChildContactsScreen> createState() => _ChildContactsScreenState();
}

class _ChildContactsScreenState extends State<ChildContactsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _contacts = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiClient>();
      final res = await api.get('/child/contacts') as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _contacts = List<Map<String, dynamic>>.from(res['contacts'] as List? ?? []);
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not load emergency contacts.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone.replaceAll(' ', ''));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cannot open dialer for $phone'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _sms(String phone) async {
    final uri = Uri(scheme: 'sms', path: phone.replaceAll(' ', ''));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _delete(Map<String, dynamic> contact) async {
    final id = contact['id'] as String?;
    final custom = contact['custom'] == true;
    if (!custom || id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Parent contacts cannot be removed.'), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    try {
      await context.read<ApiClient>().delete('/child/contacts/$id');
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not delete contact.'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _showAddSheet() async {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final relCtrl = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgElevated,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add Emergency Contact', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
              const SizedBox(height: 16),
              _Field(ctrl: nameCtrl, label: 'Name', hint: 'e.g. Uncle Raj'),
              const SizedBox(height: 10),
              _Field(ctrl: phoneCtrl, label: 'Phone Number', hint: '+91 9876543210', type: TextInputType.phone),
              const SizedBox(height: 10),
              _Field(ctrl: relCtrl, label: 'Relationship (optional)', hint: 'e.g. Uncle, Teacher'),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.cyan, foregroundColor: Colors.black),
                  onPressed: () async {
                    final name = nameCtrl.text.trim();
                    final phone = phoneCtrl.text.trim();
                    if (name.isEmpty || phone.isEmpty) return;
                    Navigator.of(ctx).pop();
                    try {
                      await context.read<ApiClient>().post('/child/contacts', body: {
                        'name': name, 'phone': phone, 'relationship': relCtrl.text.trim().isEmpty ? 'emergency' : relCtrl.text.trim(),
                      });
                      await _load();
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Could not add contact.'), behavior: SnackBarBehavior.floating),
                        );
                      }
                    }
                  },
                  child: const Text('Add Contact', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Emergency Contacts', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          IconButton(icon: const Icon(Icons.add_rounded, color: AppColors.cyan), onPressed: _showAddSheet),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : _error != null
                ? Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Text(_error!, style: const TextStyle(color: AppColors.danger)),
                      const SizedBox(height: 12),
                      TextButton(onPressed: _load, child: const Text('Retry', style: TextStyle(color: AppColors.cyan))),
                    ]),
                  )
                : _contacts.isEmpty
                    ? Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.phone_missed_rounded, size: 48, color: AppColors.textMuted),
                          const SizedBox(height: 12),
                          const Text('No emergency contacts yet.', style: TextStyle(color: AppColors.textMuted)),
                          const SizedBox(height: 8),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(backgroundColor: AppColors.cyan, foregroundColor: Colors.black),
                            icon: const Icon(Icons.add_rounded),
                            label: const Text('Add Contact', style: TextStyle(fontWeight: FontWeight.w800)),
                            onPressed: _showAddSheet,
                          ),
                        ]),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _contacts.length,
                        itemBuilder: (context, i) {
                          final c = _contacts[i];
                          final name = c['name'] as String? ?? 'Contact';
                          final phone = c['phone'] as String? ?? '';
                          final role = (c['role'] as String? ?? 'emergency').replaceAll('_', ' ').toUpperCase();
                          final isCustom = c['custom'] == true;

                          return Dismissible(
                            key: ValueKey(c['id'] ?? i),
                            direction: isCustom ? DismissDirection.endToStart : DismissDirection.none,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: AppColors.danger.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete_rounded, color: AppColors.danger),
                            ),
                            confirmDismiss: (_) async {
                              await _delete(c);
                              return false; // _load() handles UI refresh
                            },
                            child: AppCard(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44, height: 44,
                                    decoration: BoxDecoration(
                                      color: AppColors.cyan.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(child: Text(
                                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                                      style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w900, fontSize: 18),
                                    )),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 15.5)),
                                        const SizedBox(height: 3),
                                        Text(role, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                                        if (phone.isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Text(phone, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold)),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (phone.isNotEmpty) ...[
                                    IconButton(
                                      icon: const Icon(Icons.sms_rounded, color: AppColors.cyan, size: 20),
                                      onPressed: () => _sms(phone),
                                      tooltip: 'Send SMS',
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.phone_rounded, color: AppColors.success, size: 20),
                                      onPressed: () => _call(phone),
                                      tooltip: 'Call',
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
      ),
      floatingActionButton: _contacts.isNotEmpty
          ? FloatingActionButton(
              backgroundColor: AppColors.cyan,
              foregroundColor: Colors.black,
              onPressed: _showAddSheet,
              child: const Icon(Icons.add_rounded),
            )
          : null,
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.ctrl, required this.label, required this.hint, this.type});
  final TextEditingController ctrl;
  final String label;
  final String hint;
  final TextInputType? type;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl,
        keyboardType: type,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.05),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.cyan),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    ],
  );
}

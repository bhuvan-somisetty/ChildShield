import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/family_member.dart';
import '../../../data/models/family_model.dart';
import '../../../state/family_controller.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

class FamilySettingsScreen extends StatefulWidget {
  const FamilySettingsScreen({super.key});

  @override
  State<FamilySettingsScreen> createState() => _FamilySettingsScreenState();
}

class _FamilySettingsScreenState extends State<FamilySettingsScreen> {
  final _joinCodeCtrl = TextEditingController();
  bool _joinLoading = false;
  String? _joinError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyController>().load();
    });
  }

  @override
  void dispose() {
    _joinCodeCtrl.dispose();
    super.dispose();
  }

  Future<void> _joinFamily() async {
    final code = _joinCodeCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() {
      _joinLoading = true;
      _joinError = null;
    });

    try {
      await context.read<FamilyController>().joinFamily(code);
      _joinCodeCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Successfully joined the family!'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      setState(() => _joinError = 'Failed to join. Invalid or expired code.');
    } finally {
      if (mounted) setState(() => _joinLoading = false);
    }
  }

  void _showInviteSheet(BuildContext context, FamilyModel family) {
    String selectedRole = 'co_parent';
    List<String> coParentPerms = ['manage_children', 'manage_tasks', 'manage_rewards'];
    List<String> guardianPerms = ['view_location', 'view_tasks'];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgElevated,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Invite Member', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 16),
                    const Text('Select Role', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => selectedRole = 'co_parent'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: selectedRole == 'co_parent' ? AppColors.cyan.withValues(alpha: 0.12) : Colors.transparent,
                                border: Border.all(color: selectedRole == 'co_parent' ? AppColors.cyan : AppColors.border),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text('Co-Parent', style: TextStyle(color: selectedRole == 'co_parent' ? AppColors.cyan : AppColors.textPrimary, fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => selectedRole = 'guardian'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: selectedRole == 'guardian' ? AppColors.cyan.withValues(alpha: 0.12) : Colors.transparent,
                                border: Border.all(color: selectedRole == 'guardian' ? AppColors.cyan : AppColors.border),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text('Guardian', style: TextStyle(color: selectedRole == 'guardian' ? AppColors.cyan : AppColors.textPrimary, fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Granted Permissions', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: (selectedRole == 'co_parent' ? coParentPerms : guardianPerms).map((perm) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.check, color: AppColors.success, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  perm.replaceAll('_', ' ').toUpperCase(),
                                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    PrimaryButton(
                      label: 'Generate Invite Code',
                      icon: Icons.vpn_key,
                      onPressed: () async {
                        Navigator.of(context).pop();
                        try {
                          final code = await context.read<FamilyController>().createInvite(
                                familyId: family.id,
                                role: selectedRole,
                                permissions: selectedRole == 'co_parent' ? coParentPerms : guardianPerms,
                              );
                          if (context.mounted) {
                            _showGeneratedCodeDialog(context, code);
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to generate invite code.'), backgroundColor: AppColors.danger),
                            );
                          }
                        }
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showGeneratedCodeDialog(BuildContext context, String code) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgElevated,
        title: const Text('Invitation Code', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Share this code with the person you want to invite. They should enter this code in their AlphaGuard app.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: SelectableText(
                code,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.cyan, fontSize: 32, fontWeight: FontWeight.w900, fontFamily: 'monospace', letterSpacing: 4),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: code));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Code copied to clipboard.'), backgroundColor: AppColors.success),
              );
              Navigator.of(ctx).pop();
            },
            child: const Text('Copy & Close', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _memberTile(BuildContext context, FamilyMember fm, bool isPrimaryParent) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: (fm.role == 'primary_parent' ? AppColors.warning : AppColors.cyan).withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              fm.role == 'primary_parent'
                  ? Icons.admin_panel_settings
                  : fm.role == 'co_parent'
                      ? Icons.people
                      : Icons.visibility,
              color: fm.role == 'primary_parent' ? AppColors.warning : AppColors.cyan,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(fm.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                    const SizedBox(width: 6),
                    TagChip(
                      label: fm.role.replaceAll('_', ' ').toUpperCase(),
                      color: fm.role == 'primary_parent'
                          ? AppColors.warning
                          : fm.role == 'co_parent'
                              ? AppColors.cyan
                              : AppColors.textMuted,
                    ),
                  ],
                ),
                Text(fm.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
          if (isPrimaryParent && fm.role != 'primary_parent')
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 20),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.bgElevated,
                    title: const Text('Remove Member', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
                    content: Text('Are you sure you want to remove ${fm.name} from the family?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(true),
                        child: const Text('Remove', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await context.read<FamilyController>().removeMember(fm.id);
                }
              },
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final familyCtrl = context.watch<FamilyController>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Family Management', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: familyCtrl.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : RefreshIndicator(
                    onRefresh: familyCtrl.load,
                    color: AppColors.cyan,
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      children: [
                        if (familyCtrl.families.isEmpty)
                          const EmptyState(icon: Icons.group_off, title: 'No Families Found', subtitle: 'You do not belong to any family yet. Create one or enter a code below to join.')
                        else
                          ...familyCtrl.families.map((fam) {
                            final myRole = fam.members.firstWhere((m) => m.userId == context.read<AuthController>().parent?.id, orElse: () => fam.members.first).role;
                            final isPrimary = myRole == 'primary_parent';

                            return AppCard(
                              borderColor: AppColors.border,
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          fam.name,
                                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16.5),
                                        ),
                                      ),
                                      if (isPrimary)
                                        TextButton.icon(
                                          onPressed: () => _showInviteSheet(context, fam),
                                          icon: const Icon(Icons.person_add, size: 16, color: AppColors.cyan),
                                          label: const Text('Invite', style: TextStyle(color: AppColors.cyan, fontSize: 13, fontWeight: FontWeight.bold)),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  const SectionLabel('Members'),
                                  ...fam.members.map((fm) => _memberTile(context, fm, isPrimary)),
                                  const SizedBox(height: 8),
                                  const SectionLabel('Children Linked'),
                                  if (fam.children.isEmpty)
                                    const Padding(
                                      padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                      child: Text('No children linked yet. Pair a device from the child companion app.', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
                                    )
                                  else
                                    ...fam.children.map((c) => Container(
                                          margin: const EdgeInsets.only(bottom: 6),
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                                          child: Row(
                                            children: [
                                              Text(c.emoji, style: const TextStyle(fontSize: 18)),
                                              const SizedBox(width: 10),
                                              Text(c.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13.5)),
                                              const Spacer(),
                                              Text(c.age != null ? '${c.age} yrs' : '', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                            ],
                                          ),
                                        )),
                                ],
                              ),
                            );
                          }),
                        const SizedBox(height: 16),
                        AppCard(
                          padding: const EdgeInsets.all(16),
                          borderColor: AppColors.border,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text('Join a Family', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 15.5)),
                              const SizedBox(height: 6),
                              const Text('Have an invitation code? Enter it below to join as a co-parent or guardian.', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5, height: 1.35)),
                              const SizedBox(height: 14),
                              TextField(
                                controller: _joinCodeCtrl,
                                textCapitalization: TextCapitalization.characters,
                                decoration: const InputDecoration(
                                  hintText: 'ENTER 6-DIGIT CODE',
                                  hintStyle: TextStyle(letterSpacing: 2, fontSize: 13),
                                ),
                                style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, letterSpacing: 2),
                              ),
                              if (_joinError != null) ...[
                                const SizedBox(height: 8),
                                Text(_joinError!, style: const TextStyle(color: AppColors.danger, fontSize: 12.5, fontWeight: FontWeight.w600)),
                              ],
                              const SizedBox(height: 16),
                              PrimaryButton(
                                label: 'Join Family',
                                icon: Icons.group,
                                loading: _joinLoading,
                                onPressed: _joinFamily,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

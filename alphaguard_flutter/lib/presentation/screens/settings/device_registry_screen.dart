import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/device_model.dart';
import '../../../state/family_controller.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_card.dart';

class DeviceRegistryScreen extends StatefulWidget {
  const DeviceRegistryScreen({super.key});

  @override
  State<DeviceRegistryScreen> createState() => _DeviceRegistryScreenState();
}

class _AlphaTimestamp {
  static String format(int ms) {
    if (ms == 0) return 'Never';
    final diff = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(ms));
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _DeviceRegistryScreenState extends State<DeviceRegistryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyController>().load();
    });
  }

  Widget _deviceTile(BuildContext context, DeviceModel dev, FamilyController familyCtrl, bool canManage) {
    final isOnline = DateTime.now().millisecondsSinceEpoch - dev.lastSeen < 5 * 60 * 1000;
    final childName = familyCtrl.children.firstWhere((c) => c.id == dev.childId, orElse: () => familyCtrl.children.first).name;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: (dev.platform.toLowerCase() == 'ios' ? AppColors.indigo : AppColors.cyan).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(
              dev.platform.toLowerCase() == 'ios' ? Icons.phone_iphone : Icons.phone_android,
              color: dev.platform.toLowerCase() == 'ios' ? AppColors.indigo : AppColors.cyan,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(dev.deviceName, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14.5)),
                    const SizedBox(width: 8),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(color: isOnline ? AppColors.success : AppColors.textMuted, shape: BoxShape.circle),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Assigned to: $childName', style: const TextStyle(color: AppColors.textPrimary, fontSize: 12.5, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text('Agent: v${dev.agentVersion} · Last seen: ${_AlphaTimestamp.format(dev.lastSeen)}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
              ],
            ),
          ),
          if (canManage)
            IconButton(
              icon: const Icon(Icons.link_off, color: AppColors.danger, size: 20),
              tooltip: 'Unpair device',
              onPressed: () async {
                // Step 1: confirm intent
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.bgElevated,
                    title: const Text('Unpair Device', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
                    content: Text('Are you sure you want to unpair ${dev.deviceName}? The companion app will stop tracking this device.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(true),
                        child: const Text('Unpair', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
                if (confirm != true || !context.mounted) return;
                // Step 2: require security PIN
                final pinC = TextEditingController();
                String? pinError;
                final authorized = await showDialog<bool>(
                  context: context,
                  barrierDismissible: false,
                  builder: (ctx) => StatefulBuilder(
                    builder: (ctx, setS) => AlertDialog(
                      backgroundColor: AppColors.bgElevated,
                      title: const Text('Enter Security PIN', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
                      content: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Text('Enter your 6-digit PIN to confirm this action.',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                        const SizedBox(height: 16),
                        TextField(
                          controller: pinC,
                          autofocus: true,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          maxLength: 6,
                          obscureText: true,
                          onChanged: (_) => setS(() => pinError = null),
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 28,
                              fontWeight: FontWeight.w900, letterSpacing: 10),
                          decoration: const InputDecoration(counterText: '', hintText: '------'),
                        ),
                        if (pinError != null) ...[
                          const SizedBox(height: 8),
                          Text(pinError!, style: const TextStyle(color: AppColors.danger, fontSize: 12)),
                        ],
                      ]),
                      actions: [
                        TextButton(onPressed: () => Navigator.of(ctx).pop(false),
                            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
                        TextButton(
                          onPressed: () {
                            if (pinC.text.length != 6) {
                              setS(() => pinError = 'PIN must be 6 digits.');
                              return;
                            }
                            Navigator.of(ctx).pop(true);
                          },
                          child: const Text('Confirm', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                );
                pinC.dispose();
                if (authorized == true && context.mounted) {
                  await familyCtrl.deleteDevice(dev.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Device unpaired successfully.'), backgroundColor: AppColors.success),
                    );
                  }
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
    
    // Check if the current user has write permission to unpair devices (primary_parent or co_parent)
    final currentParentId = context.read<AuthController>().parent?.id;
    final myRole = familyCtrl.families.isNotEmpty && currentParentId != null
        ? familyCtrl.families.first.members.firstWhere((m) => m.userId == currentParentId, orElse: () => familyCtrl.families.first.members.first).role
        : 'guardian';
    final canManage = myRole == 'primary_parent' || myRole == 'co_parent';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Device Registry', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
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
                        if (familyCtrl.devices.isEmpty)
                          const EmptyState(icon: Icons.phonelink_off, title: 'No Devices Registered', subtitle: 'To track location or configure geofencing, pair a device in the child companion app using a pairing code.')
                        else ...[
                          const Padding(
                            padding: EdgeInsets.only(left: 4, bottom: 12),
                            child: Text('REGISTERED COMPANION DEVICES', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1)),
                          ),
                          ...familyCtrl.devices.map((dev) => _deviceTile(context, dev, familyCtrl, canManage)),
                        ],
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

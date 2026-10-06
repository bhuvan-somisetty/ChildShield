import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/safety_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/safe_zones_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

/// Safe Zones — create (tap the map), edit radius, delete; enter/exit alerts are
/// produced server-side from the live GPS stream.
class SafeZonesScreen extends StatelessWidget {
  const SafeZonesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<SafeZonesController>(
      create: (ctx) => SafeZonesController(repo: ctx.read<SafetyRepository>(), socket: ctx.read<SocketService>())..load(),
      child: const _ZonesView(),
    );
  }
}

class _ZonesView extends StatelessWidget {
  const _ZonesView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<SafeZonesController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Safe Zones', style: TextStyle(fontWeight: FontWeight.w900))),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.cyan,
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AddSafeZoneScreen(controller: c))),
        icon: const Icon(Icons.add_location_alt, color: Colors.white),
        label: const Text('Add Zone', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.zones.isEmpty
                    ? const Center(child: EmptyState(icon: Icons.shield_outlined, title: 'No safe zones yet', subtitle: 'Add a zone (home, school) to get enter/exit alerts.'))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        children: c.zones.map((z) => AppCard(
                              child: Row(children: [
                                Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.shield, color: AppColors.success, size: 20)),
                                const SizedBox(width: 12),
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(z.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                                  Text('${z.radius.round()}m radius', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                ])),
                                IconButton(onPressed: () => c.remove(z.id), icon: const Icon(Icons.delete_outline, color: AppColors.danger)),
                              ]),
                            )).toList(),
                      ),
          ),
        ),
      ),
    );
  }
}

/// Add a safe zone by tapping the map; adjust the radius; name it.
class AddSafeZoneScreen extends StatefulWidget {
  const AddSafeZoneScreen({super.key, required this.controller});
  final SafeZonesController controller;
  @override
  State<AddSafeZoneScreen> createState() => _AddSafeZoneScreenState();
}

class _AddSafeZoneScreenState extends State<AddSafeZoneScreen> {
  final _name = TextEditingController();
  LatLng _center = const LatLng(30.2672, -97.7431);
  double _radius = 150;
  bool _placed = false;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || !_placed || _busy) return;
    setState(() => _busy = true);
    try {
      await widget.controller.create(name: _name.text.trim(), lat: _center.latitude, lng: _center.longitude, radius: _radius);
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Add Safe Zone', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: _center,
                initialZoom: 13,
                onTap: (_, point) => setState(() { _center = point; _placed = true; }),
              ),
              children: [
                TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'ai.alphaguard.app'),
                if (_placed)
                  CircleLayer(circles: [CircleMarker(point: _center, radius: _radius, useRadiusInMeter: true, color: AppColors.success.withValues(alpha: 0.15), borderColor: AppColors.success, borderStrokeWidth: 2)]),
                if (_placed)
                  MarkerLayer(markers: [Marker(point: _center, child: const Icon(Icons.place, color: AppColors.success, size: 32))]),
              ],
            ),
          ),
          Container(
            color: AppColors.bgElevated,
            padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              if (!_placed) const Padding(padding: EdgeInsets.only(bottom: 8), child: Text('Tap the map to place the zone center.', style: TextStyle(color: AppColors.textMuted, fontSize: 13))),
              TextField(controller: _name, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Zone name (e.g. Home, School)')),
              Row(children: [
                const Text('Radius', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                Expanded(child: Slider(min: 50, max: 1000, divisions: 19, value: _radius, activeColor: AppColors.cyan, label: '${_radius.round()}m', onChanged: (v) => setState(() => _radius = v))),
                Text('${_radius.round()}m', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 6),
              PrimaryButton(label: 'Save Safe Zone', loading: _busy, onPressed: (_placed && _name.text.trim().isNotEmpty) ? _save : null),
            ]),
          ),
        ]),
      ),
    );
  }
}

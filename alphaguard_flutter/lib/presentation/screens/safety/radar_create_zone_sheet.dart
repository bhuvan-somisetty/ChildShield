import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../state/radar_controller.dart';

/// Bottom sheet for creating a new safe zone.
/// Parent taps on the embedded map to place the zone center, names it,
/// sets radius, type (home/school/custom), address, and optional schedule.
class RadarCreateZoneSheet extends StatefulWidget {
  const RadarCreateZoneSheet({super.key});

  @override
  State<RadarCreateZoneSheet> createState() => _RadarCreateZoneSheetState();
}

class _RadarCreateZoneSheetState extends State<RadarCreateZoneSheet> {
  final _nameCtrl  = TextEditingController(text: '');
  final _addrCtrl  = TextEditingController();
  final _arrCtrl   = TextEditingController();
  final _depCtrl   = TextEditingController();

  LatLng? _center;
  double  _radius  = 150; // metres
  String  _type    = 'custom';
  bool    _busy    = false;
  bool    _placed  = false;

  static const _types = ['home', 'school', 'custom'];
  static const _typeLabels = {'home': '🏠 Home', 'school': '🏫 School', 'custom': '📍 Custom'};
  static const _defaultNames = {'home': 'Home', 'school': 'School', 'custom': 'Safe Zone'};

  @override
  void dispose() {
    _nameCtrl.dispose(); _addrCtrl.dispose(); _arrCtrl.dispose(); _depCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0F111A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(bottom: bottom),
      child: DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.6,
        maxChildSize: 0.97,
        expand: false,
        builder: (_, scroll) => CustomScrollView(controller: scroll, slivers: [
          SliverToBoxAdapter(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Handle.
            Center(child: Container(margin: const EdgeInsets.only(top: 12, bottom: 4), width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)))),
            // Header.
            Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 12), child: Row(children: [
              const Icon(Icons.add_location_alt, color: AppColors.cyan, size: 22),
              const SizedBox(width: 10),
              const Expanded(child: Text('Add Safe Zone', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900))),
              IconButton(icon: const Icon(Icons.close, color: AppColors.textMuted), onPressed: () => Navigator.pop(context)),
            ])),
            // Map tap area.
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  height: 200,
                  child: Stack(children: [
                    FlutterMap(
                      options: MapOptions(
                        initialCenter: _center ?? const LatLng(20.5937, 78.9629),
                        initialZoom: _placed ? 15 : 5,
                        onTap: (tapPos, point) => setState(() { _center = point; _placed = true; }),
                      ),
                      children: [
                        TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'ai.alphaguard.app'),
                        if (_placed && _center != null) ...[
                          CircleLayer(circles: [CircleMarker(point: _center!, radius: _radius, useRadiusInMeter: true, color: AppColors.success.withValues(alpha: 0.15), borderColor: AppColors.success.withValues(alpha: 0.6), borderStrokeWidth: 2)]),
                          MarkerLayer(markers: [Marker(point: _center!, width: 32, height: 32, child: const Icon(Icons.location_on, color: AppColors.success, size: 32))]),
                        ],
                      ],
                    ),
                    if (!_placed)
                      const Positioned.fill(child: IgnorePointer(child: ColoredBox(color: Color(0x55000000),
                          child: Center(child: Text('Tap map to place zone center', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)))))),
                  ]),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Zone type chips.
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Row(children: _types.map((t) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(_typeLabels[t]!, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: _type == t ? Colors.black : AppColors.textSecondary)),
                selected: _type == t,
                selectedColor: AppColors.cyan,
                backgroundColor: AppColors.surface,
                side: BorderSide.none,
                onSelected: (_) => setState(() { _type = t; if (_nameCtrl.text.isEmpty) _nameCtrl.text = _defaultNames[t]!; }),
              ),
            )).toList())),
            const SizedBox(height: 16),
            // Name field.
            _Field(controller: _nameCtrl, label: 'Zone name', hint: 'e.g. Home, School, Grandma\'s'),
            const SizedBox(height: 10),
            // Radius slider.
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Text('Radius', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                const Spacer(),
                Text(_radius >= 1000 ? '${(_radius / 1000).toStringAsFixed(1)} km' : '${_radius.toInt()} m', style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w800, fontSize: 13)),
              ]),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: AppColors.cyan,
                  inactiveTrackColor: AppColors.surface,
                  thumbColor: AppColors.cyan,
                  overlayColor: AppColors.cyan.withValues(alpha: 0.15),
                ),
                child: Slider(value: _radius, min: 50, max: 2000, divisions: 39, onChanged: (v) => setState(() => _radius = v)),
              ),
            ])),
            const SizedBox(height: 10),
            // Address field.
            _Field(controller: _addrCtrl, label: 'Address (optional)', hint: 'Street address or landmark'),
            const SizedBox(height: 16),
            // Schedule section.
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Row(children: [
              const Icon(Icons.schedule_rounded, color: AppColors.textMuted, size: 16),
              const SizedBox(width: 6),
              const Text('Schedule (optional)', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700, fontSize: 13)),
            ])),
            const SizedBox(height: 8),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Row(children: [
              Expanded(child: _Field(controller: _arrCtrl, label: 'Arrive by (HH:MM)', hint: '08:30')),
              const SizedBox(width: 10),
              Expanded(child: _Field(controller: _depCtrl, label: 'Leave by (HH:MM)', hint: '15:30')),
            ])),
            const SizedBox(height: 24),
            // Save button.
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: SizedBox(width: double.infinity, child: FilledButton(
              onPressed: _busy || !_placed ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.cyan,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _busy
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black))
                  : Text(_placed ? 'Save Zone' : 'Tap map first', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
            ))),
            const SizedBox(height: 24),
          ])),
        ]),
      ),
    );
  }

  Future<void> _save() async {
    if (_center == null) return;
    final name = _nameCtrl.text.trim().isNotEmpty ? _nameCtrl.text.trim() : _defaultNames[_type]!;
    setState(() => _busy = true);
    final c = context.read<RadarController>();
    final zone = await c.createZone(
      name: name,
      lat: _center!.latitude,
      lng: _center!.longitude,
      radius: _radius,
      type: _type,
      address: _addrCtrl.text.trim().isEmpty ? null : _addrCtrl.text.trim(),
      expectedArrival: _arrCtrl.text.trim().isEmpty ? null : _arrCtrl.text.trim(),
      expectedDeparture: _depCtrl.text.trim().isEmpty ? null : _depCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (zone != null) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('${zone.name} created!', style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Failed to create zone. Try again.'),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.controller, required this.label, required this.hint});
  final TextEditingController controller;
  final String label;
  final String hint;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      TextField(
        controller: controller,
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted),
          filled: true,
          fillColor: AppColors.surface,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    ]),
  );
}

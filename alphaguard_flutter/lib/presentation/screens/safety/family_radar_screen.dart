import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/safety.dart';
import '../../../data/repositories/safety_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/radar_controller.dart';
import '../../widgets/app_card.dart';
import 'radar_create_zone_sheet.dart';
import 'radar_zone_analytics_screen.dart';

/// Family Radar — 4-tab hub:
///   1. Live Map   — child marker, geofence circles, route polyline, status bar
///   2. Route History — date-mode chips, scrollable timeline, minimap
///   3. Safe Zones — zone cards with analytics and edit/delete
///   4. Timeline   — merged radar events with severity filter
class FamilyRadarScreen extends StatelessWidget {
  const FamilyRadarScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<RadarController>(
      create: (ctx) => RadarController(
        repo: ctx.read<SafetyRepository>(),
        socket: ctx.read<SocketService>(),
        childId: childId,
      )..load(),
      child: _RadarHub(childName: childName),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _RadarHub extends StatefulWidget {
  const _RadarHub({this.childName});
  final String? childName;

  @override
  State<_RadarHub> createState() => _RadarHubState();
}

class _RadarHubState extends State<_RadarHub> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _map = MapController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RadarController>();
    final hasFix = c.latest != null;
    final name = widget.childName ?? 'Child';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Family Radar', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
          if (widget.childName != null)
            Text(widget.childName!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w500)),
        ]),
        actions: [
          // Device online indicator.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(
                color: c.isDeviceOnline ? AppColors.success : AppColors.textMuted,
                shape: BoxShape.circle,
              )),
              const SizedBox(width: 4),
              Text(c.isDeviceOnline ? 'Online' : 'Offline', style: TextStyle(color: c.isDeviceOnline ? AppColors.success : AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
            ]),
          ),
          // Battery indicator.
          if (c.battery != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _BatteryBadge(battery: c.battery!),
            ),
          // Recenter button (Live Map tab only).
          IconButton(
            tooltip: 'Recenter map',
            onPressed: hasFix ? () { _tabs.animateTo(0); _map.move(LatLng(c.latest!.lat, c.latest!.lng), 15); } : null,
            icon: const Icon(Icons.my_location, color: AppColors.cyan),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppColors.cyan,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.cyan,
          indicatorWeight: 2.5,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5),
          tabs: const [
            Tab(icon: Icon(Icons.radar, size: 18), text: 'Live Map'),
            Tab(icon: Icon(Icons.route, size: 18), text: 'History'),
            Tab(icon: Icon(Icons.shield_outlined, size: 18), text: 'Zones'),
            Tab(icon: Icon(Icons.list_alt_rounded, size: 18), text: 'Timeline'),
          ],
        ),
      ),
      body: SafeArea(
        child: c.loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : TabBarView(controller: _tabs, children: [
                _LiveMapTab(mapController: _map, childName: name),
                const _RouteHistoryTab(),
                const _SafeZonesTab(),
                const _TimelineTab(),
              ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Live Map
// ─────────────────────────────────────────────────────────────────────────────

class _LiveMapTab extends StatelessWidget {
  const _LiveMapTab({required this.mapController, required this.childName});
  final MapController mapController;
  final String childName;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RadarController>();
    final hasFix = c.latest != null;
    final center = hasFix ? LatLng(c.latest!.lat, c.latest!.lng) : const LatLng(20.5937, 78.9629); // India fallback
    final track  = c.history.map((p) => LatLng(p.lat, p.lng)).toList();

    return Stack(children: [
      Column(children: [
        Expanded(
          child: Stack(children: [
            FlutterMap(
              mapController: mapController,
              options: MapOptions(
                initialCenter: center,
                initialZoom: hasFix ? 15 : 5,
                minZoom: 3, maxZoom: 18,
              ),
              children: [
                TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'ai.alphaguard.app'),
                // Geofence circles.
                CircleLayer(circles: c.zones.map((z) => CircleMarker(
                  point: LatLng(z.lat, z.lng),
                  radius: z.radius,
                  useRadiusInMeter: true,
                  color: AppColors.success.withValues(alpha: 0.10),
                  borderColor: AppColors.success.withValues(alpha: 0.55),
                  borderStrokeWidth: 2,
                )).toList()),
                // Route polyline.
                if (track.length > 1)
                  PolylineLayer(polylines: [
                    Polyline(points: track, strokeWidth: 3.5, color: AppColors.cyan.withValues(alpha: 0.65)),
                  ]),
                // Child marker.
                if (hasFix)
                  MarkerLayer(markers: [
                    Marker(
                      point: center,
                      width: 48, height: 48,
                      child: _ChildMarker(speed: c.latest?.speed),
                    ),
                  ]),
                // Zone name labels.
                MarkerLayer(markers: c.zones.map((z) => Marker(
                  point: LatLng(z.lat, z.lng),
                  width: 120, height: 24,
                  child: Container(
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: const Color(0xCC0B0C14), borderRadius: BorderRadius.circular(6)),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    child: Text(z.name, style: const TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
                  ),
                )).toList()),
              ],
            ),
            // "Waiting" banner.
            if (!hasFix)
              const Positioned(left: 0, right: 0, top: 0,
                child: Material(color: Color(0xCC0B0C14),
                  child: Padding(padding: EdgeInsets.all(10),
                    child: Text('Waiting for child device to share location…', textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13))))),
          ]),
        ),
        // Status bar.
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: AppCard(
            child: Row(children: [
              Icon(hasFix ? Icons.location_on : Icons.location_off, color: hasFix ? AppColors.success : AppColors.textMuted, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(
                hasFix
                    ? 'Last update: ${_ago(c.latest!.at)} · ${c.history.length} pts · ${c.zones.length} zone${c.zones.length == 1 ? '' : 's'}'
                        '${c.latest!.speed != null && c.latest!.speed! > 0.5 ? ' · ${(c.latest!.speed! * 3.6).toStringAsFixed(0)} km/h' : ''}'
                    : 'No location data yet',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              )),
            ]),
          ),
        ),
      ]),
      // FAB — create zone.
      Positioned(
        bottom: 80, right: 16,
        child: FloatingActionButton.extended(
          heroTag: 'create_zone',
          backgroundColor: AppColors.cyan,
          foregroundColor: Colors.black,
          icon: const Icon(Icons.add_location_alt),
          label: const Text('Add Zone', style: TextStyle(fontWeight: FontWeight.w800)),
          onPressed: () => _showCreateZone(context),
        ),
      ),
    ]);
  }

  Future<void> _showCreateZone(BuildContext context) async {
    final c = context.read<RadarController>();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(value: c, child: const RadarCreateZoneSheet()),
    );
  }

  static String _ago(int at) {
    if (at == 0) return 'unknown';
    final mins = (DateTime.now().millisecondsSinceEpoch - at) ~/ 60000;
    if (mins < 1) return 'just now';
    if (mins < 60) return '${mins}m ago';
    return '${mins ~/ 60}h ago';
  }
}

class _ChildMarker extends StatelessWidget {
  const _ChildMarker({this.speed});
  final double? speed;

  @override
  Widget build(BuildContext context) {
    final moving = speed != null && speed! > 0.5;
    return Stack(alignment: Alignment.center, children: [
      // Pulse ring.
      Container(width: 48, height: 48, decoration: BoxDecoration(
        color: AppColors.cyan.withValues(alpha: 0.18),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.cyan.withValues(alpha: 0.35), width: 2),
      )),
      // Inner marker.
      Container(width: 32, height: 32, decoration: const BoxDecoration(
        color: AppColors.cyan, shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: Color(0x8006B6D4), blurRadius: 10)],
      ), child: Icon(moving ? Icons.directions_walk : Icons.person_pin_circle, color: Colors.white, size: 18)),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Route History
// ─────────────────────────────────────────────────────────────────────────────

class _RouteHistoryTab extends StatelessWidget {
  const _RouteHistoryTab();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RadarController>();

    return Column(children: [
      // Date mode chips.
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
        child: Row(children: HistoryMode.values.map((m) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(
            label: Text(m.label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: c.historyMode == m ? Colors.black : AppColors.textSecondary)),
            selected: c.historyMode == m,
            selectedColor: AppColors.cyan,
            backgroundColor: AppColors.surface,
            side: BorderSide.none,
            onSelected: (_) => c.setHistoryMode(m),
          ),
        )).toList()),
      ),
      // Mini-map with route.
      if (c.history.isNotEmpty)
        SizedBox(
          height: 180,
          child: _RouteMap(points: c.history),
        ),
      // Point list.
      Expanded(
        child: c.history.isEmpty
            ? const _EmptyState(icon: Icons.route, text: 'No location points for this period.\nCheck that the child device has location enabled.')
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                itemCount: c.history.length,
                separatorBuilder: (_, __) => const SizedBox(height: 4),
                itemBuilder: (_, i) {
                  final p = c.history[i];
                  return AppCard(
                    child: Row(children: [
                      Container(width: 8, height: 8, decoration: BoxDecoration(
                        color: i == 0 ? AppColors.cyan : AppColors.textMuted.withValues(alpha: 0.5),
                        shape: BoxShape.circle,
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${p.lat.toStringAsFixed(5)}, ${p.lng.toStringAsFixed(5)}',
                            style: TextStyle(color: i == 0 ? AppColors.textPrimary : AppColors.textSecondary, fontSize: 12.5, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Row(children: [
                          Text(_timestamp(p.at), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          if (p.speed != null && p.speed! > 0.5) ...[
                            const SizedBox(width: 8),
                            Text('${(p.speed! * 3.6).toStringAsFixed(0)} km/h', style: const TextStyle(color: AppColors.cyan, fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                          if (p.accuracy != null) ...[
                            const SizedBox(width: 8),
                            Text('±${p.accuracy!.toStringAsFixed(0)}m', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          ],
                        ]),
                      ])),
                      if (i == 0) const Chip(label: Text('Latest', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black)), backgroundColor: AppColors.cyan, padding: EdgeInsets.zero, labelPadding: EdgeInsets.symmetric(horizontal: 6)),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }

  static String _timestamp(int at) {
    if (at == 0) return 'Unknown';
    final d = DateTime.fromMillisecondsSinceEpoch(at);
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')} · ${d.day}/${d.month}';
  }
}

class _RouteMap extends StatelessWidget {
  const _RouteMap({required this.points});
  final List<LocationPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return const SizedBox();
    final track = points.map((p) => LatLng(p.lat, p.lng)).toList();
    final center = track.first;
    return ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: FlutterMap(
        options: MapOptions(initialCenter: center, initialZoom: 14, interactionOptions: const InteractionOptions(flags: InteractiveFlag.none)),
        children: [
          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'ai.alphaguard.app'),
          if (track.length > 1) PolylineLayer(polylines: [Polyline(points: track, strokeWidth: 3, color: AppColors.cyan.withValues(alpha: 0.7))]),
          MarkerLayer(markers: [Marker(point: center, width: 20, height: 20, child: Container(decoration: const BoxDecoration(color: AppColors.cyan, shape: BoxShape.circle), child: const Icon(Icons.circle, color: Colors.white, size: 10)))]),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Safe Zones
// ─────────────────────────────────────────────────────────────────────────────

class _SafeZonesTab extends StatelessWidget {
  const _SafeZonesTab();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RadarController>();

    return Stack(children: [
      c.zones.isEmpty
          ? _EmptyState(
              icon: Icons.shield_outlined,
              text: 'No safe zones yet.\nTap the + button to add a zone.',
              action: FilledButton.icon(onPressed: () => _showCreate(context), icon: const Icon(Icons.add_location_alt), label: const Text('Add Zone')),
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
              itemCount: c.zones.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _ZoneCard(zone: c.zones[i]),
            ),
      Positioned(
        bottom: 16, right: 16,
        child: FloatingActionButton(
          heroTag: 'zone_tab_fab',
          backgroundColor: AppColors.cyan,
          foregroundColor: Colors.black,
          onPressed: () => _showCreate(context),
          child: const Icon(Icons.add_location_alt),
        ),
      ),
    ]);
  }

  Future<void> _showCreate(BuildContext context) async {
    final c = context.read<RadarController>();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(value: c, child: const RadarCreateZoneSheet()),
    );
  }
}

class _ZoneCard extends StatelessWidget {
  const _ZoneCard({required this.zone});
  final SafeZone zone;

  @override
  Widget build(BuildContext context) {
    final c = context.read<RadarController>();

    // Count zone events for this zone.
    final enters = c.zoneEvents.where((e) => e.zoneId == zone.id && e.type == 'enter').length;
    final exits  = c.zoneEvents.where((e) => e.zoneId == zone.id && e.type == 'exit').length;

    final typeIcon = switch (zone.type) {
      'home'   => Icons.home_rounded,
      'school' => Icons.school_rounded,
      _        => Icons.shield_rounded,
    };
    final typeColor = switch (zone.type) {
      'home'   => AppColors.warning,
      'school' => AppColors.indigo,
      _        => AppColors.success,
    };

    return AppCard(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => RadarZoneAnalyticsScreen(zone: zone)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(width: 40, height: 40, decoration: BoxDecoration(color: typeColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(typeIcon, color: typeColor, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(zone.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
              Text('${(zone.radius / 1000).toStringAsFixed(2).replaceFirst(RegExp(r'\.?0+$'), '')} km radius', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ])),
            IconButton(tooltip: 'Delete zone', icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 20), onPressed: () => _confirmDelete(context, c)),
          ]),
          if (zone.address != null) ...[
            const SizedBox(height: 6),
            Row(children: [
              const Icon(Icons.location_on_outlined, color: AppColors.textMuted, size: 14),
              const SizedBox(width: 4),
              Expanded(child: Text(zone.address!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5), overflow: TextOverflow.ellipsis)),
            ]),
          ],
          if (zone.expectedArrival != null || zone.expectedDeparture != null) ...[
            const SizedBox(height: 6),
            Row(children: [
              const Icon(Icons.schedule_rounded, color: AppColors.textMuted, size: 14),
              const SizedBox(width: 4),
              Text(
                [if (zone.expectedArrival != null) 'Arrive ${zone.expectedArrival}', if (zone.expectedDeparture != null) 'Leave ${zone.expectedDeparture}'].join(' · '),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
              ),
            ]),
          ],
          if (enters + exits > 0) ...[
            const SizedBox(height: 8),
            const Divider(color: Color(0x22FFFFFF), height: 1),
            const SizedBox(height: 8),
            Row(children: [
              _StatBadge(label: 'Entries', value: '$enters', color: AppColors.success),
              const SizedBox(width: 8),
              _StatBadge(label: 'Exits', value: '$exits', color: AppColors.warning),
            ]),
          ],
        ]),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, RadarController c) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: AppColors.surface,
      title: Text('Delete ${zone.name}?', style: const TextStyle(color: AppColors.textPrimary)),
      content: const Text('This will permanently remove the safe zone.', style: TextStyle(color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(context, true), style: FilledButton.styleFrom(backgroundColor: AppColors.danger), child: const Text('Delete')),
      ],
    ));
    if (ok == true && context.mounted) c.deleteZone(zone.id);
  }
}

class _StatBadge extends StatelessWidget {
  const _StatBadge({required this.label, required this.value, required this.color});
  final String label; final String value; final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13)),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
    ]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: Timeline
// ─────────────────────────────────────────────────────────────────────────────

class _TimelineTab extends StatelessWidget {
  const _TimelineTab();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RadarController>();
    final events = c.filteredRadarEvents;

    return Column(children: [
      // Severity filter chips.
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _SeverityChip(label: 'All', selected: c.severityFilter == null, onTap: () => c.setSeverityFilter(null), color: AppColors.textSecondary),
            const SizedBox(width: 8),
            _SeverityChip(label: '🟢 Info', selected: c.severityFilter == RadarSeverity.info, onTap: () => c.setSeverityFilter(RadarSeverity.info), color: AppColors.success),
            const SizedBox(width: 8),
            _SeverityChip(label: '🟡 Warning', selected: c.severityFilter == RadarSeverity.warning, onTap: () => c.setSeverityFilter(RadarSeverity.warning), color: AppColors.warning),
            const SizedBox(width: 8),
            _SeverityChip(label: '🔴 Critical', selected: c.severityFilter == RadarSeverity.critical, onTap: () => c.setSeverityFilter(RadarSeverity.critical), color: AppColors.danger),
          ]),
        ),
      ),
      Expanded(
        child: events.isEmpty
            ? const _EmptyState(icon: Icons.list_alt_rounded, text: 'No events yet.\nEvents will appear here as they happen.')
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                itemCount: events.length,
                separatorBuilder: (_, __) => const SizedBox(height: 4),
                itemBuilder: (_, i) => _RadarEventTile(event: events[i]),
              ),
      ),
    ]);
  }
}

class _SeverityChip extends StatelessWidget {
  const _SeverityChip({required this.label, required this.selected, required this.onTap, required this.color});
  final String label; final bool selected; final VoidCallback onTap; final Color color;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: selected ? color.withValues(alpha: 0.18) : AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: selected ? color : Colors.transparent, width: 1.5),
      ),
      child: Text(label, style: TextStyle(color: selected ? color : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 12.5)),
    ),
  );
}

class _RadarEventTile extends StatelessWidget {
  const _RadarEventTile({required this.event});
  final RadarEvent event;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _iconAndColor();
    return AppCard(
      child: Row(children: [
        Container(width: 38, height: 38, decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 18)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(event.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
          if (event.body.isNotEmpty) Text(event.body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(_ago(event.at), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          const SizedBox(height: 4),
          _SeverityBadge(severity: event.severity),
        ]),
      ]),
    );
  }

  (IconData, Color) _iconAndColor() {
    switch (event.type) {
      case 'zone_enter':      return (Icons.login_rounded,         AppColors.success);
      case 'zone_exit':       return (Icons.logout_rounded,        AppColors.warning);
      case 'zone_late':       return (Icons.schedule_rounded,      AppColors.warning);
      case 'zone_missed':     return (Icons.event_busy_rounded,    AppColors.warning);
      case 'zone_stayed':     return (Icons.hourglass_full_rounded,AppColors.warning);
      case 'sos':             return (Icons.sos_rounded,           AppColors.danger);
      case 'device_online':   return (Icons.wifi_rounded,          AppColors.success);
      case 'device_offline':  return (Icons.wifi_off_rounded,      AppColors.textMuted);
      case 'battery_low':     return (Icons.battery_alert_rounded, AppColors.warning);
      case 'battery_critical':return (Icons.battery_0_bar_rounded, AppColors.danger);
      case 'location_disabled':return (Icons.location_off_rounded, AppColors.danger);
      case 'location_revoked':return (Icons.gps_off_rounded,       AppColors.danger);
      default:                return (Icons.info_outline_rounded,  AppColors.textMuted);
    }
  }

  static String _ago(int at) {
    if (at == 0) return '';
    final mins = (DateTime.now().millisecondsSinceEpoch - at) ~/ 60000;
    if (mins < 1) return 'just now';
    if (mins < 60) return '${mins}m ago';
    if (mins < 1440) return '${mins ~/ 60}h ago';
    return '${mins ~/ 1440}d ago';
  }
}

class _SeverityBadge extends StatelessWidget {
  const _SeverityBadge({required this.severity});
  final RadarSeverity severity;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (severity) {
      RadarSeverity.info     => ('Info',     AppColors.success),
      RadarSeverity.warning  => ('Warning',  AppColors.warning),
      RadarSeverity.critical => ('Critical', AppColors.danger),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.text, this.action});
  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 52, color: AppColors.textMuted.withValues(alpha: 0.4)),
        const SizedBox(height: 16),
        Text(text, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.6)),
        if (action != null) ...[const SizedBox(height: 20), action!],
      ]),
    ),
  );
}

class _BatteryBadge extends StatelessWidget {
  const _BatteryBadge({required this.battery});
  final BatteryStatus battery;

  @override
  Widget build(BuildContext context) {
    final color = battery.isCritical ? AppColors.danger : battery.isLow ? AppColors.warning : AppColors.success;
    final icon = battery.charging ? Icons.battery_charging_full_rounded
        : battery.level > 75 ? Icons.battery_full_rounded
        : battery.level > 50 ? Icons.battery_5_bar_rounded
        : battery.level > 25 ? Icons.battery_3_bar_rounded
        : battery.level > 10 ? Icons.battery_1_bar_rounded
        : Icons.battery_0_bar_rounded;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: color, size: 16),
      const SizedBox(width: 2),
      Text('${battery.level}%', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    ]);
  }
}

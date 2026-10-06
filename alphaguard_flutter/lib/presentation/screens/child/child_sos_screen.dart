import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/safety_repository.dart';
import '../../../services/socket/socket_events.dart';
import '../../../services/socket/socket_service.dart';

/// Child Emergency SOS — one big button. Captures the current location and
/// triggers an immediate, realtime alert to the parent (with location attached).
class ChildSosScreen extends StatefulWidget {
  const ChildSosScreen({super.key});
  @override
  State<ChildSosScreen> createState() => _ChildSosScreenState();
}

class _ChildSosScreenState extends State<ChildSosScreen> {
  bool _sending = false;
  bool _sent = false;

  Future<void> _sendSos() async {
    if (_sending) return;
    setState(() => _sending = true);
    Map<String, double>? location;
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm != LocationPermission.denied && perm != LocationPermission.deniedForever) {
        final pos = await Geolocator.getCurrentPosition();
        location = {'lat': pos.latitude, 'lng': pos.longitude};
      }
    } catch (_) {/* send without location rather than block an emergency */}
    // Dual-path: socket for instant alert + REST to persist in DB if socket drops.
    context.read<SocketService>().emit(SocketEvents.sosTrigger, {if (location != null) 'location': location});
    try {
      await context.read<SafetyRepository>().triggerSos(location: location);
    } catch (_) {/* non-fatal — socket path already delivered the alert */}
    if (mounted) setState(() { _sending = false; _sent = true; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Emergency', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_sent) ...[
                  const Icon(Icons.check_circle, color: AppColors.success, size: 64),
                  const SizedBox(height: 16),
                  const Text('Alert sent to your parent', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
                  const SizedBox(height: 8),
                  const Text('Stay safe. Your parent has been notified with your location.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 20),
                  OutlinedButton(onPressed: () => setState(() => _sent = false), child: const Text('Send another alert')),
                ] else ...[
                  const Text('Press and hold the button if you need help right now.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 15, height: 1.4)),
                  const SizedBox(height: 40),
                  GestureDetector(
                    onLongPress: _sendSos,
                    onTap: _sendSos,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(colors: [Color(0xFFF43F5E), Color(0xFFB91C1C)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                        boxShadow: [BoxShadow(color: Color(0x66F43F5E), blurRadius: 40, spreadRadius: 4)],
                      ),
                      child: Center(
                        child: _sending
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.sos, color: Colors.white, size: 64), SizedBox(height: 4), Text('SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: 2))]),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('In a real emergency, also call your local emergency number.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

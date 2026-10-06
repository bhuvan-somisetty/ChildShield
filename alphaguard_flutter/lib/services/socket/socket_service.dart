import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../core/config/env.dart';

/// Socket.IO client. Mirrors the web `agClient` realtime layer: a single shared
/// connection authenticated with the JWT handshake; screens subscribe to events
/// and unsubscribe on dispose to avoid listener leaks.
class SocketService {
  io.Socket? _socket;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    if (_socket != null) return; // already connected/connecting
    _socket = io.io(
      Env.apiBase,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .enableReconnection()
          .build(),
    );
    _socket!.connect();
  }

  /// Subscribe to a server event. Returns a disposer to remove THIS handler
  /// (so a remount cannot stack duplicate listeners — same discipline as web).
  void Function() on(String event, void Function(dynamic data) handler) {
    _socket?.on(event, handler);
    return () => _socket?.off(event, handler);
  }

  void emit(String event, [dynamic data]) => _socket?.emit(event, data);

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}

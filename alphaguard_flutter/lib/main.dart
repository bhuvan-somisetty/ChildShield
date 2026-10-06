import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'data/api/api_client.dart';
import 'data/repositories/admin_repository.dart';
import 'data/repositories/assistant_repository.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/chat_repository.dart';
import 'data/repositories/family_repository.dart';
import 'data/repositories/notification_repository.dart';
import 'data/repositories/productivity_repository.dart';
import 'data/repositories/safety_repository.dart';
import 'data/repositories/support_repository.dart';
import 'data/repositories/target_repository.dart';
import 'data/repositories/task_repository.dart';
import 'services/location/child_location_service.dart';
import 'services/telemetry/child_battery_service.dart';
import 'services/push/push_service.dart';
import 'services/auth/auth_service.dart';
import 'services/auth/google_auth.dart';
import 'services/auth/token_storage.dart';
import 'services/lifecycle/lifecycle_service.dart';
import 'services/lifecycle/update_service.dart';
import 'services/socket/socket_service.dart';
import 'state/auth_controller.dart';
import 'state/family_controller.dart';
import 'state/notification_controller.dart';
import 'app.dart';

/// Composition root — wires the layers via Provider (dependency injection) and
/// starts the app. The single shared ApiClient/SocketService keep one
/// authenticated connection across the app.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Singletons
  final api = ApiClient();
  final socket = SocketService();
  final tokenStorage = TokenStorage();
  final lifecycle = await LifecycleService.create();

  // Repositories
  final authRepo = AuthRepository(api);
  final familyRepo = FamilyRepository(api);
  final taskRepo = TaskRepository(api);
  final productivityRepo = ProductivityRepository(api);
  final chatRepo = ChatRepository(api);
  final assistantRepo = AssistantRepository();
  final targetRepo = TargetRepository(api);
  final supportRepo = SupportRepository(api);
  final adminRepo = AdminRepository(api);
  final safetyRepo = SafetyRepository(api);
  final notificationRepo = NotificationRepository(api);

  // Safety services (push fails soft without Firebase platform config).
  // Do NOT await — Firebase.initializeApp() blocks the Android main thread
  // and causes an ANR when google-services.json is absent.
  final pushService = PushService(safetyRepo, notificationRepo);
  pushService.init(); // fire-and-forget
  final childLocationService = ChildLocationService(safetyRepo);
  final childBatteryService = ChildBatteryService(safetyRepo, socket);

  // Services
  final authService = AuthService(
    api: api,
    repo: authRepo,
    storage: tokenStorage,
    google: GoogleAuth(),
    socket: socket,
    lifecycle: lifecycle,
  );
  final updateService = UpdateService(api);

  // State
  final authController = AuthController(authService, lifecycle)..bootstrap();

  // Listen for global 401 session expiration and force logout
  ApiClient.onSessionExpired.stream.listen((_) {
    authController.logout();
  });

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<SocketService>.value(value: socket),
        Provider<LifecycleService>.value(value: lifecycle),
        Provider<UpdateService>.value(value: updateService),
        Provider<FamilyRepository>.value(value: familyRepo),
        Provider<TaskRepository>.value(value: taskRepo),
        Provider<ProductivityRepository>.value(value: productivityRepo),
        Provider<ChatRepository>.value(value: chatRepo),
        Provider<AssistantRepository>.value(value: assistantRepo),
        Provider<TargetRepository>.value(value: targetRepo),
        Provider<SupportRepository>.value(value: supportRepo),
        Provider<AdminRepository>.value(value: adminRepo),
        Provider<SafetyRepository>.value(value: safetyRepo),
        Provider<AuthRepository>.value(value: authRepo),
        Provider<NotificationRepository>.value(value: notificationRepo),
        Provider<PushService>.value(value: pushService),
        Provider<ChildLocationService>.value(value: childLocationService),
        Provider<ChildBatteryService>.value(value: childBatteryService),
        ChangeNotifierProvider<AuthController>.value(value: authController),
        ChangeNotifierProvider<FamilyController>(create: (ctx) => FamilyController(ctx.read<FamilyRepository>())),
        ChangeNotifierProvider<NotificationController>(
          create: (ctx) => NotificationController(
            repo: ctx.read<NotificationRepository>(),
            socket: ctx.read<SocketService>(),
          ),
        ),
      ],
      child: const AlphaGuardApp(),
    ),
  );
}

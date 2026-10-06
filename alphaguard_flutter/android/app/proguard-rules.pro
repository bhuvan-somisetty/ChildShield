# Keep Flutter and plugin wrapper classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }

# Keep WorkManager worker classes from being obfuscated (reflective instantiation)
-keepclassmembers class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep class ai.alphaguard.app.UsageAnalyticsWorker { *; }

# Keep native agent components (services, receivers, MethodChannel targets)
-keep class ai.alphaguard.app.TrackingService { *; }
-keep class ai.alphaguard.app.BootReceiver { *; }
-keep class ai.alphaguard.app.BatteryReceiver { *; }
-keep class ai.alphaguard.app.GuardMonitor { *; }
-keep class ai.alphaguard.app.MainActivity { *; }
-keep class ai.alphaguard.app.MainActivity$* { *; }

# Suppress warnings from missing Play Core libraries (used by Flutter deferred components)
-dontwarn com.google.android.play.core.**


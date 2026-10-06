/// Notification domain models for the AlphaGuard notification system.
library;

class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.parentId,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.at,
    this.familyId,
    this.data = const {},
    this.deliveries = const [],
  });

  final String id;
  final String parentId;
  final String? familyId;
  final String type; // sos | location | device | battery | tasks | rewards | achievements | chat | security | screentime | system
  final String title;
  final String body;
  final bool read;
  final int at; // unix ms timestamp
  final Map<String, dynamic> data;
  final List<Map<String, dynamic>> deliveries;

  factory NotificationItem.fromJson(Map<String, dynamic> j) {
    return NotificationItem(
      id: j['id'] as String,
      parentId: j['parentId'] as String,
      familyId: j['familyId'] as String?,
      type: j['type'] as String? ?? 'system',
      title: j['title'] as String? ?? '',
      body: j['body'] as String? ?? '',
      read: j['read'] as bool? ?? false,
      at: (j['at'] as num).toInt(),
      data: (j['data'] as Map<String, dynamic>?) ?? {},
      deliveries: ((j['deliveries'] as List?)?.cast<Map<String, dynamic>>()) ?? [],
    );
  }

  NotificationItem copyWith({bool? read}) {
    return NotificationItem(
      id: id,
      parentId: parentId,
      familyId: familyId,
      type: type,
      title: title,
      body: body,
      read: read ?? this.read,
      at: at,
      data: data,
      deliveries: deliveries,
    );
  }

  /// Returns a suitable category label for display.
  String get category {
    switch (type) {
      case 'sos':
        return 'SOS';
      case 'zone':
      case 'location':
        return 'Safe Zone';
      case 'device':
        return 'Device';
      case 'battery':
        return 'Battery';
      case 'tasks':
      case 'task':
        return 'Task';
      case 'rewards':
      case 'reward':
        return 'Reward';
      case 'achievements':
      case 'achievement':
        return 'Achievement';
      case 'chat':
        return 'Chat';
      case 'security':
        return 'Security';
      case 'screentime':
        return 'Screen Time';
      default:
        return 'System';
    }
  }
}

/// User-configurable per-category notification preferences.
class NotificationPreferences {
  const NotificationPreferences({
    this.sos = true,
    this.location = true,
    this.device = true,
    this.battery = true,
    this.tasks = true,
    this.rewards = true,
    this.achievements = true,
    this.chat = true,
    this.security = true,
    this.screentime = true,
    this.system = true,
  });

  final bool sos;
  final bool location;
  final bool device;
  final bool battery;
  final bool tasks;
  final bool rewards;
  final bool achievements;
  final bool chat;
  final bool security;
  final bool screentime;
  final bool system;

  factory NotificationPreferences.fromJson(Map<String, dynamic> j) {
    return NotificationPreferences(
      sos: j['sos'] as bool? ?? true,
      location: j['location'] as bool? ?? true,
      device: j['device'] as bool? ?? true,
      battery: j['battery'] as bool? ?? true,
      tasks: j['tasks'] as bool? ?? true,
      rewards: j['rewards'] as bool? ?? true,
      achievements: j['achievements'] as bool? ?? true,
      chat: j['chat'] as bool? ?? true,
      security: j['security'] as bool? ?? true,
      screentime: j['screentime'] as bool? ?? true,
      system: j['system'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'sos': sos,
        'location': location,
        'device': device,
        'battery': battery,
        'tasks': tasks,
        'rewards': rewards,
        'achievements': achievements,
        'chat': chat,
        'security': security,
        'screentime': screentime,
        'system': system,
      };

  NotificationPreferences copyWith({
    bool? sos,
    bool? location,
    bool? device,
    bool? battery,
    bool? tasks,
    bool? rewards,
    bool? achievements,
    bool? chat,
    bool? security,
    bool? screentime,
    bool? system,
  }) {
    return NotificationPreferences(
      sos: sos ?? this.sos,
      location: location ?? this.location,
      device: device ?? this.device,
      battery: battery ?? this.battery,
      tasks: tasks ?? this.tasks,
      rewards: rewards ?? this.rewards,
      achievements: achievements ?? this.achievements,
      chat: chat ?? this.chat,
      security: security ?? this.security,
      screentime: screentime ?? this.screentime,
      system: system ?? this.system,
    );
  }
}

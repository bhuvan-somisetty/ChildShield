import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// A target/goal (`publicTarget` shape + `target:upserted`/`target:deleted`).
class Target {
  const Target({
    required this.id,
    required this.childId,
    required this.title,
    required this.progress,
    required this.status,
    this.description = '',
    this.category = 'general',
    this.priority = 'normal',
    this.startDate,
    this.endDate,
    this.updatedAt = 0,
  });

  final String id;
  final String childId;
  final String title;
  final int progress; // 0..100
  final String status; // not_started | in_progress | completed | failed
  final String description;
  final String category;
  final String priority;
  final String? startDate;
  final String? endDate;
  final int updatedAt;

  String get statusLabel => switch (status) {
        'in_progress' => 'In Progress',
        'completed' => 'Completed',
        'failed' => 'Failed',
        _ => 'Not Started',
      };

  Color get statusColor => switch (status) {
        'in_progress' => AppColors.blue,
        'completed' => AppColors.success,
        'failed' => AppColors.danger,
        _ => AppColors.textMuted,
      };

  factory Target.fromJson(Map<String, dynamic> j) => Target(
        id: j['id'].toString(),
        childId: (j['childId'] ?? '') as String,
        title: (j['title'] ?? '') as String,
        progress: (j['progress'] is num) ? (j['progress'] as num).toInt() : 0,
        status: (j['status'] ?? 'not_started') as String,
        description: (j['description'] ?? '') as String,
        category: (j['category'] ?? 'general') as String,
        priority: (j['priority'] ?? 'normal') as String,
        startDate: j['startDate'] as String?,
        endDate: j['endDate'] as String?,
        updatedAt: (j['updatedAt'] is num) ? (j['updatedAt'] as num).toInt() : 0,
      );

  Target copyWith({int? progress, String? status}) => Target(
        id: id,
        childId: childId,
        title: title,
        progress: progress ?? this.progress,
        status: status ?? this.status,
        description: description,
        category: category,
        priority: priority,
        startDate: startDate,
        endDate: endDate,
        updatedAt: updatedAt,
      );
}

/// One target audit entry (`publicTargetHistory` shape).
class TargetHistoryEntry {
  const TargetHistoryEntry({required this.id, required this.actorRole, required this.changeType, required this.at, this.field, this.oldValue, this.newValue});

  final String id;
  final String actorRole;
  final String changeType;
  final int at;
  final String? field;
  final dynamic oldValue;
  final dynamic newValue;

  String describe() {
    switch (changeType) {
      case 'create':
        return 'Created the goal';
      case 'progress':
        return 'Progress → $newValue%';
      case 'status':
        return 'Status → $newValue';
      case 'delete':
        return 'Deleted the goal';
      case 'field_edit':
        return 'Changed $field';
      default:
        return changeType;
    }
  }

  factory TargetHistoryEntry.fromJson(Map<String, dynamic> j) => TargetHistoryEntry(
        id: j['id'].toString(),
        actorRole: (j['actorRole'] ?? 'system') as String,
        changeType: (j['changeType'] ?? '') as String,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
        field: j['field'] as String?,
        oldValue: j['oldValue'],
        newValue: j['newValue'],
      );
}

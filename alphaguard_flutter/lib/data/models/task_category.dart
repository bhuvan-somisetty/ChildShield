import 'package:flutter/material.dart';

/// Task category (built-in or family custom), from GET /task-categories.
class TaskCategory {
  const TaskCategory({required this.id, required this.name, this.color, this.custom = false});

  final String id;
  final String name;
  final String? color; // hex, for custom categories
  final bool custom;

  factory TaskCategory.fromJson(Map<String, dynamic> j) => TaskCategory(
        id: j['id'].toString(),
        name: (j['name'] ?? '') as String,
        color: j['color'] as String?,
        custom: (j['custom'] ?? false) as bool,
      );

  /// Built-in category names (mirror the backend BUILTIN_CATEGORIES).
  static const builtinNames = ['Homework', 'Study', 'Reading', 'Coding', 'Exercise', 'Chores', 'Health', 'School', 'Custom'];

  /// Brand-consistent color per built-in category (matches the web palette).
  static Color colorFor(String name) {
    switch (name) {
      case 'Homework':
        return const Color(0xFF6366F1);
      case 'Study':
        return const Color(0xFF3B82F6);
      case 'Reading':
        return const Color(0xFF06B6D4);
      case 'Coding':
        return const Color(0xFFA855F7);
      case 'Exercise':
        return const Color(0xFFF59E0B);
      case 'Chores':
        return const Color(0xFF64748B);
      case 'Health':
        return const Color(0xFF10B981);
      case 'School':
        return const Color(0xFFEC4899);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  Color get displayColor {
    if (color != null && color!.startsWith('#') && color!.length >= 7) {
      return Color(int.parse('FF${color!.substring(1, 7)}', radix: 16));
    }
    return colorFor(name);
  }
}

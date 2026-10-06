import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Visual identity + copy for an assistant persona. Keeps the parent and child
/// experiences distinct (calm cyan co-pilot vs. playful violet study buddy)
/// while sharing one screen implementation.
class AssistantPersona {
  const AssistantPersona({
    required this.key,
    required this.title,
    required this.tagline,
    required this.accent,
    required this.avatarGradient,
  });

  final String key; // 'parent' | 'child' — matches AssistantController.persona
  final String title;
  final String tagline;
  final Color accent;
  final List<Color> avatarGradient;

  static const parent = AssistantPersona(
    key: 'parent',
    title: 'DISHA',
    tagline: 'Family safety co-pilot',
    accent: AppColors.cyan,
    avatarGradient: [AppColors.cyan, AppColors.blue],
  );

  static const child = AssistantPersona(
    key: 'child',
    title: 'DISHA',
    tagline: 'Your study buddy',
    accent: AppColors.violet,
    avatarGradient: [AppColors.violet, AppColors.indigo],
  );
}

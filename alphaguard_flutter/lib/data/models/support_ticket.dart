import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Support ticket (`publicTicket` shape) + thread comment.
class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.ticketNumber,
    required this.title,
    required this.status,
    required this.priority,
    this.issueType = 'other',
    this.description = '',
    this.createdAt = 0,
    this.updatedAt = 0,
  });

  final String id;
  final int ticketNumber;
  final String title;
  final String status; // open | investigating | in_progress | waiting_user | resolved | closed
  final String priority; // low | medium | high | critical
  final String issueType;
  final String description;
  final int createdAt;
  final int updatedAt;

  String get statusLabel => status.replaceAll('_', ' ').split(' ').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(' ');

  Color get statusColor => switch (status) {
        'open' => AppColors.blue,
        'investigating' => AppColors.warning,
        'in_progress' => AppColors.violet,
        'waiting_user' => AppColors.cyan,
        'resolved' => AppColors.success,
        'closed' => AppColors.textMuted,
        _ => AppColors.textMuted,
      };

  factory SupportTicket.fromJson(Map<String, dynamic> j) => SupportTicket(
        id: j['id'].toString(),
        ticketNumber: (j['ticketNumber'] is num) ? (j['ticketNumber'] as num).toInt() : 0,
        title: (j['title'] ?? '') as String,
        status: (j['status'] ?? 'open') as String,
        priority: (j['priority'] ?? 'medium') as String,
        issueType: (j['issueType'] ?? 'other') as String,
        description: (j['description'] ?? '') as String,
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
        updatedAt: (j['updatedAt'] is num) ? (j['updatedAt'] as num).toInt() : 0,
      );
}

class TicketComment {
  const TicketComment({required this.id, required this.authorRole, required this.body, required this.at, this.internal = false});
  final String id;
  final String authorRole; // user | admin
  final String body;
  final int at;
  final bool internal;

  factory TicketComment.fromJson(Map<String, dynamic> j) => TicketComment(
        id: j['id'].toString(),
        authorRole: (j['authorRole'] ?? 'user') as String,
        body: (j['body'] ?? '') as String,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
        internal: (j['internal'] ?? false) as bool,
      );
}

/// Full thread returned by getTicketThread / adminTicket.
class TicketThread {
  const TicketThread({required this.ticket, required this.comments});
  final SupportTicket ticket;
  final List<TicketComment> comments;

  factory TicketThread.fromJson(Map<String, dynamic> j) => TicketThread(
        ticket: SupportTicket.fromJson(j['ticket'] as Map<String, dynamic>),
        comments: ((j['comments'] ?? const []) as List).map((e) => TicketComment.fromJson(e as Map<String, dynamic>)).toList(),
      );
}

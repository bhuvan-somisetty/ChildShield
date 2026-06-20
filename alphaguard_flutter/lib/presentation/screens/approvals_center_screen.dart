import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

// Matches ApprovalsCenter.jsx — pending app install/delete requests queue.

class ApprovalsCenterScreen extends StatefulWidget {
  const ApprovalsCenterScreen({super.key});

  @override
  State<ApprovalsCenterScreen> createState() => _ApprovalsCenterScreenState();
}

class _ApprovalsCenterScreenState extends State<ApprovalsCenterScreen> {
  final List<_Request> _pending = [
    _Request(id: '1', app: 'Snapchat', type: 'install', cat: 'Social', childName: 'Lily', time: '2 min ago', reason: 'My friends use it to share photos', color: const Color(0xFFEAB308)),
    _Request(id: '2', app: 'Roblox', type: 'install', cat: 'Gaming', childName: 'Lily', time: '5 min ago', color: const Color(0xFF16A34A)),
  ];

  final List<_Request> _history = [
    _Request(id: 'h1', app: 'TikTok', type: 'install', cat: 'Social', childName: 'Lily', time: 'Yesterday', color: const Color(0xFFA855F7), status: 'rejected', decidedAt: 'Yesterday 10:14 AM'),
    _Request(id: 'h2', app: 'Khan Academy', type: 'install', cat: 'Education', childName: 'Lily', time: '2 days ago', color: const Color(0xFF10B981), status: 'approved', decidedAt: '2 days ago'),
  ];

  String? _toast;

  void _act(String id, String decision) {
    setState(() {
      final idx = _pending.indexWhere((r) => r.id == id);
      if (idx == -1) return;
      final r = _pending.removeAt(idx);
      _history.insert(0, r.copyWith(status: decision, decidedAt: 'Just now'));
      _toast = decision == 'approved' ? 'Request approved' : 'Request rejected';
    });
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              children: [
                _buildHeader(context),
                const SizedBox(height: 24),
                _buildInfoCard(),
                const SizedBox(height: 20),
                _buildLabel('Pending (${_pending.length})'),
                const SizedBox(height: 10),
                if (_pending.isEmpty)
                  _buildEmptyPending()
                else
                  ...(_pending.map((r) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildRequestCard(r, decided: false),
                  ))),
                if (_history.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _buildLabel('History'),
                  const SizedBox(height: 10),
                  ...(_history.map((r) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildRequestCard(r, decided: true),
                  ))),
                ],
                const SizedBox(height: 32),
              ],
            ),
            if (_toast != null)
              Positioned(
                bottom: 100,
                left: 0, right: 0,
                child: Center(
                  child: AnimatedOpacity(
                    opacity: _toast != null ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF11131D),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withValues(alpha: .15)),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .4), blurRadius: 20)],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 15),
                          const SizedBox(width: 8),
                          Text(_toast!, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: .1)),
            ),
            child: const Icon(Icons.chevron_left_rounded, color: Color(0xFFCBD5E1), size: 20),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('App Requests', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              Text('${_pending.length} pending approval${_pending.length == 1 ? '' : 's'}',
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF06B6D4).withValues(alpha: .05),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: .15)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.verified_user_rounded, color: Color(0xFF22D3EE), size: 16),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                "Children can't install or remove apps without your approval. Every decision is logged below.",
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500, height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyPending() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .07)),
      ),
      child: const Padding(
        padding: EdgeInsets.symmetric(vertical: 36),
        child: Column(
          children: [
            Icon(Icons.inbox_rounded, color: Color(0xFF475569), size: 26),
            SizedBox(height: 8),
            Text('No pending requests', style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestCard(_Request r, {required bool decided}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .07)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: r.color, borderRadius: BorderRadius.circular(14)),
                  child: Center(child: Text(r.app[0], style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(r.app, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900)),
                          const SizedBox(width: 8),
                          _TypeBadge(type: r.type),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text('${r.cat} · ${r.childName} · ${r.time}',
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
            if (r.reason != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: .2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: .06)),
                ),
                child: RichText(
                  text: TextSpan(
                    children: [
                      const TextSpan(text: 'Reason: ', style: TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w700)),
                      TextSpan(text: r.reason, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            if (decided)
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (r.status == 'approved' ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withValues(alpha: .15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      r.status == 'approved' ? 'APPROVED' : 'REJECTED',
                      style: TextStyle(
                        color: r.status == 'approved' ? const Color(0xFF34D399) : const Color(0xFFF87171),
                        fontSize: 11, fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(r.decidedAt ?? '', style: const TextStyle(color: Color(0xFF475569), fontSize: 11.5, fontWeight: FontWeight.w600)),
                ],
              )
            else
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _act(r.id, 'rejected'),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .05),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: .1)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.close_rounded, color: Colors.white, size: 16),
                            SizedBox(width: 6),
                            Text('Reject', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _act(r.id, 'approved'),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0D9488)]),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_rounded, color: Colors.white, size: 16),
                            SizedBox(width: 6),
                            Text('Approve', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) => Text(
    text.toUpperCase(),
    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 2.0),
  );
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    final isInstall = type == 'install';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: (isInstall ? const Color(0xFF06B6D4) : const Color(0xFFEF4444)).withValues(alpha: .15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isInstall ? Icons.download_rounded : Icons.delete_rounded,
              color: isInstall ? const Color(0xFF22D3EE) : const Color(0xFFF87171), size: 10),
          const SizedBox(width: 3),
          Text(isInstall ? 'INSTALL' : 'DELETE',
              style: TextStyle(color: isInstall ? const Color(0xFF22D3EE) : const Color(0xFFF87171), fontSize: 9, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _Request {
  const _Request({
    required this.id, required this.app, required this.type, required this.cat,
    required this.childName, required this.time, required this.color,
    this.reason, this.status, this.decidedAt,
  });
  final String id;
  final String app;
  final String type;
  final String cat;
  final String childName;
  final String time;
  final Color color;
  final String? reason;
  final String? status;
  final String? decidedAt;

  _Request copyWith({String? status, String? decidedAt}) => _Request(
    id: id, app: app, type: type, cat: cat, childName: childName,
    time: time, color: color, reason: reason,
    status: status ?? this.status,
    decidedAt: decidedAt ?? this.decidedAt,
  );
}

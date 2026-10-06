import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

// Matches centers.jsx SecurityCenter — Security & Controls hub.

class ControlsHubScreen extends StatefulWidget {
  const ControlsHubScreen({super.key});

  @override
  State<ControlsHubScreen> createState() => _ControlsHubScreenState();
}

class _ControlsHubScreenState extends State<ControlsHubScreen> {
  bool _bio = true;
  bool _loginAlerts = true;
  final Map<String, bool> _prot = {
    'uninstall': true,
    'forceStop': true,
    'monitoring': true,
    'tamper': false,
  };

  static const _protRows = [
    _ProtRow(key: 'uninstall', title: 'Block Uninstall', sub: 'Prevent child from removing AlphaGuard', icon: Icons.block_rounded),
    _ProtRow(key: 'forceStop', title: 'Block Force Stop', sub: 'Prevent disabling monitoring via app settings', icon: Icons.stop_circle_rounded),
    _ProtRow(key: 'monitoring', title: 'Lock Monitoring', sub: 'Monitoring cannot be paused without PIN', icon: Icons.lock_rounded),
    _ProtRow(key: 'tamper', title: 'Tamper Alerts', sub: 'Notify if device admin is revoked', icon: Icons.notification_important_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          children: [
            _buildHeader(context),
            const SizedBox(height: 24),
            _buildProtectionStatus(),
            const SizedBox(height: 20),
            _buildLoginSection(),
            const SizedBox(height: 20),
            _buildAppProtection(),
            const SizedBox(height: 20),
            _buildInfoCards(),
            const SizedBox(height: 32),
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
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: .1)),
            ),
            child: const Icon(Icons.chevron_left_rounded, color: Color(0xFFCBD5E1), size: 20),
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Security & Controls', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              Text('Manage protection settings', style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProtectionStatus() {
    return _Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: .15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 22),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Protection Active', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900)),
                  Text('All security features enabled', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: .15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('SECURE', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('Login'),
        const SizedBox(height: 10),
        _Card(
          child: Column(
            children: [
              _ToggleRow(
                icon: Icons.fingerprint_rounded,
                iconColor: const Color(0xFF06B6D4),
                title: 'Biometric Login',
                sub: 'Face ID / Fingerprint',
                value: _bio,
                onChanged: (v) => setState(() => _bio = v),
              ),
              _divider(),
              _ToggleRow(
                icon: Icons.notifications_rounded,
                iconColor: const Color(0xFF06B6D4),
                title: 'Login Alerts',
                sub: 'Notify on new device sign-in',
                value: _loginAlerts,
                onChanged: (v) => setState(() => _loginAlerts = v),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAppProtection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('AlphaGuard App Protection'),
        const SizedBox(height: 10),
        _Card(
          child: Column(
            children: _protRows.map((r) {
              final isFirst = _protRows.first == r;
              return Column(
                children: [
                  if (!isFirst) _divider(),
                  _ToggleRow(
                    icon: r.icon,
                    iconColor: const Color(0xFFF87171),
                    iconBg: const Color(0xFFEF4444),
                    title: r.title,
                    sub: r.sub,
                    value: _prot[r.key] ?? false,
                    onChanged: (v) => setState(() => _prot[r.key] = v),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCards() {
    return Column(
      children: [
        _Card(
          borderColor: const Color(0xFFF59E0B).withValues(alpha: .2),
          bgColor: const Color(0xFFF59E0B).withValues(alpha: .05),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.verified_user_rounded, color: Color(0xFFFBBF24), size: 16),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'On the child device these protections are enforced via Android Device Admin / Accessibility — uninstall, force-stop and disabling monitoring are blocked without your Security PIN.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500, height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        _Card(
          borderColor: const Color(0xFF06B6D4).withValues(alpha: .15),
          bgColor: const Color(0xFF06B6D4).withValues(alpha: .05),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.verified_user_rounded, color: Color(0xFF22D3EE), size: 16),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Your PIN is required to delete the account, unpair a child, disable monitoring, or change security settings.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500, height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _label(String text) => Text(
    text.toUpperCase(),
    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 2.0),
  );

  Widget _divider() => Divider(height: 1, color: Colors.white.withValues(alpha: .05), indent: 0, endIndent: 0);
}

// ── Reusable sub-widgets ───────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  const _Card({required this.child, this.borderColor, this.bgColor});
  final Widget child;
  final Color? borderColor;
  final Color? bgColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: bgColor ?? AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderColor ?? Colors.white.withValues(alpha: .07)),
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(22), child: child),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.icon, required this.iconColor, required this.title, required this.value, required this.onChanged,
    this.sub, this.iconBg,
  });
  final IconData icon;
  final Color iconColor;
  final Color? iconBg;
  final String title;
  final String? sub;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: (iconBg ?? iconColor).withValues(alpha: .15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 17),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                if (sub != null)
                  Text(sub!, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => onChanged(!value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 48, height: 28,
              padding: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: value ? const Color(0xFF06B6D4).withValues(alpha: .8) : Colors.white.withValues(alpha: .1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Align(
                alignment: value ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(width: 24, height: 24, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProtRow {
  const _ProtRow({required this.key, required this.title, required this.sub, required this.icon});
  final String key;
  final String title;
  final String sub;
  final IconData icon;
}



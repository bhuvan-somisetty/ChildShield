import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';

/// ParentSetup — 5-step wizard shown to new parents after first login.
/// Matches frontend-v2 /setup: welcome → location → notifications → contacts → complete.
class ParentSetupScreen extends StatefulWidget {
  const ParentSetupScreen({super.key});
  @override
  State<ParentSetupScreen> createState() => _ParentSetupScreenState();
}

class _ParentSetupScreenState extends State<ParentSetupScreen>
    with SingleTickerProviderStateMixin {
  int _step = 0;
  static const int _totalSteps = 5;

  // Emergency contacts form state
  final List<_Contact> _contacts = [];

  late final AnimationController _slideCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 260),
  );
  late Animation<double> _slideAnim;

  @override
  void initState() {
    super.initState();
    _slideAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut),
    );
    _slideCtrl.value = 1;
  }

  @override
  void dispose() {
    _slideCtrl.dispose();
    super.dispose();
  }

  void _goToStep(int next) async {
    await _slideCtrl.reverse();
    setState(() => _step = next);
    await _slideCtrl.forward();
  }

  void _next() {
    if (_step < _totalSteps - 1) {
      _goToStep(_step + 1);
    } else {
      context.go('/connect');
    }
  }

  void _back() {
    if (_step > 0) {
      _goToStep(_step - 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          SizedBox(height: safe.top + 12),
          // ── Progress bar ────────────────────────────────────────────────
          _ProgressBar(step: _step, total: _totalSteps),
          // ── Step content ────────────────────────────────────────────────
          Expanded(
            child: AnimatedBuilder(
              animation: _slideAnim,
              builder: (_, child) => Opacity(
                opacity: _slideAnim.value,
                child: Transform.translate(
                  offset: Offset(18 * (1 - _slideAnim.value), 0),
                  child: child,
                ),
              ),
              child: _buildStep(context),
            ),
          ),
          // ── Actions ──────────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(24, 12, 24, safe.bottom + 24),
            child: _buildActions(context),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(BuildContext context) {
    return switch (_step) {
      0 => _StepWelcome(),
      1 => _StepLocation(),
      2 => _StepNotifications(),
      3 => _StepContacts(contacts: _contacts, onChanged: () => setState(() {})),
      4 => _StepComplete(),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildActions(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _next,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 17),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: Text(
              _step == _totalSteps - 1 ? 'Connect a Child' : 'Continue',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
          ),
        ),
        if (_step > 0 && _step < _totalSteps - 1) ...[
          const SizedBox(height: 10),
          TextButton(
            onPressed: _next,
            child: const Text('Skip for now', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          ),
        ],
        if (_step > 0) ...[
          const SizedBox(height: 4),
          GestureDetector(
            onTap: _back,
            child: const Text(
              '← Back',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ],
    );
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.step, required this.total});
  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    final progress = (step + 1) / total;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step ${step + 1} of $total', style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
              Text('${(progress * 100).toInt()}%', style: const TextStyle(color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.cyan),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

class _StepWelcome extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          // Icon hero
          Center(
            child: Container(
              width: 88, height: 88,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: const LinearGradient(
                  colors: [Color(0x402563EB), Color(0x1A06B6D4)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                border: Border.all(color: const Color(0x4D3B82F6)),
                boxShadow: const [BoxShadow(color: Color(0x4D2563EB), blurRadius: 28)],
              ),
              child: Center(
                child: SvgPicture.asset(
                  'assets/icons/shield.svg',
                  width: 44, height: 44,
                  colorFilter: const ColorFilter.mode(Color(0xFF22D3EE), BlendMode.srcIn),
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            "Let's Set Up Your\nFamily Protection",
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2, letterSpacing: -0.3),
          ),
          const SizedBox(height: 14),
          const Text(
            "We'll walk you through a few quick steps to get AlphaGuard fully set up for your family.",
            style: TextStyle(fontSize: 14.5, color: Color(0xFF94A3B8), height: 1.6),
          ),
          const SizedBox(height: 28),
          _BulletItem(icon: Icons.location_on_outlined, color: AppColors.cyan, text: "Location tracking to always know where your child is"),
          const SizedBox(height: 12),
          _BulletItem(icon: Icons.notifications_outlined, color: const Color(0xFFF59E0B), text: "Smart alerts when your child arrives or leaves safe zones"),
          const SizedBox(height: 12),
          _BulletItem(icon: Icons.contacts_outlined, color: const Color(0xFF10B981), text: "Emergency contacts for quick response when it matters"),
          const SizedBox(height: 12),
          _BulletItem(icon: Icons.phone_iphone, color: const Color(0xFFA855F7), text: "Connect your child's device for real-time protection"),
        ],
      ),
    );
  }
}

// ── Step 1: Location ──────────────────────────────────────────────────────────

class _StepLocation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          _PermissionHero(icon: Icons.location_on_outlined, color: AppColors.cyan, label: 'Location Access'),
          const SizedBox(height: 28),
          const Text('Enable Location Tracking', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 12),
          const Text('AlphaGuard uses location to show you where your child is in real time and alert you when they enter or leave designated safe zones.', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
          const SizedBox(height: 24),
          _PermCard(icon: Icons.radar, color: AppColors.cyan, title: 'Live map', sub: "See your child's real-time position on the family radar"),
          const SizedBox(height: 12),
          _PermCard(icon: Icons.home_outlined, color: const Color(0xFF10B981), title: 'Safe zones', sub: 'Get alerts when your child arrives home or school'),
          const SizedBox(height: 12),
          _PermCard(icon: Icons.history, color: const Color(0xFFA855F7), title: 'Location history', sub: 'Review where your child was throughout the day'),
        ],
      ),
    );
  }
}

// ── Step 2: Notifications ─────────────────────────────────────────────────────

class _StepNotifications extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          _PermissionHero(icon: Icons.notifications_active_outlined, color: const Color(0xFFF59E0B), label: 'Notifications'),
          const SizedBox(height: 28),
          const Text('Stay Instantly Informed', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 12),
          const Text("Enable notifications so you're always in the loop — from location alerts to task completions and safety events.", style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
          const SizedBox(height: 24),
          _PermCard(icon: Icons.place_outlined, color: AppColors.cyan, title: 'Zone alerts', sub: 'Notified the moment your child arrives or leaves'),
          const SizedBox(height: 12),
          _PermCard(icon: Icons.task_alt, color: const Color(0xFF10B981), title: 'Task updates', sub: 'Know when tasks are completed or need approval'),
          const SizedBox(height: 12),
          _PermCard(icon: Icons.warning_amber_outlined, color: const Color(0xFFF43F5E), title: 'SOS alerts', sub: 'Immediate notification if your child triggers an SOS'),
          const SizedBox(height: 12),
          _PermCard(icon: Icons.auto_awesome_outlined, color: const Color(0xFFA855F7), title: 'AI insights', sub: 'Daily summaries and safety reports from DISHA'),
        ],
      ),
    );
  }
}

// ── Step 3: Emergency Contacts ────────────────────────────────────────────────

class _Contact {
  String name, relationship, phone, email;
  _Contact({this.name = '', this.relationship = '', this.phone = '', this.email = ''});
}

class _StepContacts extends StatefulWidget {
  const _StepContacts({required this.contacts, required this.onChanged});
  final List<_Contact> contacts;
  final VoidCallback onChanged;

  @override
  State<_StepContacts> createState() => _StepContactsState();
}

class _StepContactsState extends State<_StepContacts> {
  void _addContact() {
    setState(() => widget.contacts.add(_Contact()));
    widget.onChanged();
  }

  void _removeContact(int i) {
    setState(() => widget.contacts.removeAt(i));
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          _PermissionHero(icon: Icons.contacts_outlined, color: const Color(0xFF10B981), label: 'Emergency Contacts'),
          const SizedBox(height: 24),
          const Text('Add Emergency Contacts', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 10),
          const Text('These people will be notified if your child triggers an SOS or goes missing. You can add up to 3 contacts.', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
          const SizedBox(height: 20),
          for (int i = 0; i < widget.contacts.length; i++)
            _ContactCard(contact: widget.contacts[i], onRemove: () => _removeContact(i)),
          if (widget.contacts.length < 3)
            GestureDetector(
              onTap: _addContact,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                margin: const EdgeInsets.only(top: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35), style: BorderStyle.solid),
                  color: const Color(0xFF10B981).withValues(alpha: 0.05),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_circle_outline, color: Color(0xFF10B981), size: 20),
                    SizedBox(width: 8),
                    Text('Add emergency contact', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w700, fontSize: 14)),
                  ],
                ),
              ),
            ),
          if (widget.contacts.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('You can also add contacts later in Settings.', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
            ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.contact, required this.onRemove});
  final _Contact contact;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white.withValues(alpha: 0.04),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _Field(label: 'Name', onChanged: (v) => contact.name = v, initial: contact.name)),
              const SizedBox(width: 12),
              GestureDetector(onTap: onRemove, child: const Icon(Icons.remove_circle_outline, color: Color(0xFFF43F5E), size: 22)),
            ],
          ),
          const SizedBox(height: 10),
          _Field(label: 'Relationship (e.g. Grandparent)', onChanged: (v) => contact.relationship = v, initial: contact.relationship),
          const SizedBox(height: 10),
          _Field(label: 'Phone number', onChanged: (v) => contact.phone = v, initial: contact.phone, keyboardType: TextInputType.phone),
          const SizedBox(height: 10),
          _Field(label: 'Email (optional)', onChanged: (v) => contact.email = v, initial: contact.email, keyboardType: TextInputType.emailAddress),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.onChanged, this.initial = '', this.keyboardType});
  final String label;
  final ValueChanged<String> onChanged;
  final String initial;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: initial,
      onChanged: onChanged,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.04),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cyan)),
      ),
    );
  }
}

// ── Step 4: Complete ──────────────────────────────────────────────────────────

class _StepComplete extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 28),
          Container(
            width: 100, height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF10B981).withValues(alpha: 0.15),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35)),
              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.35), blurRadius: 30)],
            ),
            child: const Icon(Icons.celebration_outlined, color: Color(0xFF10B981), size: 48),
          ),
          const SizedBox(height: 28),
          const Text("You're All Set!", textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 14),
          const Text(
            "AlphaGuard is ready to protect your family. The next step is to connect your child's device so monitoring can begin.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14.5, color: Color(0xFF94A3B8), height: 1.6),
          ),
          const SizedBox(height: 32),
          _SummaryRow(icon: Icons.location_on_outlined, color: AppColors.cyan, label: 'Location tracking configured'),
          const SizedBox(height: 12),
          _SummaryRow(icon: Icons.notifications_outlined, color: const Color(0xFFF59E0B), label: 'Notifications enabled'),
          const SizedBox(height: 12),
          _SummaryRow(icon: Icons.contacts_outlined, color: const Color(0xFF10B981), label: 'Emergency contacts saved'),
        ],
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _PermissionHero extends StatelessWidget {
  const _PermissionHero({required this.icon, required this.color, required this.label});
  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              color: color.withValues(alpha: 0.12),
              border: Border.all(color: color.withValues(alpha: 0.30)),
              boxShadow: [BoxShadow(color: color.withValues(alpha: 0.25), blurRadius: 24)],
            ),
            child: Icon(icon, color: color, size: 36),
          ),
          const SizedBox(height: 10),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        ],
      ),
    );
  }
}

class _PermCard extends StatelessWidget {
  const _PermCard({required this.icon, required this.color, required this.title, required this.sub});
  final IconData icon;
  final Color color;
  final String title;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: color.withValues(alpha: 0.06),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.15)), child: Icon(icon, color: color, size: 18)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 2),
                Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BulletItem extends StatelessWidget {
  const _BulletItem({required this.icon, required this.color, required this.text});
  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.12)), child: Icon(icon, color: color, size: 16)),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.5))),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.icon, required this.color, required this.label});
  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.check_circle_outline_rounded, color: color, size: 20),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

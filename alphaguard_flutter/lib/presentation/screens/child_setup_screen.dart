import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';

/// ChildSetup — runs on the child device before pairing.
/// Step 1: Gender selection (Boy / Girl cards with animated glow)
/// Step 2: Name input with emoji avatar
/// Matches frontend-v2 /child-setup (ChildSetup.jsx).
class ChildSetupScreen extends StatefulWidget {
  const ChildSetupScreen({super.key});
  @override
  State<ChildSetupScreen> createState() => _ChildSetupScreenState();
}

class _ChildSetupScreenState extends State<ChildSetupScreen>
    with SingleTickerProviderStateMixin {
  int _step = 0;
  String? _gender; // 'boy' | 'girl'
  final _nameCtrl = TextEditingController();

  late final AnimationController _slideCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 240),
  );
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _anim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut),
    );
    _slideCtrl.value = 1;
  }

  @override
  void dispose() {
    _slideCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  String get _emoji => _gender == 'girl' ? '👧' : '👦';
  Color get _accent => _gender == 'girl' ? const Color(0xFFA855F7) : AppColors.cyan;

  void _goStep(int next) async {
    await _slideCtrl.reverse();
    setState(() => _step = next);
    await _slideCtrl.forward();
  }

  void _continue() {
    if (_step == 0) {
      if (_gender == null) return;
      _goStep(1);
    } else {
      context.push('/pair', extra: {'gender': _gender, 'name': _nameCtrl.text.trim()});
    }
  }

  void _back() {
    if (_step == 0) {
      context.pop();
    } else {
      _goStep(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          SizedBox(height: safe.top + 16),
          // ── Back ──────────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _back,
                  child: Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.white.withValues(alpha: 0.06),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                    ),
                    child: const Icon(Icons.arrow_back_ios_new, color: AppColors.textMuted, size: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Text(
                  _step == 0 ? 'Set Up Your Profile' : 'What\'s your name?',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // ── Step dots ────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(children: [
              _StepDot(active: true, accent: AppColors.cyan),
              const SizedBox(width: 6),
              _StepDot(active: _step == 1, accent: AppColors.cyan),
            ]),
          ),
          const SizedBox(height: 20),
          // ── Content ───────────────────────────────────────────────────────
          Expanded(
            child: AnimatedBuilder(
              animation: _anim,
              builder: (_, child) => Opacity(
                opacity: _anim.value,
                child: Transform.translate(offset: Offset(18 * (1 - _anim.value), 0), child: child),
              ),
              child: _step == 0 ? _buildGenderStep() : _buildNameStep(),
            ),
          ),
          // ── CTA ───────────────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(24, 8, 24, safe.bottom + 24),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_step == 0 && _gender == null) ? null : _continue,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.white.withValues(alpha: 0.08),
                  disabledForegroundColor: AppColors.textMuted,
                  padding: const EdgeInsets.symmetric(vertical: 17),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(
                  _step == 0 ? 'Continue' : 'Start AlphaGuard',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenderStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Text('Who\'s using AlphaGuard?',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 8),
          const Text('This helps us personalize your experience.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: _GenderCard(
                emoji: '👦', label: 'Boy', accent: AppColors.cyan,
                selected: _gender == 'boy', onTap: () => setState(() => _gender = 'boy'),
              )),
              const SizedBox(width: 16),
              Expanded(child: _GenderCard(
                emoji: '👧', label: 'Girl', accent: const Color(0xFFA855F7),
                selected: _gender == 'girl', onTap: () => setState(() => _gender = 'girl'),
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNameStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 90, height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [_accent.withValues(alpha: 0.35), _accent.withValues(alpha: 0.10)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              border: Border.all(color: _accent.withValues(alpha: 0.40)),
              boxShadow: [BoxShadow(color: _accent.withValues(alpha: 0.30), blurRadius: 24)],
            ),
            child: Center(child: Text(_emoji, style: const TextStyle(fontSize: 44))),
          ),
          const SizedBox(height: 24),
          const Text('What\'s your name?',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 8),
          const Text('Enter your first name so AlphaGuard knows who you are.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.5)),
          const SizedBox(height: 28),
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            onChanged: (_) => setState(() {}),
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
            decoration: InputDecoration(
              hintText: 'Enter your name',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.25), fontSize: 16),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.04),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: _accent, width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Gender card ───────────────────────────────────────────────────────────────

class _GenderCard extends StatefulWidget {
  const _GenderCard({required this.emoji, required this.label, required this.accent, required this.selected, required this.onTap});
  final String emoji;
  final String label;
  final Color accent;
  final bool selected;
  final VoidCallback onTap;

  @override
  State<_GenderCard> createState() => _GenderCardState();
}

class _GenderCardState extends State<_GenderCard> with SingleTickerProviderStateMixin {
  late final AnimationController _glow = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1200),
  );
  late final Animation<double> _glowAnim = Tween<double>(begin: 0.25, end: 0.55)
      .animate(CurvedAnimation(parent: _glow, curve: Curves.easeInOut));

  @override
  void didUpdateWidget(_GenderCard old) {
    super.didUpdateWidget(old);
    if (widget.selected && !old.selected) _glow.repeat(reverse: true);
    if (!widget.selected && old.selected) { _glow.stop(); _glow.value = 0; }
  }

  @override
  void dispose() { _glow.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _glowAnim,
        builder: (_, child) => Container(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: widget.selected ? widget.accent.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.04),
            border: Border.all(
              color: widget.selected ? widget.accent.withValues(alpha: 0.55) : Colors.white.withValues(alpha: 0.10),
              width: widget.selected ? 2 : 1,
            ),
            boxShadow: widget.selected
              ? [BoxShadow(color: widget.accent.withValues(alpha: _glowAnim.value), blurRadius: 20)]
              : [],
          ),
          child: child,
        ),
        child: Column(
          children: [
            Text(widget.emoji, style: const TextStyle(fontSize: 52)),
            const SizedBox(height: 12),
            Text(widget.label, style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.w800,
              color: widget.selected ? widget.accent : Colors.white,
            )),
            if (widget.selected)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Icon(Icons.check_circle_rounded, color: widget.accent, size: 22),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Step dot indicator ────────────────────────────────────────────────────────

class _StepDot extends StatelessWidget {
  const _StepDot({required this.active, required this.accent});
  final bool active;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: active ? 24 : 8, height: 8,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        color: active ? accent : Colors.white.withValues(alpha: 0.18),
      ),
    );
  }
}

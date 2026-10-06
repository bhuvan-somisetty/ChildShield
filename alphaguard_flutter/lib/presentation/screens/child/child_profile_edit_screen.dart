import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/child.dart';
import '../../../state/family_controller.dart';
import '../../widgets/primary_button.dart';

class ChildProfileEditScreen extends StatefulWidget {
  const ChildProfileEditScreen({super.key, required this.child});
  final Child child;

  @override
  State<ChildProfileEditScreen> createState() => _ChildProfileEditScreenState();
}

class _ChildProfileEditScreenState extends State<ChildProfileEditScreen> {
  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _gradeCtrl = TextEditingController();
  final _schoolCtrl = TextEditingController();
  String _selectedEmoji = '🧒';
  String _selectedColor = '#10b981';

  bool _loading = false;
  String? _error;

  final List<String> _emojis = ['🧒', '👧', '👶', '👦', '🧑', '👨', '👩', '🦁', '🦊', '🐼', '🐨', '🦄', '🚀', '🎨', '⚽'];
  final List<String> _colors = ['#10b981', '#06b6d4', '#4f46e5', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'];

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = widget.child.name;
    _ageCtrl.text = widget.child.age?.toString() ?? '';
    _gradeCtrl.text = widget.child.grade ?? '';
    _schoolCtrl.text = widget.child.school ?? '';
    _selectedEmoji = widget.child.emoji;
    _selectedColor = widget.child.color;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _gradeCtrl.dispose();
    _schoolCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Name cannot be empty.');
      return;
    }

    final age = int.tryParse(_ageCtrl.text.trim());

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await context.read<FamilyController>().updateChild(widget.child.id, {
        'name': name,
        'age': age,
        'grade': _gradeCtrl.text.trim(),
        'school': _schoolCtrl.text.trim(),
        'emoji': _selectedEmoji,
        'color': _selectedColor,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Child profile updated successfully.'), backgroundColor: AppColors.success),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to update child profile.';
          _loading = false;
        });
      }
    }
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xff')));
    } catch (_) {
      return AppColors.cyan;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Edit Child Profile', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: _parseColor(_selectedColor).withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: _parseColor(_selectedColor), width: 2),
                      ),
                      alignment: Alignment.center,
                      child: Text(_selectedEmoji, style: const TextStyle(fontSize: 40)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Profile Details', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(labelText: 'Name', hintText: 'Child\'s Name'),
                    style: const TextStyle(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _ageCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Age', hintText: 'e.g. 10'),
                          style: const TextStyle(color: AppColors.textPrimary),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _gradeCtrl,
                          decoration: const InputDecoration(labelText: 'Grade', hintText: 'e.g. Grade 5'),
                          style: const TextStyle(color: AppColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _schoolCtrl,
                    decoration: const InputDecoration(labelText: 'School Name', hintText: 'e.g. Lincoln Elementary'),
                    style: const TextStyle(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 24),
                  const Text('Select Avatar Emoji', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _emojis.map((emoji) {
                      final isSel = _selectedEmoji == emoji;
                      return InkWell(
                        onTap: () => setState(() => _selectedEmoji = emoji),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: isSel ? AppColors.cyan.withValues(alpha: 0.15) : AppColors.bgElevated,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isSel ? AppColors.cyan : AppColors.border, width: isSel ? 2 : 1),
                          ),
                          alignment: Alignment.center,
                          child: Text(emoji, style: const TextStyle(fontSize: 20)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  const Text('Select Theme Color', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: _colors.map((color) {
                      final isSel = _selectedColor == color;
                      final c = _parseColor(color);
                      return InkWell(
                        onTap: () => setState(() => _selectedColor = color),
                        borderRadius: BorderRadius.circular(100),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: c,
                            shape: BoxShape.circle,
                            border: Border.all(color: isSel ? Colors.white : Colors.transparent, width: 2),
                            boxShadow: isSel ? [BoxShadow(color: c.withValues(alpha: 0.4), blurRadius: 8, spreadRadius: 1)] : null,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 20),
                    Text(_error!, style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
                  ],
                  const SizedBox(height: 32),
                  PrimaryButton(
                    label: 'Save Changes',
                    icon: Icons.check,
                    loading: _loading,
                    onPressed: _save,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

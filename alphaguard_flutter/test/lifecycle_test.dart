import 'package:flutter_test/flutter_test.dart';
import 'package:alphaguard/services/lifecycle/lifecycle_service.dart';

/// Pure-logic test (no Flutter bindings needed). Verifies the version-compare
/// used by the update gate matches the backend's numeric semver semantics.
void main() {
  group('LifecycleService.compareVersions', () {
    test('greater / less / equal', () {
      expect(LifecycleService.compareVersions('2.2.0', '2.1.0'), 1);
      expect(LifecycleService.compareVersions('2.1.0', '2.1.1'), -1);
      expect(LifecycleService.compareVersions('2.1.0', '2.1.0'), 0);
    });

    test('numeric, not lexical (2.10.0 > 2.9.0)', () {
      expect(LifecycleService.compareVersions('2.10.0', '2.9.0'), 1);
    });

    test('handles differing segment counts', () {
      expect(LifecycleService.compareVersions('2.1', '2.1.0'), 0);
      expect(LifecycleService.compareVersions('2.1.0.1', '2.1.0'), 1);
    });
  });
}

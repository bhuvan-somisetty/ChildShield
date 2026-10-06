/// Response of GET /api/app/version?version= — drives the update gate.
class VersionInfo {
  const VersionInfo({
    required this.currentVersion,
    required this.minimumVersion,
    this.updateAvailable = false,
    this.mandatory = false,
    this.releaseNotes,
  });

  final String currentVersion;
  final String minimumVersion;
  final bool updateAvailable;
  final bool mandatory;
  final ReleaseNotes? releaseNotes;

  factory VersionInfo.fromJson(Map<String, dynamic> j) => VersionInfo(
        currentVersion: (j['currentVersion'] ?? '0.0.0') as String,
        minimumVersion: (j['minimumVersion'] ?? '0.0.0') as String,
        updateAvailable: (j['updateAvailable'] ?? false) as bool,
        mandatory: (j['mandatory'] ?? false) as bool,
        releaseNotes: j['releaseNotes'] is Map<String, dynamic>
            ? ReleaseNotes.fromJson(j['releaseNotes'] as Map<String, dynamic>)
            : null,
      );
}

class ReleaseNotes {
  const ReleaseNotes({required this.version, this.added = const [], this.improved = const [], this.fixed = const []});

  final String version;
  final List<String> added;
  final List<String> improved;
  final List<String> fixed;

  bool get isEmpty => added.isEmpty && improved.isEmpty && fixed.isEmpty;

  factory ReleaseNotes.fromJson(Map<String, dynamic> j) => ReleaseNotes(
        version: (j['version'] ?? '') as String,
        added: ((j['added'] ?? []) as List).cast<String>(),
        improved: ((j['improved'] ?? []) as List).cast<String>(),
        fixed: ((j['fixed'] ?? []) as List).cast<String>(),
      );
}

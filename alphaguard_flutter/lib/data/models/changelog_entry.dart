/// A changelog entry (`publicChangelog` shape + `changelog:new`).
class ChangelogEntry {
  const ChangelogEntry({required this.id, required this.version, this.date, this.added = const [], this.fixed = const [], this.improved = const [], this.at = 0});

  final String id;
  final String version;
  final String? date;
  final List<String> added;
  final List<String> fixed;
  final List<String> improved;
  final int at;

  factory ChangelogEntry.fromJson(Map<String, dynamic> j) => ChangelogEntry(
        id: j['id'].toString(),
        version: (j['version'] ?? '') as String,
        date: j['date'] as String?,
        added: ((j['added'] ?? const []) as List).cast<String>(),
        fixed: ((j['fixed'] ?? const []) as List).cast<String>(),
        improved: ((j['improved'] ?? const []) as List).cast<String>(),
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
      );
}

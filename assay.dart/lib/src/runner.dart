import 'dart:convert';

import 'catalog.g.dart';

enum VerdictStatus {
  pass('pass'),
  fail('fail'),
  notApplicable('not-applicable'),
  unresolved('unresolved');

  const VerdictStatus(this.id);
  final String id;
}

/// An oracle fails a criterion with an actionable reason.
final class AvpFail implements Exception {
  const AvpFail(this.reason, [this.evidence]);
  final String reason;
  final Object? evidence;

  @override
  String toString() => reason;
}

final class AvpNotApplicable implements Exception {
  const AvpNotApplicable(this.reason);
  final String reason;
}

final class AvpUnresolved implements Exception {
  const AvpUnresolved(this.reason);
  final String reason;
}

final class AvpGateError implements Exception {
  const AvpGateError(this.reason);
  final String reason;

  @override
  String toString() => reason;
}

final class CriterionVerdict {
  const CriterionVerdict(
    this.criterionId,
    this.status,
    this.reason, {
    this.evidence,
  });
  final String criterionId;
  final VerdictStatus status;
  final String reason;
  final Object? evidence;

  Map<String, Object?> toJson() => {
    'criterionId': criterionId,
    'status': status.id,
    'reason': reason,
    if (evidence != null) 'evidence': evidence,
  };
}

final class Verdict {
  const Verdict(
    this.subject,
    this.archetype,
    this.results, {
    required this.archetypeVersion,
    required this.protocolVersion,
  });
  final String subject, archetype, archetypeVersion, protocolVersion;
  final List<CriterionVerdict> results;

  int get applicable => results
      .where(
        (r) => r.status == VerdictStatus.pass || r.status == VerdictStatus.fail,
      )
      .length;
  int get passed => results.where((r) => r.status == VerdictStatus.pass).length;
  int get unresolved =>
      results.where((r) => r.status == VerdictStatus.unresolved).length;

  String get outcome => results.any((r) => r.status == VerdictStatus.fail)
      ? 'fail'
      : applicable == 0 || unresolved > 0
      ? 'inconclusive'
      : 'pass';

  double? get acceptanceScore => applicable == 0 ? null : passed / applicable;

  VerdictStatus of(String criterionId) =>
      results.firstWhere((r) => r.criterionId == criterionId).status;

  void requireAccepted() {
    if (outcome == 'inconclusive') {
      throw AvpGateError(
        'Verification is inconclusive: applicable=$applicable, unresolved=$unresolved. No green verdict was produced.',
      );
    }
    if (outcome == 'fail') {
      throw AvpGateError(
        'Verification failed: ${results.where((r) => r.status == VerdictStatus.fail).length} criterion/criteria failed.',
      );
    }
  }

  Map<String, Object?> toJson() => {
    'subject': subject,
    'archetype': archetype,
    'archetypeVersion': archetypeVersion,
    'protocolVersion': protocolVersion,
    'results': [for (final r in results) r.toJson()],
    'outcome': outcome,
    'acceptanceScore': acceptanceScore,
  };
}

/// Binds mechanical oracles to a catalog archetype for subjects of type [S].
abstract class Archetype<S> {
  String get name;
  Map<String, Future<void> Function(S subject)> get oracles;

  /// The seams [subject] provides, matched against a criterion's `requires`.
  Set<String> seams(S subject);
}

/// The neutral catalog this adapter binds to (the same bytes as `protocol/catalog.json`).
Map<String, Object?> bundledCatalog() =>
    (jsonDecode(catalogJson) as Map).cast<String, Object?>();

Future<Verdict> runVerification<S>(
  Archetype<S> archetype,
  String subjectName,
  S subject, {
  Map<String, Object?>? catalog,
}) async {
  catalog ??= bundledCatalog();
  final spec = (catalog['archetypes']! as List)
      .cast<Map>()
      .where((a) => a['archetype'] == archetype.name)
      .firstOrNull;
  if (spec == null) {
    throw ArgumentError(
      "Archetype '${archetype.name}' is not in the catalog (protocol drift?).",
    );
  }
  final seams = archetype.seams(subject);
  final results = <CriterionVerdict>[];
  for (final criterion in (spec['criteria'] as List).cast<Map>()) {
    final id = criterion['id'] as String,
        oracle = archetype.oracles[id],
        requires = criterion['requires'] as String?;
    if (criterion['oracle'] != 'mechanical') {
      results.add(
        CriterionVerdict(
          id,
          VerdictStatus.unresolved,
          "oracle '${criterion['oracle']}' is not run by this adapter",
        ),
      );
    } else if (requires != null && !seams.contains(requires)) {
      results.add(
        CriterionVerdict(
          id,
          VerdictStatus.notApplicable,
          "the subject declares no '$requires' seam",
        ),
      );
    } else if (oracle == null) {
      results.add(
        CriterionVerdict(
          id,
          VerdictStatus.unresolved,
          'no Flutter oracle bound yet',
        ),
      );
    } else {
      try {
        await oracle(subject);
        results.add(
          CriterionVerdict(
            id,
            VerdictStatus.pass,
            criterion['statement'] as String,
          ),
        );
      } on AvpFail catch (e) {
        results.add(
          CriterionVerdict(
            id,
            VerdictStatus.fail,
            e.reason,
            evidence: e.evidence,
          ),
        );
      } on AvpNotApplicable catch (e) {
        results.add(
          CriterionVerdict(id, VerdictStatus.notApplicable, e.reason),
        );
      } on AvpUnresolved catch (e) {
        results.add(CriterionVerdict(id, VerdictStatus.unresolved, e.reason));
      } on Object catch (e) {
        results.add(
          CriterionVerdict(
            id,
            VerdictStatus.fail,
            'Unexpected error while verifying: $e',
            evidence: {'error': '$e'},
          ),
        );
      }
    }
  }
  return Verdict(
    subjectName,
    archetype.name,
    results,
    archetypeVersion: spec['version'] as String,
    protocolVersion: catalog['protocolVersion'] as String,
  );
}

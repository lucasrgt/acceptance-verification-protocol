import 'package:assay_flutter/assay_flutter.dart';
import 'package:flutter_test/flutter_test.dart';

final class Probe extends Archetype<int> {
  @override
  String get name => 'probe';

  @override
  Set<String> seams(int subject) => {};

  @override
  Map<String, Future<void> Function(int)> get oracles => {
    'irrelevant': (_) async => throw const AvpNotApplicable('not this subject'),
    'crashes': (_) async => throw StateError('socket closed'),
  };
}

const catalog = {
  'protocolVersion': '0.4.0',
  'archetypes': [
    {
      'archetype': 'probe',
      'version': '1',
      'criteria': [
        {'id': 'irrelevant', 'oracle': 'mechanical', 'statement': 's'},
        {'id': 'crashes', 'oracle': 'mechanical', 'statement': 's'},
        {'id': 'judged', 'oracle': 'model', 'statement': 's'},
      ],
    },
  ],
};

void main() {
  test(
    'not-applicable, unexpected errors and non-mechanical oracles keep their meaning',
    () async {
      final v = await runVerification(Probe(), 'subject', 0, catalog: catalog);
      expect(v.of('irrelevant'), VerdictStatus.notApplicable);
      expect(v.of('crashes'), VerdictStatus.fail);
      expect(v.results[1].reason, contains('Unexpected error while verifying'));
      expect(v.of('judged'), VerdictStatus.unresolved);
      expect('${const AvpNotApplicable('n')}', contains('AvpNotApplicable'));
      expect('${const AvpGateError('g')}', 'g');
    },
  );

  test('nothing decided is inconclusive and never accepted', () {
    const v = Verdict(
      's',
      'a',
      [CriterionVerdict('c', VerdictStatus.unresolved, 'r')],
      archetypeVersion: '1',
      protocolVersion: '0.4.0',
    );
    expect(v.outcome, 'inconclusive');
    expect(v.acceptanceScore, isNull);
    expect(
      v.requireAccepted,
      throwsA(
        isA<AvpGateError>().having(
          (e) => e.reason,
          'reason',
          contains('inconclusive'),
        ),
      ),
    );
  });
}

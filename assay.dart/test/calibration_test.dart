import 'dart:convert';
import 'dart:io';

import 'package:assay_flutter/assay_flutter.dart';
import 'package:assay_flutter/src/catalog.g.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// A note composer: [guard] blocks a second tap while saving, [keepDraft]
/// keeps the text on failure, [admit] shows the error, [fire] performs the save.
class Composer extends StatefulWidget {
  const Composer(
    this.backend, {
    super.key,
    this.guard = true,
    this.keepDraft = true,
    this.admit = true,
    this.fire = true,
    this.boast = false,
  });
  final AssayBackend backend;
  final bool guard, keepDraft, admit, fire, boast;

  @override
  State<Composer> createState() => _ComposerState();
}

class _ComposerState extends State<Composer> {
  final draft = TextEditingController();
  var busy = false;
  String? outcome;

  Future<void> save() async {
    if (widget.guard && busy) return;
    setState(() => busy = true);
    try {
      if (widget.fire) {
        await widget.backend.call('save', () => null, body: draft.text);
      }
      setState(() => outcome = 'Saved');
    } on AssayBackendError {
      if (!widget.keepDraft) draft.clear();
      setState(
        () => outcome = widget.boast
            ? 'Saved'
            : (widget.admit ? 'Could not save; try again' : null),
      );
    } finally {
      setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    home: Scaffold(
      body: Column(
        children: [
          TextField(key: const Key('draft'), controller: draft),
          ElevatedButton(
            key: const Key('save'),
            onPressed: save,
            child: const Text('Save'),
          ),
          if (outcome != null)
            Text(outcome!, key: Key(outcome == 'Saved' ? 'saved' : 'error')),
        ],
      ),
    ),
  );
}

WidgetActionSubject subject(
  WidgetTester tester,
  Composer Function(AssayBackend) build,
) => WidgetActionSubject(
  tester: tester,
  build: build,
  action: find.byKey(const Key('save')),
  effect: 'save',
  input: find.byKey(const Key('draft')),
  error: find.byKey(const Key('error')),
  success: find.byKey(const Key('saved')),
);

Widget publish(AssayBackend backend, {required bool enforced}) => MaterialApp(
  home: Column(
    children: [
      ElevatedButton(
        key: const Key('publish'),
        onPressed: enforced ? null : () => backend.call('publish', () => null),
        child: const Text('Publish'),
      ),
      if (enforced) const Text('Add a cover photo to publish', key: Key('why')),
    ],
  ),
);

void main() {
  testWidgets('action-effect passes a guarded, honest composer', (
    tester,
  ) async {
    final v = await runVerification(
      WidgetActionEffect(),
      'good',
      subject(tester, (b) => Composer(b)),
    );
    expect(v.of('fires-primary-effect'), VerdictStatus.pass);
    expect(v.of('no-phantom-success'), VerdictStatus.pass);
    expect(v.of('single-flight'), VerdictStatus.pass);
    expect(v.of('error-is-specific'), VerdictStatus.unresolved);
    expect(v.outcome, 'inconclusive');
  });

  testWidgets(
    'action-effect fails a no-op, a lost draft, a silent or boasting failure and a double fire',
    (tester) async {
      Future<VerdictStatus> run(
        String id,
        Composer Function(AssayBackend) build,
      ) async => (await runVerification(
        WidgetActionEffect(),
        'bad',
        subject(tester, build),
      )).of(id);

      expect(
        await run('fires-primary-effect', (b) => Composer(b, fire: false)),
        VerdictStatus.fail,
      );
      expect(
        await run('no-phantom-success', (b) => Composer(b, fire: false)),
        VerdictStatus.fail,
      );
      expect(
        await run('no-phantom-success', (b) => Composer(b, keepDraft: false)),
        VerdictStatus.fail,
      );
      expect(
        await run('no-phantom-success', (b) => Composer(b, admit: false)),
        VerdictStatus.fail,
      );
      expect(
        await run(
          'no-phantom-success',
          (b) => Composer(b, boast: true, admit: false),
        ),
        VerdictStatus.fail,
      );
      expect(
        await run('single-flight', (b) => Composer(b, guard: false)),
        VerdictStatus.fail,
      );
    },
  );

  testWidgets(
    'a subject without the input seam is not applicable to input criteria',
    (tester) async {
      final bare = WidgetActionSubject(
        tester: tester,
        build: (b) => Composer(b),
        action: find.byKey(const Key('save')),
        effect: 'save',
      );
      final v = await runVerification(WidgetActionEffect(), 'bare', bare);
      expect(v.of('no-phantom-success'), VerdictStatus.notApplicable);
      final noError = WidgetActionSubject(
        tester: tester,
        build: (b) => Composer(b),
        action: find.byKey(const Key('save')),
        effect: 'save',
        input: find.byKey(const Key('draft')),
      );
      expect(
        (await runVerification(
          WidgetActionEffect(),
          'noError',
          noError,
        )).of('no-phantom-success'),
        VerdictStatus.unresolved,
      );
    },
  );

  testWidgets(
    'lifecycle-gate passes a disabled, explained control and fails a live one',
    (tester) async {
      WidgetGateSubject gate(bool enforced, {Finder? reason}) =>
          WidgetGateSubject(
            tester: tester,
            build: (b) => publish(b, enforced: enforced),
            action: find.byKey(const Key('publish')),
            effect: 'publish',
            reason: reason,
          );
      final good = await runVerification(
        WidgetLifecycleGate(),
        'good',
        gate(true, reason: find.byKey(const Key('why'))),
      );
      expect(good.of('blocked-action-is-disabled'), VerdictStatus.pass);
      expect(good.of('gate-enforced-server-side'), VerdictStatus.notApplicable);
      expect(good.outcome, 'pass');
      good.requireAccepted();
      final live = await runVerification(
        WidgetLifecycleGate(),
        'bad',
        gate(false),
      );
      expect(live.of('blocked-action-is-disabled'), VerdictStatus.fail);
      expect(() => live.requireAccepted(), throwsA(isA<AvpGateError>()));
      final silent = await runVerification(
        WidgetLifecycleGate(),
        'silent',
        gate(true, reason: find.byKey(const Key('missing'))),
      );
      expect(silent.of('blocked-action-is-disabled'), VerdictStatus.fail);
    },
  );

  test(
    'the bundled catalog is byte-identical to the protocol and verdicts are portable',
    () {
      expect(catalogJson, File('../protocol/catalog.json').readAsStringSync());
      final v = Verdict(
        's',
        'a',
        const [
          CriterionVerdict('c', VerdictStatus.fail, 'r', evidence: {'x': 1}),
        ],
        archetypeVersion: '1',
        protocolVersion: '0.4.0',
      );
      expect(
        jsonDecode(jsonEncode(v.toJson())),
        containsPair('outcome', 'fail'),
      );
      expect(v.acceptanceScore, 0);
      expect(() => runVerification(_Missing(), 's', 0), throwsArgumentError);
    },
  );

  test('the backend forces each condition and records calls', () async {
    final empty = AssayBackend(Condition.empty);
    expect(await empty.call('list', () => [1], empty: () => <int>[]), isEmpty);
    expect(await AssayBackend(Condition.empty).call('list', () => [1]), [1]);
    expect(
      () => AssayBackend(Condition.offline).call('x', () => 1),
      throwsA(isA<AssayBackendError>()),
    );
    expect(Condition.parse('api-error'), Condition.apiError);
    expect(Condition.parse('unknown'), Condition.success);
    expect(
      '${const AssayBackendError(Condition.offline)}',
      'AssayBackendError(offline)',
    );
    expect('${const AvpFail('r')}', 'r');
  });
}

class _Missing extends Archetype<int> {
  @override
  String get name => 'missing';
  @override
  Map<String, Future<void> Function(int)> get oracles => {};
  @override
  Set<String> seams(int subject) => {};
}

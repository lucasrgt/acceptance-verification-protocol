import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'backend.dart';
import 'runner.dart';

/// A screen action under verification. [build] mounts the screen around the
/// backend; [action] finds the control; [effect] is the backend operation the
/// action must perform. [input], [error] and [success] are optional seams.
final class WidgetActionSubject {
  const WidgetActionSubject({
    required this.tester,
    required this.build,
    required this.action,
    required this.effect,
    this.input,
    this.draftSample = 'Assay draft',
    this.error,
    this.success,
  });

  final WidgetTester tester;
  final Widget Function(AssayBackend backend) build;
  final Finder action;
  final String effect;
  final Finder? input;
  final String draftSample;
  final Finder? error, success;
}

/// A transition whose precondition is unmet in [build]: the control must be
/// absent or inert, and [reason] (when given) must say why.
final class WidgetGateSubject {
  const WidgetGateSubject({
    required this.tester,
    required this.build,
    required this.action,
    required this.effect,
    this.reason,
  });

  final WidgetTester tester;
  final Widget Function(AssayBackend backend) build;
  final Finder action;
  final String effect;
  final Finder? reason;
}

Future<AssayBackend> _mount(
  WidgetTester tester,
  Widget Function(AssayBackend) build,
  Condition condition,
) async {
  final backend = AssayBackend(condition);
  await tester.pumpWidget(build(backend));
  await tester.pumpAndSettle();
  return backend;
}

/// action-effect over the widget substrate.
final class WidgetActionEffect extends Archetype<WidgetActionSubject> {
  @override
  String get name => 'action-effect';

  @override
  Set<String> seams(WidgetActionSubject s) => {
    'singleFlight',
    if (s.input != null) 'input',
  };

  @override
  Map<String, Future<void> Function(WidgetActionSubject)> get oracles => {
    'fires-primary-effect': (s) async {
      final backend = await _mount(s.tester, s.build, Condition.success);
      await s.tester.tap(s.action);
      await s.tester.pumpAndSettle();
      if (backend.count(s.effect) == 0) {
        throw AvpFail(
          "the action did not perform '${s.effect}': a visible action is a no-op",
        );
      }
    },
    'no-phantom-success': (s) async {
      if (s.error == null) {
        throw const AvpUnresolved(
          'no-phantom-success needs an error seam to see the failure',
        );
      }
      final backend = await _mount(s.tester, s.build, Condition.apiError);
      await s.tester.enterText(s.input!, s.draftSample);
      await s.tester.tap(s.action);
      await s.tester.pumpAndSettle();
      if (backend.count(s.effect) == 0) {
        throw AvpFail(
          "the action never reached '${s.effect}', so its failure was not exercised",
        );
      }
      final kept = s.tester
          .widget<EditableText>(
            find.descendant(of: s.input!, matching: find.byType(EditableText)),
          )
          .controller
          .text;
      if (kept != s.draftSample) {
        throw AvpFail(
          'the user input was lost after a failed action ("$kept" instead of "${s.draftSample}")',
        );
      }
      if (s.error!.evaluate().isEmpty) {
        throw const AvpFail('no error was shown after the action failed');
      }
      if (s.success != null && s.success!.evaluate().isNotEmpty) {
        throw const AvpFail('a success was affirmed after the action failed');
      }
    },
    'single-flight': (s) async {
      final backend = await _mount(s.tester, s.build, Condition.slow);
      await s.tester.tap(s.action, warnIfMissed: false);
      await s.tester.pump();
      await s.tester.tap(s.action, warnIfMissed: false);
      await s.tester.pumpAndSettle();
      final fired = backend.count(s.effect);
      if (fired != 1) {
        throw AvpFail(
          "a fast double activation performed '${s.effect}' $fired times",
        );
      }
    },
  };
}

/// lifecycle-gate's interface criterion over the widget substrate.
final class WidgetLifecycleGate extends Archetype<WidgetGateSubject> {
  @override
  String get name => 'lifecycle-gate';

  @override
  Set<String> seams(WidgetGateSubject s) => {'blocked'};

  @override
  Map<String, Future<void> Function(WidgetGateSubject)> get oracles => {
    'blocked-action-is-disabled': (s) async {
      final backend = await _mount(s.tester, s.build, Condition.success);
      if (s.action.evaluate().isNotEmpty) {
        await s.tester.tap(s.action, warnIfMissed: false);
        await s.tester.pumpAndSettle();
      }
      if (backend.count(s.effect) > 0) {
        throw AvpFail(
          "a live control performed '${s.effect}' although its precondition is unmet",
        );
      }
      if (s.reason != null && s.reason!.evaluate().isEmpty) {
        throw const AvpFail('the action is blocked without saying why');
      }
    },
  };
}

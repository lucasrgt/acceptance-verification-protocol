# Assay.Flutter

Flutter reference implementation of the Acceptance Verification Protocol over
`flutter_test`. A subject mounts the screen around an `AssayBackend` that the
oracle controls: it forces the criterion's condition (`success`, `api-error`,
`slow`, `offline`, `empty`) and records every call, so the proof is the
backend effect, not the screen's own claim.

| Archetype | Criteria bound |
| --- | --- |
| `action-effect` | `fires-primary-effect`, `no-phantom-success`, `single-flight` |
| `lifecycle-gate` | `blocked-action-is-disabled` (`gate-enforced-server-side` is the HTTP adapters') |

```dart
testWidgets('cancel a booking', (tester) async {
  final verdict = await runVerification(WidgetActionEffect(), 'booking.cancel', WidgetActionSubject(
    tester: tester,
    build: (backend) => ReservationsScreen(gateway: gatewayOver(backend)),
    action: find.byKey(const Key('cancel')),
    effect: 'cancel',
    error: find.byKey(const Key('error')),
  ));
  expect(verdict.of('fires-primary-effect'), VerdictStatus.pass);
});
```

Criteria without a bound oracle are `unresolved`; criteria whose seam
(`requires`) the subject lacks are `not-applicable`. `lib/src/catalog.g.dart`
embeds `protocol/catalog.json` byte for byte (a test keeps them equal).

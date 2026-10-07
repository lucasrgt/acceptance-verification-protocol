/// Flutter reference implementation of AVP for the widget substrate.
///
/// A subject builds the screen around an [AssayBackend] the test controls:
/// the backend forces the criterion's condition (`success`, `api-error`,
/// `slow`, `offline`, `empty`) and records every call, so an oracle can
/// prove the action's effect instead of trusting the screen. Criteria the
/// adapter has no oracle for are `unresolved`; criteria whose required seam
/// the subject lacks are `not-applicable`.
library;

export 'src/backend.dart';
export 'src/runner.dart';
export 'src/widget_archetypes.dart';

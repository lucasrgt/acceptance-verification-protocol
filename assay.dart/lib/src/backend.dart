import 'dart:async';

/// The precondition an adapter forces before observing (the catalog's condition ids).
enum Condition {
  success('success'),
  apiError('api-error'),
  slow('slow'),
  offline('offline'),
  empty('empty');

  const Condition(this.id);
  final String id;

  static Condition parse(String id) =>
      values.firstWhere((c) => c.id == id, orElse: () => success);
}

/// Raised by [AssayBackend] under `api-error` and `offline`.
final class AssayBackendError implements Exception {
  const AssayBackendError(this.condition);
  final Condition condition;

  @override
  String toString() => 'AssayBackendError(${condition.id})';
}

/// The backend a subject's screen talks to during verification.
final class AssayBackend {
  AssayBackend(
    this.condition, {
    this.latency = const Duration(milliseconds: 300),
  });

  final Condition condition;

  /// How long a `slow` call takes.
  final Duration latency;
  final calls = <({String operation, Object? body})>[];

  /// Performs [operation]: records it, then answers with [success] (or an
  /// empty value under `empty`), waits under `slow`, and fails under
  /// `api-error` or `offline`.
  Future<T> call<T>(
    String operation,
    T Function() success, {
    Object? body,
    T Function()? empty,
  }) async {
    calls.add((operation: operation, body: body));
    if (condition == Condition.slow) await Future<void>.delayed(latency);
    return switch (condition) {
      Condition.apiError ||
      Condition.offline => throw AssayBackendError(condition),
      Condition.empty when empty != null => empty(),
      _ => success(),
    };
  }

  int count(String operation) =>
      calls.where((c) => c.operation == operation).length;
}

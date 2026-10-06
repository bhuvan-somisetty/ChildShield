/// A tiny Result type so the data/service layers can return success or a
/// user-safe failure message without throwing across layer boundaries.
sealed class Result<T> {
  const Result();
  bool get isOk => this is Ok<T>;
  T? get valueOrNull => this is Ok<T> ? (this as Ok<T>).value : null;
  String? get errorOrNull => this is Err<T> ? (this as Err<T>).message : null;

  R when<R>({required R Function(T value) ok, required R Function(String message) err}) {
    final self = this;
    return self is Ok<T> ? ok(self.value) : err((self as Err<T>).message);
  }
}

class Ok<T> extends Result<T> {
  const Ok(this.value);
  final T value;
}

class Err<T> extends Result<T> {
  const Err(this.message);
  final String message;
}

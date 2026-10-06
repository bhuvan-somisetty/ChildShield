import 'dart:async';
import 'package:dio/dio.dart';

import '../../core/config/env.dart';
import 'api_exception.dart';

/// Thin REST client over Dio.
///
/// Cold-start awareness (Render free tier):
///   The backend process sleeps after ~15 min idle. The first request after
///   sleep triggers a cold start that takes 30–90 s. To handle this:
///     • connectTimeout / receiveTimeout: 90 s (covers worst-case cold start)
///     • _RetryInterceptor: 3 retries, 5 s back-off, on timeout / 503 / 502
///
/// Callers can watch [coldStartStream] to show "Server warming up…" UX when
/// a request takes more than [coldStartWarningMs] ms.
class ApiClient {
  static final StreamController<void> onSessionExpired =
      StreamController<void>.broadcast();

  /// Fired once when a request takes longer than [coldStartWarningMs] ms.
  static final StreamController<bool> onColdStart =
      StreamController<bool>.broadcast();
  static const int coldStartWarningMs = 6000;

  ApiClient()
      : _dio = Dio(BaseOptions(
          baseUrl: Env.restBase,
          connectTimeout: const Duration(seconds: 90),
          receiveTimeout: const Duration(seconds: 90),
          sendTimeout: const Duration(seconds: 90),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.addAll([
      _AuthInterceptor(getToken: () => _token, onExpired: () => onSessionExpired.add(null)),
      _RetryInterceptor(_dio),
    ]);
  }

  final Dio _dio;
  String? _token;

  void setToken(String? token) => _token = token;
  String? get token => _token;

  /// Fire-and-forget GET /health to wake the Render free-tier backend during splash,
  /// so it is ready by the time the user reaches Login/Signup.
  static void warmup() {
    Dio(BaseOptions(
      baseUrl: Env.apiBase,
      connectTimeout: const Duration(seconds: 90),
      receiveTimeout: const Duration(seconds: 90),
    )).get('/health').then((_) {}).catchError((_) {});
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body}) =>
      _send(() => _dio.post(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _send(() => _dio.patch(path, data: body));

  Future<dynamic> put(String path, {Object? body}) =>
      _send(() => _dio.put(path, data: body));

  Future<dynamic> delete(String path, {Object? body}) =>
      _send(() => _dio.delete(path, data: body));

  Future<dynamic> _send(Future<Response> Function() run) async {
    // Emit cold-start warning if the request takes more than 6 s.
    Timer? warmTimer;
    warmTimer = Timer(const Duration(milliseconds: coldStartWarningMs), () {
      onColdStart.add(true);
    });
    try {
      final res = await run();
      warmTimer.cancel();
      onColdStart.add(false);
      return res.data;
    } on DioException catch (e) {
      warmTimer.cancel();
      onColdStart.add(false);
      final status = e.response?.statusCode ?? 0;
      final data = e.response?.data;
      final String message;
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        message = 'Connection timed out. The server may be starting up — please try again.';
      } else if (status == 503 || status == 502) {
        message = 'Server is warming up. Please wait a moment and try again.';
      } else if (status == 0) {
        message = 'Network error. Check your connection and try again.';
      } else {
        message = (data is Map && data['error'] is String)
            ? data['error'] as String
            : 'Request failed ($status).';
      }
      throw ApiException(status, message);
    }
  }
}

// ── Auth header injector ──────────────────────────────────────────────────────

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor({required this.getToken, required this.onExpired});
  final String? Function() getToken;
  final void Function() onExpired;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final t = getToken();
    if (t != null && t.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $t';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) onExpired();
    handler.next(err);
  }
}

// ── Retry interceptor — handles cold start 502/503/timeout ───────────────────

class _RetryInterceptor extends Interceptor {
  _RetryInterceptor(this._dio);
  final Dio _dio;

  static const _maxRetries = 3;
  static const _backoff = Duration(seconds: 5);

  static bool _isRetryable(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) return true;
    final s = e.response?.statusCode ?? 0;
    return s == 502 || s == 503;
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final extra = err.requestOptions.extra;
    final retryCount = (extra['_retryCount'] as int?) ?? 0;

    if (_isRetryable(err) && retryCount < _maxRetries) {
      await Future<void>.delayed(_backoff * (retryCount + 1));
      final opts = err.requestOptions;
      opts.extra['_retryCount'] = retryCount + 1;
      try {
        final res = await _dio.fetch(opts);
        handler.resolve(res);
      } on DioException catch (e2) {
        handler.next(e2);
      }
      return;
    }
    handler.next(err);
  }
}

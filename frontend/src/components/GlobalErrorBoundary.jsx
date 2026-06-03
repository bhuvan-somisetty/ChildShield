import React from 'react';

/**
 * GlobalErrorBoundary
 * ───────────────────
 * Catches any uncaught render errors and shows a recovery UI
 * instead of a blank white screen. Gives users a button to reload.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center', flexDirection: 'column', gap: '24px'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px'
        }}>⚠️</div>

        <div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6, margin: '0 auto' }}>
            AlphaGuard encountered an unexpected error. Your session data is safe.
          </p>
          {this.state.error && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ color: '#475569', fontSize: '12px', cursor: 'pointer' }}>
                Technical details
              </summary>
              <pre style={{
                marginTop: '8px', padding: '12px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                fontSize: '11px', color: '#ef4444', textAlign: 'left',
                maxWidth: '400px', overflowX: 'auto', whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '12px 24px', background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.3)', borderRadius: '12px',
              color: '#2563eb', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px', background: '#2563eb',
              border: 'none', borderRadius: '12px',
              color: '#0f172a', fontWeight: '800', fontSize: '14px', cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;

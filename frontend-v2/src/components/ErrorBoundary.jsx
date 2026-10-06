import React from 'react';

// Top-level safety net. Any uncaught render error anywhere in the tree is caught
// here and shown as a recoverable screen instead of a blank white page. Offers a
// reload and a last-resort "reset app data" escape hatch for the rare case where
// corrupt local state is what's crashing the render.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surfaced in dev tools / future remote logging; never swallowed silently.
    // eslint-disable-next-line no-console
    console.error('AlphaGuard UI error:', error, info?.componentStack);
  }

  handleReload = () => { this.setState({ hasError: false }); window.location.reload(); };

  handleReset = () => {
    try { localStorage.clear(); } catch { /* ignore */ }
    window.location.replace('/welcome');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center', background: '#030307', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 30 }}>⚠️</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 13.5, color: '#94a3b8', maxWidth: 300, marginTop: 8, lineHeight: 1.5 }}>
            AlphaGuard hit an unexpected error. Your data is safe — try reloading. If it keeps happening, you can reset the app.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={this.handleReload} style={{ height: 46, padding: '0 22px', borderRadius: 999, border: 'none', fontWeight: 800, fontSize: 14, color: '#fff', background: 'linear-gradient(140deg,#06b6d4,#2563eb)', cursor: 'pointer' }}>Reload</button>
          <button onClick={this.handleReset} style={{ height: 46, padding: '0 22px', borderRadius: 999, fontWeight: 700, fontSize: 14, color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Reset App</button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

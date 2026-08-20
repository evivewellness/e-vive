import React from 'react';

/**
 * Catches a render error anywhere below it and shows something a person can act
 * on, instead of the white page React leaves behind when a component throws.
 *
 * This matters most in the portals. A carer part-way through a Cardex, or a
 * family opening a care report, meeting a blank screen has no way to tell a
 * bug from a lost connection, and no way to tell us which it was. The reference
 * shown here is the timestamp that appears in the logged line, so a support
 * call can be matched to the actual failure.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, reference: null };
  }

  static getDerivedStateFromError() {
    return { failed: true, reference: new Date().toISOString() };
  }

  componentDidCatch(error, info) {
    // Structured so it can be found later. No form contents, no patient data —
    // only where it broke.
    console.error(JSON.stringify({
      level: 'error',
      event: 'render_error',
      at: new Date().toISOString(),
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      message: error?.message,
      component: info?.componentStack?.split('\n')[1]?.trim() || null,
    }));
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif", color: '#0F2035',
      }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, marginBottom: 10 }}>
            Something went wrong on this page
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#5A7080', marginBottom: 20 }}>
            Your data is safe — this is a fault in the page, not in your account.
            Reloading usually clears it. If it keeps happening, call us on{' '}
            <strong style={{ color: '#0F2035' }}>+254&nbsp;141&nbsp;888&nbsp;340</strong> or
            email <strong style={{ color: '#0F2035' }}>hello@e-vive.co.ke</strong> and quote
            the reference below.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg,#004A99,#002E6E)', color: '#fff', border: 'none',
              borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Reload the page
          </button>
          <div style={{ marginTop: 18, fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#5A7080' }}>
            Reference: {this.state.reference}
          </div>
        </div>
      </div>
    );
  }
}

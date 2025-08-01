"use client";

export default function CheckinPage() {
  return (
    <section aria-labelledby="checkin-title" style={{ width: '100%' }}>
      <h1 id="checkin-title" style={{
        color: "var(--color-primary)", fontWeight: 800, fontSize: "2rem", marginBottom: "1.3rem"
      }}>Welcome! Start Your Visit Check-In</h1>
      <p style={{ marginBottom: "1.3rem", color: "var(--color-accent)", fontSize: "1.1rem" }}>
        Touch or use keyboard navigation. For accessibility help, <a href="#a11y-info">see details below</a>.
      </p>
      {/* Placeholder touch-friendly start button */}
      <button
        aria-label="Begin check-in process"
        autoFocus
        style={{ width: "100%", margin: "0.5rem 0 1.1rem 0" }}
        tabIndex={0}
        onKeyPress={e => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
      >
        Start Check-In
      </button>
      {/* Kiosk accessibility tips */}
      <div aria-live="polite" aria-atomic="true" id="a11y-info" tabIndex={-1}
        style={{ marginTop: '2rem', fontSize: '0.93rem', color: "#424242" }}>
        <strong>Accessibility:</strong> Use <kbd>Tab</kbd> to navigate, <kbd>Enter</kbd> to activate. High-contrast, ARIA labels and screen reader support enabled.
      </div>
    </section>
  );
}

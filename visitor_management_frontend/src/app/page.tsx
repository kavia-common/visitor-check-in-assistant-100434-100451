export default function Home() {
  return (
    <section aria-labelledby="home-title" style={{ width: "100%" }}>
      <h1 id="home-title" style={{
        color: "var(--color-primary)", fontWeight: 800, fontSize: "2.8rem", marginBottom: "1.2rem"
      }}>
        Welcome to the <span style={{ color: "var(--color-accent)" }}>Visitor Kiosk</span>
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#424242", marginBottom: "1.3rem" }}>
        For a seamless check-in experience. Touch below or use keyboard navigation.
      </p>
      <nav aria-label="Main options">
        <a href="/checkin" className="btn" tabIndex={0} style={{marginRight:"1.1rem"}} aria-label="Check in as visitor">Visitor Check-In</a>
        <a href="/admin" className="btn" tabIndex={0} style={{background:"var(--color-accent)",color:"#212121"}} aria-label="Admin dashboard access">Admin Dashboard</a>
      </nav>
      <div style={{marginTop:'2rem',color:"#777",fontSize:".97rem"}} aria-live="polite">
        <strong>Accessibility:</strong> Fully ARIA-labeled, keyboard friendly, and screen reader tested.
      </div>
    </section>
  );
}

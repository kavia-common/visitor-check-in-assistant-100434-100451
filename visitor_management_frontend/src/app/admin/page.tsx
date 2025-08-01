export default function AdminPage() {
  return (
    <section aria-labelledby="admin-title" style={{ width: '100%' }}>
      <h1 id="admin-title" style={{
        color: "var(--color-primary)",
        fontWeight: 800,
        fontSize: "2rem",
        marginBottom: "1.2rem"
      }}>Admin Dashboard</h1>
      <p style={{ color: "var(--color-accent)", fontSize: "1.1rem", marginBottom: "0.8rem" }}>
        Manage visitors, hosts, and check-in logs. Touch-friendly &amp; responsive.
      </p>
      <section aria-labelledby="visitors-table-title" style={{marginBottom: "1.8rem"}}>
        <h2 id="visitors-table-title" style={{
          color: "var(--color-primary)", margin: "1rem 0", fontSize: "1.2rem"
        }}>
          Visitor Logs
        </h2>
        {/* Example: Accessible table layout for logs */}
        <div style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: ".7rem",
          boxShadow: "0 1px 8px 0 rgba(25, 118, 210, 0.04)",
          marginBottom: "1.4rem"
        }}>
          <table aria-label="Visitor Logs" style={{ width: "100%", minWidth: "400px" }}>
            <thead>
              <tr>
                <th scope="col">Visitor</th>
                <th scope="col">Host</th>
                <th scope="col">Purpose</th>
                <th scope="col">Time In</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholders, should be populated dynamically */}
              <tr tabIndex={0}>
                <td>Jane Doe</td>
                <td>John Smith</td>
                <td>Meeting</td>
                <td>09:25</td>
                <td>In Progress</td>
              </tr>
              <tr tabIndex={0}>
                <td>Alan Park</td>
                <td>Maria Rojas</td>
                <td>Interview</td>
                <td>10:12</td>
                <td>Checked Out</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{fontSize: '.95rem', color: "#777"}}>For keyboard navigation, use <kbd>Tab</kbd> and <kbd>Left/Right</kbd> to explore data.</p>
      </section>
    </section>
  );
}

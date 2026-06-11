import { useEffect, useState } from "react";
import * as api from "../../api";
import Section from "../../components/Section";
import Card from "../../components/Card";
import { COLORS } from "../../styles/colors";

export default function AuditLogsScreen() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.auditLogs.list({ limit: 100 })
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Section title="Audit Logs" sub="System activity and administrative changes">
      {error && <div style={{ color: COLORS.danger, marginBottom: 12 }}>{error}</div>}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: COLORS.text, fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.surface }}>
              {["Time", "Actor", "Action", "Resource", "Department"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={td}>{new Date(row.created_at).toLocaleString()}</td>
                <td style={td}>{row.actor_name || "System"}</td>
                <td style={td}>{row.action}</td>
                <td style={td}>{row.resource}{row.resource_id ? ` #${row.resource_id}` : ""}</td>
                <td style={td}>{row.department_name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

const th = { textAlign: "left", padding: "12px 14px", color: COLORS.muted, fontSize: 11, textTransform: "uppercase" };
const td = { padding: "12px 14px", verticalAlign: "top" };

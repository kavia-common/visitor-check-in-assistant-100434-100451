'use client';
import React, { useEffect, useState } from 'react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://vscode-internal-21452-beta.beta01.cloud.kavia.ai'; // Demo: replace with actual backend url/env

// Types based on backend schemas
type Visitor = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  created_at: string;
};

type Host = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
};

type VisitLog = {
  id: number;
  visitor: Visitor;
  host: Host;
  purpose: string | null;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
};

type NotificationLog = {
  id: number;
  timestamp: string;
  host_email: string;
  visitor_name: string;
  message: string;
  status: string;
};

function formatDate(dt?: string | null) {
  if (!dt) return '';
  return new Date(dt).toLocaleString();
}

// Basic table component with filtering and override controls
function DataTable<T extends object>({
  title,
  data,
  columns,
  filterableKeys = [],
  idField = 'id',
  onAction,
  actions = [],
  filterHint,
}: {
  title: string;
  data: T[];
  columns: { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode }[];
  filterableKeys?: (keyof T | string)[];
  idField?: keyof T | string;
  actions?: { label: string; action: string; color?: string }[];
  filterHint?: string;
  onAction?: (row: T, action: string) => void;
}) {
  const [filter, setFilter] = useState('');
  const lowerFilter = filter.toLowerCase();

  // Support filtering with dot notation keys (e.g., 'visitor.full_name')
  const filteredData: T[] =
    filter.length < 1
      ? data
      : data.filter((row) =>
          filterableKeys.some((key) => {
            // Allow dot notation
            let val: unknown = row;
            for (const part of (typeof key === 'string' ? key.split('.') : [String(key)])) {
              if (val && typeof val === 'object' && part in val) {
                // @ts-expect-error indexing object
                val = val[part];
              } else {
                val = undefined;
                break;
              }
            }
            return typeof val === 'string' && val.toLowerCase().includes(lowerFilter);
          })
        );

  return (
    <section className="admincard">
      <div className="admincard__header">
        <h2>{title}</h2>
        {filterableKeys.length > 0 && (
          <input
            className="admincard__filter"
            type="search"
            placeholder={filterHint || 'Search...'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: 180, marginLeft: '1em' }}
          />
        )}
      </div>
      <div className="admincard__table-container">
        <table className="admincard__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={typeof col.key === 'string' ? col.key : String(col.key)}>{col.label}</th>
              ))}
              {actions.length > 0 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row: T, i: number) => {
                // Compute the id value in a type-safe way
                const idValue =
                  typeof idField === 'string'
                    ? idField.split('.').reduce(
                        (obj: unknown, key: string) =>
                          obj && typeof obj === 'object' && key in obj
                            ? (obj as Record<string, unknown>)[key]
                            : undefined,
                        row
                      )
                    : (row as { [K in typeof idField]: unknown })[idField];
                return (
                  <tr key={typeof idValue === 'string' || typeof idValue === 'number' ? idValue : i}>
                    {columns.map((col) => {
                      let cellValue: unknown;
                      if (col.render) {
                        return (
                          <td key={typeof col.key === 'string' ? col.key : String(col.key)}>
                            {col.render(row)}
                          </td>
                        );
                      }
                      if (typeof col.key === 'string' && col.key.includes('.')) {
                        // dot notation for nested fields
                        cellValue = col.key.split('.').reduce(
                          (obj: unknown, key: string) =>
                            obj && typeof obj === 'object' && key in obj
                              ? (obj as Record<string, unknown>)[key]
                              : undefined,
                          row
                        );
                      } else {
                        cellValue = row[col.key as keyof T];
                      }
                      return (
                        <td key={typeof col.key === 'string' ? col.key : String(col.key)}>
                          {typeof cellValue === 'string' || typeof cellValue === 'number'
                            ? cellValue
                            : cellValue !== undefined
                            ? String(cellValue)
                            : ''}
                        </td>
                      );
                    })}
                    {actions.length > 0 && (
                      <td className="admincard__actions">
                        {actions.map(({ label, action, color }) => (
                          <button
                            key={action}
                            style={{ marginRight: 6, ...(color ? { background: color, color: '#fff' } : {}) }}
                            className="admincard__actionbtn"
                            onClick={() => onAction && onAction(row, action)}
                          >
                            {label}
                          </button>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} style={{ textAlign: 'center' }}>
                  No matching data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const fetcher = async (path: string) => {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
};

export default function AdminDashboard() {
  // States for API data
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  // For this demo, notifications log is stubbed (backend may not persist)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notifications, _setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pagination could be added; demo loads first N
  useEffect(() => {
    async function load() {
      setLoading(true);
      setApiError(null);
      try {
        const [logData, visitorData, hostData] = await Promise.all([
          fetcher('/api/admin/visitlogs?limit=50'),
          fetcher('/api/admin/visitors?limit=50'),
          fetcher('/api/admin/hosts?limit=50'),
        ]);
        setVisitLogs(logData);
        setVisitors(visitorData);
        setHosts(hostData);

        // If host notification logs API is added, fetch them here:
        // setNotifications(await fetcher('/api/admin/notifications?limit=50'));
      } catch (e: unknown) {
        if (typeof e === "object" && e && "message" in e && typeof (e as { message?: unknown }).message === "string") {
          setApiError((e as { message: string }).message);
        } else {
          setApiError('API error');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Admin actions for manual override (approve/reject, check out, etc.)
  // As the actual backend endpoints for override are not yet specified, stub handler for now.
  const handleVisitAction = (log: VisitLog, action: string) => {
    alert(
      `Demo action: ${action} for visit #${log.id} (${log.visitor.full_name} -> ${log.host.full_name}).\nYou would make a POST to /api/admin/visitlog/${log.id}/${action}`
    );
    // Example for production:
    // fetch(`${BACKEND_URL}/api/admin/visitlog/${log.id}/${action}`, { method: "POST" })...
  };

  return (
    <main>
      <h1 className="admintitle">Admin Dashboard</h1>
      <p className="admindesc">
        View and manage visitor logs, live visits, host notifications, and perform admin overrides.<br />
        <span style={{ fontWeight: 400, fontSize: '0.9em' }}>
          Data displayed below is for demo—filtered & paginated, real API calls are made.
        </span>
      </p>
      {loading ? (
        <div className="adminloading">Loading data...</div>
      ) : apiError ? (
        <div className="adminerror">{apiError}</div>
      ) : (
        <div className="admindash-container">
          <DataTable<VisitLog>
            title="Visit Logs"
            data={visitLogs}
            columns={[
              { key: 'id', label: 'ID' },
              {
                key: 'visitor',
                label: 'Visitor',
                render: (row) => (
                  <span>
                    {row.visitor?.full_name}
                    {row.visitor?.email && <div className="admindash-email">{row.visitor?.email}</div>}
                  </span>
                ),
              },
              {
                key: 'host',
                label: 'Host',
                render: (row) => (
                  <span>
                    {row.host?.full_name}
                    {row.host?.email && <div className="admindash-email">{row.host?.email}</div>}
                  </span>
                ),
              },
              { key: 'purpose', label: 'Purpose' },
              {
                key: 'check_in_time',
                label: 'Check In',
                render: (row) => formatDate(row.check_in_time),
              },
              {
                key: 'check_out_time',
                label: 'Check Out',
                render: (row) => formatDate(row.check_out_time),
              },
              { key: 'status', label: 'Status' },
            ]}
            idField="id"
            filterableKeys={[
              'visitor.full_name',
              'host.full_name',
              'purpose',
              'status',
            ]}
            filterHint="Search by visitor, host, or status"
            actions={[
              { label: 'Approve', action: 'approve', color: '#43a047' },
              { label: 'Reject', action: 'reject', color: '#e53935' },
              { label: 'Checkout', action: 'checkout', color: '#1976d2' },
            ]}
            onAction={handleVisitAction}
          />

          <DataTable<Visitor>
            title="Visitors"
            data={visitors}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'full_name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'id_number', label: 'ID Number' },
              {
                key: 'created_at',
                label: 'First Seen',
                render: (row) => formatDate(row.created_at),
              },
            ]}
            idField="id"
            filterableKeys={['full_name', 'email', 'phone', 'id_number']}
            filterHint="Name, email, phone"
          />

          <DataTable<Host>
            title="Hosts/Employees"
            data={hosts}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'full_name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'department', label: 'Department' },
            ]}
            idField="id"
            filterableKeys={['full_name', 'email', 'phone', 'department']}
            filterHint="Host name, dept"
          />

          {notifications.length > 0 && (
            <DataTable<NotificationLog>
              title="Host Notification Logs"
              data={notifications}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'timestamp', label: 'Sent', render: (row) => formatDate(row.timestamp) },
                { key: 'host_email', label: 'Host Email' },
                { key: 'visitor_name', label: 'Visitor' },
                { key: 'message', label: 'Message' },
                { key: 'status', label: 'Status' },
              ]}
              idField="id"
              filterableKeys={['host_email', 'visitor_name', 'message', 'status']}
              filterHint="host, visitor, message"
            />
          )}
        </div>
      )}

      <style jsx>{`
        main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
        }
        .admintitle {
          font-size: 2.3rem;
          font-weight: 700;
          color: #1976d2;
          margin-bottom: 0.2em;
        }
        .admindesc {
          color: #424242;
          font-size: 1.13rem;
          margin-bottom: 1.4em;
        }
        .adminloading,
        .adminerror {
          background: #fffde7;
          color: #c62828;
          padding: 1.2em 2em;
          margin: 2em 0;
          border-radius: 5px;
          font-weight: 500;
        }
        .admindash-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2em;
          justify-content: start;
        }
        .admincard {
          flex: 1 1 350px;
          min-width: 330px;
          background: #f6f7fa;
          border-radius: 10px;
          box-shadow: 0 2px 12px #1976d23a;
          padding: 1.2em 1em 1.7em;
          margin-bottom: 2em;
        }
        .admincard__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.7em;
        }
        .admincard__header h2 {
          font-weight: 600;
          margin: 0;
          font-size: 1.18rem;
          color: #1976d2;
        }
        .admincard__filter {
          border: 1.5px solid #bcdff8;
          border-radius: 6px;
          padding: 0.38em 0.7em;
          font-size: 0.97em;
        }
        .admincard__table-container {
          width: 100%;
          overflow-x: auto;
        }
        .admincard__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.97em;
        }
        .admincard__table th,
        .admincard__table td {
          padding: 0.38em 0.8em;
          border-bottom: 1px solid #d6e2ee;
        }
        .admincard__table th {
          background: #e3eefc;
          color: #1976d2;
          font-weight: 600;
        }
        .admincard__actions {
          display: flex;
          gap: 5px;
        }
        .admincard__actionbtn {
          font-size: 0.95em;
          padding: 0.26em 0.8em;
          border-radius: 4px;
          border: none;
          background: #b1b1b1;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .admincard__actionbtn:hover {
          filter: brightness(0.96);
        }
        .admindash-email {
          font-size: 0.9em;
          font-weight: 400;
          color: #424242;
          opacity: 0.81;
        }

        @media (max-width: 720px) {
          .admindash-container {
            flex-direction: column;
          }
          .admincard {
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}

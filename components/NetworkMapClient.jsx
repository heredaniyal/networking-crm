"use client";

import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { ZONES, LAHORE_CENTER, findZone } from "../lib/zones";

const BASE_TAGS = ["Friend", "Professional", "APC", "Family", "Business"];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => h === "name");
  const firstIdx = header.findIndex((h) => h.includes("first name"));
  const lastIdx = header.findIndex((h) => h.includes("last name"));
  const phoneIdx = header.findIndex((h) => h.includes("phone"));
  const emailIdx = header.findIndex(
    (h) => h.includes("e-mail") || h.includes("email")
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    let name = "";
    if (nameIdx >= 0 && cells[nameIdx]) name = cells[nameIdx];
    else {
      const f = firstIdx >= 0 ? cells[firstIdx] || "" : "";
      const l = lastIdx >= 0 ? cells[lastIdx] || "" : "";
      name = `${f} ${l}`.trim();
    }
    if (!name) continue;
    rows.push({
      name,
      phone: phoneIdx >= 0 ? cells[phoneIdx] || "" : "",
      email: emailIdx >= 0 ? cells[emailIdx] || "" : "",
    });
  }
  return rows;
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function NetworkMapClient() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("map");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [manual, setManual] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Lahore",
    area: "",
    tags: [],
    notes: "",
  });

  async function refresh() {
    try {
      setLoading(true);
      const data = await api("/api/contacts");
      setContacts(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const zoneCounts = useMemo(() => {
    const map = {};
    ZONES.forEach((z) => (map[z.id] = 0));
    contacts.forEach((c) => {
      if ((c.city || "").trim().toLowerCase() === "lahore" && c.area) {
        const zone = findZone(c.area);
        if (zone) map[zone.id]++;
      }
    });
    return map;
  }, [contacts]);

  const otherCities = useMemo(() => {
    const map = {};
    contacts.forEach((c) => {
      const city = (c.city || "").trim();
      if (city && city.toLowerCase() !== "lahore") {
        map[city] = (map[city] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [contacts]);

  const maxCount = Math.max(1, ...Object.values(zoneCounts));

  const allTags = useMemo(() => {
    const set = new Set(BASE_TAGS);
    contacts.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (selectedZone) {
      list = list.filter((c) => {
        if ((c.city || "").trim().toLowerCase() !== "lahore") return false;
        const zone = findZone(c.area);
        return zone && zone.id === selectedZone;
      });
    }
    if (tagFilter) {
      list = list.filter((c) => (c.tags || []).includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.area || "").toLowerCase().includes(q) ||
          (c.city || "").toLowerCase().includes(q) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, selectedZone, tagFilter, search]);

  async function handleUpdate(id, patch) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    try {
      await api(`/api/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      setError(e.message);
      refresh();
    }
  }

  async function handleDelete(id) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await api(`/api/contacts/${id}`, { method: "DELETE" });
    } catch (e) {
      setError(e.message);
      refresh();
    }
  }

  async function addManual() {
    if (!manual.name.trim()) return;
    try {
      const created = await api("/api/contacts", {
        method: "POST",
        body: JSON.stringify(manual),
      });
      setContacts((prev) => [created, ...prev]);
      setManual({
        name: "",
        phone: "",
        email: "",
        city: "Lahore",
        area: "",
        tags: [],
        notes: "",
      });
    } catch (e) {
      setError(e.message);
    }
  }

  function runImportPreview() {
    setImportPreview(parseCSV(csvText));
  }

  async function confirmImport() {
    if (!importPreview) return;
    try {
      const inserted = await api("/api/contacts", {
        method: "PUT",
        body: JSON.stringify({ bulk: importPreview }),
      });
      setContacts((prev) => [...inserted, ...prev]);
      setImportPreview(null);
      setCsvText("");
      setView("directory");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>registry / {contacts.length} contacts</div>
          <h1 style={styles.title}>Networking CRM</h1>
        </div>
        <div style={styles.tabs}>
          {["map", "directory", "add"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ ...styles.tabBtn, ...(view === v ? styles.tabBtnActive : {}) }}
            >
              {v === "map" ? "Map" : v === "directory" ? "Directory" : "Add / import"}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.body}>Loading...</div>}

      {!loading && view === "map" && (
        <div>
          <div style={styles.searchRow}>
            <input
              style={styles.input}
              placeholder="Search name, area, city, or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {selectedZone && (
              <button style={styles.clearBtn} onClick={() => setSelectedZone(null)}>
                Clear selection
              </button>
            )}
          </div>

          <div style={{ height: "420px", marginBottom: "1.25rem" }}>
            <MapContainer
              center={[LAHORE_CENTER.lat, LAHORE_CENTER.lng]}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ZONES.map((z) => {
                const count = zoneCounts[z.id] || 0;
                const radius = count === 0 ? 6 : 8 + (count / maxCount) * 18;
                return (
                  <CircleMarker
                    key={z.id}
                    center={[z.lat, z.lng]}
                    radius={radius}
                    pathOptions={{
                      color: selectedZone === z.id ? "#D9A441" : "#6B9080",
                      fillColor: "#D9A441",
                      fillOpacity: count === 0 ? 0.1 : 0.35 + (count / maxCount) * 0.4,
                      weight: selectedZone === z.id ? 2 : 1,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedZone(selectedZone === z.id ? null : z.id),
                    }}
                  >
                    <Popup>
                      <strong>{z.name}</strong>
                      <br />
                      {count} contact{count !== 1 ? "s" : ""}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {otherCities.length > 0 && (
            <>
              <div style={styles.sectionLabel}>Other cities and abroad</div>
              <div style={styles.otherRow}>
                {otherCities.map(([city, count]) => (
                  <span key={city} style={styles.otherChip}>
                    {city} <span style={styles.otherChipCount}>{count}</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {(selectedZone || search) && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={styles.sectionLabel}>
                {filteredContacts.length} result
                {filteredContacts.length !== 1 ? "s" : ""}
              </div>
              <ContactList
                contacts={filteredContacts}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                allTags={allTags}
              />
            </div>
          )}
        </div>
      )}

      {!loading && view === "directory" && (
        <div>
          <div style={styles.searchRow}>
            <input
              style={styles.input}
              placeholder="Search name, area, city, or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.tagFilterRow}>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                style={{
                  ...styles.tagChip,
                  borderColor: tagFilter === t ? "#D9A441" : "#2A303B",
                  color: tagFilter === t ? "#D9A441" : "#B7B4AA",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {contacts.length === 0 ? (
            <div style={styles.body}>No contacts yet. Head to Add / import.</div>
          ) : (
            <ContactList
              contacts={filteredContacts}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              allTags={allTags}
              editable
            />
          )}
        </div>
      )}

      {!loading && view === "add" && (
        <div>
          <div style={styles.sectionLabel}>Import from Google Contacts</div>
          <p style={styles.body}>
            Export your Google Contacts as CSV, open the file, paste the contents below.
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Name,Given Name,Family Name,E-mail 1 - Value,Phone 1 - Value..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <div style={styles.actionRow}>
            <button style={styles.primaryBtn} onClick={runImportPreview}>
              Preview import
            </button>
            {importPreview && (
              <span style={styles.body}>{importPreview.length} contacts found</span>
            )}
          </div>
          {importPreview && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={styles.previewBox}>
                {importPreview.slice(0, 8).map((p, i) => (
                  <div key={i}>
                    {p.name} {p.phone && `· ${p.phone}`}
                  </div>
                ))}
                {importPreview.length > 8 && (
                  <div>+ {importPreview.length - 8} more</div>
                )}
              </div>
              <button
                style={{ ...styles.primaryBtn, marginTop: "0.75rem" }}
                onClick={confirmImport}
              >
                Add {importPreview.length} contacts
              </button>
            </div>
          )}

          <div style={{ ...styles.sectionLabel, marginTop: "2rem" }}>
            Add one manually
          </div>
          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Name"
              value={manual.name}
              onChange={(e) => setManual({ ...manual, name: e.target.value })}
            />
            <div style={styles.formRow}>
              <input
                style={styles.input}
                placeholder="Phone"
                value={manual.phone}
                onChange={(e) => setManual({ ...manual, phone: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={manual.email}
                onChange={(e) => setManual({ ...manual, email: e.target.value })}
              />
            </div>
            <div style={styles.formRow}>
              <input
                style={styles.input}
                placeholder="City"
                value={manual.city}
                onChange={(e) => setManual({ ...manual, city: e.target.value })}
              />
              <input
                style={styles.input}
                list="zone-list"
                placeholder="Area (e.g. DHA)"
                value={manual.area}
                onChange={(e) => setManual({ ...manual, area: e.target.value })}
              />
              <datalist id="zone-list">
                {ZONES.map((z) => (
                  <option key={z.id} value={z.name} />
                ))}
              </datalist>
            </div>
            <div style={styles.tagFilterRow}>
              {BASE_TAGS.map((t) => {
                const active = manual.tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() =>
                      setManual({
                        ...manual,
                        tags: active
                          ? manual.tags.filter((x) => x !== t)
                          : [...manual.tags, t],
                      })
                    }
                    style={{
                      ...styles.tagChip,
                      borderColor: active ? "#D9A441" : "#2A303B",
                      color: active ? "#D9A441" : "#B7B4AA",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <input
              style={styles.input}
              placeholder="Notes"
              value={manual.notes}
              onChange={(e) => setManual({ ...manual, notes: e.target.value })}
            />
            <button style={styles.primaryBtn} onClick={addManual}>
              Add contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactList({ contacts, onDelete, onUpdate, allTags, editable }) {
  if (contacts.length === 0) {
    return <div style={styles.body}>No contacts match.</div>;
  }
  return (
    <div style={styles.list}>
      {contacts.map((c) => (
        <div key={c.id} style={styles.row}>
          <div style={styles.rowMain}>
            <div style={styles.rowName}>{c.name}</div>
            <div style={styles.rowMeta}>
              {c.phone && <span>{c.phone}</span>}
              {c.email && <span>{c.email}</span>}
            </div>
          </div>
          {editable ? (
            <>
              <input
                style={styles.smallInput}
                placeholder="City"
                value={c.city || ""}
                onChange={(e) => onUpdate(c.id, { city: e.target.value })}
              />
              <input
                style={styles.smallInput}
                list="zone-list"
                placeholder="Area"
                value={c.area || ""}
                onChange={(e) => onUpdate(c.id, { area: e.target.value })}
              />
              <select
                style={styles.smallInput}
                value=""
                onChange={(e) => {
                  const t = e.target.value;
                  if (t && !(c.tags || []).includes(t)) {
                    onUpdate(c.id, { tags: [...(c.tags || []), t] });
                  }
                }}
              >
                <option value="">+ tag</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div style={styles.rowTags}>
                {(c.tags || []).map((t) => (
                  <span
                    key={t}
                    style={styles.rowTag}
                    onClick={() =>
                      onUpdate(c.id, { tags: c.tags.filter((x) => x !== t) })
                    }
                    title="Remove tag"
                  >
                    {t} ×
                  </span>
                ))}
              </div>
              <button style={styles.deleteBtn} onClick={() => onDelete(c.id)}>
                Delete
              </button>
            </>
          ) : (
            <div style={styles.rowTags}>
              <span style={styles.rowLocation}>
                {c.area ? `${c.area}, ` : ""}
                {c.city}
              </span>
              {(c.tags || []).map((t) => (
                <span key={t} style={styles.rowTag}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    padding: "1.5rem",
    maxWidth: "960px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1.5rem",
    borderBottom: "1px solid #2A303B",
    paddingBottom: "1.25rem",
  },
  eyebrow: {
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: "12px",
    color: "#8C8A80",
    letterSpacing: "0.04em",
    marginBottom: "0.25rem",
  },
  title: {
    fontFamily: "ui-serif, Georgia, serif",
    fontSize: "28px",
    fontWeight: 500,
    margin: 0,
  },
  tabs: { display: "flex", gap: "0.5rem" },
  tabBtn: {
    background: "transparent",
    border: "1px solid #2A303B",
    color: "#B7B4AA",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
  tabBtnActive: { borderColor: "#D9A441", color: "#D9A441" },
  errorBanner: {
    background: "#2A1414",
    border: "1px solid #D4534E",
    color: "#F09595",
    padding: "0.6rem 0.9rem",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "1rem",
  },
  searchRow: { display: "flex", gap: "0.75rem", marginBottom: "1.25rem" },
  input: {
    flex: 1,
    background: "#1C222C",
    border: "1px solid #2A303B",
    color: "#E7E5DE",
    padding: "0.55rem 0.75rem",
    borderRadius: "8px",
    fontSize: "14px",
  },
  clearBtn: {
    background: "transparent",
    border: "1px solid #2A303B",
    color: "#B7B4AA",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sectionLabel: {
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: "12px",
    color: "#8C8A80",
    letterSpacing: "0.04em",
    marginBottom: "0.6rem",
  },
  otherRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  otherChip: {
    background: "#1C222C",
    border: "1px solid #2A303B",
    padding: "0.4rem 0.75rem",
    borderRadius: "999px",
    fontSize: "13px",
  },
  otherChipCount: {
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    color: "#D9A441",
    marginLeft: "0.35rem",
  },
  tagFilterRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" },
  tagChip: {
    background: "transparent",
    border: "1px solid",
    padding: "0.35rem 0.7rem",
    borderRadius: "999px",
    fontSize: "12px",
    cursor: "pointer",
  },
  list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  row: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.6rem",
    background: "#1C222C",
    border: "1px solid #2A303B",
    borderRadius: "8px",
    padding: "0.65rem 0.85rem",
  },
  rowMain: { minWidth: "160px", flex: "1 1 160px" },
  rowName: { fontSize: "14px", fontWeight: 500 },
  rowMeta: {
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: "11px",
    color: "#8C8A80",
    display: "flex",
    gap: "0.6rem",
  },
  rowLocation: { fontSize: "12px", color: "#8C8A80", marginRight: "0.4rem" },
  rowTags: { display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" },
  rowTag: {
    fontSize: "11px",
    border: "1px solid #2A303B",
    borderRadius: "999px",
    padding: "0.15rem 0.55rem",
    color: "#6B9080",
    cursor: "pointer",
  },
  smallInput: {
    background: "#14181F",
    border: "1px solid #2A303B",
    color: "#E7E5DE",
    padding: "0.35rem 0.5rem",
    borderRadius: "6px",
    fontSize: "12px",
    width: "110px",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #2A303B",
    color: "#D4534E",
    padding: "0.35rem 0.6rem",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  body: { fontSize: "13px", color: "#B7B4AA", lineHeight: 1.6 },
  textarea: {
    width: "100%",
    minHeight: "100px",
    background: "#1C222C",
    border: "1px solid #2A303B",
    color: "#E7E5DE",
    borderRadius: "8px",
    padding: "0.75rem",
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: "12px",
    marginTop: "0.5rem",
  },
  actionRow: { display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.75rem" },
  primaryBtn: {
    background: "#D9A441",
    border: "none",
    color: "#14181F",
    padding: "0.6rem 1.1rem",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  previewBox: {
    background: "#1C222C",
    border: "1px solid #2A303B",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "12px",
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    color: "#B7B4AA",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: "560px" },
  formRow: { display: "flex", gap: "0.6rem" },
};

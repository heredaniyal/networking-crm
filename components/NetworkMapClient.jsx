"use client";

import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { ZONES, LAHORE_CENTER, findZone } from "../lib/zones";

const BASE_TAGS = ["Friend", "Professional", "APC", "Family", "Business"];

// Country codes — format uses '#' as digit placeholder, other chars are literal separators
const COUNTRY_CODES = [
  { name: "Pakistan", code: "+92", flag: "🇵🇰", maxDigits: 10, format: "###-#######", placeholder: "300-1234567" },
  { name: "United States", code: "+1", flag: "🇺🇸", maxDigits: 10, format: "(###) ###-####", placeholder: "(555) 123-4567" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", maxDigits: 10, format: "#### ######", placeholder: "7911 123456" },
  { name: "India", code: "+91", flag: "🇮🇳", maxDigits: 10, format: "#####-#####", placeholder: "98765-43210" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", maxDigits: 9, format: "##-#######", placeholder: "50-1234567" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", maxDigits: 9, format: "##-#######", placeholder: "51-2345678" },
  { name: "Canada", code: "+1", flag: "🇨🇦", maxDigits: 10, format: "(###) ###-####", placeholder: "(416) 123-4567" },
  { name: "Australia", code: "+61", flag: "🇦🇺", maxDigits: 9, format: "### ### ###", placeholder: "412 345 678" },
  { name: "Afghanistan", code: "+93", flag: "🇦🇫", maxDigits: 9, format: "##-#######", placeholder: "70-1234567" },
  { name: "Albania", code: "+355", flag: "🇦🇱", maxDigits: 9, format: "###-######", placeholder: "067-212345" },
  { name: "Algeria", code: "+213", flag: "🇩🇿", maxDigits: 9, format: "###-###-###", placeholder: "551-234-567" },
  { name: "Argentina", code: "+54", flag: "🇦🇷", maxDigits: 10, format: "(###) ###-####", placeholder: "(911) 123-4567" },
  { name: "Austria", code: "+43", flag: "🇦🇹", maxDigits: 10, format: "### #######", placeholder: "664 1234567" },
  { name: "Azerbaijan", code: "+994", flag: "🇦🇿", maxDigits: 9, format: "##-###-##-##", placeholder: "40-123-45-67" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭", maxDigits: 8, format: "####-####", placeholder: "3600-1234" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩", maxDigits: 10, format: "####-######", placeholder: "1711-123456" },
  { name: "Belgium", code: "+32", flag: "🇧🇪", maxDigits: 9, format: "### ## ## ##", placeholder: "470 12 34 56" },
  { name: "Bolivia", code: "+591", flag: "🇧🇴", maxDigits: 8, format: "####-####", placeholder: "7012-3456" },
  { name: "Bosnia", code: "+387", flag: "🇧🇦", maxDigits: 8, format: "##-###-###", placeholder: "61-123-456" },
  { name: "Brazil", code: "+55", flag: "🇧🇷", maxDigits: 11, format: "(##) #####-####", placeholder: "(11) 91234-5678" },
  { name: "Bulgaria", code: "+359", flag: "🇧🇬", maxDigits: 9, format: "### ### ###", placeholder: "888 123 456" },
  { name: "Cambodia", code: "+855", flag: "🇰🇭", maxDigits: 9, format: "##-###-####", placeholder: "12-345-6789" },
  { name: "Cameroon", code: "+237", flag: "🇨🇲", maxDigits: 9, format: "####-####", placeholder: "6712-3456" },
  { name: "Chile", code: "+56", flag: "🇨🇱", maxDigits: 9, format: "# ####-####", placeholder: "9 1234-5678" },
  { name: "China", code: "+86", flag: "🇨🇳", maxDigits: 11, format: "### #### ####", placeholder: "131 2345 6789" },
  { name: "Colombia", code: "+57", flag: "🇨🇴", maxDigits: 10, format: "### ### ####", placeholder: "321 123 4567" },
  { name: "Croatia", code: "+385", flag: "🇭🇷", maxDigits: 9, format: "##-###-####", placeholder: "91-234-5678" },
  { name: "Cyprus", code: "+357", flag: "🇨🇾", maxDigits: 8, format: "##-######", placeholder: "96-123456" },
  { name: "Czech Republic", code: "+420", flag: "🇨🇿", maxDigits: 9, format: "### ### ###", placeholder: "601 234 567" },
  { name: "Denmark", code: "+45", flag: "🇩🇰", maxDigits: 8, format: "##-##-##-##", placeholder: "20-12-34-56" },
  { name: "Ecuador", code: "+593", flag: "🇪🇨", maxDigits: 9, format: "##-###-####", placeholder: "99-123-4567" },
  { name: "Egypt", code: "+20", flag: "🇪🇬", maxDigits: 10, format: "###-###-####", placeholder: "101-234-5678" },
  { name: "Ethiopia", code: "+251", flag: "🇪🇹", maxDigits: 9, format: "##-###-####", placeholder: "91-234-5678" },
  { name: "Finland", code: "+358", flag: "🇫🇮", maxDigits: 10, format: "## ### ####", placeholder: "40 123 4567" },
  { name: "France", code: "+33", flag: "🇫🇷", maxDigits: 9, format: "# ## ## ## ##", placeholder: "6 12 34 56 78" },
  { name: "Georgia", code: "+995", flag: "🇬🇪", maxDigits: 9, format: "###-##-##-##", placeholder: "555-12-34-56" },
  { name: "Germany", code: "+49", flag: "🇩🇪", maxDigits: 11, format: "#### #######", placeholder: "1511 2345678" },
  { name: "Ghana", code: "+233", flag: "🇬🇭", maxDigits: 9, format: "##-###-####", placeholder: "24-123-4567" },
  { name: "Greece", code: "+30", flag: "🇬🇷", maxDigits: 10, format: "### ### ####", placeholder: "697 123 4567" },
  { name: "Hungary", code: "+36", flag: "🇭🇺", maxDigits: 9, format: "##-###-####", placeholder: "20-123-4567" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩", maxDigits: 12, format: "####-####-####", placeholder: "0812-3456-7890" },
  { name: "Iran", code: "+98", flag: "🇮🇷", maxDigits: 10, format: "###-###-####", placeholder: "912-345-6789" },
  { name: "Iraq", code: "+964", flag: "🇮🇶", maxDigits: 10, format: "###-###-####", placeholder: "771-234-5678" },
  { name: "Ireland", code: "+353", flag: "🇮🇪", maxDigits: 9, format: "## ###-####", placeholder: "85 123-4567" },
  { name: "Israel", code: "+972", flag: "🇮🇱", maxDigits: 9, format: "##-###-####", placeholder: "52-123-4567" },
  { name: "Italy", code: "+39", flag: "🇮🇹", maxDigits: 10, format: "### ### ####", placeholder: "312 345 6789" },
  { name: "Japan", code: "+81", flag: "🇯🇵", maxDigits: 10, format: "##-####-####", placeholder: "90-1234-5678" },
  { name: "Jordan", code: "+962", flag: "🇯🇴", maxDigits: 9, format: "#-####-####", placeholder: "7-9012-3456" },
  { name: "Kazakhstan", code: "+7", flag: "🇰🇿", maxDigits: 10, format: "(###) ###-##-##", placeholder: "(701) 234-56-78" },
  { name: "Kenya", code: "+254", flag: "🇰🇪", maxDigits: 9, format: "###-######", placeholder: "712-345678" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼", maxDigits: 8, format: "####-####", placeholder: "9123-4567" },
  { name: "Lebanon", code: "+961", flag: "🇱🇧", maxDigits: 8, format: "##-######", placeholder: "71-123456" },
  { name: "Libya", code: "+218", flag: "🇱🇾", maxDigits: 9, format: "##-#######", placeholder: "91-1234567" },
  { name: "Lithuania", code: "+370", flag: "🇱🇹", maxDigits: 8, format: "####-####", placeholder: "6123-4567" },
  { name: "Luxembourg", code: "+352", flag: "🇱🇺", maxDigits: 9, format: "### ### ###", placeholder: "621 123 456" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾", maxDigits: 10, format: "##-####-####", placeholder: "12-3456-7890" },
  { name: "Mexico", code: "+52", flag: "🇲🇽", maxDigits: 10, format: "### ###-####", placeholder: "555 123-4567" },
  { name: "Morocco", code: "+212", flag: "🇲🇦", maxDigits: 9, format: "##-###-####", placeholder: "61-234-5678" },
  { name: "Myanmar", code: "+95", flag: "🇲🇲", maxDigits: 10, format: "##-###-####", placeholder: "9-123-4567" },
  { name: "Nepal", code: "+977", flag: "🇳🇵", maxDigits: 10, format: "##-###-####", placeholder: "98-012-3456" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱", maxDigits: 9, format: "# ## ## ## ##", placeholder: "6 12 34 56 78" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿", maxDigits: 9, format: "##-###-####", placeholder: "21-234-5678" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬", maxDigits: 10, format: "###-###-####", placeholder: "802-123-4567" },
  { name: "Norway", code: "+47", flag: "🇳🇴", maxDigits: 8, format: "#### ####", placeholder: "4012 3456" },
  { name: "Oman", code: "+968", flag: "🇴🇲", maxDigits: 8, format: "####-####", placeholder: "9123-4567" },
  { name: "Peru", code: "+51", flag: "🇵🇪", maxDigits: 9, format: "###-###-###", placeholder: "912-345-678" },
  { name: "Philippines", code: "+63", flag: "🇵🇭", maxDigits: 10, format: "###-###-####", placeholder: "917-123-4567" },
  { name: "Poland", code: "+48", flag: "🇵🇱", maxDigits: 9, format: "###-###-###", placeholder: "512-345-678" },
  { name: "Portugal", code: "+351", flag: "🇵🇹", maxDigits: 9, format: "###-###-###", placeholder: "912-345-678" },
  { name: "Qatar", code: "+974", flag: "🇶🇦", maxDigits: 8, format: "####-####", placeholder: "3312-3456" },
  { name: "Romania", code: "+40", flag: "🇷🇴", maxDigits: 9, format: "###-###-###", placeholder: "712-345-678" },
  { name: "Russia", code: "+7", flag: "🇷🇺", maxDigits: 10, format: "(###) ###-##-##", placeholder: "(912) 345-67-89" },
  { name: "Singapore", code: "+65", flag: "🇸🇬", maxDigits: 8, format: "####-####", placeholder: "9123-4567" },
  { name: "Slovenia", code: "+386", flag: "🇸🇮", maxDigits: 8, format: "##-###-###", placeholder: "31-234-567" },
  { name: "Somalia", code: "+252", flag: "🇸🇴", maxDigits: 8, format: "##-######", placeholder: "61-123456" },
  { name: "South Africa", code: "+27", flag: "🇿🇦", maxDigits: 9, format: "##-###-####", placeholder: "71-234-5678" },
  { name: "South Korea", code: "+82", flag: "🇰🇷", maxDigits: 10, format: "###-####-####", placeholder: "010-1234-5678" },
  { name: "Spain", code: "+34", flag: "🇪🇸", maxDigits: 9, format: "### ### ###", placeholder: "612 345 678" },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰", maxDigits: 9, format: "##-###-####", placeholder: "71-234-5678" },
  { name: "Sudan", code: "+249", flag: "🇸🇩", maxDigits: 9, format: "##-###-####", placeholder: "91-234-5678" },
  { name: "Sweden", code: "+46", flag: "🇸🇪", maxDigits: 9, format: "##-###-####", placeholder: "70-123-4567" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭", maxDigits: 9, format: "##-###-####", placeholder: "76-234-5678" },
  { name: "Syria", code: "+963", flag: "🇸🇾", maxDigits: 9, format: "###-###-###", placeholder: "944-123-456" },
  { name: "Taiwan", code: "+886", flag: "🇹🇼", maxDigits: 9, format: "####-######", placeholder: "0912-345678" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿", maxDigits: 9, format: "###-###-###", placeholder: "712-345-678" },
  { name: "Thailand", code: "+66", flag: "🇹🇭", maxDigits: 9, format: "##-####-####", placeholder: "81-2345-6789" },
  { name: "Tunisia", code: "+216", flag: "🇹🇳", maxDigits: 8, format: "##-######", placeholder: "20-123456" },
  { name: "Turkey", code: "+90", flag: "🇹🇷", maxDigits: 10, format: "(###) ###-####", placeholder: "(532) 123-4567" },
  { name: "Uganda", code: "+256", flag: "🇺🇬", maxDigits: 9, format: "###-######", placeholder: "712-345678" },
  { name: "Ukraine", code: "+380", flag: "🇺🇦", maxDigits: 9, format: "##-###-##-##", placeholder: "50-123-45-67" },
  { name: "Uruguay", code: "+598", flag: "🇺🇾", maxDigits: 9, format: "#-###-##-##", placeholder: "9-412-34-56" },
  { name: "Uzbekistan", code: "+998", flag: "🇺🇿", maxDigits: 9, format: "##-###-##-##", placeholder: "90-123-45-67" },
  { name: "Venezuela", code: "+58", flag: "🇻🇪", maxDigits: 10, format: "(###) ###-####", placeholder: "(412) 123-4567" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳", maxDigits: 9, format: "###-####-###", placeholder: "091-2345-678" },
  { name: "Yemen", code: "+967", flag: "🇾🇪", maxDigits: 9, format: "###-###-###", placeholder: "712-345-678" },
  { name: "Zimbabwe", code: "+263", flag: "🇿🇼", maxDigits: 9, format: "##-###-####", placeholder: "71-234-5678" },
];

// Applies a format mask (# = digit, other chars are literal separators)
function formatPhoneNumber(digits, format) {
  if (!format || !digits) return digits;
  let result = "";
  let di = 0;
  for (let i = 0; i < format.length; i++) {
    if (di >= digits.length) break;
    if (format[i] === "#") {
      result += digits[di++];
    } else {
      // Only emit a separator when there are already some digits typed
      if (di > 0) result += format[i];
    }
  }
  return result;
}

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
  const orgIdx = header.findIndex((h) => h.includes("organization name"));
  const phoneIdx = header.findIndex((h) => h.includes("phone"));
  const emailIdx = header.findIndex(
    (h) => h.includes("e-mail") || h.includes("email")
  );
  const areaIdx = header.findIndex((h) => h === "area");
  const cityIdx = header.findIndex((h) => h === "city");
  const tagsIdx = header.findIndex((h) => h === "tags");

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
    // Fall back to Organization Name for business contacts with no person name
    if (!name && orgIdx >= 0 && cells[orgIdx]) name = cells[orgIdx];
    if (!name) continue;
    rows.push({
      name,
      phone: phoneIdx >= 0 ? cells[phoneIdx] || "" : "",
      email: emailIdx >= 0 ? cells[emailIdx] || "" : "",
      area: areaIdx >= 0 ? cells[areaIdx] || "" : "",
      city: cityIdx >= 0 ? cells[cityIdx] || "Lahore" : "Lahore",
      tags: tagsIdx >= 0 && cells[tagsIdx] ? cells[tagsIdx].split("|").filter(Boolean) : [],
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
  // Phone country code state — defaults to Pakistan
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneRaw, setPhoneRaw] = useState(""); // raw digits only, no separators

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
    // Compose full phone: country code + formatted local number
    const fullPhone = phoneRaw
      ? `${selectedCountry.code} ${formatPhoneNumber(phoneRaw, selectedCountry.format)}`
      : "";
    try {
      const created = await api("/api/contacts", {
        method: "POST",
        body: JSON.stringify({ ...manual, phone: fullPhone }),
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
      setPhoneRaw("");
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
              {/* Phone: country code dropdown + formatted number input */}
              <div style={styles.phoneGroup}>
                <select
                  style={styles.countrySelect}
                  value={selectedCountry.code + "__" + selectedCountry.name}
                  onChange={(e) => {
                    const found = COUNTRY_CODES.find(
                      (c) => c.code + "__" + c.name === e.target.value
                    );
                    if (found) {
                      setSelectedCountry(found);
                      setPhoneRaw(""); // reset digits when country changes
                    }
                  }}
                  title="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code + "__" + c.name} value={c.code + "__" + c.name}>
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <input
                  style={styles.phoneInput}
                  placeholder={selectedCountry.placeholder}
                  value={formatPhoneNumber(phoneRaw, selectedCountry.format)}
                  onChange={(e) => {
                    // Strip everything except digits, cap at maxDigits
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, selectedCountry.maxDigits);
                    setPhoneRaw(digits);
                  }}
                  inputMode="numeric"
                />
              </div>
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
  // Phone field styles
  phoneGroup: {
    display: "flex",
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #2A303B",
    overflow: "hidden",
    background: "#1C222C",
  },
  countrySelect: {
    background: "#161C25",
    border: "none",
    borderRight: "1px solid #2A303B",
    color: "#D9A441",
    padding: "0.55rem 0.5rem",
    fontSize: "13px",
    cursor: "pointer",
    outline: "none",
    flexShrink: 0,
    maxWidth: "210px",
  },
  phoneInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#E7E5DE",
    padding: "0.55rem 0.75rem",
    fontSize: "14px",
    outline: "none",
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    letterSpacing: "0.05em",
    minWidth: 0,
  },
};

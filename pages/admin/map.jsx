import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";
import {
  getAllMapMarkers,
  getAllMapEntities,
  updateClientCoords,
  updateHcaCoords,
  getAllClients,
  getAllHcaProfiles,
  getAdminSession,
  clearAdminSession,
} from "../../lib/store";

const MAP_CSS = `
  body { margin:0; padding:0; }
  .map-wrap { display:flex; height:100vh; overflow:hidden; }

  /* Sidebar */
  .map-side { width:280px; flex-shrink:0; background:var(--deep); border-right:1px solid rgba(168,0,64,0.12); display:flex; flex-direction:column; overflow:hidden; }
  .map-logo { padding:18px 20px 12px; border-bottom:1px solid rgba(168,0,64,0.1); }
  .map-logo-text { font-family:var(--serif); font-size:20px; font-weight:900; color:var(--text); }
  .map-logo-text span { color:var(--mint); }
  .map-logo-sub { font-size:10px; font-family:var(--mono); color:var(--amber); letter-spacing:0.12em; text-transform:uppercase; margin-top:2px; }

  /* Legend */
  .map-legend { padding:14px 20px; border-bottom:1px solid rgba(168,0,64,0.08); }
  .map-legend-title { font-size:10px; font-family:var(--mono); color:var(--muted); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:10px; }
  .map-legend-item { display:flex; align-items:center; gap:10px; margin-bottom:7px; font-size:12px; }
  .map-legend-dot { width:14px; height:14px; border-radius:50%; flex-shrink:0; border:2px solid rgba(255,255,255,0.3); }

  /* Filters */
  .map-filters { padding:12px 20px; border-bottom:1px solid rgba(168,0,64,0.08); display:flex; flex-wrap:wrap; gap:6px; }
  .map-chip { padding:4px 12px; border-radius:100px; font-size:11px; font-family:var(--mono); border:1px solid rgba(168,0,64,0.18); background:transparent; color:var(--muted); cursor:pointer; transition:all 0.18s; }
  .map-chip:hover  { border-color:rgba(0,74,153,0.4); color:var(--text); }
  .map-chip.active { background:rgba(0,74,153,0.15); border-color:var(--jade); color:var(--mint); font-weight:700; }

  /* Entity list */
  .map-entity-list { flex:1; overflow-y:auto; padding:8px 0; }
  .map-entity-row { display:flex; align-items:center; gap:10px; padding:9px 20px; cursor:pointer; transition:background 0.15s; }
  .map-entity-row:hover { background:rgba(255,255,255,0.04); }
  .map-entity-row.selected { background:rgba(0,74,153,0.12); border-left:3px solid var(--jade); padding-left:17px; }
  .map-entity-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .map-entity-name { font-size:12px; font-weight:600; color:var(--text); }
  .map-entity-sub  { font-size:10px; color:var(--muted); font-family:var(--mono); margin-top:1px; }
  .map-entity-pin  { font-size:10px; color:var(--mint); margin-left:auto; }

  /* Main content */
  .map-main { flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; }

  /* Topbar */
  .map-topbar { display:flex; align-items:center; gap:14px; padding:12px 20px; background:rgba(10,10,20,0.95); border-bottom:1px solid rgba(168,0,64,0.1); z-index:10; flex-wrap:wrap; }
  .map-title { font-family:var(--serif); font-size:16px; font-weight:700; }
  .map-title span { color:var(--mint); }
  .map-mode-btn { padding:7px 16px; border-radius:100px; font-size:12px; font-family:var(--mono); font-weight:700; border:1px solid; cursor:pointer; transition:all 0.2s; }
  .map-mode-btn.view { background:transparent; border-color:rgba(168,0,64,0.25); color:var(--muted); }
  .map-mode-btn.place { background:rgba(249,112,102,0.18); border-color:var(--coral); color:var(--coral); }
  .map-mode-hint { font-size:11px; color:var(--amber); font-family:var(--mono); }

  /* Map container */
  #evive-map { flex:1; min-height:0; }

  /* Edit panel (drawer) */
  .map-edit-panel { position:absolute; bottom:0; right:0; width:320px; background:var(--deep); border-top:1px solid rgba(168,0,64,0.12); border-left:1px solid rgba(168,0,64,0.12); border-radius:12px 0 0 0; padding:20px; z-index:20; box-shadow:-8px -8px 32px rgba(0,0,0,0.4); transform:translateY(0); transition:transform 0.25s; }
  .map-edit-panel.hidden { transform:translateY(120%); }
  .map-edit-title { font-weight:700; font-size:14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; }
  .map-edit-close { background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer; line-height:1; }
  .map-field { margin-bottom:12px; }
  .map-label { font-size:10px; font-family:var(--mono); color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:5px; display:block; }
  .map-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(168,0,64,0.18); border-radius:8px; padding:9px 12px; color:var(--text); font-family:var(--mono); font-size:13px; outline:none; box-sizing:border-box; }
  .map-input:focus { border-color:var(--mint); }
  .map-save-btn { width:100%; padding:10px; border-radius:10px; background:linear-gradient(135deg,var(--jade),var(--emerald)); border:none; color:#fff; font-weight:700; font-size:13px; font-family:var(--sans); cursor:pointer; margin-top:4px; }
  .map-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* No-map fallback */
  .map-loading { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--muted); gap:12px; }

  @media (max-width:768px) {
    .map-side { width:220px; }
    .map-edit-panel { width:100%; border-radius:0; }
  }
`;

const MARKER_COLORS = {
  client:  "#004A99",
  hca:     "#059669",
  patient: "#d97706",
  partner: "#7c3aed",
};

const TYPE_LABELS = {
  client:  "Client",
  hca:     "HCA",
  patient: "Patient",
  partner: "Partner",
};

// Nairobi centre
const NAIROBI = { lat: -1.2921, lng: 36.8219 };

export default function AdminMap() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const mapContainerRef  = useRef(null);
  const mapInstanceRef   = useRef(null);
  const markersLayerRef  = useRef(null);
  const leafletRef       = useRef(null);

  const [mapReady,      setMapReady]      = useState(false);
  const [entities,      setEntities]      = useState([]);
  const [markers,       setMarkers]       = useState([]);
  const [filterType,    setFilterType]    = useState("all");
  const [selectedEntity,setSelectedEntity]= useState(null);
  const [placeMode,     setPlaceMode]     = useState(false);
  const [editPanel,     setEditPanel]     = useState(null); // { entity, lat, lng }
  const [editLat,       setEditLat]       = useState("");
  const [editLng,       setEditLng]       = useState("");
  const [editAddr,      setEditAddr]      = useState("");
  const [saveMsg,       setSaveMsg]       = useState("");

  // Auth guard
  useEffect(() => {
    try {
      const session = getAdminSession();
      if (!session?.id) { router.replace("/admin/login"); return; }
      setAuthed(true);
    } catch { router.replace("/admin/login"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshData = useCallback(async () => {
    const [m, e] = await Promise.all([getAllMapMarkers(), getAllMapEntities()]);
    setMarkers(m);
    setEntities(e);
  }, []);

  // Load Leaflet from CDN
  useEffect(() => {
    refreshData();

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      setMapReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapReady(true);
    script.onerror = () => console.error("Failed to load Leaflet");
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [refreshData]);

  // Build custom Leaflet icon
  function makeIcon(L, color, size = 14) {
    return L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2) - 4],
    });
  }

  // Draw markers on the map
  const drawMarkers = useCallback((L, map, markerData, filter) => {
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    } else {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const filtered = filter === "all" ? markerData : markerData.filter(m => m.type === filter);

    filtered.forEach(m => {
      const icon = makeIcon(L, m.color);
      const popup = `
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${m.label}</div>
          <div style="font-size:11px;color:#666;margin-bottom:4px">${m.sub || ""}</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;background:${m.color}22;color:${m.color};border:1px solid ${m.color}44">${TYPE_LABELS[m.type] || m.type}</span>
            <span style="font-size:10px;color:#999">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</span>
          </div>
          ${m.patients && m.patients.length > 0 ? `<div style="margin-top:6px;font-size:11px;color:#555">Patients: ${m.patients.join(", ")}</div>` : ""}
        </div>`;
      L.marker([m.lat, m.lng], { icon })
        .addTo(markersLayerRef.current)
        .bindPopup(popup);
    });
  }, []);

  // Initialise map once Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = window.L;
    leafletRef.current = L;

    const map = L.map(mapContainerRef.current, {
      center: [NAIROBI.lat, NAIROBI.lng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    drawMarkers(L, map, markers, filterType);

    // Click handler for place mode
    map.on("click", e => {
      if (!placeMode || !selectedEntity) return;
      const { lat, lng } = e.latlng;
      setEditLat(lat.toFixed(6));
      setEditLng(lng.toFixed(6));
      setEditPanel(prev => prev ? { ...prev, lat, lng } : null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]); // intentionally only runs once on mapReady — map init must not re-run

  // Redraw markers when filter or data changes (after map is ready)
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    drawMarkers(leafletRef.current, mapInstanceRef.current, markers, filterType);
  }, [markers, filterType, drawMarkers]);

  // Update map click handler when placeMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.off("click");
    map.on("click", e => {
      if (!placeMode || !selectedEntity) return;
      const { lat, lng } = e.latlng;
      setEditLat(lat.toFixed(6));
      setEditLng(lng.toFixed(6));
      setEditPanel(ep => ep ? { ...ep, lat, lng } : {
        entity: selectedEntity,
        lat, lng,
      });
    });
  }, [placeMode, selectedEntity]);

  function openEditPanel(entity) {
    setSelectedEntity(entity);
    setEditLat(entity.lat ? String(entity.lat) : "");
    setEditLng(entity.lng ? String(entity.lng) : "");
    setEditAddr(entity.sub || "");
    setEditPanel({ entity });
    setSaveMsg("");
  }

  async function saveLocation() {
    if (!editPanel?.entity || !editLat || !editLng) return;
    const entity = editPanel.entity;
    const lat = Number(editLat);
    const lng = Number(editLng);
    try {
      if (entity.type === "client" || entity.type === "patient") {
        const clientId = entity.type === "client" ? entity.id : entity.parentClientId;
        await updateClientCoords(clientId, lat, lng);
      } else if (entity.type === "hca") {
        await updateHcaCoords(entity.id, lat, lng);
      }
      setSaveMsg("✓ Location saved.");
      await refreshData();
      setPlaceMode(false);
      setTimeout(() => { setSaveMsg(""); setEditPanel(null); }, 1500);
    } catch (e) {
      setSaveMsg("⚠ " + e.message);
    }
  }

  function flyToEntity(entity) {
    const map = mapInstanceRef.current;
    if (!map || !entity.lat || !entity.lng) return;
    map.flyTo([entity.lat, entity.lng], 15, { animate: true, duration: 0.8 });
  }

  const filteredEntities = filterType === "all"
    ? entities
    : entities.filter(e => e.type === filterType);

  const pinnedCount = entities.filter(e => e.lat && e.lng).length;

  // Block render until auth check passes
  if (!authed) return null;

  return (
    <>
      <Head>
        <title>Map View — E-Vive Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + MAP_CSS}</style>

      <div className="map-wrap">
        {/* ── SIDEBAR ── */}
        <aside className="map-side">
          <div className="map-logo">
            <Link href="/" style={{ textDecoration: "none" }}>
              <div className="map-logo-text">e<span>-</span>vive</div>
            </Link>
            <div className="map-logo-sub">Map View</div>
          </div>

          {/* Legend */}
          <div className="map-legend">
            <div className="map-legend-title">Colour Legend</div>
            {Object.entries(MARKER_COLORS).map(([type, color]) => (
              <div key={type} className="map-legend-item">
                <div className="map-legend-dot" style={{ background: color }} />
                <span>{TYPE_LABELS[type]}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {pinnedCount}/{entities.length} entities pinned
            </div>
          </div>

          {/* Filters */}
          <div className="map-filters">
            {[["all", "All"], ["client", "Clients"], ["hca", "HCAs"], ["patient", "Patients"]].map(([k, l]) => (
              <button key={k} className={`map-chip${filterType === k ? " active" : ""}`} onClick={() => setFilterType(k)}>{l}</button>
            ))}
          </div>

          {/* Entity list */}
          <div className="map-entity-list">
            {filteredEntities.length === 0 && (
              <div style={{ padding: "20px 20px", color: "var(--muted)", fontSize: 12 }}>No entities for this filter.</div>
            )}
            {filteredEntities.map(e => (
              <div
                key={`${e.type}-${e.id}`}
                className={`map-entity-row${selectedEntity?.id === e.id ? " selected" : ""}`}
                onClick={() => {
                  openEditPanel(e);
                  flyToEntity(e);
                }}
              >
                <div className="map-entity-dot" style={{ background: e.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="map-entity-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</div>
                  <div className="map-entity-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.sub || TYPE_LABELS[e.type]}</div>
                </div>
                {e.lat && e.lng
                  ? <div className="map-entity-pin">📍</div>
                  : <div style={{ fontSize: 10, color: "var(--coral)", marginLeft: "auto" }}>Unset</div>
                }
              </div>
            ))}
          </div>

          {/* Back link + sign out */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(168,0,64,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/admin/dashboard" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Admin Dashboard</Link>
            <button onClick={() => { clearAdminSession(); router.push("/admin/login"); }} style={{ background: "rgba(249,112,102,0.1)", border: "1px solid rgba(249,112,102,0.2)", borderRadius: 8, padding: "6px 10px", color: "var(--coral)", fontSize: 11, fontFamily: "var(--mono)", fontWeight: 700, cursor: "pointer" }}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="map-main">
          {/* Topbar */}
          <div className="map-topbar">
            <div>
              <div className="map-title">E-Vive <span>Location Map</span></div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 2 }}>
                Super Admin · OpenStreetMap · {markers.length} markers active
              </div>
            </div>
            <button
              className={`map-mode-btn ${placeMode ? "place" : "view"}`}
              onClick={() => {
                setPlaceMode(p => !p);
                if (placeMode) setEditPanel(null);
              }}
            >
              {placeMode ? "🎯 Place Mode — Click map to set location" : "📍 Place / Edit Mode"}
            </button>
            {placeMode && selectedEntity && (
              <div className="map-mode-hint">Selected: {selectedEntity.label} · Click anywhere on the map to drop a pin</div>
            )}
            {placeMode && !selectedEntity && (
              <div className="map-mode-hint">Select an entity from the left panel first</div>
            )}
          </div>

          {/* Map */}
          {mapReady ? (
            <div id="evive-map" ref={mapContainerRef} style={{ flex: 1 }} />
          ) : (
            <div className="map-loading">
              <div style={{ fontSize: 40 }}>🗺️</div>
              <div style={{ fontSize: 14 }}>Loading OpenStreetMap…</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>Requires internet connection to load tiles</div>
            </div>
          )}

          {/* Edit panel drawer */}
          <div className={`map-edit-panel${editPanel ? "" : " hidden"}`}>
            {editPanel && (
              <>
                <div className="map-edit-title">
                  <div>
                    <div style={{ fontWeight: 700 }}>{editPanel.entity?.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", fontWeight: 400, marginTop: 2 }}>
                      {TYPE_LABELS[editPanel.entity?.type]} · Edit Location
                    </div>
                  </div>
                  <button className="map-edit-close" onClick={() => { setEditPanel(null); setSelectedEntity(null); setPlaceMode(false); }}>×</button>
                </div>

                <div className="map-field">
                  <label className="map-label">Address / Location</label>
                  <input className="map-input" value={editAddr} onChange={e => setEditAddr(e.target.value)} placeholder="e.g. Karen, Nairobi" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div className="map-field" style={{ margin: 0 }}>
                    <label className="map-label">Latitude</label>
                    <input className="map-input" type="number" step="any" value={editLat} onChange={e => setEditLat(e.target.value)} placeholder="-1.2921" />
                  </div>
                  <div className="map-field" style={{ margin: 0 }}>
                    <label className="map-label">Longitude</label>
                    <input className="map-input" type="number" step="any" value={editLng} onChange={e => setEditLng(e.target.value)} placeholder="36.8219" />
                  </div>
                </div>

                {placeMode && (
                  <div style={{ padding: "8px 12px", background: "rgba(249,112,102,0.08)", border: "1px solid rgba(249,112,102,0.2)", borderRadius: 8, fontSize: 11, color: "var(--amber)", marginBottom: 12, fontFamily: "var(--mono)" }}>
                    🎯 Place mode active — click anywhere on the map to set coordinates automatically
                  </div>
                )}

                {saveMsg && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10, color: saveMsg.startsWith("✓") ? "var(--mint)" : "var(--coral)", background: saveMsg.startsWith("✓") ? "rgba(0,74,153,0.08)" : "rgba(249,112,102,0.08)", border: saveMsg.startsWith("✓") ? "1px solid rgba(0,74,153,0.15)" : "1px solid rgba(249,112,102,0.25)" }}>
                    {saveMsg}
                  </div>
                )}

                <button className="map-save-btn" disabled={!editLat || !editLng} onClick={saveLocation}>
                  Save Location
                </button>

                {editPanel.entity?.lat && (
                  <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
                    Current: {Number(editPanel.entity.lat).toFixed(4)}, {Number(editPanel.entity.lng).toFixed(4)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

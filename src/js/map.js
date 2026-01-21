import { loadCentreSectors } from "./centres.js";
import { loadWards } from "./wards.js";
import { loadElectoralDistricts } from "./electoral_ridings.js";

const map = L.map("map", {
  renderer: L.svg(),
  zoomControl: false,
}).setView([45.394724, -75.474857], 11);

L.control.zoom({ position: "topleft" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Panes
map.createPane("sectorsPane");
map.getPane("sectorsPane").style.zIndex = 400;

map.createPane("wardsPane");
map.getPane("wardsPane").style.zIndex = 450;

map.createPane("districtsPane");
map.getPane("districtsPane").style.zIndex = 500;

map.whenReady(() => {
  const renderer = map.getRenderer(map);
  const svg = renderer._container;

  if (svg) {
    const defs = L.SVG.create("defs");
    const pattern = L.SVG.create("pattern");

    pattern.setAttribute("id", "diagonalHatch");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "8");
    pattern.setAttribute("height", "8");
    pattern.setAttribute("patternTransform", "rotate(45)");

    const line = L.SVG.create("line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "0");
    line.setAttribute("y2", "8");
    line.setAttribute("stroke", "#2e92cc");
    line.setAttribute("stroke-width", "1");

    pattern.appendChild(line);
    defs.appendChild(pattern);
    svg.appendChild(defs);
  }
});

let centreGeoJSON;
let wardsLayer;
let districtLayer;
let highlightedLayers = [];

(async () => {
  centreGeoJSON = await loadCentreSectors(map);
  wardsLayer = await loadWards(map, centreGeoJSON);
  districtLayer = await loadElectoralDistricts(map, centreGeoJSON);

  if (document.getElementById("toggle-wards")?.checked) {
    wardsLayer.addTo(map);
  }

  if (document.getElementById("toggle-districts")?.checked) {
    districtLayer.addTo(map);
  }

  document.getElementById("toggle-wards").addEventListener("change", (e) => {
    e.target.checked ? map.addLayer(wardsLayer) : map.removeLayer(wardsLayer);
  });

  document
    .getElementById("toggle-districts")
    .addEventListener("change", (e) => {
      e.target.checked
        ? map.addLayer(districtLayer)
        : map.removeLayer(districtLayer);
    });

  // Mobile panel toggle
  const panel = document.getElementById("ui-panel");
  panel
    .querySelector(".panel-header")
    .addEventListener("click", () => panel.classList.toggle("open"));
})();

// Interaction Handlers

// --- Interaction Handlers ---

function getFeaturesAtPoint(latlng) {
  if (!centreGeoJSON) return {};
  const point = turf.point([latlng.lng, latlng.lat]);

  let sector = null;
  let ward = null;
  let district = null;

  // 1. Check Sector (Base Layer)
  centreGeoJSON.features.forEach((f) => {
    if (turf.booleanPointInPolygon(point, f)) sector = f.properties;
  });

  // 2. Check Ward (Only if visible)
  if (wardsLayer && map.hasLayer(wardsLayer)) {
    wardsLayer.eachLayer((l) => {
      // Ensure layer has geometry (feature) before checking
      if (l.feature && turf.booleanPointInPolygon(point, l.feature)) {
        ward = { props: l.feature.properties, layer: l };
      }
    });
  }

  // 3. Check District (Only if visible)
  if (districtLayer && map.hasLayer(districtLayer)) {
    districtLayer.eachLayer((l) => {
      if (l.feature && turf.booleanPointInPolygon(point, l.feature)) {
        district = { props: l.feature.properties, layer: l };
      }
    });
  }

  return { sector, ward, district };
}

// CLICK: Show Popup
map.on("click", (e) => {
  const { sector, ward, district } = getFeaturesAtPoint(e.latlng);

  if (!sector && !ward && !district) return;

  let content = '<div class="custom-popup">';

  if (sector) {
    content += `
      <h4 style="border-bottom: 2px solid #8e44ad; padding-bottom: 4px; margin-bottom: 8px;">${sector.sector}</h4>
      <p><strong>Services:</strong> ${sector.services}</p>
    `;
  }

  if (ward) {
    content += `
      <div class="meta-info" style="margin-top:8px; border-top:1px solid #ccc; padding-top:4px;">
        <strong style="color:#34495e;">Ward ${ward.props.WARD || "?"}</strong>: ${ward.props.NAME || "Unknown"}
      </div>
    `;
  }

  if (district) {
    const props = district.props;
    const mpName = props.MP_Name || props.MP || "TBD";
    const mppName = props.MPP_Name || props.MPP || "TBD";

    content += `
      <div class="meta-info" style="margin-top:8px; border-top:1px solid #ccc; padding-top:4px;">
        <strong style="color:#2980b9;">Federal Riding</strong><br/>
        ${props.ENGLISH_NA || props.Name || "District"}<br/>
        <span style="font-size:0.9em; display:block; margin-top:4px;">
          <strong>MP:</strong> ${mpName}<br/>
          <strong>MPP:</strong> ${mppName}
        </span>
      </div>
    `;
  }

  content += "</div>";
  L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
});

// MOUSEMOVE: Robust Hover Effects
map.on("mousemove", (e) => {
  // A. RESET PREVIOUS HIGHLIGHTS
  // We loop through anything currently highlighted and restore it
  if (highlightedLayers.length > 0) {
    highlightedLayers.forEach((layer) => {
      // Reset to the style we saved in _originalStyle
      if (layer._originalStyle) {
        layer.setStyle(layer._originalStyle);
        delete layer._originalStyle; // Clear the saved style so we don't stale it
      }
    });
    highlightedLayers = []; // Empty the tracker
  }

  // B. FIND NEW TARGETS
  const { ward, district } = getFeaturesAtPoint(e.latlng);

  // C. APPLY NEW HIGHLIGHTS

  // Highlight Ward
  if (ward) {
    const layer = ward.layer;
    // Save current style before changing it (if not already saved)
    if (!layer._originalStyle) {
      // We accept either the current options or the function result
      layer._originalStyle = { ...layer.options };
    }

    layer.setStyle({ fillOpacity: 0.4, color: "#222", weight: 2 });
    highlightedLayers.push(layer);
  }

  // Highlight District
  if (district) {
    const layer = district.layer;
    if (!layer._originalStyle) {
      layer._originalStyle = { ...layer.options };
    }

    // Important: For hatched patterns, we ONLY change weight/color,
    // we must NOT touch fillOpacity or fillColor or the pattern disappears.
    layer.setStyle({ weight: 3, color: "#165a85" });
    highlightedLayers.push(layer);
  }
});

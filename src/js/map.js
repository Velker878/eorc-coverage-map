import { loadCentreSectors } from "./centres.js";
import { loadWards } from "./wards.js";
import { loadElectoralDistricts } from "./electoral_ridings.js";

const sectorColors = {
  "EORC (CSS)": "#c45f5f",
  EORC: "#9762c0",
};

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

map.createPane("districtsPane");
map.getPane("districtsPane").style.zIndex = 450;

map.createPane("wardsPane");
map.getPane("wardsPane").style.zIndex = 500;

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
    line.setAttribute("stroke", "#7a7a7a");
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

function getFeaturesAtPoint(latlng) {
  if (!centreGeoJSON) return {};
  const point = turf.point([latlng.lng, latlng.lat]);

  let sector = null;
  let ward = null;
  let district = null;

  centreGeoJSON.features.forEach((f) => {
    if (turf.booleanPointInPolygon(point, f)) sector = f.properties;
  });

  if (wardsLayer && map.hasLayer(wardsLayer)) {
    wardsLayer.eachLayer((l) => {
      if (l.feature && turf.booleanPointInPolygon(point, l.feature)) {
        ward = { props: l.feature.properties, layer: l };
      }
    });
  }

  if (districtLayer && map.hasLayer(districtLayer)) {
    districtLayer.eachLayer((l) => {
      if (l.feature && turf.booleanPointInPolygon(point, l.feature)) {
        district = { props: l.feature.properties, layer: l };
      }
    });
  }

  return { sector, ward, district };
}

// Click effects
map.on("click", (e) => {
  const { sector, ward, district } = getFeaturesAtPoint(e.latlng);

  if (!sector && !ward && !district) return;

  let content = '<div class="custom-popup">';

  if (sector) {
    const titleColor = sectorColors[sector.sector] || "#8e44ad"; // fallback

    content += `
      <h4 
        class="popup-title"
        style="border-bottom: 2px solid ${titleColor};"
      >
        ${sector.sector}
      </h4>
      <p><strong>Services offered:</strong> ${sector.services}</p>
    `;
  }

  if (ward) {
    const props = ward.props;
    const wardName = props.NAME || "Error fetching name";
    const councillorName = props.COUNCILLOR || "Error fetching name";

    content += `
      <div class="meta-info">
        <strong class="info-title">Ward:</strong><br/>
        ${wardName}
        <div class="district-people">
          <strong>Councillor:</strong> ${councillorName}<br/>
        </div>
      </div>
    `;
  }

  if (district) {
    const props = district.props;
    const mpName = props.MP || "Error fetching name";
    const mppName = props.MPP || "Error fetching name";

    content += `
      <div class="meta-info">
        <strong class="info-title">Electoral Riding:</strong><br/>
        ${props.ENGLISH_NA || props.Name || "District"}
        <div class="district-people">
          <strong>MP:</strong> ${mpName}<br/>
          <strong>MPP:</strong> ${mppName}
        </div>
      </div>
    `;
  }

  content += "</div>";

  L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
});

// Hover effects
map.on("mousemove", (e) => {
  if (highlightedLayers.length > 0) {
    highlightedLayers.forEach((layer) => {
      if (layer._originalStyle) {
        layer.setStyle(layer._originalStyle);
        delete layer._originalStyle;
      }
    });
    highlightedLayers = [];
  }

  const { ward, district } = getFeaturesAtPoint(e.latlng);

  // Highlight Ward
  if (ward) {
    const layer = ward.layer;
    if (!layer._originalStyle) {
      layer._originalStyle = { ...layer.options };
    }

    layer.setStyle({
      color: "#363636",
      weight: 1.3,
      fillColor: "url(#diagonalHatch)",
      fillOpacity: 1.0,
    });
    highlightedLayers.push(layer);
  }

  // Highlight District
  if (district) {
    const layer = district.layer;
    if (!layer._originalStyle) {
      layer._originalStyle = { ...layer.options };
    }

    layer.setStyle({
      color: "#2e539c",
      weight: 1.7,
      fillOpacity: 0.35,
      fillColor: "#d5ecfc",
    });
    highlightedLayers.push(layer);
  }
});

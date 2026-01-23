import { loadCentreSectors } from "./centres.js";
import { loadWards } from "./wards.js";
import { loadElectoralDistricts } from "./electoral_ridings.js";
import { loadNeighbourhoods } from "./neighbourhoods.js";

const sectorColors = {
  "EORC (CSS)": "#cc5a4d",
  EORC: "#965bb0",
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

map.createPane("neighbourhoodsPane");
map.getPane("neighbourhoodsPane").style.zIndex = 450;

map.createPane("wardsPane");
map.getPane("wardsPane").style.zIndex = 650;

map.whenReady(() => {
  const renderer = map.getRenderer(map);
  const svg = renderer._container;
  if (!svg) return;

  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = L.SVG.create("defs");
    svg.appendChild(defs);
  }

  // Diagonal hatch pattern
  if (!svg.querySelector("#diagonalHatch")) {
    const hatch = L.SVG.create("pattern");
    hatch.setAttribute("id", "diagonalHatch");
    hatch.setAttribute("patternUnits", "userSpaceOnUse");
    hatch.setAttribute("width", "8");
    hatch.setAttribute("height", "8");
    hatch.setAttribute("patternTransform", "rotate(45)");

    const line = L.SVG.create("line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "0");
    line.setAttribute("y2", "8");
    line.setAttribute("stroke", "#7a7a7a");
    line.setAttribute("stroke-width", "1");

    hatch.appendChild(line);
    defs.appendChild(hatch);
  }

  // Dot matrix pattern
  if (!svg.querySelector("#dotPattern")) {
    const dots = L.SVG.create("pattern");
    dots.setAttribute("id", "dotPattern");
    dots.setAttribute("patternUnits", "userSpaceOnUse");
    dots.setAttribute("width", "6");
    dots.setAttribute("height", "6");

    const dot = L.SVG.create("circle");
    dot.setAttribute("cx", "3");
    dot.setAttribute("cy", "3");
    dot.setAttribute("r", "0.8");
    dot.setAttribute("fill", "#cc0000");

    dots.appendChild(dot);
    defs.appendChild(dots);
  }
});

let centreGeoJSON;
let wardsLayer;
let districtLayer;
let neighbourhoodLayer;
let highlightedLayers = [];

(async () => {
  centreGeoJSON = await loadCentreSectors(map);
  wardsLayer = await loadWards(map, centreGeoJSON);
  districtLayer = await loadElectoralDistricts(centreGeoJSON);
  neighbourhoodLayer = await loadNeighbourhoods(centreGeoJSON);

  if (document.getElementById("toggle-wards")?.checked) {
    wardsLayer.addTo(map);
  }

  if (document.getElementById("toggle-districts")?.checked) {
    districtLayer.addTo(map);
  }

  if (document.getElementById("toggle-neighbourhoods")?.checked) {
    neighbourhoodLayer.addTo(map);
  }

  document.getElementById("toggle-wards").addEventListener("change", (e) => {
    clearHighlights();
    e.target.checked ? map.addLayer(wardsLayer) : map.removeLayer(wardsLayer);
  });

  document
    .getElementById("toggle-districts")
    .addEventListener("change", (e) => {
      clearHighlights();
      e.target.checked
        ? map.addLayer(districtLayer)
        : map.removeLayer(districtLayer);
    });

  document
    .getElementById("toggle-neighbourhoods")
    .addEventListener("change", (e) => {
      clearHighlights();
      e.target.checked
        ? map.addLayer(neighbourhoodLayer)
        : map.removeLayer(neighbourhoodLayer);
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
  let neighbourhood = null;

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

  if (neighbourhoodLayer && map.hasLayer(neighbourhoodLayer)) {
    neighbourhoodLayer.eachLayer((l) => {
      if (l.feature && turf.booleanPointInPolygon(point, l.feature)) {
        neighbourhood = { props: l.feature.properties, layer: l };
      }
    });
  }

  return { sector, ward, district, neighbourhood };
}

function clearHighlights() {
  highlightedLayers.forEach((layer) => {
    if (!layer._originalStyle) return;

    layer.setStyle(layer._originalStyle.options);

    if (layer._path) {
      layer._path.setAttribute("fill", layer._originalStyle.fill ?? "none");
      layer._path.setAttribute(
        "fill-opacity",
        layer._originalStyle.fillOpacity ?? 0,
      );
    }

    delete layer._originalStyle;
  });

  highlightedLayers = [];
}

// Click effects
map.on("click", (e) => {
  const { sector, ward, district, neighbourhood } = getFeaturesAtPoint(
    e.latlng,
  );

  if (!sector && !ward && !district && !neighbourhood) return;

  let content = '<div class="custom-popup">';

  if (sector) {
    const titleColor = sectorColors[sector.sector] || "#8e44ad";

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

  if (neighbourhood) {
    const props = neighbourhood.props;
    const neighbourhoodName =
      props.neighbourhoodFormatted || props.ONS_Name || "Error fetching name";

    content += `
      <div class="meta-info">
        <strong class="info-title">Neighbourhood:</strong><br/>
        ${neighbourhoodName}
      </div>
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
        ${props.ENGLISH_NA || "District"}
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
  highlightedLayers.forEach((layer) => {
    if (!layer._originalStyle) return;

    layer.setStyle(layer._originalStyle.options);

    if (layer._path && layer._originalStyle.fill) {
      layer._path.setAttribute("fill", layer._originalStyle.fill);
      layer._path.setAttribute(
        "fill-opacity",
        layer._originalStyle.fillOpacity ?? 1,
      );
    }

    delete layer._originalStyle;
  });
  highlightedLayers = [];

  const { ward, district, neighbourhood } = getFeaturesAtPoint(e.latlng);

  const highlight = (obj, fn) => {
    if (!obj) return;
    const layer = obj.layer;

    if (!layer._originalStyle) {
      layer._originalStyle = {
        options: { ...layer.options },
        fill: layer._path?.getAttribute("fill"),
        fillOpacity: layer._path?.getAttribute("fill-opacity"),
      };
    }

    fn(layer);
    highlightedLayers.push(layer);
  };

  highlight(ward, (layer) => {
    layer.setStyle({ color: "#363636", weight: 1.3, fillOpacity: 1 });
    layer._path.setAttribute("fill", "url(#diagonalHatch)");
  });

  highlight(district, (layer) => {
    layer.setStyle({
      color: "#2e539c",
      weight: 1.7,
      fillColor: "#d5ecfc",
      fillOpacity: 0.35,
    });
  });

  highlight(neighbourhood, (layer) => {
    layer.setStyle({
      color: "#cc00007a",
      weight: 1.4,
      fillOpacity: 0.5,
    });

    if (layer._path) {
      layer._path.setAttribute("fill", "url(#dotPattern)");
    }
  });
});

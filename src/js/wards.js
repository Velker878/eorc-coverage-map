import { loadCentreSectors } from "./centres.js";

export async function loadWards(map, centreRegionsGeoJSON) {
  const wardsResponse = await fetch("src/data/ottawa_wards.geojson");
  const wardsData = await wardsResponse.json();

  const clippedFeatures = [];

  wardsData.features.forEach((ward) => {
    centreRegionsGeoJSON.features.forEach((region) => {
      const intersection = turf.intersect(ward, region);

      if (intersection) {
        intersection.properties = {
          ...ward.properties,
          _sectorName: region.properties.sector,
          _sectorServices: region.properties.services,
        };
        clippedFeatures.push(intersection);
      }
    });
  });

  const clippedWards = {
    type: "FeatureCollection",
    features: clippedFeatures,
  };

  return L.geoJSON(clippedWards, {
    pane: "wardsPane",
    style: wardStyle,
    onEachFeature: wardInteractions,
  }).addTo(map);
}

function wardStyle() {
  return {
    color: "#5d5d5d",
    weight: 1,
    fillOpacity: 0.05,
    dashArray: "3",
  };
}

function wardInteractions(feature, layer) {
  const wardID = feature.properties.WARD;
  const wardName = feature.properties.NAME;
  const sectorName = feature.properties._sectorName;
  const services = feature.properties._sectorServices;

  const tooltipContent = `Ward ${wardID}: ${wardName}`;

  layer.bindTooltip(tooltipContent, { sticky: true });

  const popupContent = `
    <div>
      <h4>${sectorName ? sectorName.toUpperCase() : "SECTOR"}</h4>
      <p><strong>Services:</strong> ${services}</p>
      <div class="meta-info">
        Intersects with <strong>Ward ${wardID} (${wardName})</strong>
      </div>
    </div>
  `;

  layer.bindPopup(popupContent);

  layer.on("popupopen", () => {
    layer.unbindTooltip();
  });

  layer.on("popupclose", () => {
    layer.bindTooltip(tooltipContent, { sticky: true });
  });

  layer.on({
    mouseover: () => {
      layer.setStyle({ color: "#363636", weight: 2, fillOpacity: 0.3 });
      layer.bringToFront();
    },
    mouseout: () => {
      layer.setStyle({ color: "#5d5d5d", weight: 1, fillOpacity: 0.05 });
    },
  });
}

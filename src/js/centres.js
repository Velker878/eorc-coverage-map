export async function loadCentreSectors(map) {
  const response = await fetch("src/data/centre_sectors.geojson");
  const data = await response.json();

  const layer = L.geoJSON(data, {
    pane: "sectorsPane",
    style: centreStyle,
    onEachFeature: centreInteractions,
  }).addTo(map);

  return data;
}

function centreStyle(feature) {
  const colors = {
    "eorc - css": "#c45f5f",
    eorc: "#9762c0",
  };

  return {
    color: colors[feature.properties.sector] || "#cccccc",
    weight: 4,
    fillOpacity: 0.3,
  };
}

function centreInteractions(feature, layer) {
  const sectorName = feature.properties.sector;
  const services = feature.properties.services;

  const tooltipContent = `<strong>${sectorName}</strong>`;

  layer.bindTooltip(tooltipContent, { sticky: true });

  layer.on({
    mouseover: () => layer.setStyle({ fillOpacity: 0.35 }),
    mouseout: () => layer.setStyle({ fillOpacity: 0.3 }),
  });
}

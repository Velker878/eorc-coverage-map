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
    "eorc - css": "#db6e6e",
    eorc: "#ad72db",
  };

  return {
    color: colors[feature.properties.sector],
    weight: 4,
    fillOpacity: 0.5,
  };
}

function centreInteractions(feature, layer) {
  layer.bindTooltip(
    `<strong>${feature.properties.sector}</strong><br/>
     ${feature.properties.services}`,
    { sticky: true }
  );

  layer.on({
    mouseover: () => layer.setStyle({ fillOpacity: 0.65 }),
    mouseout: () => layer.setStyle({ fillOpacity: 0.45 }),
  });
}

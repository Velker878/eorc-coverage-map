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
          region_name: region.properties.region_name,
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
    fillOpacity: 0.1,
    dashArray: "3",
  };
}

function wardInteractions(feature, layer) {
  const wardLabel =
    feature.properties.WARD_NAME ||
    feature.properties.WARD ||
    feature.properties.ward;

  layer.bindTooltip(`Ward ${wardLabel}`, { sticky: true });

  layer.on({
    mouseover: () =>
      layer.setStyle({ color: "#363636", weight: 2, fillOpacity: 0.55 }),
    mouseout: () =>
      layer.setStyle({ color: "#5d5d5d", weight: 1, fillOpacity: 0.1 }),
  });
}

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
  }).addTo(map);
}

function wardStyle() {
  return {
    color: "#5d5d5d",
    weight: 1,
    fillColor: "#ffffff",
    fillOpacity: 0.1,
    dashArray: "3",
  };
}

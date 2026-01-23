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
    onEachFeature: (feature, layer) => {
      layer.on("add", () => {
        if (layer._path) {
          layer._path.setAttribute("fill", "none");
          layer._path.setAttribute("fill-opacity", "0");
        }
      });
    },
  });
}

function wardStyle() {
  return {
    color: "#7a7a7a",
    weight: 1,
    fillOpacity: 0,
    dashArray: "6",
  };
}

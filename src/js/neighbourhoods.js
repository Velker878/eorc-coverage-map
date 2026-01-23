export async function loadNeighbourhoods(centreRegionsGeoJSON) {
  const response = await fetch("src/data/neighbourhoods.geojson");
  const rawData = await response.json();

  const clippedFeatures = [];

  rawData.features.forEach((neighbourhood) => {
    const neighbourhoodPolys =
      neighbourhood.geometry.type === "MultiPolygon"
        ? turf.flatten(neighbourhood).features
        : [neighbourhood];

    neighbourhoodPolys.forEach((neighbourhoodPoly) => {
      centreRegionsGeoJSON.features.forEach((sector) => {
        const intersection = turf.intersect(neighbourhoodPoly, sector);

        if (intersection && turf.area(intersection) > 0) {
          intersection.properties = {
            ...neighbourhood.properties,
            neighbourhoodFormatted: toTitleCase(
              neighbourhood.properties.ONS_Name,
            ),
            _sectorName: sector.properties.sector,
          };

          clippedFeatures.push(intersection);
        }
      });
    });
  });

  const clippedCollection = {
    type: "FeatureCollection",
    features: clippedFeatures,
  };

  return L.geoJSON(clippedCollection, {
    pane: "neighbourhoodsPane",
    style: neighbourhoodStyle,
    onEachFeature: (feature, layer) => {
      layer.on("add", () => {
        if (layer._path) {
          layer._path.setAttribute("fill", "url(#dotPattern)");
          layer._path.setAttribute("fill-opacity", "0");
        }
      });
    },
  });
}

function neighbourhoodStyle() {
  return {
    color: "#cc000027",
    weight: 1,
    fillOpacity: 0,
  };
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// src/js/electoral_ridings.js

function districtStyle() {
  return {
    color: "#2e92cc",
    weight: 1.5,
    fill: true,
    fillColor: "url(#diagonalHatch)",
    fillOpacity: 1.0,
  };
}

export async function loadElectoralDistricts(map, centreRegionsGeoJSON) {
  const response = await fetch("src/data/electoral_district.geojson");
  const rawData = await response.json();

  const clippedFeatures = [];

  rawData.features.forEach((district) => {
    const districtPolys =
      district.geometry.type === "MultiPolygon"
        ? turf.flatten(district).features
        : [district];

    districtPolys.forEach((districtPoly) => {
      centreRegionsGeoJSON.features.forEach((sector) => {
        const intersection = turf.intersect(districtPoly, sector);

        if (intersection && turf.area(intersection) > 0) {
          intersection.properties = {
            ...district.properties,
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
    pane: "districtsPane",
    style: districtStyle,
  });
}

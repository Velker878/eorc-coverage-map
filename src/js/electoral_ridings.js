// src/js/electoral_ridings.js

function districtStyle() {
  return {
    color: "#667ab3",
    weight: 1.4,
    fillColor: "#afbad9",
    fillOpacity: 0,
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

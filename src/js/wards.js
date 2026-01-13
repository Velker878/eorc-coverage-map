// src/js/wards.js

export async function loadWards(map) {
  const response = await fetch("src/data/ottawa_wards.geojson");
  const wardsData = await response.json();

  const wardsLayer = L.geoJSON(wardsData, {
    style: {
      color: "#2E86AB",
      weight: 1,
      fillOpacity: 0.35,
    },
    onEachFeature: (feature, layer) => {
      const wardName =
        feature.properties.WARD || feature.properties.ward || "Ward";

      layer.bindTooltip(`<strong>${wardName}</strong>`, { sticky: true });

      layer.on({
        mouseover: () => {
          layer.setStyle({
            weight: 3,
            fillOpacity: 0.6,
          });
        },
        mouseout: () => {
          layer.setStyle({
            weight: 1,
            fillOpacity: 0.35,
          });
        },
      });
    },
  });

  wardsLayer.addTo(map);
}

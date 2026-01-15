import { loadCentreSectors } from "./centres.js";
import { loadWards } from "./wards.js";

const map = L.map("map").setView([45.394724, -75.474857], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

map.createPane("sectorsPane");
map.getPane("sectorsPane").style.zIndex = 400;

map.createPane("wardsPane");
map.getPane("wardsPane").style.zIndex = 500;
let wardsLayer;

(async () => {
  const centreGeoJSON = await loadCentreSectors(map);
  wardsLayer = await loadWards(map, centreGeoJSON);

  const toggle = document.getElementById("toggle-wards");

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      if (wardsLayer) map.addLayer(wardsLayer);
    } else {
      if (wardsLayer) map.removeLayer(wardsLayer);
      map.closePopup();
    }
  });

  const panel = document.getElementById("ui-panel");
  const header = panel.querySelector(".panel-header");

  header.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
})();

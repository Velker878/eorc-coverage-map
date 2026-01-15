import { loadCentreSectors } from "./centres.js";
import { loadWards } from "./wards.js";

const map = L.map("map").setView([45.4215, -75.6972], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

(async () => {
  const centreGeoJSON = await loadCentreSectors(map);
  await loadWards(map, centreGeoJSON);
})();

map.createPane("sectorsPane");
map.getPane("sectorsPane").style.zIndex = 400;

map.createPane("wardsPane");
map.getPane("wardsPane").style.zIndex = 500;

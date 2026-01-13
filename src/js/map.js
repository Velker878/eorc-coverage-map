// src/js/map.js

// Initialize map centered on Ottawa
const map = L.map("map").setView([45.4215, -75.6972], 11);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Temporary test marker (sanity check)
L.marker([45.4215, -75.6972])
  .addTo(map)
  .bindPopup("Ottawa City Centre")
  .openPopup();

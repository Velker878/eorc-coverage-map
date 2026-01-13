// src/js/map.js
import { loadWards } from "./wards.js";

const map = L.map("map").setView([45.4215, -75.6972], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Load Ottawa wards
loadWards(map);

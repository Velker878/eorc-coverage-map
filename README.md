# Eastern Ottawa Resource Centre Coverage Map

An interactive geospatial data visualization built with **Leaflet.js** and **Turf.js** to help Community Health and Resource Centres understand and communicate the areas they serve across Ottawa.

This project visualizes service sectors and their intersections with municipal wards, allowing users to explore coverage areas, available services, and jurisdictional overlap through a clean, intuitive UI.

---

## Features

#### Interactive GeoJSON Mapping
- Visualizes real geographic boundaries of service sectors and Ottawa wards
- Custom styling with transparency to clearly distinguish overlapping regions

#### Dynamic Spatial Intersections
- Uses **Turf.js** to compute intersections between wards and service sectors at runtime
- Ensures ward data is shown only where it overlaps with the centre’s coverage areas

#### Context-Aware Information Panel
- Clicking a region displays a clean info panel instead of default Leaflet popups
- Information adapts based on visible layers:
  - Sector name and services when wards are hidden
  - Sector name, services, and intersecting Ward ID when wards are visible

### Layer Toggling
- Toggle the ward overlay on and off to simplify or enrich the map view
- Ensures a clutter-free experience when ward data is not needed

#### Responsive Bottom Sheet UI
- Mobile-first layout with a collapsible bottom panel on smaller screens
- Legend, controls, and information remain accessible without obstructing the map

---

## Tech Stack

- **Leaflet.js** – Interactive web mapping
- **Turf.js** – Spatial analysis and geometry intersections
- **GeoJSON** – Geographic data format
- **HTML / CSS / JavaScript**
- **OpenStreetMap** – Base map tiles

---
## Running the Project Locally

Because this project uses ES modules and local GeoJSON files, it must be run through a local server.

#### VS Code Live Server
1. Open the project in VS Code
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

## License

This project is licensed under the [MIT License](LICENSE).


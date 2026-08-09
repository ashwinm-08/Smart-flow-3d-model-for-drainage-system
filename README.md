# 🌧️ SmartFlow: AI-Powered Predictive Urban Drainage & Flood Prevention System

> **"Predict Early. Act Automatically. Protect the City."**

An interactive 3D working prototype built for open innovation, engineering exhibitions, and smart-city hackathons. SmartFlow demonstrates how passive conventional urban drainage grids can be transformed into intelligent, self-monitoring, and preventive infrastructure.

* **Live Production Site**: [https://smartflow-3d-model.vercel.app](https://smartflow-3d-model.vercel.app)
* **GitHub Repository**: [https://github.com/ashwinm-08/Smart-flow-3d-model-for-drainage-system](https://github.com/ashwinm-08/Smart-flow-3d-model-for-drainage-system)

---

## 💡 The Innovation Formula
$$\text{Monitor} \longrightarrow \text{Predict} \longrightarrow \text{Prevent} \longrightarrow \text{Divert} \longrightarrow \text{Reuse}$$

Conventional urban drainage systems are passive—they allow water to flow until a blockage or severe rain causes a backup. By the time authorities identify the problem, street flooding is already active. **SmartFlow** shifts the paradigm from *responsive cleaning* to *predictive prevention*.

---

## 💎 Features of the 3D Working Prototype

### 1. Multi-Layer Visual Environment (WebGL)
* **Layer 1 (Surface City)**: Features roads, sidewalks, buildings, trees, street lights, animated traffic, and a custom rain particle system.
* **Layer 2 (Drainage Inlet)**: A curbside slotted smart grate, motorized rotating cylindrical grid filter, and a transparent trash collection bin.
* **Layer 3 (Underground)**: Translucent pipes showing animated water flow particles, S1/S2/S3 sensor collars, an automated Solenoid gate valve, and a 10,000L transparent storage tank.
* **Underground Cutaway**: Press the *View Cutaway* button to animate surface buildings to be semi-transparent, exposing the underground networks.

### 2. Dual-Theme Support (Day & Night Mode)
* Click the **Light/Dark Mode** button in the header to transition the environment seamlessly.
* Switches lights from dark night sky colors and neon streetlights to a bright slate-grey daylight sun.
* Overlays transition instantly using CSS body-variable mapping.
* Holographic billboards adjust canvas backing opacity and text colors for high readability.

### 3. Procedural 3D Holographic Sprite Billboards
* Hovering text cards float above key physical assets in 3D space, automatically rotating to face the camera (Billboarding).
* Refreshes text parameters (flow rates, fill volumes, valve percentages) and border colors (Green $\to$ Yellow $\to$ Orange $\to$ Red) dynamically based on warning indices.

### 4. Interactive Telemetry Raycasting
* Clicking on any physical element (grate, filter, valve, storage tank, flow sensors) highlights the mesh with a GSAP scale pulse and opens a side drawer displaying name, purpose, live reading, and active state.

### 5. Automated 12-Step Guided Presentation Mode
Press **Start Presentation Mode** to play an automated tour. The camera will transition smoothly between presets while triggering simulation steps:
1. **Sunny Day** (Normal city operation)
2. **Rain Commences** (Shower triggers street lights)
3. **Storm Intensifies** (Rainfall rates increase)
4. **Debris Infiltration** (Litter washes down the grate)
5. **Rotating filter sweeps grate** (Trash separated to chamber)
6. **Downstream Blockage starts** (Conduit pipe clogged)
7. **Water Level backs up** (Upstream inlet backs up)
8. **AI Engine detects Critical Risk** (Dashboard indicators blink red)
9. **AI core sweeps waste** (Auto filter spins to clear leaves/plastics)
10. **Motorized Diversion Valve opens** (Vertical slide gate raises)
11. **Surplus routed to storage** (Emergency tank buffers overflow)
12. **Sustainability Water Reuse** (Stored storm runoff treated and reused for public garden irrigation)

---

## 🛠️ Technology Stack & Architecture

```text
workspace/
├── index.html          # GUI overlays, dashboards, and Canvas target
├── style.css           # Styling variables, glassmorphic HUD, and LEDs
├── main.js             # Bootstrap entry point, events, and Raycaster click listener
└── src/
    ├── scene.js        # ThreeJS scene, Perspective camera, and lighting
    ├── city.js         # Roads, traffic, buildings, and rain particle generator
    ├── drainage.js     # Curbside grate, filters, pipes, valves, and 3D Sprites
    ├── simulation.js   # Physics equations, clog parameters, and auto prevention
    ├── dashboard.js    # Data binding stats, alerts log, and details drawer
    └── presentation.js # Guided tour timeline sequencer
```

* **Core Engine**: Three.js (WebGL rendering, raycasting, billboards)
* **Animations**: GSAP (GreenSock) for smooth camera transitions and material color morphs
* **Layout / GUI**: HTML5 / CSS3 variables (Day/Night Theme, Glassmorphism backdrop-filters)
* **Build System**: Vite

---

## 🚀 Running Locally

Follow these steps to run the interactive prototype on your computer:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ashwinm-08/Smart-flow-3d-model-for-drainage-system.git
cd Smart-flow-3d-model-for-drainage-system
npm install
```

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
Open the local address printed in the terminal (usually `http://localhost:5173`) in your web browser.

### 4. Build for Production
Create a minified production bundle in the `dist` directory:
```bash
npm run build
```

import * as THREE from 'three';
import { SceneManager } from './src/scene.js';
import { CityManager } from './src/city.js';
import { DrainageManager } from './src/drainage.js';
import { SimulationEngine } from './src/simulation.js';
import { DashboardManager } from './src/dashboard.js';
import { PresentationManager } from './src/presentation.js';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Subsystems
    const sceneManager = new SceneManager('canvas-container');
    const cityManager = new CityManager(sceneManager.scene);
    const drainageManager = new DrainageManager(sceneManager.scene);
    const dashboardManager = new DashboardManager();
    const simulationEngine = new SimulationEngine(cityManager, drainageManager, dashboardManager);
    const presentationManager = new PresentationManager(sceneManager, cityManager, drainageManager, simulationEngine, dashboardManager);

    // 2. Register Subsystems to the Render Loop
    sceneManager.registerTick((deltaTime) => {
        cityManager.update(deltaTime);
    });

    sceneManager.registerTick((deltaTime, elapsedTime) => {
        drainageManager.update(deltaTime, elapsedTime);
    });

    sceneManager.registerTick((deltaTime) => {
        // Inject current clicked component's live userdata if the drawer is active
        if (dashboardManager.activeComponentId) {
            const activeComp = drainageManager.components[dashboardManager.activeComponentId];
            if (activeComp) {
                simulationEngine.activeComponentDetails = {
                    status: activeComp.userData.status,
                    reading: activeComp.userData.reading,
                    action: activeComp.userData.action
                };
            }
        }
        
        simulationEngine.update(deltaTime);
    });

    // 3. UI Controls Event Listeners
    
    // Rainfall intensity buttons
    const rainButtons = document.querySelectorAll('.rain-grid .btn');
    rainButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from others
            rainButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const intensity = btn.getAttribute('data-intensity');
            simulationEngine.setRain(intensity);
        });
    });

    // Scenario Selection buttons
    const scenarioButtons = document.querySelectorAll('.btn-scenario');
    scenarioButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            scenarioButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const scenarioId = idx + 1;
            simulationEngine.triggerScenario(scenarioId);

            // Sync rain buttons
            rainButtons.forEach(b => b.classList.remove('active'));
            const currentIntensity = simulationEngine.rainIntensity;
            const targetRainBtn = document.querySelector(`.rain-grid .btn[data-intensity="${currentIntensity}"]`);
            if (targetRainBtn) targetRainBtn.classList.add('active');

            // Sync auto mode button
            const autoBtn = document.getElementById('action-toggle-auto');
            if (autoBtn) {
                if (simulationEngine.isAutoMode) {
                    autoBtn.textContent = "🤖 Auto-Prevention: ON";
                    autoBtn.className = "btn-action toggle-active";
                } else {
                    autoBtn.textContent = "🤖 Auto-Prevention: OFF";
                    autoBtn.className = "btn-action toggle-inactive";
                }
            }
        });
    });

    // Manual Intervention Action buttons
    document.getElementById('action-add-garbage').addEventListener('click', () => {
        simulationEngine.addGarbage();
    });

    document.getElementById('action-trigger-blockage').addEventListener('click', () => {
        simulationEngine.triggerBlockage();
    });

    const autoBtn = document.getElementById('action-toggle-auto');
    autoBtn.addEventListener('click', () => {
        const isAuto = simulationEngine.toggleAutoMode();
        if (isAuto) {
            autoBtn.textContent = "🤖 Auto-Prevention: ON";
            autoBtn.className = "btn-action toggle-active";
        } else {
            autoBtn.textContent = "🤖 Auto-Prevention: OFF";
            autoBtn.className = "btn-action toggle-inactive";
        }
    });

    let cutawayActive = false;
    const cutawayBtn = document.getElementById('action-toggle-cutaway');
    cutawayBtn.addEventListener('click', () => {
        cutawayActive = !cutawayActive;
        cityManager.setCutaway(cutawayActive);
        cutawayBtn.classList.toggle('active', cutawayActive);
        dashboardManager.log(`Cutaway underground view toggled: ${cutawayActive ? 'VISIBLE' : 'HIDDEN'}`);
    });

    // General Control Buttons
    document.getElementById('btn-reset').addEventListener('click', () => {
        simulationEngine.reset();
        
        // Reset button states
        rainButtons.forEach(b => b.classList.remove('active'));
        document.getElementById('rain-none').classList.add('active');
        
        scenarioButtons.forEach(b => b.classList.remove('active'));
        document.getElementById('scenario-1').classList.add('active');
        
        autoBtn.textContent = "🤖 Auto-Prevention: ON";
        autoBtn.className = "btn-action toggle-active";
        
        cutawayActive = false;
        cityManager.setCutaway(false);
        cutawayBtn.classList.remove('active');
        
        dashboardManager.hideComponentDrawer();
    });

    // Theme Switcher Toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    themeToggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light-theme');
        if (isLight) {
            document.body.classList.remove('light-theme');
            themeToggleBtn.textContent = "☀️ Light Mode";
            sceneManager.setTheme('dark');
            cityManager.setTheme('dark');
            drainageManager.setTheme('dark');
            dashboardManager.log("Theme switched to: DARK MODE");
        } else {
            document.body.classList.add('light-theme');
            themeToggleBtn.textContent = "🌙 Dark Mode";
            sceneManager.setTheme('light');
            cityManager.setTheme('light');
            drainageManager.setTheme('light');
            dashboardManager.log("Theme switched to: LIGHT MODE");
        }
    });

    // 4. Camera presets configuration
    const cameraPresets = {
        'cam-city': { pos: new THREE.Vector3(25, 20, 25), look: new THREE.Vector3(0, 0, 0) },
        'cam-road': { pos: new THREE.Vector3(3.5, 4, 10), look: new THREE.Vector3(3.5, 0.2, 5.0) },
        'cam-underground': { pos: new THREE.Vector3(0, -3.5, 12), look: new THREE.Vector3(0, -3.5, 3.5) },
        'cam-technical': { pos: new THREE.Vector3(12, -4, 11), look: new THREE.Vector3(-5, -4, 2) },
        'cam-dashboard': { pos: new THREE.Vector3(15, 12, 18), look: new THREE.Vector3(0, -2, 0) }
    };

    const camButtons = document.querySelectorAll('.btn-cam');
    camButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            camButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const id = btn.id;
            const preset = cameraPresets[id];
            
            // Automatically turn on cutaway for underground/technical views
            if (id === 'cam-underground' || id === 'cam-technical') {
                cutawayActive = true;
                cityManager.setCutaway(true);
                cutawayBtn.classList.add('active');
            } else if (id === 'cam-city' || id === 'cam-road') {
                cutawayActive = false;
                cityManager.setCutaway(false);
                cutawayBtn.classList.remove('active');
            }

            sceneManager.animateCamera(preset.pos, preset.look, 1.8);
            dashboardManager.log(`Camera view changed: ${btn.textContent}`);
        });
    });

    // 5. Raycaster click handlers on 3D components
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const canvas = sceneManager.renderer.domElement;
    canvas.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        
        // Intersect only with components listed in the dictionary
        const interactiveObjects = Object.values(drainageManager.components);
        const intersects = raycaster.intersectObjects(interactiveObjects, true);

        if (intersects.length > 0) {
            // Find parent object with component details
            let rootObj = intersects[0].object;
            while (rootObj && !rootObj.userData.isInteractive) {
                rootObj = rootObj.parent;
            }

            if (rootObj && rootObj.userData.isInteractive) {
                dashboardManager.showComponentDrawer(rootObj.userData);
                pulseHighlight(rootObj);
                dashboardManager.log(`Sensor Probe connected: ${rootObj.userData.name}`);
            }
        } else {
            // Clicked in empty space on the canvas
            dashboardManager.hideComponentDrawer();
        }
    });

    // Helper to pulse highlight clicked meshes
    function pulseHighlight(mesh) {
        if (!mesh) return;
        
        const originalScale = mesh.scale.clone();
        const pulseScale = originalScale.clone().multiplyScalar(1.2);
        
        gsap.to(mesh.scale, {
            x: pulseScale.x,
            y: pulseScale.y,
            z: pulseScale.z,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut'
        });

        // If it has material color, flash it briefly
        if (mesh.material && mesh.material.color) {
            const originalColor = mesh.material.color.getHex();
            gsap.to(mesh.material.color, {
                r: 1, g: 1, b: 1, // flash white
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    mesh.material.color.setHex(originalColor);
                }
            });
        }
    }

    // 6. Boot scene loop
    sceneManager.start();
    dashboardManager.log("System initialization complete. Monitoring online.");
});

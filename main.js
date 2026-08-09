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

    // --- Welcome Splash Landing Page Controller (Automated Diagnostic Bootloader) ---
    const welcomeCard = document.getElementById('welcome-card');
    const progressBar = document.getElementById('backend-progress-bar');
    const exploreBtn = document.getElementById('btn-explore-drainage');
    const splash = document.getElementById('welcome-splash');
    const hudOverlay = document.getElementById('ui-overlay');

    // Ensure the Earth globe is immediately visible on launch
    if (sceneManager.globeGroup) {
        sceneManager.globeGroup.visible = true;
        sceneManager.setGroupOpacity(sceneManager.globeGroup, 1.0);
    }

    // Auto-running loading sequence on start
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progressBar) progressBar.style.width = `${progress}%`;
        
        if (progress === 16) {
            const line = document.getElementById('backend-line-1');
            if (line) line.style.opacity = 1;
        }
        if (progress === 44) {
            const line = document.getElementById('backend-line-2');
            if (line) line.style.opacity = 1;
        }
        if (progress === 68) {
            const line = document.getElementById('backend-line-3');
            if (line) line.style.opacity = 1;
        }
        if (progress === 92) {
            const line = document.getElementById('backend-line-4');
            if (line) line.style.opacity = 1;
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Fade out the diagnostics card
            if (welcomeCard) {
                gsap.to(welcomeCard, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        welcomeCard.style.display = 'none';
                    }
                });
            }
            
            // Fade in the unique black-and-white water droplet Explore button
            if (exploreBtn) {
                exploreBtn.style.display = 'block';
                gsap.to(exploreBtn, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.65,
                    ease: 'back.out(1.7)',
                    onComplete: () => {
                        exploreBtn.style.pointerEvents = 'auto';
                    }
                });
            }
        }
    }, 30);

    if (exploreBtn) {
        // Hover scaling on droplet
        exploreBtn.addEventListener('mouseenter', () => {
            gsap.to(exploreBtn, { scale: 1.06, duration: 0.2 });
        });
        exploreBtn.addEventListener('mouseleave', () => {
            gsap.to(exploreBtn, { scale: 1.0, duration: 0.2 });
        });
        
        exploreBtn.addEventListener('click', () => {
            gsap.to(exploreBtn, { scale: 0.94, duration: 0.1 });
            
            // 1. Cinematic Camera Fly-In from current distance to local coordinates (25, 20, 25)
            sceneManager.animateCamera(new THREE.Vector3(25, 20, 25), new THREE.Vector3(0, 0, 0), 2.2);

            // 2. Fade out the 3D Universe galaxy and transition to Earth Globe
            if (sceneManager.universeGroup) {
                gsap.to(sceneManager.universeGroup.position, {
                    z: -40, // push it backwards to simulate forward camera travel through space
                    duration: 1.8,
                    ease: 'power2.inOut'
                });
                sceneManager.universeGroup.traverse(child => {
                    if (child.material) {
                        gsap.to(child.material, {
                            opacity: 0,
                            duration: 1.4,
                            ease: 'power2.out'
                        });
                    }
                });
                setTimeout(() => {
                    sceneManager.isWelcomeActive = false; // engage normal camera-distance fading
                    sceneManager.universeGroup.visible = false;
                }, 1400);
            } else {
                sceneManager.isWelcomeActive = false;
            }

            // 3. Fade out splash landing html overlay
            if (splash) {
                splash.style.opacity = 0;
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 800);
            }

            // 4. Fade in HUD telemetry elements
            if (hudOverlay) {
                hudOverlay.style.opacity = 1;
                hudOverlay.style.pointerEvents = 'auto';
            }

            // Automatically enable cutaway to reveal the pipes under the road
            cutawayActive = true;
            cityManager.setCutaway(true);
            if (cutawayBtn) cutawayBtn.classList.add('active');
            
            dashboardManager.log("Global grid synchronizing. Monitoring online.");
        });
    }

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

    // Unified City System Selection Helper
    function selectCitySystem(cityId) {
        simulationEngine.setCitySystem(cityId);
        drainageManager.setCitySystem(cityId);
        dashboardManager.setCitySystem(cityId);
        
        // Sync active class on UI buttons
        const targetBtn = document.getElementById(`city-${cityId}`);
        if (targetBtn) {
            scenarioButtons.forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }
    }

    // City Selection buttons
    const scenarioButtons = document.querySelectorAll('.btn-scenario');
    scenarioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cityId = btn.id.replace('city-', '');
            selectCitySystem(cityId);
            
            // Automatically zoom camera into the local city block
            sceneManager.animateCamera(cameraPresets['cam-city'].pos, cameraPresets['cam-city'].look, 1.8);
            
            // Automatically enable cutaway to reveal the pipes under the road
            cutawayActive = true;
            cityManager.setCutaway(true);
            if (cutawayBtn) cutawayBtn.classList.add('active');
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
        selectCitySystem('tokyo');
        
        // Reset button states
        rainButtons.forEach(b => b.classList.remove('active'));
        document.getElementById('rain-none').classList.add('active');
        
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
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        
        // 1. Raycast click detection on digital Earth globe nodes
        if (sceneManager.globeGroup && sceneManager.globeGroup.visible) {
            const globeNodes = [];
            sceneManager.globeGroup.traverse(child => {
                if (child.isMesh && child.userData.isGlobalNode) {
                    globeNodes.push(child);
                }
            });
            const intersects = raycaster.intersectObjects(globeNodes, true);
            if (intersects.length > 0) {
                const node = intersects[0].object;
                const cityId = node.userData.cityName;
                
                selectCitySystem(cityId);
                sceneManager.animateCamera(cameraPresets['cam-city'].pos, cameraPresets['cam-city'].look, 2.0);
                
                // Automatically enable cutaway to reveal the pipes under the road
                cutawayActive = true;
                cityManager.setCutaway(true);
                if (cutawayBtn) cutawayBtn.classList.add('active');
                
                dashboardManager.log(`Global node clicked: zooming into ${node.userData.name}`);
                return;
            }
        }
        
        // 2. Raycast click detection on local drainage components
        const interactiveObjects = Object.values(drainageManager.components);
        const intersects = raycaster.intersectObjects(interactiveObjects, true);

        if (intersects.length > 0) {
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
    selectCitySystem('tokyo');
    sceneManager.start();

    // Event forwarding for unrestricted scroll-zoom and drag-rotation on welcome landing screen
    const welcomeSplash = document.getElementById('welcome-splash');
    const threeCanvas = document.querySelector('canvas');
    if (welcomeSplash && threeCanvas) {
        // Forward click drags and touch movements
        const forwardEvent = (e) => {
            if (e.target === welcomeSplash) {
                const clonedEvent = new e.constructor(e.type, e);
                threeCanvas.dispatchEvent(clonedEvent);
            }
        };

        ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'].forEach(evt => {
            welcomeSplash.addEventListener(evt, forwardEvent, { passive: true });
        });

        // Forward mouse wheel scrolls (critical for zoom approach)
        welcomeSplash.addEventListener('wheel', (e) => {
            if (e.target === welcomeSplash) {
                threeCanvas.dispatchEvent(new WheelEvent('wheel', {
                    deltaX: e.deltaX,
                    deltaY: e.deltaY,
                    deltaZ: e.deltaZ,
                    deltaMode: e.deltaMode,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    bubbles: true,
                    cancelable: true
                }));
            }
        }, { passive: true });
    }

    dashboardManager.log("System initialization complete. Monitoring online.");
});

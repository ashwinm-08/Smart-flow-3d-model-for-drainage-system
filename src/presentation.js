import * as THREE from 'three';

export class PresentationManager {
    constructor(sceneManager, cityManager, drainageManager, simulationEngine, dashboardManager) {
        this.sm = sceneManager;
        this.city = cityManager;
        this.drainage = drainageManager;
        this.sim = simulationEngine;
        this.dashboard = dashboardManager;

        this.currentStep = 1;
        this.totalSteps = 12;

        this.overlay = document.getElementById('presentation-overlay');
        this.stepBadge = document.getElementById('pres-step');
        this.stepTitle = document.getElementById('pres-title');
        this.stepDesc = document.getElementById('pres-description');

        this.btnPrev = document.getElementById('btn-pres-prev');
        this.btnNext = document.getElementById('btn-pres-next');
        this.btnExit = document.getElementById('btn-exit-presentation');
        this.btnStart = document.getElementById('btn-start-presentation');

        this.steps = this.defineSteps();
        this.initEvents();
    }

    initEvents() {
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => this.start());
        }
        if (this.btnExit) {
            this.btnExit.addEventListener('click', () => this.stop());
        }
        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', () => this.prevStep());
        }
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => this.nextStep());
        }
    }

    defineSteps() {
        return {
            1: {
                title: "Miniature Smart City: Normal State",
                description: "Welcome to SmartFlow. Under sunny skies, the smart city operates under normal conditions. Street lights are off, vehicles flow along the asphalt grid, and the underground drainage system stands ready.",
                cameraPos: new THREE.Vector3(25, 20, 25),
                cameraLookAt: new THREE.Vector3(0, 0, 0),
                cutaway: false,
                action: () => {
                    this.sim.reset();
                    this.sim.isAutoMode = true;
                }
            },
            2: {
                title: "Storm Threat: Rainfall Commences",
                description: "Light rain begins falling over the city. Runoff streams down the streets and starts entering the smart curb grate. Our virtual sensors register the flow, and street lights activate automatically.",
                cameraPos: new THREE.Vector3(3.5, 4, 10),
                cameraLookAt: new THREE.Vector3(3.5, 0.2, 5.0),
                cutaway: false,
                action: () => {
                    this.sim.setRain('light');
                }
            },
            3: {
                title: "Storm Intensifies: Inflow Rises",
                description: "Rainfall transitions from a light shower to a heavy storm. Water flow through the grate escalates. The upstream sensor (S1) registers high volume, and blue flow indicators illustrate water moving into the main conduit.",
                cameraPos: new THREE.Vector3(3, 4, 8),
                cameraLookAt: new THREE.Vector3(-1, -1, 1),
                cutaway: false,
                action: () => {
                    this.sim.setRain('heavy');
                }
            },
            4: {
                title: "Debris Infiltration: Waste Enters System",
                description: "Trash, leaves, and plastics wash off the streets into the drainage inlet. Without prevention, this garbage would quickly choke the main lines downstream. Watch as the rotating grate captures the debris.",
                cameraPos: new THREE.Vector3(5.2, -0.2, 6.2),
                cameraLookAt: new THREE.Vector3(4.0, -0.7, 4.0),
                cutaway: true,
                action: () => {
                    this.sim.wastePercent = 55;
                    this.sim.isAutoMode = false; // pause auto so user sees buildup
                }
            },
            5: {
                title: "Conveyor Separation: Waste Captured",
                description: "Our innovative rotating waste cylinder filter traps the debris underground, preventing it from travelling into the pipe network. The filter shifts the trash to the adjacent transparent waste collection chamber.",
                cameraPos: new THREE.Vector3(6.5, -0.6, 5.0),
                cameraLookAt: new THREE.Vector3(4.0, -0.8, 3.2),
                cutaway: true,
                action: () => {
                    this.sim.wastePercent = 85;
                }
            },
            6: {
                title: "Conduit Blockage Detected",
                description: "Simulating a physical blockage downstream. Silt and mud obstruct the main pipe downstream. Water flow past the blockage zone restricts, causing incoming water to back up upstream.",
                cameraPos: new THREE.Vector3(-2.0, -2.0, 9.5),
                cameraLookAt: new THREE.Vector3(-5.0, -3.0, 5.0),
                cutaway: true,
                action: () => {
                    this.sim.blockagePercent = 80;
                }
            },
            7: {
                title: "Water Levels Back Up",
                description: "Because incoming flow exceeds outgoing discharge capacity (Inflow > Outflow), water level rises inside the vertical inlet shaft. Upstream water reaches a critical 85% volume.",
                cameraPos: new THREE.Vector3(8.0, -2.5, 7.5),
                cameraLookAt: new THREE.Vector3(3.0, -2.5, 5.0),
                cutaway: true,
                action: () => {
                    // Force water level rise
                    this.sim.pipeWaterLevel = 85;
                }
            },
            8: {
                title: "AI Analysis: Critical Risk Triggered",
                description: "The AI predictive core compares Sensor 1 (Inflow) with Sensor 3 (Outflow). Noting the massive flow deficit and high water mark, it raises the flood risk score to CRITICAL. The red LED indicator flashes.",
                cameraPos: new THREE.Vector3(12, 10, 12),
                cameraLookAt: new THREE.Vector3(0, -2, 0),
                cutaway: true,
                action: () => {
                    // Showcase dashboard and led state
                }
            },
            9: {
                title: "Automatic Waste Cleaning Activates",
                description: "The AI core commands the rotating waste filter to engage automatically. Watch as the cylinder rotates and clears the accumulated garbage, sending it to the containment bin for easy collection.",
                cameraPos: new THREE.Vector3(6.5, -0.6, 5.0),
                cameraLookAt: new THREE.Vector3(4.0, -0.8, 3.2),
                cutaway: true,
                action: () => {
                    this.sim.isAutoMode = true; // Auto-prevention mode cleans waste
                }
            },
            10: {
                title: "Automatic Diversion Valve Opens",
                description: "With the main pipe still overloaded by extreme storm volumes, the AI opens the Motorized Diversion Valve. The physical metal gate slides open, establishing a secondary path for overflow.",
                cameraPos: new THREE.Vector3(0.5, -2.5, 7.5),
                cameraLookAt: new THREE.Vector3(-1.0, -3.2, 5.0),
                cutaway: true,
                action: () => {
                    this.sim.valveOpen = 1.0;
                }
            },
            11: {
                title: "Emergency Reservoir Buffer",
                description: "Stormwater is diverted down the branch pipeline and enters the 10,000L transparent Emergency Storage Tank. The rising blue block represents stored water, preventing street flooding.",
                cameraPos: new THREE.Vector3(-6.0, -4.0, -1.0),
                cameraLookAt: new THREE.Vector3(-10.0, -5.0, -8.0),
                cutaway: true,
                action: () => {
                    this.sim.storagePercent = 65;
                }
            },
            12: {
                title: "Sustainable Loop: Water Reuse",
                description: "As the storm clears, stored runoff passes through our Bio-Filter Treatment Unit and is pumped back up to irrigate the public gardens. The garden plants glow as treated water is reused. Flood prevented successfully!",
                cameraPos: new THREE.Vector3(-17.0, 3.0, -10.0),
                cameraLookAt: new THREE.Vector3(-20.0, 0.2, -15.0),
                cutaway: false,
                action: () => {
                    this.sim.setRain('none');
                    this.sim.pipeWaterLevel = 0;
                    this.sim.valveOpen = 0.0;
                    this.sim.storagePercent = 40; // starts discharging
                }
            }
        };
    }

    start() {
        this.currentStep = 1;
        this.overlay.classList.remove('hidden');
        this.runStep(this.currentStep);
        this.dashboard.log("Presentation Mode started. Guided tour active.");
    }

    stop() {
        this.overlay.classList.add('hidden');
        this.sim.reset();
        this.city.setCutaway(false);
        this.sm.animateCamera(new THREE.Vector3(25, 20, 25), new THREE.Vector3(0, 0, 0), 1.5);
        this.dashboard.log("Presentation Mode ended. User controls restored.");
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.runStep(this.currentStep);
        } else {
            this.stop();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.runStep(this.currentStep);
        }
    }

    runStep(stepIdx) {
        const step = this.steps[stepIdx];
        
        // Update DOM texts
        this.stepBadge.textContent = `Step ${stepIdx} of ${this.totalSteps}`;
        this.stepTitle.textContent = step.title;
        this.stepDesc.textContent = step.description;

        // Next/Prev button texts
        this.btnPrev.style.visibility = (stepIdx === 1) ? 'hidden' : 'visible';
        this.btnNext.textContent = (stepIdx === this.totalSteps) ? 'Finish' : 'Next →';

        // Execute step simulation actions
        step.action();

        // Toggle building/road cutaway view
        this.city.setCutaway(step.cutaway);

        // Animate camera to the targeted preset
        this.sm.animateCamera(step.cameraPos, step.cameraLookAt, 1.8);
    }
}

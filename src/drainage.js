import * as THREE from 'three';

export class DrainageManager {
    constructor(scene) {
        this.scene = scene;
        this.drainageGroup = new THREE.Group();
        this.scene.add(this.drainageGroup);

        this.components = {}; // References to interactive meshes
        this.flowParticles = []; // Array of flowing water particles
        this.maxParticles = 120;
        this.labels = {}; // Sprite holographic labels
        this.currentTheme = 'dark'; // theme state
        
        // Define materials
        this.materials = {
            pipe: new THREE.MeshStandardMaterial({
                color: 0x0ea5e9,
                transparent: true,
                opacity: 0.35,
                roughness: 0.1,
                metalness: 0.9,
                side: THREE.DoubleSide
            }),
            concrete: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
            metal: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }),
            waste: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
            tank: new THREE.MeshStandardMaterial({
                color: 0x3b82f6,
                transparent: true,
                opacity: 0.25,
                roughness: 0.1,
                metalness: 0.1
            }),
            water: new THREE.MeshStandardMaterial({
                color: 0x3b82f6,
                transparent: true,
                opacity: 0.75,
                roughness: 0.1
            }),
            sensorLed: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
            treatment: new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.8, roughness: 0.3 })
        };

        this.buildSystem();
        this.buildFlowParticles();
    }

    buildSystem() {
        // --- 1. SMART DRAIN GRATE & INLET (Layer 2) ---
        // Inlet box
        const inletGeo = new THREE.BoxGeometry(2.5, 2.0, 1.8);
        const inlet = new THREE.Mesh(inletGeo, this.materials.concrete);
        inlet.position.set(4.0, -0.9, 5.0);
        inlet.receiveShadow = true;
        this.drainageGroup.add(inlet);

        // Grate cover on the road surface
        const grateGeo = new THREE.BoxGeometry(2.0, 0.1, 1.4);
        const grate = new THREE.Mesh(grateGeo, this.materials.metal);
        grate.position.set(4.0, 0.12, 5.0);
        grate.castShadow = true;
        grate.userData = {
            isInteractive: true,
            id: 'smart-grate',
            name: 'Smart Drain Grate',
            purpose: 'Captures surface rainwater and screens out large solid wastes.',
            status: 'Operational',
            reading: '0.00 L/s',
            action: 'Filtering debris'
        };
        this.drainageGroup.add(grate);
        this.components['smart-grate'] = grate;

        // --- 2. ROTATING WASTE FILTER ---
        const filterGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 12);
        // Create wireframe for filter grid representation
        const filterWireMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            wireframe: true,
            metalness: 0.9
        });
        const filterMesh = new THREE.Mesh(filterGeo, filterWireMat);
        filterMesh.rotation.z = Math.PI / 2;
        filterMesh.position.set(4.0, -0.5, 5.0);
        filterMesh.userData = {
            isInteractive: true,
            id: 'waste-filter',
            name: 'Rotating Waste Filter',
            purpose: 'Conveyor filter traps leaves/plastics and drives them to the storage chamber.',
            status: 'Operational',
            reading: '0 rpm',
            action: 'Scanning'
        };
        this.drainageGroup.add(filterMesh);
        this.components['waste-filter'] = filterMesh;

        // --- 3. WASTE COLLECTION CHAMBER ---
        const chamberGeo = new THREE.BoxGeometry(1.6, 1.4, 1.4);
        const chamberBox = new THREE.Mesh(chamberGeo, new THREE.MeshStandardMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.4,
            roughness: 0.2
        }));
        chamberBox.position.set(4.0, -0.6, 3.2); // Positioned behind the filter
        this.drainageGroup.add(chamberBox);

        // Waste level mesh (scales up)
        const wasteHeightGeo = new THREE.BoxGeometry(1.4, 1.2, 1.2);
        const wasteHeightMesh = new THREE.Mesh(wasteHeightGeo, this.materials.waste);
        wasteHeightMesh.position.set(4.0, -1.2, 3.2); // Pivot from bottom
        wasteHeightMesh.scale.set(1, 0.01, 1);
        wasteHeightMesh.userData = {
            isInteractive: true,
            id: 'waste-chamber',
            name: 'Waste Chamber',
            purpose: 'Temporarily stores filtered solid garbage for maintenance alerts.',
            status: 'Operational',
            reading: '0% Fill',
            action: 'Collecting'
        };
        this.drainageGroup.add(wasteHeightMesh);
        this.components['waste-chamber'] = wasteHeightMesh;

        // LED Indicator on top of waste chamber
        const wasteLedGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const wasteLed = new THREE.Mesh(wasteLedGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        wasteLed.position.set(4.0, 0.2, 3.2);
        this.drainageGroup.add(wasteLed);
        this.components['waste-led'] = wasteLed;

        // --- 4. UNDERGROUND PIPES (Layer 3) ---
        // Main Drain Pipe (Cylinder along X-axis from inlet to discharge)
        // Position: inlet is x=4, main drainage runs x=4 to x=-25 at height y=-3
        const mainPipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 29, 16);
        mainPipeGeo.rotateZ(Math.PI / 2);
        const mainPipe = new THREE.Mesh(mainPipeGeo, this.materials.pipe);
        mainPipe.position.set(-10.5, -3.0, 5.0);
        this.drainageGroup.add(mainPipe);

        // Vertical drop pipe from inlet to main pipe
        const dropPipeGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.5, 16);
        const dropPipe = new THREE.Mesh(dropPipeGeo, this.materials.pipe);
        dropPipe.position.set(4.0, -2.1, 5.0);
        this.drainageGroup.add(dropPipe);

        // Diversion Pipe branching from main pipe (x=-1, y=-3, z=5) to storage tank (x=-5, y=-5, z=-8)
        // Let's model this as three straight pipe sections for clean visualization
        // A. Divert Drop Pipe
        const divDropGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.0, 16);
        const divDrop = new THREE.Mesh(divDropGeo, this.materials.pipe);
        divDrop.position.set(-1.0, -4.0, 5.0);
        this.drainageGroup.add(divDrop);

        // B. Horizontal Connector going from Z=5 to Z=-8
        const connectorGeo = new THREE.CylinderGeometry(0.35, 0.35, 13, 16);
        connectorGeo.rotateX(Math.PI / 2);
        const connector = new THREE.Mesh(connectorGeo, this.materials.pipe);
        connector.position.set(-1.0, -5.0, -1.5);
        this.drainageGroup.add(connector);

        // C. Feed pipe into Tank
        const feedGeo = new THREE.CylinderGeometry(0.35, 0.35, 4.0, 16);
        feedGeo.rotateZ(Math.PI / 2);
        const feedPipe = new THREE.Mesh(feedGeo, this.materials.pipe);
        feedPipe.position.set(-3.0, -5.0, -8.0);
        this.drainageGroup.add(feedPipe);

        // --- 5. MONITORED FLOW SENSORS ---
        const sensorRingGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.3, 16);
        sensorRingGeo.rotateZ(Math.PI / 2);
        const sensorRingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

        // S1 - Upstream Sensor (located right below the drop)
        const s1 = new THREE.Mesh(sensorRingGeo, sensorRingMat);
        s1.position.set(2.0, -3.0, 5.0);
        s1.userData = {
            isInteractive: true,
            id: 'sensor-upstream',
            name: 'Upstream Flow Sensor (S1)',
            purpose: 'Measures incoming rainwater volume entering the drainage system.',
            status: 'Operational',
            reading: '0.0 L/s',
            action: 'Monitoring inlet flow'
        };
        this.drainageGroup.add(s1);
        this.components['sensor-upstream'] = s1;

        const s1Led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        s1Led.position.set(2.0, -2.4, 5.0);
        this.drainageGroup.add(s1Led);
        this.components['sensor-upstream-led'] = s1Led;

        // S2 - Blockage Zone Sensor (in the middle zone before diversion)
        const s2 = new THREE.Mesh(sensorRingGeo, sensorRingMat);
        s2.position.set(-5.0, -3.0, 5.0);
        s2.userData = {
            isInteractive: true,
            id: 'sensor-blockage',
            name: 'Obstruction Sensor (S2)',
            purpose: 'Monitors pressure differentials and backups indicating clogging.',
            status: 'Operational',
            reading: 'Clear',
            action: 'Scanning zone'
        };
        this.drainageGroup.add(s2);
        this.components['sensor-blockage'] = s2;

        const s2Led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        s2Led.position.set(-5.0, -2.4, 5.0);
        this.drainageGroup.add(s2Led);
        this.components['sensor-blockage-led'] = s2Led;

        // S3 - Downstream Sensor (near discharge)
        const s3 = new THREE.Mesh(sensorRingGeo, sensorRingMat);
        s3.position.set(-20.0, -3.0, 5.0);
        s3.userData = {
            isInteractive: true,
            id: 'sensor-downstream',
            name: 'Downstream Discharge Sensor (S3)',
            purpose: 'Measures water escaping the system to compare against incoming volumes.',
            status: 'Operational',
            reading: '0.0 L/s',
            action: 'Monitoring discharge flow'
        };
        this.drainageGroup.add(s3);
        this.components['sensor-downstream'] = s3;

        const s3Led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        s3Led.position.set(-20.0, -2.4, 5.0);
        this.drainageGroup.add(s3Led);
        this.components['sensor-downstream-led'] = s3Led;

        // --- 6. MOTORIZED DIVERSION VALVE ---
        const valveHousingGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const valveHousing = new THREE.Mesh(valveHousingGeo, this.materials.metal);
        valveHousing.position.set(-1.0, -3.2, 5.0);
        this.drainageGroup.add(valveHousing);

        // Slide Gate mesh (moves vertically)
        const gateGeo = new THREE.BoxGeometry(0.1, 0.7, 0.6);
        const gate = new THREE.Mesh(gateGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9 }));
        gate.position.set(-1.0, -3.4, 5.0); // y=-3.4 closed, y=-2.9 open
        gate.userData = {
            isInteractive: true,
            id: 'diversion-valve',
            name: 'Motorized Diversion Valve',
            purpose: 'Solenoid gate valve routing overloaded storm runoff into storage reservoirs.',
            status: 'CLOSED',
            reading: '0% Open',
            action: 'Holding line'
        };
        this.drainageGroup.add(gate);
        this.components['diversion-valve'] = gate;

        // --- 7. EMERGENCY UNDERGROUND STORAGE TANK ---
        const tankHousingGeo = new THREE.BoxGeometry(10.0, 4.0, 6.0);
        const tankHousing = new THREE.Mesh(tankHousingGeo, this.materials.tank);
        tankHousing.position.set(-10.0, -5.0, -8.0);
        this.drainageGroup.add(tankHousing);

        // Stored water block inside tank
        const tankWaterGeo = new THREE.BoxGeometry(9.8, 3.8, 5.8);
        const tankWater = new THREE.Mesh(tankWaterGeo, this.materials.water);
        tankWater.position.set(-10.0, -6.9, -8.0); // Scale from bottom
        tankWater.scale.set(1, 0.01, 1);
        tankWater.userData = {
            isInteractive: true,
            id: 'emergency-tank',
            name: 'Emergency Storage Reservoir',
            purpose: 'Holds 10,000L of overflow runoff to protect roadways from flash floods.',
            status: 'Empty',
            reading: '0 L (0%)',
            action: 'Awaiting intake'
        };
        this.drainageGroup.add(tankWater);
        this.components['emergency-tank'] = tankWater;

        // --- 8. TREATMENT & REUSE SYSTEM ---
        // Reuse line pipe leading from storage tank to treatment cylinder
        const reusePipe1Geo = new THREE.CylinderGeometry(0.2, 0.2, 5.0, 16);
        reusePipe1Geo.rotateZ(Math.PI / 2);
        const reusePipe1 = new THREE.Mesh(reusePipe1Geo, this.materials.pipe);
        reusePipe1.position.set(-17.5, -5.0, -8.0);
        this.drainageGroup.add(reusePipe1);

        // Treatment cylinder
        const treatmentGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16);
        const treatment = new THREE.Mesh(treatmentGeo, this.materials.treatment);
        treatment.position.set(-20.0, -5.0, -8.0);
        treatment.userData = {
            isInteractive: true,
            id: 'treatment-unit',
            name: 'Bio-Filter Treatment Unit',
            purpose: 'Filters heavy metals, motor oils, and litter from stored runoff.',
            status: 'Operational',
            reading: 'Inactive',
            action: 'Monitoring'
        };
        this.drainageGroup.add(treatment);
        this.components['treatment-unit'] = treatment;

        // Clean output pipeline to public garden (reaches surface at x=-20, y=0.1, z=-15)
        const reusePipe2Geo = new THREE.CylinderGeometry(0.18, 0.18, 5.0, 16);
        reusePipe2Geo.rotateX(Math.PI / 2);
        const reusePipe2 = new THREE.Mesh(reusePipe2Geo, this.materials.pipe);
        reusePipe2.position.set(-20.0, -5.0, -11.5);
        this.drainageGroup.add(reusePipe2);

        const reusePipe3Geo = new THREE.CylinderGeometry(0.18, 0.18, 5.0, 16);
        const reusePipe3 = new THREE.Mesh(reusePipe3Geo, this.materials.pipe);
        reusePipe3.position.set(-20.0, -2.5, -14.0);
        this.drainageGroup.add(reusePipe3);

        // --- 9. PUBLIC REUSE GARDEN ---
        // Represented by a flowerbeds/shrubs zone at the quadrant
        this.gardenGroup = new THREE.Group();
        this.gardenGroup.position.set(-20.0, 0.2, -15.0);
        this.cityGroupForGardenReference = this.drainageGroup; // Reference
        this.drainageGroup.add(this.gardenGroup);

        // Plant models (3 futuristic glowing bulbs)
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x14532d });
        const bulbGeo = new THREE.DodecahedronGeometry(0.25);
        this.plantBulbs = [];

        for (let i = 0; i < 4; i++) {
            const plant = new THREE.Group();
            const posX = (Math.random() - 0.5) * 3;
            const posZ = (Math.random() - 0.5) * 3;
            plant.position.set(posX, 0, posZ);

            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.25;
            plant.add(stem);

            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0x15803d,
                emissive: 0x16a34a,
                emissiveIntensity: 0.1
            });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.y = 0.5;
            plant.add(bulb);
            this.plantBulbs.push(bulb);

            this.gardenGroup.add(plant);
        }

        // --- 10. HOLOGRAPHIC 3D LABELS ---
        this.labels['grate'] = this.createHologramLabel('grate', 'INLET\nFlow: 0.0 L/s', 0x06b6d4);
        this.labels['grate'].position.set(4.0, 1.4, 5.0);
        this.drainageGroup.add(this.labels['grate']);

        this.labels['waste'] = this.createHologramLabel('waste', 'WASTE CHAMBER\nFill: 0%', 0xf97316);
        this.labels['waste'].position.set(4.0, 0.9, 3.2);
        this.drainageGroup.add(this.labels['waste']);

        this.labels['s1'] = this.createHologramLabel('s1', 'S1 INFLOW\n0.0 L/s', 0xf59e0b);
        this.labels['s1'].position.set(2.0, -1.8, 5.0);
        this.drainageGroup.add(this.labels['s1']);

        this.labels['s2'] = this.createHologramLabel('s2', 'S2 BLOCKAGE\nClog: 0%', 0xf97316);
        this.labels['s2'].position.set(-5.0, -1.8, 5.0);
        this.drainageGroup.add(this.labels['s2']);

        this.labels['s3'] = this.createHologramLabel('s3', 'S3 OUTFLOW\n0.0 L/s', 0xf59e0b);
        this.labels['s3'].position.set(-20.0, -1.8, 5.0);
        this.drainageGroup.add(this.labels['s3']);

        this.labels['valve'] = this.createHologramLabel('valve', 'DIVERSION VALVE\nCLOSED', 0xef4444);
        this.labels['valve'].position.set(-1.0, -2.0, 5.0);
        this.drainageGroup.add(this.labels['valve']);

        this.labels['tank'] = this.createHologramLabel('tank', 'EMERGENCY TANK\n0% Fill', 0x3b82f6);
        this.labels['tank'].position.set(-10.0, -2.5, -8.0);
        this.drainageGroup.add(this.labels['tank']);

        this.labels['garden'] = this.createHologramLabel('garden', 'REUSE GARDEN\nSTANDBY', 0x10b981);
        this.labels['garden'].position.set(-20.0, 1.5, -15.0);
        this.drainageGroup.add(this.labels['garden']);
    }

    buildFlowParticles() {
        const particleGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const particleMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

        // Instantiate water flow particles
        for (let i = 0; i < this.maxParticles; i++) {
            const p = new THREE.Mesh(particleGeo, particleMat);
            p.visible = false;
            this.drainageGroup.add(p);

            this.flowParticles.push({
                mesh: p,
                state: 'idle', // 'idle', 'main-flow', 'diversion-flow', 'reuse-flow'
                progress: 0,
                speed: 1.0,
                startOffset: Math.random() // For staggered distribution
            });
        }
    }

    // Set colors of sensor LEDs based on telemetry warnings
    updateSensorLeds(s1State, s2State, s3State) {
        const getColor = (state) => {
            if (state === 'green') return 0x10b981;
            if (state === 'yellow') return 0xf59e0b;
            if (state === 'orange') return 0xf97316;
            if (state === 'red') return 0xef4444;
            return 0x10b981;
        };

        this.components['sensor-upstream-led'].material.color.setHex(getColor(s1State));
        this.components['sensor-blockage-led'].material.color.setHex(getColor(s2State));
        this.components['sensor-downstream-led'].material.color.setHex(getColor(s3State));
    }

    // Slide the diversion valve open or closed
    setValveOpen(openFraction) {
        // Closed at y = -3.4, open at y = -2.8
        const startY = -3.4;
        const endY = -2.85;
        this.components['diversion-valve'].position.y = startY + (endY - startY) * openFraction;
        
        // Update user data status
        const valve = this.components['diversion-valve'];
        if (openFraction > 0.8) {
            valve.userData.status = 'OPEN';
            valve.userData.reading = '100% Open';
            valve.userData.action = 'Diverting overflow';
        } else if (openFraction > 0) {
            valve.userData.status = 'TRANSITION';
            valve.userData.reading = `${Math.round(openFraction * 100)}% Open`;
            valve.userData.action = 'Adjusting flow';
        } else {
            valve.userData.status = 'CLOSED';
            valve.userData.reading = '0% Open';
            valve.userData.action = 'Holding line';
        }
    }

    // Update scale of waste in the chamber
    setWasteLevel(percent) {
        // scale.y ranges from 0.01 (empty) to 1.0 (full)
        const scaleY = 0.01 + (0.99 * (percent / 100));
        this.components['waste-chamber'].scale.y = scaleY;
        
        // Shift position y slightly so it rises from base instead of stretching both ways
        // Base is at -1.2, height is 1.2, so top rises from -1.2
        const baseHeight = 1.2;
        this.components['waste-chamber'].position.y = -1.2 + (baseHeight * scaleY) / 2;

        // Change LED color of the chamber
        const led = this.components['waste-led'];
        if (percent > 80) {
            led.material.color.setHex(0xef4444); // Red
        } else if (percent > 45) {
            led.material.color.setHex(0xf59e0b); // Yellow
        } else {
            led.material.color.setHex(0x10b981); // Green
        }

        // Update userdata
        this.components['waste-chamber'].userData.reading = `${Math.round(percent)}% Fill`;
        if (percent > 80) {
            this.components['waste-chamber'].userData.status = 'CRITICAL';
            this.components['waste-chamber'].userData.action = 'NEEDS EMPTYING';
        } else if (percent > 45) {
            this.components['waste-chamber'].userData.status = 'WARNING';
            this.components['waste-chamber'].userData.action = 'Accumulation high';
        } else {
            this.components['waste-chamber'].userData.status = 'Operational';
            this.components['waste-chamber'].userData.action = 'Collecting';
        }
    }

    // Update scale of water in the emergency storage tank
    setStorageLevel(percent) {
        // scale.y ranges from 0.01 (empty) to 1.0 (full)
        const scaleY = 0.01 + (0.99 * (percent / 100));
        this.components['emergency-tank'].scale.y = scaleY;
        
        // Pivot from bottom (base is at -6.9, height is 3.8)
        const baseHeight = 3.8;
        this.components['emergency-tank'].position.y = -6.9 + (baseHeight * scaleY) / 2;

        // Update metadata
        const Liters = Math.round(100 * percent);
        const tank = this.components['emergency-tank'];
        tank.userData.reading = `${Liters} L (${Math.round(percent)}%)`;
        if (percent > 90) {
            tank.userData.status = 'CRITICAL ALERT';
            tank.userData.action = 'Tanks maxed out';
        } else if (percent > 50) {
            tank.userData.status = 'HIGH';
            tank.userData.action = 'Storing surplus';
        } else if (percent > 0) {
            tank.userData.status = 'ACTIVE';
            tank.userData.action = 'Receiving water';
        } else {
            tank.userData.status = 'EMPTY';
            tank.userData.action = 'Awaiting intake';
        }
    }

    // Trigger visual treatment & garden blooming
    updateWaterReuse(isActive) {
        const treatment = this.components['treatment-unit'];
        treatment.userData.reading = isActive ? '5.2 L/s Flow' : 'Inactive';
        treatment.userData.status = isActive ? 'ACTIVE' : 'Operational';
        treatment.userData.action = isActive ? 'Bio-filtering runoff' : 'Monitoring';

        // Animate plant emissives
        this.plantBulbs.forEach(b => {
            const targetColor = isActive ? 0x60a5fa : 0x15803d; // Glow blue or green
            const targetIntensity = isActive ? 1.5 : 0.1;
            b.material.color.setHex(targetColor);
            b.material.emissive.setHex(targetColor);
            b.material.emissiveIntensity = targetIntensity;
        });
    }

    // Set how many particles are moving and in which direction
    // FlowRates: { main: float 0-1, diversion: float 0-1, reuse: float 0-1 }
    setFlowRates(flowRates) {
        this.flowParticles.forEach((p, idx) => {
            // Allocate particles to states based on flow levels
            const thresholdMain = flowRates.main * this.maxParticles * 0.6;
            const thresholdDiv = flowRates.diversion * this.maxParticles * 0.4;
            const thresholdReuse = flowRates.reuse * this.maxParticles * 0.2;

            if (idx < thresholdMain && flowRates.main > 0) {
                if (p.state !== 'main-flow') {
                    p.state = 'main-flow';
                    p.mesh.visible = true;
                    p.progress = (idx / thresholdMain) + p.startOffset; // offset start times
                    if (p.progress > 1) p.progress -= 1;
                    p.speed = 0.5 + Math.random() * 0.5;
                }
            } else if (idx < (thresholdMain + thresholdDiv) && flowRates.diversion > 0) {
                if (p.state !== 'diversion-flow') {
                    p.state = 'diversion-flow';
                    p.mesh.visible = true;
                    p.progress = ((idx - thresholdMain) / thresholdDiv) + p.startOffset;
                    if (p.progress > 1) p.progress -= 1;
                    p.speed = 0.6 + Math.random() * 0.4;
                }
            } else if (idx < (thresholdMain + thresholdDiv + thresholdReuse) && flowRates.reuse > 0) {
                if (p.state !== 'reuse-flow') {
                    p.state = 'reuse-flow';
                    p.mesh.visible = true;
                    p.progress = ((idx - thresholdMain - thresholdDiv) / thresholdReuse) + p.startOffset;
                    if (p.progress > 1) p.progress -= 1;
                    p.speed = 0.4 + Math.random() * 0.3;
                }
            } else {
                p.state = 'idle';
                p.mesh.visible = false;
            }
        });
    }

    createHologramLabel(id, text, colorCode) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const color = '#' + colorCode.toString(16).padStart(6, '0');

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2.8, 1.4, 1);
        
        sprite.userData = { id, canvas, ctx, texture, color };
        this.updateHologramLabel(id, text, color);
        return sprite;
    }

    updateHologramLabel(id, text, customColor) {
        const sprite = this.labels[id];
        if (!sprite) return;

        const { canvas, ctx, texture, color } = sprite.userData;
        const activeColor = customColor || color;
        
        // Cache current text for theme repaints
        sprite.userData.text = text;
        
        ctx.clearRect(0, 0, 256, 128);

        // Draw background (Light Glass or Dark Glass depending on theme)
        const isLight = this.currentTheme === 'light';
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(6, 10, 24, 0.85)';
        ctx.fillRect(0, 0, 256, 128);

        // Draw border
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 120);

        // Draw corners
        ctx.fillStyle = activeColor;
        ctx.fillRect(4, 4, 15, 6);
        ctx.fillRect(4, 4, 6, 15);
        ctx.fillRect(237, 4, 15, 6);
        ctx.fillRect(246, 4, 6, 15);
        ctx.fillRect(4, 118, 15, 6);
        ctx.fillRect(4, 107, 6, 15);
        ctx.fillRect(237, 118, 15, 6);
        ctx.fillRect(246, 107, 6, 15);

        // Draw grid lines (subtle grid)
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 20; x < 256; x += 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke();
        }
        for (let y = 20; y < 128; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        }
        
        // Draw Text (Dark slate or white depending on theme)
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 22px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = text.split('\n');
        if (lines.length === 1) {
            ctx.fillText(lines[0], 128, 64);
        } else {
            ctx.fillText(lines[0], 128, 44);
            ctx.fillStyle = activeColor;
            ctx.font = 'bold 20px "Rajdhani", sans-serif';
            ctx.fillText(lines[1], 128, 84);
        }

        texture.needsUpdate = true;
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        // Trigger a force repaint on all labels with their cached text
        Object.entries(this.labels).forEach(([id, sprite]) => {
            if (sprite.userData.text) {
                this.updateHologramLabel(id, sprite.userData.text);
            }
        });
    }

    update(deltaTime, elapsedTime) {
        // 1. Rotate waste filter cylinder if flow is active
        const filter = this.components['waste-filter'];
        if (filter.userData.action === 'ROTATING') {
            filter.rotation.x += deltaTime * 2.0; // spin speed
        }

        // 2. Animate water particles along their paths
        this.flowParticles.forEach(p => {
            if (p.state === 'idle') return;

            p.progress += p.speed * deltaTime * 0.6; // advance along path
            if (p.progress > 1.0) p.progress -= 1.0; // loop

            let t = p.progress;

            if (p.state === 'main-flow') {
                if (t < 0.2) {
                    const segmentT = t / 0.2;
                    p.mesh.position.set(4.0, -0.5 - segmentT * 2.5, 5.0);
                } else {
                    const segmentT = (t - 0.2) / 0.8;
                    p.mesh.position.set(4.0 - segmentT * 29.0, -3.0, 5.0);
                }
            } else if (p.state === 'diversion-flow') {
                if (t < 0.2) {
                    const segmentT = t / 0.2;
                    p.mesh.position.set(-1.0, -3.0 - segmentT * 2.0, 5.0);
                } else if (t < 0.7) {
                    const segmentT = (t - 0.2) / 0.5;
                    p.mesh.position.set(-1.0, -5.0, 5.0 - segmentT * 13.0);
                } else {
                    const segmentT = (t - 0.7) / 0.3;
                    p.mesh.position.set(-1.0 - segmentT * 4.0, -5.0, -8.0);
                }
            } else if (p.state === 'reuse-flow') {
                if (t < 0.3) {
                    const segmentT = t / 0.3;
                    p.mesh.position.set(-15.0 - segmentT * 5.0, -5.0, -8.0);
                } else if (t < 0.7) {
                    const segmentT = (t - 0.3) / 0.4;
                    p.mesh.position.set(-20.0, -5.0, -8.0 - segmentT * 7.0);
                } else {
                    const segmentT = (t - 0.7) / 0.3;
                    p.mesh.position.set(-20.0, -5.0 + segmentT * 5.2, -15.0);
                }
            }
        });

        // 3. Animate 3D labels floating up and down slightly
        const time = elapsedTime || (Date.now() * 0.001);
        Object.entries(this.labels).forEach(([id, sprite]) => {
            let offset = 0;
            switch(id) {
                case 'grate': offset = 1.4; break;
                case 'waste': offset = 0.9; break;
                case 's1': offset = -1.8; break;
                case 's2': offset = -1.8; break;
                case 's3': offset = -1.8; break;
                case 'valve': offset = -2.0; break;
                case 'tank': offset = -2.5; break;
                case 'garden': offset = 1.5; break;
            }
            sprite.position.y = offset + Math.sin(time * 2.0 + offset) * 0.06;
        });
    }
}

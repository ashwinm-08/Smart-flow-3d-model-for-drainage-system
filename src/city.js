import * as THREE from 'three';

export class CityManager {
    constructor(scene) {
        this.scene = scene;
        this.cityGroup = new THREE.Group();
        this.cityGroup.name = 'cityGroup';
        this.scene.add(this.cityGroup);

        this.vehicles = [];
        this.streetLights = [];
        this.rainParticles = null;
        this.rainVelocity = [];
        this.rainCount = 3000;
        this.rainIntensity = 'none'; // 'none', 'light', 'heavy', 'extreme'
        
        // Define shared, themeable materials (Dark Mode defaults)
        this.groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x0f172a, 
            roughness: 0.8,
            metalness: 0.2
        });
        this.roadMat = new THREE.MeshStandardMaterial({ 
            color: 0x1e293b, 
            roughness: 0.6 
        });
        this.sidewalkMat = new THREE.MeshStandardMaterial({ 
            color: 0x334155, 
            roughness: 0.9 
        });
        this.buildingMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.5,
            metalness: 0.8,
            transparent: true,
            opacity: 0.95
        });
        this.glowMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });

        this.buildEnvironment();
        this.buildRainSystem();
    }

    buildEnvironment() {
        // 1. Ground and Roads
        const groundGeo = new THREE.PlaneGeometry(60, 60);
        const ground = new THREE.Mesh(groundGeo, this.groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.cityGroup.add(ground);

        // Grid overlay for technical city feel
        this.gridHelper = new THREE.GridHelper(60, 30, 0x1e293b, 0x111827);
        this.gridHelper.position.y = 0.01;
        this.cityGroup.add(this.gridHelper);

        // East-West Road
        const ewRoadGeo = new THREE.PlaneGeometry(60, 8);
        const ewRoad = new THREE.Mesh(ewRoadGeo, this.roadMat);
        ewRoad.rotation.x = -Math.PI / 2;
        ewRoad.position.set(0, 0.02, 0);
        ewRoad.receiveShadow = true;
        this.cityGroup.add(ewRoad);

        // North-South Road
        const nsRoadGeo = new THREE.PlaneGeometry(8, 60);
        const nsRoad = new THREE.Mesh(nsRoadGeo, this.roadMat);
        nsRoad.rotation.x = -Math.PI / 2;
        nsRoad.position.set(0, 0.02, 0);
        nsRoad.receiveShadow = true;
        this.cityGroup.add(nsRoad);

        // Create 4 quadrant sidewalks
        const quadrantGeo = new THREE.BoxGeometry(24, 0.15, 24);
        const offsets = [-17, 17];
        
        offsets.forEach(x => {
            offsets.forEach(z => {
                const sidewalk = new THREE.Mesh(quadrantGeo, this.sidewalkMat);
                sidewalk.position.set(x, 0.075, z);
                sidewalk.receiveShadow = true;
                this.cityGroup.add(sidewalk);
                
                // Add buildings in quadrants
                this.spawnBuildingsInQuadrant(x, z);
            });
        });

        // 2. Spawn Street Lights
        this.spawnStreetLights();

        // 3. Spawn low-poly vehicles
        this.spawnVehicles();
    }

    spawnBuildingsInQuadrant(quadX, quadZ) {
        // Place 3 buildings per quadrant with variations

        // Place 3 buildings per quadrant with variations
        const coords = [
            { x: quadX - 4, z: quadZ - 4, w: 6, d: 6, h: 8 + Math.random() * 8 },
            { x: quadX + 4, z: quadZ + 4, w: 5, d: 5, h: 10 + Math.random() * 12 },
            { x: quadX - 4, z: quadZ + 4, w: 4, d: 7, h: 6 + Math.random() * 6 }
        ];

        coords.forEach(c => {
            const geo = new THREE.BoxGeometry(c.w, c.h, c.d);
            const b = new THREE.Mesh(geo, this.buildingMat);
            b.position.set(c.x, c.h / 2 + 0.15, c.z);
            b.castShadow = true;
            b.receiveShadow = true;
            this.cityGroup.add(b);

            // Wireframe glow copy
            const wire = new THREE.Mesh(geo, this.glowMat);
            wire.position.copy(b.position);
            this.cityGroup.add(wire);
        });
    }

    spawnStreetLights() {
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
        
        const lampGeo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
        const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        // Positions along road edges
        const positions = [
            { x: -5, z: -10, rot: -Math.PI / 2 },
            { x: -5, z: 10, rot: -Math.PI / 2 },
            { x: 5, z: -15, rot: Math.PI / 2 },
            { x: 5, z: 15, rot: Math.PI / 2 },
            { x: -10, z: -5, rot: 0 },
            { x: 10, z: -5, rot: 0 },
            { x: -15, z: 5, rot: Math.PI },
            { x: 15, z: 5, rot: Math.PI }
        ];

        positions.forEach(pos => {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(pos.x, 1.5 + 0.15, pos.z);
            pole.castShadow = true;
            this.cityGroup.add(pole);

            const lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.set(0, 1.5, 0.3);
            lamp.rotation.y = pos.rot;
            pole.add(lamp);

            const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), bulbMat);
            bulb.position.set(0, -0.06, 0.2);
            bulb.rotation.y = pos.rot;
            pole.add(bulb);

            // Add real PointLight
            const pointLight = new THREE.PointLight(0xfef08a, 0.0, 8);
            pointLight.position.set(0, 1.4, 0.2);
            pointLight.castShadow = true;
            pointLight.shadow.bias = -0.002;
            pole.add(pointLight);

            this.streetLights.push({
                mesh: pole,
                light: pointLight
            });
        });
    }

    spawnVehicles() {
        const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7];
        
        // Spawn 4 cars
        const tracks = [
            { x: -2, zStart: -25, speed: 8, color: carColors[0], dirZ: 1 },
            { x: 2, zStart: 25, speed: -6, color: carColors[1], dirZ: -1 },
            { xStart: -25, z: -2, speed: 7, color: carColors[2], dirX: 1 },
            { xStart: 25, z: 2, speed: -5, color: carColors[3], dirX: -1 }
        ];

        tracks.forEach(track => {
            const carGroup = new THREE.Group();
            
            // Body
            const bodyGeo = new THREE.BoxGeometry(0.9, 0.5, 1.6);
            const bodyMat = new THREE.MeshStandardMaterial({ color: track.color, roughness: 0.3 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.35;
            body.castShadow = true;
            carGroup.add(body);

            // Cabin
            const cabGeo = new THREE.BoxGeometry(0.8, 0.4, 0.9);
            const cabMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1 });
            const cab = new THREE.Mesh(cabGeo, cabMat);
            cab.position.set(0, 0.7, -0.15);
            cab.castShadow = true;
            carGroup.add(cab);

            // Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
            wheelGeo.rotateZ(Math.PI / 2);

            const wheelOffsets = [
                {x: -0.5, y: 0.2, z: -0.5},
                {x: 0.5, y: 0.2, z: -0.5},
                {x: -0.5, y: 0.2, z: 0.5},
                {x: 0.5, y: 0.2, z: 0.5}
            ];

            wheelOffsets.forEach(o => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(o.x, o.y, o.z);
                carGroup.add(wheel);
            });

            // Set initial position
            if (track.zStart !== undefined) {
                carGroup.position.set(track.x, 0.05, track.zStart);
            } else {
                carGroup.position.set(track.xStart, 0.05, track.z);
                carGroup.rotation.y = Math.PI / 2;
            }

            this.cityGroup.add(carGroup);
            this.vehicles.push({
                mesh: carGroup,
                track: track
            });
        });
    }

    buildRainSystem() {
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.rainCount * 3);
        
        for (let i = 0; i < this.rainCount; i++) {
            // Position randomly within city bounds [-30, 30] horizontally, [0, 25] vertically
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 25;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

            this.rainVelocity.push(30 + Math.random() * 20); // fall speed
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create rain material
        const rainMat = new THREE.PointsMaterial({
            color: 0x60a5fa,
            size: 0.08,
            transparent: true,
            opacity: 0.0, // default off
            depthWrite: false
        });

        this.rainParticles = new THREE.Points(rainGeo, rainMat);
        this.scene.add(this.rainParticles);
    }

    // Set rain level & animate intensity changes
    setRainIntensity(level) {
        this.rainIntensity = level;
        let targetOpacity = 0.0;
        let streetLightTargetIntensity = 0.0;

        if (level === 'light') {
            targetOpacity = 0.35;
            streetLightTargetIntensity = 1.0;
        } else if (level === 'heavy') {
            targetOpacity = 0.7;
            streetLightTargetIntensity = 2.0;
        } else if (level === 'extreme') {
            targetOpacity = 1.0;
            streetLightTargetIntensity = 3.5;
        }

        // Animate rain particle opacity
        this.rainParticles.material.opacity = targetOpacity;

        // Animate street light intensities
        this.streetLights.forEach(sl => {
            sl.light.intensity = streetLightTargetIntensity;
        });
    }

    // Dynamic transparency trigger to see pipes
    setCutaway(enabled) {
        this.cityGroup.traverse(child => {
            if (child.isMesh && child.material) {
                // Ensure we don't mess up bulb emissives or specific meshes
                if (child.material.name !== 'ignore-cutaway') {
                    child.material.transparent = true;
                    child.material.opacity = enabled ? 0.15 : 0.95;
                    
                    // Keep roads slightly more visible so vehicles look like they are riding on them
                    if (child.geometry.type === 'PlaneGeometry' && child.position.y <= 0.02) {
                        child.material.opacity = enabled ? 0.3 : 1.0;
                    }
                }
            }
        });
    }

    setTheme(themeName) {
        const isLight = themeName === 'light';

        // Animate material colors using GSAP for a smooth visual switch
        gsap.to(this.groundMat.color, {
            r: isLight ? 0xf1 / 255 : 0x0f / 255,
            g: isLight ? 0xf5 / 255 : 0x17 / 255,
            b: isLight ? 0xf9 / 255 : 0x2a / 255,
            duration: 1.0
        });
        gsap.to(this.groundMat, { metalness: isLight ? 0.1 : 0.2, duration: 1.0 });

        gsap.to(this.roadMat.color, {
            r: isLight ? 0x64 / 255 : 0x1e / 255,
            g: isLight ? 0x74 / 255 : 0x29 / 255,
            b: isLight ? 0x8b / 255 : 0x3b / 255,
            duration: 1.0
        });

        gsap.to(this.sidewalkMat.color, {
            r: isLight ? 0xcb / 255 : 0x33 / 255,
            g: isLight ? 0xd5 / 255 : 0x41 / 255,
            b: isLight ? 0xe1 / 255 : 0x55 / 255,
            duration: 1.0
        });

        gsap.to(this.buildingMat.color, {
            r: isLight ? 0xf8 / 255 : 0x11 / 255,
            g: isLight ? 0xfa / 255 : 0x18 / 255,
            b: isLight ? 0xfc / 255 : 0x27 / 255,
            duration: 1.0
        });
        gsap.to(this.buildingMat, { metalness: isLight ? 0.2 : 0.8, duration: 1.0 });

        const glowColor = isLight ? 0x38bdf8 : 0x06b6d4;
        gsap.to(this.glowMat.color, {
            r: ((glowColor >> 16) & 255) / 255,
            g: ((glowColor >> 8) & 255) / 255,
            b: (glowColor & 255) / 255,
            duration: 1.0
        });
        gsap.to(this.glowMat, { opacity: isLight ? 0.12 : 0.15, duration: 1.0 });

        const gridCenterColor = isLight ? 0x94a3b8 : 0x1e293b;
        gsap.to(this.gridHelper.material.color, {
            r: ((gridCenterColor >> 16) & 255) / 255,
            g: ((gridCenterColor >> 8) & 255) / 255,
            b: (gridCenterColor & 255) / 255,
            duration: 1.0
        });
    }

    update(deltaTime) {
        // 1. Move vehicles
        this.vehicles.forEach(v => {
            const tr = v.track;
            if (tr.dirZ) {
                v.mesh.position.z += tr.speed * deltaTime;
                // Wrap around
                if (tr.speed > 0 && v.mesh.position.z > 30) v.mesh.position.z = -30;
                if (tr.speed < 0 && v.mesh.position.z < -30) v.mesh.position.z = 30;
            } else if (tr.dirX) {
                v.mesh.position.x += tr.speed * deltaTime;
                // Wrap around
                if (tr.speed > 0 && v.mesh.position.x > 30) v.mesh.position.x = -30;
                if (tr.speed < 0 && v.mesh.position.x < -30) v.mesh.position.x = 30;
            }
        });

        // 2. Animate rain
        if (this.rainIntensity !== 'none') {
            const positions = this.rainParticles.geometry.attributes.position.array;
            let speedMultiplier = 1.0;
            if (this.rainIntensity === 'heavy') speedMultiplier = 1.5;
            if (this.rainIntensity === 'extreme') speedMultiplier = 2.0;

            for (let i = 0; i < this.rainCount; i++) {
                // Y coordinate
                positions[i * 3 + 1] -= this.rainVelocity[i] * speedMultiplier * deltaTime;

                // Reset particle to top if it hits the ground
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 25;
                    // Splattering ripple simulation can be added here conceptually
                }
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
}

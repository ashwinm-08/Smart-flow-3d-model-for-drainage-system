import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.lights = {};
        this.ticks = [];
        
        this.init();
    }

    init() {
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060814);
        this.scene.fog = new THREE.FogExp2(0x060814, 0.015);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(25, 20, 25);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // 4. Controls setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Allow looking slightly underground
        this.controls.minDistance = 3;
        this.controls.maxDistance = 60;
        this.controls.target.set(0, 0, 0);

        // 5. Lighting setup
        this.setupLights();

        // 6. Global Network Setup
        this.buildGlobalNetwork();

        // 7. Event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupLights() {
        // Ambient Light
        this.lights.ambient = new THREE.AmbientLight(0x0a1128, 0.6);
        this.scene.add(this.lights.ambient);

        // Directional Light (Sunlight/Moonlight)
        this.lights.sun = new THREE.DirectionalLight(0x7dd3fc, 0.8);
        this.lights.sun.position.set(15, 30, 15);
        this.lights.sun.castShadow = true;
        this.lights.sun.shadow.mapSize.width = 2048;
        this.lights.sun.shadow.mapSize.height = 2048;
        this.lights.sun.shadow.camera.near = 0.5;
        this.lights.sun.shadow.camera.far = 80;
        const d = 25;
        this.lights.sun.shadow.camera.left = -d;
        this.lights.sun.shadow.camera.right = d;
        this.lights.sun.shadow.camera.top = d;
        this.lights.sun.shadow.camera.bottom = -d;
        this.lights.sun.shadow.bias = -0.0005;
        this.scene.add(this.lights.sun);

        // Subsurface Glow Light (Underground Fill)
        this.lights.undergroundGlow = new THREE.DirectionalLight(0x1e3a8a, 0.5);
        this.lights.undergroundGlow.position.set(0, -20, 0);
        this.scene.add(this.lights.undergroundGlow);

        // Emissive light for smart city accent
        this.lights.cityGlow = new THREE.HemisphereLight(0x06b6d4, 0x1e1b4b, 0.3);
        this.scene.add(this.lights.cityGlow);
    }

    setTheme(themeName) {
        const isLight = themeName === 'light';
        const bgColor = isLight ? 0xe2e8f0 : 0x060814;
        
        // Dynamic animation of Three.js background and fog
        gsap.to(this.scene.background, {
            r: ((bgColor >> 16) & 255) / 255,
            g: ((bgColor >> 8) & 255) / 255,
            b: (bgColor & 255) / 255,
            duration: 1.0
        });

        gsap.to(this.scene.fog.color, {
            r: ((bgColor >> 16) & 255) / 255,
            g: ((bgColor >> 8) & 255) / 255,
            b: (bgColor & 255) / 255,
            duration: 1.0
        });

        // Dynamic light transition
        const ambientHex = isLight ? 0xffffff : 0x0a1128;
        const ambientIntensity = isLight ? 0.95 : 0.6;
        gsap.to(this.lights.ambient.color, {
            r: ((ambientHex >> 16) & 255) / 255,
            g: ((ambientHex >> 8) & 255) / 255,
            b: (ambientHex & 255) / 255,
            duration: 1.0
        });
        gsap.to(this.lights.ambient, { intensity: ambientIntensity, duration: 1.0 });

        const sunHex = isLight ? 0xfffbeb : 0x7dd3fc;
        const sunIntensity = isLight ? 1.3 : 0.8;
        gsap.to(this.lights.sun.color, {
            r: ((sunHex >> 16) & 255) / 255,
            g: ((sunHex >> 8) & 255) / 255,
            b: (sunHex & 255) / 255,
            duration: 1.0
        });
        gsap.to(this.lights.sun, { intensity: sunIntensity, duration: 1.0 });

        const glowHex = isLight ? 0x93c5fd : 0x1e3a8a;
        const glowIntensity = isLight ? 0.3 : 0.5;
        gsap.to(this.lights.undergroundGlow.color, {
            r: ((glowHex >> 16) & 255) / 255,
            g: ((glowHex >> 8) & 255) / 255,
            b: (glowHex & 255) / 255,
            duration: 1.0
        });
        gsap.to(this.lights.undergroundGlow, { intensity: glowIntensity, duration: 1.0 });

        const cityGlowSky = isLight ? 0xe0f2fe : 0x06b6d4;
        const cityGlowGround = isLight ? 0xf1f5f9 : 0x1e1b4b;
        const cityGlowIntensity = isLight ? 0.35 : 0.3;
        
        gsap.to(this.lights.cityGlow.color, {
            r: ((cityGlowSky >> 16) & 255) / 255,
            g: ((cityGlowSky >> 8) & 255) / 255,
            b: (cityGlowSky & 255) / 255,
            duration: 1.0
        });
        gsap.to(this.lights.cityGlow.groundColor, {
            r: ((cityGlowGround >> 16) & 255) / 255,
            g: ((cityGlowGround >> 8) & 255) / 255,
            b: (cityGlowGround & 255) / 255,
            duration: 1.0
        });
        // Update globe materials if they exist
        if (this.globeMat && this.globeCoreMat) {
            const globeHex = isLight ? 0x0284c7 : 0x0ea5e9;
            const coreHex = isLight ? 0xcbd5e1 : 0x091e3a;
            
            gsap.to(this.globeMat.color, {
                r: ((globeHex >> 16) & 255) / 255,
                g: ((globeHex >> 8) & 255) / 255,
                b: (globeHex & 255) / 255,
                duration: 1.0
            });
            
            gsap.to(this.globeCoreMat.color, {
                r: ((coreHex >> 16) & 255) / 255,
                g: ((coreHex >> 8) & 255) / 255,
                b: (coreHex & 255) / 255,
                duration: 1.0
            });
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Smoothly animate the camera to a preset view
    animateCamera(targetPos, targetLookAt, duration = 1.5) {
        // Disable controls temporarily during animation
        this.controls.enabled = false;

        gsap.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: duration,
            ease: 'power2.inOut'
        });

        gsap.to(this.controls.target, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration: duration,
            ease: 'power2.inOut',
            onComplete: () => {
                this.controls.enabled = true;
            }
        });
    }

    buildGlobalNetwork() {
        this.globeGroup = new THREE.Group();
        this.globeGroup.name = 'globeGroup';
        this.scene.add(this.globeGroup);

        // 1. Digital Wireframe Globe
        const sphereGeo = new THREE.SphereGeometry(6, 24, 24);
        this.globeMat = new THREE.MeshBasicMaterial({
            color: 0x0ea5e9,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });
        const globeMesh = new THREE.Mesh(sphereGeo, this.globeMat);
        this.globeGroup.add(globeMesh);

        // Inner solid core representing water masses
        const coreGeo = new THREE.SphereGeometry(5.8, 24, 24);
        this.globeCoreMat = new THREE.MeshStandardMaterial({
            color: 0x091e3a,
            roughness: 0.5,
            metalness: 0.8,
            transparent: true,
            opacity: 0.45
        });
        const coreMesh = new THREE.Mesh(coreGeo, this.globeCoreMat);
        this.globeGroup.add(coreMesh);

        // 2. Abstract Geometric Landmasses
        const landMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            roughness: 0.7,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6
        });

        // 6 approximate lat/lon nodes for low-poly continents
        const landPositions = [
            { lat: 0.5, lon: -1.2, size: 1.8 },   // North America
            { lat: -0.4, lon: -0.9, size: 1.5 },  // South America
            { lat: 0.7, lon: 0.2, size: 2.1 },    // Europe / Eurasia
            { lat: 0.1, lon: 0.4, size: 1.7 },    // Africa
            { lat: -0.5, lon: 2.3, size: 1.4 },   // Australia
            { lat: -1.3, lon: 0, size: 1.6 }      // Antarctica
        ];

        landPositions.forEach(pos => {
            const geom = new THREE.IcosahedronGeometry(pos.size, 1);
            const land = new THREE.Mesh(geom, landMat);
            
            const r = 5.95;
            const phi = (90 - pos.lat * 90) * (Math.PI / 180);
            const theta = (pos.lon * 180) * (Math.PI / 180);

            land.position.set(
                -(r * Math.sin(phi) * Math.sin(theta)),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.cos(theta)
            );
            
            land.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.globeGroup.add(land);
        });

        // 3. Spawning Global Telemetry Nodes
        const cities = [
            { name: 'NEW YORK\nRisk: High Storm', lat: 0.45, lon: -0.8, color: 0xef4444 },
            { name: 'LONDON\nRisk: Active Sweep', lat: 0.58, lon: 0.0, color: 0xf59e0b },
            { name: 'TOKYO\nRisk: Operational', lat: 0.38, lon: 2.4, color: 0x10b981 },
            { name: 'SYDNEY\nRisk: Normal Flow', lat: -0.38, lon: 2.6, color: 0x10b981 },
            { name: 'CAIRO\nRisk: Dry Runoff', lat: 0.33, lon: 0.5, color: 0x10b981 }
        ];

        const nodePositions = [];

        cities.forEach(city => {
            const dotGeo = new THREE.SphereGeometry(0.18, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({ color: city.color, transparent: true, opacity: 0.9 });
            const dot = new THREE.Mesh(dotGeo, dotMat);

            const r = 6.0;
            const phi = (90 - city.lat * 90) * (Math.PI / 180);
            const theta = (city.lon * 180) * (Math.PI / 180);

            const pos = new THREE.Vector3(
                -(r * Math.sin(phi) * Math.sin(theta)),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.cos(theta)
            );
            dot.position.copy(pos);
            this.globeGroup.add(dot);
            nodePositions.push(pos);

            // Add floating billboarding label above node
            const label = this.createGlobalLabel(city.name, '#' + city.color.toString(16).padStart(6, '0'));
            label.position.copy(pos).multiplyScalar(1.22); // float above
            this.globeGroup.add(label);
        });

        // Add communicationBezier lines representing global flow routing networks
        const createArc = (start, end) => {
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            mid.normalize().multiplyScalar(7.2); // dome peak
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const points = curve.getPoints(20);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.45 });
            const line = new THREE.Line(lineGeo, lineMat);
            this.globeGroup.add(line);
        };

        if (nodePositions.length >= 2) {
            createArc(nodePositions[0], nodePositions[1]); // NY -> London
            createArc(nodePositions[1], nodePositions[2]); // London -> Tokyo
            createArc(nodePositions[2], nodePositions[3]); // Tokyo -> Sydney
            createArc(nodePositions[1], nodePositions[4]); // London -> Cairo
        }

        // Auto spin the global network
        this.registerTick((dt) => {
            if (this.globeGroup.visible) {
                this.globeGroup.rotation.y += dt * 0.05;
            }
        });
    }

    createGlobalLabel(text, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(6, 10, 24, 0.85)';
        ctx.fillRect(0, 0, 160, 80);
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, 154, 74);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = text.split('\n');
        ctx.fillText(lines[0], 80, 26);
        ctx.fillStyle = colorHex;
        ctx.font = 'bold 13px "Rajdhani", sans-serif';
        ctx.fillText(lines[1], 80, 52);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.8, 0.9, 1.0);
        return sprite;
    }

    setGroupOpacity(group, opacity) {
        group.traverse(child => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                    if (mat.userData.originalOpacity === undefined) {
                        mat.userData.originalOpacity = mat.opacity !== undefined ? mat.opacity : 1.0;
                        mat.transparent = true;
                    }
                    mat.opacity = mat.userData.originalOpacity * opacity;
                });
            } else if (child.isSprite && child.material) {
                if (child.material.userData.originalOpacity === undefined) {
                    child.material.userData.originalOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                    child.material.transparent = true;
                }
                child.material.opacity = child.material.userData.originalOpacity * opacity;
            } else if (child.isLine && child.material) {
                if (child.material.userData.originalOpacity === undefined) {
                    child.material.userData.originalOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                    child.material.transparent = true;
                }
                child.material.opacity = child.material.userData.originalOpacity * opacity;
            }
        });
    }


    // Register objects that need to animate per frame
    registerTick(callback) {
        this.ticks.push(callback);
    }

    // Start render loop
    start() {
        const clock = new THREE.Clock();

        const tick = () => {
            const deltaTime = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();

            this.controls.update();

            // Run camera distance cross-fade logic between global earth and local block model
            if (this.globeGroup) {
                const distance = this.camera.position.distanceTo(this.controls.target);
                const cityGroup = this.scene.getObjectByName('cityGroup');
                const drainageGroup = this.scene.getObjectByName('drainageGroup');

                const minCityDist = 14.0;
                const maxGlobeDist = 24.0;

                if (distance > maxGlobeDist) {
                    this.globeGroup.visible = true;
                    this.setGroupOpacity(this.globeGroup, 1.0);
                    
                    if (cityGroup) cityGroup.visible = false;
                    if (drainageGroup) drainageGroup.visible = false;
                } else if (distance < minCityDist) {
                    this.globeGroup.visible = false;
                    
                    if (cityGroup) {
                        cityGroup.visible = true;
                        this.setGroupOpacity(cityGroup, 1.0);
                    }
                    if (drainageGroup) {
                        drainageGroup.visible = true;
                        this.setGroupOpacity(drainageGroup, 1.0);
                    }
                } else {
                    // Transition phase
                    this.globeGroup.visible = true;
                    if (cityGroup) cityGroup.visible = true;
                    if (drainageGroup) drainageGroup.visible = true;

                    const t = (distance - minCityDist) / (maxGlobeDist - minCityDist);
                    this.setGroupOpacity(this.globeGroup, t);
                    if (cityGroup) this.setGroupOpacity(cityGroup, 1.0 - t);
                    if (drainageGroup) this.setGroupOpacity(drainageGroup, 1.0 - t);
                }
            }

            // Run registered updates
            for (const callback of this.ticks) {
                callback(deltaTime, elapsedTime);
            }

            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }
}

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
        this.isWelcomeActive = true;
        
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
        // Start camera at a perfect zoom distance (0, 0, 36) so the upscaled Earth fills the background
        this.camera.position.set(0, 0, 36);

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
        this.controls.maxPolarAngle = Math.PI; // Allow full unrestricted 3D orbit rotation (looking underground from below)
        this.controls.minDistance = 3;
        this.controls.maxDistance = 60;
        this.controls.target.set(0, 0, 0);

        // 5. Lighting setup
        this.setupLights();

        // 6. Global Network Setup
        this.buildGlobalNetwork();
        this.buildUniverse();

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

        // 1. 3D Stars Starfield Backdrop
        const starGeo = new THREE.BufferGeometry();
        const starCount = 600;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 90.0 + Math.random() * 60.0; // sphere shell distance
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i+2] = r * Math.cos(phi);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.28,
            transparent: true,
            opacity: 0.8
        });
        const stars = new THREE.Points(starGeo, starMat);
        this.globeGroup.add(stars);

        // 2. Procedural Geographic Earth Core (Upscaled to 8.5)
        const earthTexture = this.buildEarthTexture();
        this.globeCoreMat = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.45,
            metalness: 0.2,
            transparent: true,
            opacity: 0.95
        });
        
        const coreGeo = new THREE.SphereGeometry(8.4, 32, 32);
        const coreMesh = new THREE.Mesh(coreGeo, this.globeCoreMat);
        this.globeGroup.add(coreMesh);

        // 3. Volumetric Glowing Atmosphere Halo (Custom WebGL Fresnel Shader)
        const haloGeo = new THREE.SphereGeometry(8.65, 32, 32);
        const haloMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
                    gl_FragColor = vec4(0.06, 0.65, 0.95, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        this.globeGroup.add(haloMesh);

        // 4. Holographic Digital Grid Overlay
        const sphereGeo = new THREE.SphereGeometry(8.5, 24, 24);
        this.globeMat = new THREE.MeshBasicMaterial({
            color: 0x0ea5e9,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const globeMesh = new THREE.Mesh(sphereGeo, this.globeMat);
        this.globeGroup.add(globeMesh);

        // 5. Global flow pipes (glowing Tube meshes) and flow particles tracker
        this.globalParticles = [];

        const createArcPipe = (start, end, colorHex = 0x0ea5e9) => {
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            mid.normalize().multiplyScalar(9.8); // upscaled dome peak
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            
            // Render 3D Tube mesh representing a physical drainage pipe
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.05, 6, false);
            const tubeMat = new THREE.MeshBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.22,
                wireframe: true
            });
            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            this.globeGroup.add(tube);
            
            // Spawn 3 flowing particles inside this connection pipe
            for (let i = 0; i < 3; i++) {
                const particleMat = new THREE.MeshBasicMaterial({
                    color: 0x38bdf8,
                    transparent: true,
                    opacity: 0.9
                });
                const particle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), particleMat);
                
                this.globalParticles.push({
                    curve: curve,
                    t: (i / 3) + Math.random() * 0.08,
                    speed: 0.45,
                    mesh: particle
                });
                this.globeGroup.add(particle);
            }
        };

        // 6. Spawning 3D Map Balloon Pins and Radial Core Pipes
        const cities = [
            { name: 'NEW YORK\nRisk: High Storm', lat: 0.45, lon: -0.8, color: 0xef4444 },
            { name: 'LONDON\nRisk: Active Sweep', lat: 0.58, lon: 0.0, color: 0xf59e0b },
            { name: 'TOKYO\nRisk: Operational', lat: 0.38, lon: 2.4, color: 0x10b981 },
            { name: 'SYDNEY\nRisk: Normal Flow', lat: -0.38, lon: 2.6, color: 0x10b981 },
            { name: 'CAIRO\nRisk: Dry Runoff', lat: 0.33, lon: 0.5, color: 0x10b981 }
        ];

        const nodePositions = [];

        cities.forEach(city => {
            const rawName = city.name.split('\n')[0];
            const systemKey = rawName.toLowerCase().replace(' ', ''); // 'newyork', 'london', etc.

            // Create 3D Map Pin group
            const pin = this.create3DPin(city.color);
            
            // Add miniature underground drainage process components to the pin (extending downwards under the surface)
            // 1. Mini Filtration Chamber (Orange cylinder)
            const miniFilterGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.25, 8);
            const miniFilterMat = new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.6,
                wireframe: true
            });
            const miniFilter = new THREE.Mesh(miniFilterGeo, miniFilterMat);
            miniFilter.position.set(0, -0.6, 0); // below the cone pointer
            miniFilter.rotateX(Math.PI / 2);
            pin.add(miniFilter);

            // 2. Mini Emergency Storage Reservoir (Blue box)
            const miniTankGeo = new THREE.BoxGeometry(0.35, 0.45, 0.35);
            const miniTankMat = new THREE.MeshBasicMaterial({
                color: 0x0ea5e9,
                transparent: true,
                opacity: 0.55
            });
            const miniTank = new THREE.Mesh(miniTankGeo, miniTankMat);
            miniTank.position.set(0, -1.2, 0); // deeper underground
            pin.add(miniTank);

            // 3. Mini Reuse Garden / Aquifer (Green sphere)
            const miniGardenGeo = new THREE.SphereGeometry(0.22, 8, 8);
            const miniGardenMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.65,
                wireframe: true
            });
            const miniGarden = new THREE.Mesh(miniGardenGeo, miniGardenMat);
            miniGarden.position.set(0, -1.8, 0); // deepest core connector
            pin.add(miniGarden);
            
            // Tag the pin head mesh as interactive for the Raycaster click checks
            const pinHead = pin.getObjectByName('pinHead');
            if (pinHead) {
                pinHead.userData = {
                    isGlobalNode: true,
                    cityName: systemKey,
                    name: rawName
                };
            }

            const r = 8.4; // Sit on the surface of the upscaled core sphere
            const phi = (90 - city.lat * 90) * (Math.PI / 180);
            const theta = (city.lon * 180) * (Math.PI / 180);

            const pos = new THREE.Vector3(
                -(r * Math.sin(phi) * Math.sin(theta)),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.cos(theta)
            );
            pin.position.copy(pos);

            // Align pin to point outwards along the Earth sphere normal vector
            const normal = pos.clone().normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
            pin.quaternion.copy(quaternion);

            this.globeGroup.add(pin);
            nodePositions.push(pos);

            // Draw a radial drainage shaft pipe from center of Earth to the surface node
            const points = [new THREE.Vector3(0, 0, 0), pos.clone().multiplyScalar(0.96)];
            const radialCurve = new THREE.CatmullRomCurve3(points);
            const radialTubeGeo = new THREE.TubeGeometry(radialCurve, 10, 0.08, 6, false);
            const radialTubeMat = new THREE.MeshBasicMaterial({
                color: city.color,
                transparent: true,
                opacity: 0.18,
                wireframe: true
            });
            const radialTube = new THREE.Mesh(radialTubeGeo, radialTubeMat);
            this.globeGroup.add(radialTube);

            // Spawn 2 core-flow particles rising from center core to the surface
            for (let i = 0; i < 2; i++) {
                const particleMat = new THREE.MeshBasicMaterial({
                    color: city.color,
                    transparent: true,
                    opacity: 0.95
                });
                const particle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), particleMat);
                
                this.globalParticles.push({
                    curve: radialCurve,
                    t: (i / 2) + Math.random() * 0.1,
                    speed: 0.35,
                    mesh: particle
                });
                this.globeGroup.add(particle);
            }

            // Add floating billboarding label above node
            const label = this.createGlobalLabel(city.name, '#' + city.color.toString(16).padStart(6, '0'));
            // Position label further out along the normal vector
            label.position.copy(pos).add(normal.multiplyScalar(2.0));
            this.globeGroup.add(label);
        });

        if (nodePositions.length >= 2) {
            createArcPipe(nodePositions[0], nodePositions[1], 0xef4444); // NY -> London (Storm Red)
            createArcPipe(nodePositions[1], nodePositions[2], 0xf59e0b); // London -> Tokyo (Warning Orange)
            createArcPipe(nodePositions[2], nodePositions[3], 0x10b981); // Tokyo -> Sydney (Normal Green)
            createArcPipe(nodePositions[1], nodePositions[4], 0x10b981); // London -> Cairo (Normal Green)
        }

        // Auto spin the global network and animate flowing particles along pipes
        this.registerTick((dt) => {
            if (this.globeGroup.visible) {
                this.globeGroup.rotation.y += dt * 0.04;
                
                // Animate global flow particles along the curves
                this.globalParticles.forEach(p => {
                    p.t += dt * p.speed;
                    if (p.t > 1.0) p.t = 0.0;
                    
                    const pPos = p.curve.getPointAt(p.t);
                    p.mesh.position.copy(pPos);
                });
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

    create3DPin(colorHex) {
        const pinGroup = new THREE.Group();
        
        // 1. Balloon Pin Head (Sphere)
        const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.35,
            metalness: 0.7,
            roughness: 0.2
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.name = 'pinHead'; // for Raycaster intersection target
        head.position.y = 0.55;
        pinGroup.add(head);

        // 2. Pin Cone (pointing down)
        const coneGeo = new THREE.ConeGeometry(0.12, 0.3, 12);
        coneGeo.rotateX(Math.PI);
        const coneMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.7,
            roughness: 0.2
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.4;
        pinGroup.add(cone);

        // 3. Pin Stem (Cylinder connection)
        const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8, // silver metal stem
            metalness: 0.9,
            roughness: 0.1
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.2;
        pinGroup.add(stem);

        return pinGroup;
    }

    buildEarthTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Draw deep ocean blue background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1024, 512);

        // Draw subtle longitude / latitude grid overlays
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1024; x += 64) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        }
        for (let y = 0; y < 512; y += 64) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
        }

        // Draw simplified geographic continent paths
        ctx.fillStyle = '#10b981'; // Green continents

        const drawLand = (coords) => {
            if (coords.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(coords[0][0], coords[0][1]);
            for (let i = 1; i < coords.length; i++) {
                ctx.lineTo(coords[i][0], coords[i][1]);
            }
            ctx.closePath();
            ctx.fill();
        };

        // Coordinates scaled to 1024x512 projection:
        // North America
        drawLand([
            [100, 80], [220, 60], [320, 100], [300, 180], [260, 200], 
            [220, 180], [180, 160], [140, 150], [120, 110]
        ]);
        // Greenland
        drawLand([
            [350, 40], [420, 30], [400, 80], [360, 80]
        ]);
        // South America
        drawLand([
            [250, 210], [320, 210], [340, 250], [310, 320], [280, 420], 
            [260, 420], [250, 320], [230, 260]
        ]);
        // Africa
        drawLand([
            [460, 210], [530, 190], [600, 240], [620, 320], [580, 420], 
            [540, 420], [500, 310], [440, 260]
        ]);
        // Europe & Asia (Eurasia)
        drawLand([
            [420, 120], [520, 80], [640, 60], [800, 60], [920, 80], 
            [900, 180], [820, 220], [740, 210], [700, 250], [620, 240], 
            [580, 180], [520, 180], [460, 150]
        ]);
        // India
        drawLand([
            [680, 210], [710, 210], [700, 240]
        ]);
        // Indochina / SE Asia
        drawLand([
            [760, 210], [800, 210], [790, 260], [770, 260]
        ]);
        // Australia
        drawLand([
            [800, 320], [900, 320], [920, 380], [820, 380]
        ]);
        // Antarctica
        drawLand([
            [50, 480], [974, 480], [974, 505], [50, 505]
        ]);

        return new THREE.CanvasTexture(canvas);
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
            if (this.isWelcomeActive) {
                // Keep universe visible and everything else hidden
                if (this.universeGroup) this.universeGroup.visible = true;
                if (this.globeGroup) this.globeGroup.visible = false;
                const cityGroup = this.scene.getObjectByName('cityGroup');
                const drainageGroup = this.scene.getObjectByName('drainageGroup');
                if (cityGroup) cityGroup.visible = false;
                if (drainageGroup) drainageGroup.visible = false;
            } else if (this.globeGroup) {
                const distance = this.camera.position.distanceTo(this.controls.target);
                const cityGroup = this.scene.getObjectByName('cityGroup');
                const drainageGroup = this.scene.getObjectByName('drainageGroup');

                const minCityDist = 18.0;
                const maxGlobeDist = 34.0;

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

    buildUniverse() {
        this.universeGroup = new THREE.Group();
        this.universeGroup.name = 'universeGroup';
        this.scene.add(this.universeGroup);

        // 1. Central Core Sun/BlackHole Glow
        const coreGeo = new THREE.SphereGeometry(1.6, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a, // bright gold core
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.universeGroup.add(core);

        // 2. Orbiting Planets
        this.planets = [];
        const planetConfigs = [
            { radius: 6.0, size: 0.35, color: 0x38bdf8, speed: 0.5 },  // Blue planet
            { radius: 10.0, size: 0.55, color: 0xf43f5e, speed: 0.35 }, // Red planet
            { radius: 14.0, size: 0.45, color: 0x10b981, speed: 0.25 }  // Green planet
        ];
        planetConfigs.forEach(config => {
            const planetGeo = new THREE.SphereGeometry(config.size, 16, 16);
            const planetMat = new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.6,
                metalness: 0.1,
                transparent: true,
                opacity: 1.0
            });
            const planet = new THREE.Mesh(planetGeo, planetMat);
            planet.userData = { config, angle: Math.random() * Math.PI * 2 };
            this.universeGroup.add(planet);
            this.planets.push(planet);

            // Orbit path ring line
            const ringGeo = new THREE.RingGeometry(config.radius - 0.05, config.radius + 0.05, 64);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x1e293b,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.25
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            this.universeGroup.add(ring);
        });

        // 3. Spiral Galaxy Particle System (4,000 stars)
        const starCount = 4000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        const colorCore = new THREE.Color('#fcd34d'); // Gold core
        const colorInner = new THREE.Color('#db2777'); // Magenta inner arms
        const colorOuter = new THREE.Color('#06b6d4'); // Cyan outer arms

        const arms = 3;
        for (let i = 0; i < starCount; i++) {
            const r = Math.random() * 26.0; // Distance from center
            const armIndex = i % arms;
            const theta = (armIndex * (2.0 * Math.PI / arms)) + (r * 0.22); // Spiral angle offset

            // Random dispersion to make it a volumetric cloud
            const randomX = (Math.random() - 0.5) * 1.4 * (1.0 + r * 0.08);
            const randomY = (Math.random() - 0.5) * 0.6 * (1.0 + r * 0.04);
            const randomZ = (Math.random() - 0.5) * 1.4 * (1.0 + r * 0.08);

            const x = Math.cos(theta) * r + randomX;
            const y = randomY;
            const z = Math.sin(theta) * r + randomZ;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Interpolate color based on distance
            let mixedColor = colorCore.clone();
            if (r < 8.0) {
                mixedColor.lerp(colorInner, r / 8.0);
            } else {
                mixedColor.copy(colorInner).lerp(colorOuter, (r - 8.0) / 18.0);
            }

            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        const galaxyGeo = new THREE.BufferGeometry();
        galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const galaxyMat = new THREE.PointsMaterial({
            size: 0.16,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const galaxyPoints = new THREE.Points(galaxyGeo, galaxyMat);
        this.universeGroup.add(galaxyPoints);

        // Register tick handler to rotate universe and animate orbiting planets
        this.registerTick((dt) => {
            if (this.universeGroup.visible) {
                this.universeGroup.rotation.y += dt * 0.02;
                
                // Orbit planets
                this.planets.forEach(p => {
                    const cfg = p.userData.config;
                    p.userData.angle += dt * cfg.speed;
                    p.position.set(
                        Math.cos(p.userData.angle) * cfg.radius,
                        0,
                        Math.sin(p.userData.angle) * cfg.radius
                    );
                    p.rotation.y += dt * 0.8;
                });
            }
        });
    }
}

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

        // 6. Event listeners
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
        gsap.to(this.lights.cityGlow, { intensity: cityGlowIntensity, duration: 1.0 });
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

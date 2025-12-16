import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- Configuration ---
const PARTICLE_COUNT = 2000;
const SPHERE_RADIUS = 800;
const ROTATION_SPEED = 0.0005;

// --- State ---
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// --- Init Canvas ---
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 1000;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: "high-performance" }); // Antialias off for post-processing usually
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;

// --- Post Processing ---
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.15; // Raised threshold to avoid blooming dark background
bloomPass.strength = 1.0; // Slightly reduced strength
bloomPass.radius = 0.5;

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- Custom Shaders ---

const vertexShader = `
uniform float uTime;
uniform float uPixelRatio;

attribute float aScale;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
    vColor = aColor;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aScale * uPixelRatio * (800.0 / -mvPosition.z);
    
    // Simple pulse
    float pulse = sin(uTime * 2.0 + position.x * 0.01) * 0.5 + 0.5;
    vAlpha = 0.5 + 0.5 * pulse; 
}
`;

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft edge glow
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, vAlpha * glow);
}
`;

// --- Geometry: Particle Network ---
const geometry = new THREE.BufferGeometry();
const positions = [];
const colors = [];
const scales = [];

const color1 = new THREE.Color(0x00ffff); // Cyan
const color2 = new THREE.Color(0xaa00ff); // Purple
const color3 = new THREE.Color(0x0055ff); // Blue

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = SPHERE_RADIUS * Math.cbrt(Math.random());

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);

    // Random size
    scales.push(Math.random() * 30 + 10);

    // Gradient Color Mix based on position (or random)
    const mixedColor = color1.clone().lerp(color2, Math.random());
    if (Math.random() > 0.5) mixedColor.lerp(color3, Math.random());

    colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
geometry.setAttribute('aScale', new THREE.Float32BufferAttribute(scales, 1));

const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(geometry, material);
const group = new THREE.Group();
group.add(particlesMesh);

// --- Dark 3D Object (Icosahedron) ---
const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS * 0.7, 2); // Slightly smaller than particles
const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222, // Dark Grey
    wireframe: true,
    transparent: true,
    opacity: 0.1 // Very subtle
});
const sphereMesh = new THREE.Mesh(sphereGeometry, wireframeMaterial);
group.add(sphereMesh);

// Inner Core for depth
const coreGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS * 0.6, 1);
const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
group.add(coreMesh);


scene.add(group);


// --- Interaction ---
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.0005; // Reduced sensitivity
    mouseY = (event.clientY - window.innerHeight / 2) * 0.0005;
});

// UI Navigation (Existing Logic)
const navButtons = document.querySelectorAll('nav button');
const panels = document.querySelectorAll('.panel');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    });
});

// --- Certificate Modal Logic (Existing Logic) ---
const modal = document.getElementById('cert-modal');
const modalImg = document.getElementById('cert-image');
const closeBtn = document.querySelector('.close-modal');
const viewButtons = document.querySelectorAll('.view-cert-btn');

viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const certSrc = btn.getAttribute('data-cert');
        modalImg.src = certSrc;
        modal.classList.add('active');
    });
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => { modalImg.src = ''; }, 400);
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => { modalImg.src = ''; }, 400);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
    }
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Uniform Update
    material.uniforms.uTime.value = elapsedTime;

    // Smooth Rotation
    targetRotationY += (mouseX - targetRotationY) * 0.03;
    targetRotationX += (mouseY - targetRotationX) * 0.03;

    group.rotation.y += ROTATION_SPEED + targetRotationY * 0.2;
    group.rotation.x += targetRotationX * 0.2;

    // Gentle Float
    group.position.y = Math.sin(elapsedTime * 0.3) * 15;

    // Render via Composer (includes Bloom)
    composer.render();

    requestAnimationFrame(animate);
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight); // Important for bloom
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
});

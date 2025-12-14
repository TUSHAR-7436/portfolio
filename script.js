import * as THREE from 'three';

// --- Configuration ---
const PARTICLE_COUNT = 1500;
const CONNECTION_DISTANCE = 100;
const SPHERE_RADIUS = 800;
const ROTATION_SPEED = 0.001;

// --- State ---
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// --- Init Canvas ---
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
// Add some fog for depth
scene.fog = new THREE.FogExp2(0x050505, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 1000;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Geometry: Particle Network ---
// We will create a BufferGeometry with points scattered on a sphere surface or volume
const geometry = new THREE.BufferGeometry();
const positions = [];
const velocity = []; // For subtle internal movement (optional)

for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random position within a sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = SPHERE_RADIUS * Math.cbrt(Math.random()); // Cube root for even distribution inside

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

// 1. Points Material
const particlesMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 3,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
});

const particlesMesh = new THREE.Points(geometry, particlesMaterial);
scene.add(particlesMesh);

// 2. Lines (Wait, computing connections for 1500 points every frame is CPU heavy)
// Let's create a static wireframe or a simpler secondary object for lines to keep it high performance
// Or we can just render the points as a cool cloud.
// The reference has lines. Let's make a smaller subset for lines to keep FPS high.

const linesGeometry = new THREE.BufferGeometry();
const linePositions = [];
const reducedCount = 300; // Only connect a subset

// Just create random connections between the first N points
for (let i = 0; i < reducedCount; i++) {
    for (let j = i + 1; j < reducedCount; j++) {
        const p1 = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        const p2 = new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);

        if (p1.distanceTo(p2) < CONNECTION_DISTANCE * 2) {
            linePositions.push(p1.x, p1.y, p1.z);
            linePositions.push(p2.x, p2.y, p2.z);
        }
    }
}
linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.15
});
const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
// Parent both to a group so they rotate together
const group = new THREE.Group();
group.add(particlesMesh);
group.add(linesMesh);
scene.add(group);


// --- Interaction ---
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.001;
});

// UI Navigation
const navButtons = document.querySelectorAll('nav button');
const panels = document.querySelectorAll('.panel');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;

        // Update Nav
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Panels
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');

        // Visual: Zoom camera slightly on interaction
        // (Just a simple effect)
    });
});


// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Constant rotation
    group.rotation.y += ROTATION_SPEED;

    // Mouse interaction ease-in
    targetRotationY += (mouseX - targetRotationY) * 0.05;
    targetRotationX += (mouseY - targetRotationX) * 0.05;

    group.rotation.y += targetRotationY * 0.5;
    group.rotation.x += targetRotationX * 0.5;

    // Gentle floating
    group.position.y = Math.sin(elapsedTime * 0.5) * 20;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

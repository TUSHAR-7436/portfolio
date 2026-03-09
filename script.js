import * as THREE from 'three';

// --- Configuration ---
const PARTICLE_COUNT = 800; // Fewer particles for a cleaner look
const MAX_DISTANCE = 150; // Distance for drawing lines between particles

// --- State ---
let mouseX = 0;
let mouseY = 0;

// --- Init Canvas ---
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Very dark gray, matches CSS --bg-color
scene.fog = new THREE.FogExp2(0x050505, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 400;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Geometry: Elegant Particle Network ---
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = [];

for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 1000;
    particlePositions[i + 1] = (Math.random() - 0.5) * 1000;
    particlePositions[i + 2] = (Math.random() - 0.5) * 1000;
    
    particleVelocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2
    });
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

// Particle Material
const particleMaterial = new THREE.PointsMaterial({
    color: 0x888888, // Subtle grey/white
    size: 2,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Lines Geometry (Network effect)
const linesGeometry = new THREE.BufferGeometry();
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff, // Cyan accent from CSS
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
});

const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
scene.add(linesMesh);

// --- Interaction ---
document.addEventListener('mousemove', (event) => {
    // Normalize mouse coordinates for subtle camera movement
    mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
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
const modalFrame = document.getElementById('cert-frame');
const closeBtn = document.querySelector('.close-modal');
const viewButtons = document.querySelectorAll('.view-cert-btn');

viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const certSrc = btn.getAttribute('data-cert');

        // Check file extension
        if (certSrc.toLowerCase().endsWith('.pdf')) {
            modalImg.style.display = 'none';
            modalFrame.style.display = 'block';
            modalFrame.src = certSrc;
        } else {
            modalFrame.style.display = 'none';
            modalImg.style.display = 'block';
            modalImg.src = certSrc;
        }

        modal.classList.add('active');
    });
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => {
        modalImg.src = '';
        modalFrame.src = '';
    }, 400);
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modalImg.src = '';
            modalFrame.src = '';
        }, 400);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
    }
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Subtle camera movement based on mouse
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    // Slow, constant rotation of the entire system
    particleSystem.rotation.y += 0.001;
    linesMesh.rotation.y += 0.001;

    // Update particle positions
    const positions = particleSystem.geometry.attributes.position.array;
    
    // Arrays for lines
    const linePositions = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Move particles
        positions[i * 3] += particleVelocities[i].x;
        positions[i * 3 + 1] += particleVelocities[i].y;
        positions[i * 3 + 2] += particleVelocities[i].z;
        
        // Wrap around bounds
        if (positions[i * 3] > 500) positions[i * 3] = -500;
        if (positions[i * 3] < -500) positions[i * 3] = 500;
        if (positions[i * 3 + 1] > 500) positions[i * 3 + 1] = -500;
        if (positions[i * 3 + 1] < -500) positions[i * 3 + 1] = 500;
        if (positions[i * 3 + 2] > 500) positions[i * 3 + 2] = -500;
        if (positions[i * 3 + 2] < -500) positions[i * 3 + 2] = 500;
        
        // Connect particles that are close to each other
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distSq = dx * dx + dy * dy + dz * dz;
            
            if (distSq < MAX_DISTANCE * MAX_DISTANCE) {
                linePositions.push(
                    positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                    positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                );
            }
        }
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    
    // Update lines
    linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    renderer.render(scene, camera);
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

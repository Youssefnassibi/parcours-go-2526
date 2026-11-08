// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e27);
scene.fog = new THREE.Fog(0x0a0e27, 100, 1000);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Remove loading screen when ready
document.querySelector('.loading').style.display = 'none';

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0xff00ff, 2, 200);
pointLight1.position.set(50, 50, 50);
pointLight1.castShadow = true;
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00ffff, 1.5, 200);
pointLight2.position.set(-50, 30, -50);
pointLight2.castShadow = true;
scene.add(pointLight2);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create universe objects
class UniverseObject {
    constructor(position, size, color, speed = 0) {
        this.position = position;
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.mesh = null;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationAxis = new THREE.Vector3(
            Math.random(),
            Math.random(),
            Math.random()
        ).normalize();
    }

    create(geometry, name) {
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.6,
            roughness: 0.3,
            emissive: new THREE.Color(this.color).multiplyScalar(0.3)
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.scale.set(this.size, this.size, this.size);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.name = name;
        this.mesh.userData.object = this;

        return this.mesh;
    }

    update() {
        if (this.mesh && this.speed > 0) {
            this.mesh.rotation.x += this.speed * 0.001;
            this.mesh.rotation.y += this.speed * 0.002;
            this.mesh.rotation.z += this.speed * 0.0015;
        }
    }
}

// Create celestial bodies
const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 4);
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100);

const objects = [
    new UniverseObject(
        new THREE.Vector3(0, 0, 0),
        8,
        0xff00ff,
        3
    ).create(sphereGeometry, 'Noyau Primaire'),

    new UniverseObject(
        new THREE.Vector3(40, 0, 0),
        4,
        0x00ffff,
        2
    ).create(icosahedronGeometry, 'Planète Cyan'),

    new UniverseObject(
        new THREE.Vector3(-40, 20, 0),
        3,
        0xffff00,
        2.5
    ).create(sphereGeometry, 'Étoile Jaune'),

    new UniverseObject(
        new THREE.Vector3(0, 40, 30),
        5,
        0xff6600,
        1.8
    ).create(icosahedronGeometry, 'Astre Orange'),

    new UniverseObject(
        new THREE.Vector3(-30, -30, 40),
        2.5,
        0x00ff00,
        3.5
    ).create(sphereGeometry, 'Cristal Vert'),

    new UniverseObject(
        new THREE.Vector3(50, -20, -40),
        3,
        0xff0088,
        2.2
    ).create(torusGeometry, 'Anneau Rose'),
];

objects.forEach(obj => scene.add(obj));

// Orbital rings
const ringMaterial = new THREE.LineBasicMaterial({ color: 0x0f0, linewidth: 1, transparent: true, opacity: 0.3 });

const createOrbit = (radius) => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(
            new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            )
        );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, ringMaterial);
};

scene.add(createOrbit(40));
scene.add(createOrbit(50));

// Star field
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const positions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2000;
    positions[i + 1] = (Math.random() - 0.5) * 2000;
    positions[i + 2] = (Math.random() - 0.5) * 2000;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Camera controller
const cameraController = {
    velocity: new THREE.Vector3(),
    speed: 0.5,
    keys: {},

    update() {
        this.velocity.set(0, 0, 0);
        const direction = new THREE.Vector3();

        if (this.keys['w'] || this.keys['z']) direction.z -= 1;
        if (this.keys['s']) direction.z += 1;
        if (this.keys['a'] || this.keys['q']) direction.x -= 1;
        if (this.keys['d']) direction.x += 1;
        if (this.keys[' ']) direction.y += 1;
        if (this.keys['control']) direction.y -= 1;

        if (direction.length() > 0) {
            direction.normalize();
            const moveVector = new THREE.Vector3();
            moveVector.copy(direction).applyQuaternion(camera.quaternion);
            this.velocity.add(moveVector.multiplyScalar(this.speed));
        }

        camera.position.add(this.velocity);
    },

    setSpeed(delta) {
        this.speed = Math.max(0.1, Math.min(5, this.speed + delta));
    },

    getSpeed() {
        return this.velocity.length();
    }
};

// Input handling
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    cameraController.keys[key] = true;
    if (key === 'control') cameraController.keys['control'] = true;
    if (e.code === 'Space') cameraController.keys[' '] = true;

    if (e.key === '+' || e.key === '=') cameraController.setSpeed(0.2);
    if (e.key === '-') cameraController.setSpeed(-0.2);
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    cameraController.keys[key] = false;
    if (e.code === 'Space') cameraController.keys[' '] = false;
});

// Mouse controls
let mouseDown = false;
const mouse = { x: 0, y: 0, dx: 0, dy: 0 };

document.addEventListener('mousedown', () => { mouseDown = true; });
document.addEventListener('mouseup', () => { mouseDown = false; });

document.addEventListener('mousemove', (e) => {
    if (mouseDown) {
        mouse.dx = e.movementX * 0.005;
        mouse.dy = e.movementY * 0.005;
    }
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

// Raycaster for object detection
const raycaster = new THREE.Raycaster();
const mouse3d = new THREE.Vector2();

// Stats
let frameCount = 0;
let lastTime = performance.now();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    cameraController.update();

    // Update rotation
    if (mouseDown) {
        camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), mouse.dx);
        camera.rotateOnWorldAxis(camera.getWorldDirection(new THREE.Vector3()).cross(new THREE.Vector3(0, 1, 0)), mouse.dy);
    }

    // Update objects
    objects.forEach(obj => obj.update());

    // Raycasting
    mouse3d.set(0, 0);
    raycaster.setFromCamera(mouse3d, camera);
    const intersects = raycaster.intersectObjects(objects);

    let focusName = 'Univers';
    if (intersects.length > 0) {
        focusName = intersects[0].object.userData.name || 'Univers';
    }

    // Update HUD
    document.getElementById('pos').textContent =
        `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
    document.getElementById('focus').textContent = focusName;
    document.getElementById('speed').textContent = cameraController.getSpeed().toFixed(2);

    // FPS counter
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        document.getElementById('fps').textContent = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }

    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// U-SEA 3D Immersive Experience
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001a4d);
scene.fog = new THREE.Fog(0x001a4d, 200, 1000);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 25, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Remove loading
setTimeout(() => {
    document.querySelector('.loading').style.display = 'none';
}, 1000);

// Ocean lights
const ambientLight = new THREE.AmbientLight(0x4488ff, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(100, 100, 50);
sunLight.castShadow = true;
scene.add(sunLight);

const underwaterLight1 = new THREE.PointLight(0x00ffff, 2, 300);
underwaterLight1.position.set(80, 30, 0);
scene.add(underwaterLight1);

const underwaterLight2 = new THREE.PointLight(0x0088ff, 1.5, 250);
underwaterLight2.position.set(-80, 20, -80);
scene.add(underwaterLight2);

// Ocean water plane
const waterGeometry = new THREE.PlaneGeometry(500, 500);
const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a6b99,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x0044aa,
    emissiveIntensity: 0.2
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0;
water.receiveShadow = true;
scene.add(water);

// Ocean floor
const floorGeometry = new THREE.PlaneGeometry(500, 500);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a3a4a,
    roughness: 0.8
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -80;
floor.receiveShadow = true;
scene.add(floor);

// Service vessels & structures
class ServiceElement {
    constructor(position, scale, color, type, name) {
        this.position = position;
        this.scale = scale;
        this.color = color;
        this.type = type;
        this.name = name;
        this.mesh = null;
        this.particles = [];
    }

    create() {
        let geometry;

        if (this.type === 'fishing') {
            // Fishing vessel
            geometry = new THREE.BoxGeometry(this.scale, this.scale * 0.6, this.scale * 2);
        } else if (this.type === 'naval') {
            // Naval engineering structure
            geometry = new THREE.ConeGeometry(this.scale, this.scale * 2, 8);
        } else if (this.type === 'logistics') {
            // Logistics container/dock
            geometry = new THREE.BoxGeometry(this.scale * 2, this.scale, this.scale);
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.7,
            roughness: 0.3,
            emissive: new THREE.Color(this.color).multiplyScalar(0.4)
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { name: this.name, type: this.type };

        return this.mesh;
    }

    update() {
        if (this.mesh) {
            this.mesh.rotation.y += 0.003;
            this.mesh.position.y += Math.sin(Date.now() * 0.001) * 0.05;
        }
    }
}

// Create service elements
const services = [
    new ServiceElement(
        new THREE.Vector3(0, 20, 0),
        8,
        0xff6b35,
        'fishing',
        '🐟 PÊCHE DURABLE'
    ).create(),

    new ServiceElement(
        new THREE.Vector3(50, 25, 30),
        7,
        0x0088ff,
        'naval',
        '⛴️ INGÉNIERIE NAVALE'
    ).create(),

    new ServiceElement(
        new THREE.Vector3(-50, 20, 40),
        6,
        0x00d4ff,
        'logistics',
        '🚢 LOGISTIQUE'
    ).create(),

    new ServiceElement(
        new THREE.Vector3(30, -40, -50),
        5,
        0xffaa00,
        'fishing',
        '🌊 AGADIR MAROC'
    ).create()
];

services.forEach(s => scene.add(s));

// Fish school (particles)
const createFishSchool = () => {
    const fishGroup = new THREE.Group();
    const fishCount = 50;

    for (let i = 0; i < fishCount; i++) {
        const fishGeometry = new THREE.ConeGeometry(0.8, 2, 4);
        const fishMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.4, 0.8, 0.5),
            metalness: 0.8,
            roughness: 0.2
        });
        const fish = new THREE.Mesh(fishGeometry, fishMaterial);

        fish.position.set(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 100 - 20,
            (Math.random() - 0.5) * 150
        );

        fish.rotation.z = Math.random() * Math.PI * 2;
        fish.userData = {
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01,
            radius: Math.random() * 40 + 20
        };

        fishGroup.add(fish);
    }

    return fishGroup;
};

const fishSchool = createFishSchool();
scene.add(fishSchool);

// Animate fish
const updateFishSchool = () => {
    fishSchool.children.forEach((fish, idx) => {
        const data = fish.userData;
        data.angle += data.speed;

        fish.position.x = Math.cos(data.angle) * data.radius;
        fish.position.z = Math.sin(data.angle) * data.radius;
        fish.position.y += Math.sin(Date.now() * 0.0005 + idx) * 0.02;

        fish.rotation.y = data.angle;
    });
};

// Bubbles
const createBubbles = () => {
    const bubbles = [];
    for (let i = 0; i < 30; i++) {
        const bubbleGeometry = new THREE.SphereGeometry(
            Math.random() * 0.5 + 0.2,
            8,
            8
        );
        const bubbleMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.4,
            metalness: 0.6,
            roughness: 0.1
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);

        bubble.position.set(
            (Math.random() - 0.5) * 200,
            Math.random() * 100 - 50,
            (Math.random() - 0.5) * 200
        );

        bubble.userData = {
            originY: bubble.position.y,
            speed: Math.random() * 0.05 + 0.02
        };

        bubbles.push(bubble);
        scene.add(bubble);
    }
    return bubbles;
};

const bubbles = createBubbles();

const updateBubbles = () => {
    bubbles.forEach(bubble => {
        bubble.position.y += bubble.userData.speed;
        bubble.position.x += Math.sin(Date.now() * 0.0003) * 0.02;

        if (bubble.position.y > 100) {
            bubble.position.y = -80;
        }
    });
};

// Agadir port reference
const portLight = new THREE.PointLight(0xffaa00, 2, 200);
portLight.position.set(0, 40, -100);
scene.add(portLight);

// Camera controller
const controller = {
    velocity: new THREE.Vector3(),
    speed: 0.4,
    keys: {},

    update() {
        this.velocity.set(0, 0, 0);
        const dir = new THREE.Vector3();

        if (this.keys['w'] || this.keys['z']) dir.z -= 1;
        if (this.keys['s']) dir.z += 1;
        if (this.keys['a'] || this.keys['q']) dir.x -= 1;
        if (this.keys['d']) dir.x += 1;
        if (this.keys[' ']) dir.y += 1;
        if (this.keys['control']) dir.y -= 1;

        if (dir.length() > 0) {
            dir.normalize();
            const moveVec = new THREE.Vector3();
            moveVec.copy(dir).applyQuaternion(camera.quaternion);
            this.velocity.add(moveVec.multiplyScalar(this.speed));
        }

        camera.position.add(this.velocity);

        // Clamp camera height
        camera.position.y = Math.max(-70, Math.min(100, camera.position.y));
    },

    getSpeed() {
        return this.velocity.length();
    }
};

// Input
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    controller.keys[key] = true;
    if (e.code === 'Space') controller.keys[' '] = true;
    if (e.key === '+' || e.key === '=') controller.speed = Math.min(1.5, controller.speed + 0.2);
    if (e.key === '-') controller.speed = Math.max(0.1, controller.speed - 0.2);
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    controller.keys[key] = false;
    if (e.code === 'Space') controller.keys[' '] = false;
});

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

// Raycaster
const raycaster = new THREE.Raycaster();

// Stats
let frameCount = 0;
let lastTime = performance.now();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controller.update();

    if (mouseDown) {
        camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), mouse.dx);
        camera.rotateOnWorldAxis(
            camera.getWorldDirection(new THREE.Vector3()).cross(new THREE.Vector3(0, 1, 0)),
            mouse.dy
        );
    }

    services.forEach(s => {
        s.rotation.y += 0.004;
        s.position.y += Math.sin(Date.now() * 0.001) * 0.03;
    });

    updateFishSchool();
    updateBubbles();

    // Raycasting for focus
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(services);

    let focus = 'Océan U-SEA';
    if (intersects.length > 0) {
        focus = intersects[0].object.userData.name;
    }

    // HUD Update
    document.getElementById('pos').textContent =
        `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
    document.getElementById('focus').textContent = focus;
    document.getElementById('speed').textContent = controller.getSpeed().toFixed(2);

    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        document.getElementById('fps').textContent = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

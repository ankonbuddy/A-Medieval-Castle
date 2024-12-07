import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls;
let trees = [];
const treeTextures = {};
const foregroundTextures = {};
let directionalLight, bridge;
let isBridgeRaised = false;
let timeOfDay = 0;
let sun, moon;
let dayPhases = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk', 'Night'];

init();
animate();

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB);
    document.body.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Initially set bright light
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    const loader = new THREE.TextureLoader();
    treeTextures['summer'] = loader.load('summer_tree.png');
    foregroundTextures['summer'] = loader.load('summer_foreground.JPG');
    
    addTrees('summer');
    addForeground('summer');
    
    addCliffs();
    addCastle();
    addRiver();
    addDrawbridge();
    
    addSunAndMoon();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', onMouseClick);
    document.addEventListener('keydown', onKeyDown);
}

function addTrees(season) {
    trees.forEach(tree => scene.remove(tree));
    trees = [];
    
    const numTrees = 40;
    const treeGeometry = new THREE.PlaneGeometry(20, 40);
    const treeMaterial = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });

    const castleBoundary = 40;
    
    for (let i = 0; i < numTrees; i++) {
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        
        let x, z;
        do {
            x = Math.random() * 300 - 150;
            z = Math.random() * 300 - 150;
        } while (Math.abs(x) < castleBoundary && Math.abs(z) < castleBoundary);
        
        tree.position.set(x, -5, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        tree.material.map = treeTextures[season];
        trees.push(tree);
        scene.add(tree);
    }
}

function addForeground(season) {
    const groundMaterial = new THREE.MeshBasicMaterial({ map: foregroundTextures[season] });
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.set(0, -25, 0);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
}

function addCliffs() {
    const gltfLoader = new GLTFLoader();
    const castleBoundary = 40;
    
    gltfLoader.load('models/cliff/scene.gltf', (gltf) => {
        for (let i = 0; i < 8; i++) {
            const cliff = gltf.scene.clone();
            
            let x, z;
            do {
                x = Math.random() * 300 - 150;
                z = Math.random() * 300 - 150;
            } while (Math.abs(x) < castleBoundary && Math.abs(z) < castleBoundary);

            cliff.position.set(x, -20, z);
            cliff.scale.set(100, 100, 100);
            scene.add(cliff);
        }
    });
}

function addCastle() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('models/castle/scene.gltf', (gltf) => {
        const castle = gltf.scene;
        castle.position.set(0, -25, 0);
        castle.scale.set(150, 150, 150);
        scene.add(castle);
    });
}

function addRiver() {
    const riverGeometry = new THREE.RingGeometry(50, 60, 32);
    const riverMaterial = new THREE.MeshBasicMaterial({ color: 0x00008b, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const river = new THREE.Mesh(riverGeometry, riverMaterial);
    
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -24.9, 0);
    
    scene.add(river);
}

function addDrawbridge() {
    const bridgeGeometry = new THREE.BoxGeometry(10, 1, 60);
    const bridgeMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    
    bridge.position.set(0, -24.5, 55);
    bridge.rotation.x = 0;
    scene.add(bridge);
}

function addSunAndMoon() {
    const sunGeometry = new THREE.SphereGeometry(15, 32, 32); // Increased size of sun
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 100, -150); // Push sun behind the castle
    scene.add(sun);

    const moonGeometry = new THREE.SphereGeometry(15, 32, 32); // Increased size of moon
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(0, 100, -150); // Push moon behind the castle
    scene.add(moon);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick() {
    if (!isBridgeRaised) {
        raiseBridge();
    } else {
        lowerBridge();
    }
}

function raiseBridge() {
    if (bridge.rotation.x === 0) {
        bridge.rotation.x = Math.PI / 2;
        isBridgeRaised = true;
    }
}

function lowerBridge() {
    if (bridge.rotation.x === Math.PI / 2) {
        bridge.rotation.x = 0;
        isBridgeRaised = false;
    }
}

function animateDayNightCycle() {
    const skyColors = [
        0xffcc99, // Dawn
        0x87CEEB, // Morning
        0x0000ff, // Noon
        0x87CEFA, // Afternoon
        0xff4500, // Dusk
        0x000022  // Night
    ];

    timeOfDay = (timeOfDay + 0.01) % 6;
    const phaseIndex = Math.floor(timeOfDay);
    renderer.setClearColor(skyColors[phaseIndex]);

    sun.visible = (timeOfDay >= 1 && timeOfDay < 4); // Sun visible from morning to afternoon
    moon.visible = (timeOfDay >= 5 || timeOfDay < 1); // Moon visible from dusk to dawn

    adjustLightBasedOnPhase(phaseIndex);
    displayPhase(phaseIndex);
}

function adjustLightBasedOnPhase(phaseIndex) {
    // Bright light during day, dimmer light at dawn and dusk, almost off during night
    if (phaseIndex === 5 || phaseIndex === 0) { // Night and Dawn
        directionalLight.intensity = 0.1; // Very dim light
    } else if (phaseIndex === 4) { // Dusk
        directionalLight.intensity = 0.3; // Medium dim light
    } else { // Morning, Noon, Afternoon
        directionalLight.intensity = 1; // Full bright light
    }
}

function displayPhase(phaseIndex) {
    const phaseText = `Phase: ${dayPhases[phaseIndex]}`;

    const textElement = document.getElementById('phase-display');
    if (!textElement) {
        const div = document.createElement('div');
        div.id = 'phase-display';
        div.style.position = 'absolute';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.fontSize = '32px';
        div.style.color = 'white';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.zIndex = 1;
        document.body.appendChild(div);
    }

    document.getElementById('phase-display').innerHTML = phaseText;
}


function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            camera.position.z -= 2; // Move camera forward
            break;
        case 'ArrowDown':
            camera.position.z += 2; // Move camera backward
            break;
        case 'ArrowLeft':
            camera.position.x -= 2; // Move camera left
            break;
        case 'ArrowRight':
            camera.position.x += 2; // Move camera right
            break;
        case '+':
            camera.position.y -= 2; // Zoom in
            break;
        case '-':
            camera.position.y += 2; // Zoom out
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    animateDayNightCycle();
    renderer.render(scene, camera);
}
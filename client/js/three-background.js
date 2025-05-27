// Vérification de Three.js
if (typeof THREE === 'undefined') {
    console.error('Three.js n\'est pas chargé. Arrêt de l\'initialisation.');
    throw new Error('Three.js non chargé');
}

// Vérification du canvas
const canvas = document.querySelector('#bg-canvas');
if (!canvas) {
    console.error('Canvas non trouvé. Arrêt de l\'initialisation.');
    throw new Error('Canvas non trouvé');
}

console.log('Initialisation de Three.js...');

// Configuration de la scène Three.js
const scene = new THREE.Scene();
console.log('Scène créée');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

// Configuration du renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
console.log('Renderer et caméra configurés');

// Variables pour le suivi de la souris
const mouse = {
    x: 0,
    y: 0,
    target: { x: 0, y: 0 }
};

// Test de rendu simple
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
console.log('Cube de test ajouté à la scène');

// Animation simple pour tester
function animate() {
    requestAnimationFrame(animate);
    
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Fenêtre redimensionnée');
});

// Démarrage de l'animation
console.log('Démarrage de l\'animation');
animate();

// Si tout s'est bien passé
console.log('Initialisation Three.js terminée avec succès'); 
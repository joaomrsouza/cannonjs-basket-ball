import * as CANNON from "cannon-es";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

// Scene setup
const scene = new THREE.Scene();
scene.background = createGradientTexture();

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 60, 300);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Helper Axis
// const axesHelper = new THREE.AxesHelper(100); // Length of the axes
// scene.add(axesHelper);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Cannon.js World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// ==================================================================

let points = 0;

let boxBody;
let boxMesh;
let pointBoxBody;

// Load the .obj model
const objLoader = new OBJLoader();
const object = await objLoader.loadAsync("assets/open_box.obj");

async function createBox() {
  // The model has loaded
  boxMesh = object.children[0]; // Assuming the first child is the mesh
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  const boxMaterial = new THREE.MeshStandardMaterial({ color: "#e5c886" });
  boxMesh.material = boxMaterial;
  scene.add(boxMesh);

  // Get the geometry
  const geometry = boxMesh.geometry;

  let indices;
  if (geometry.index) {
    indices = geometry.index.array;
  } else {
    // If the geometry is not indexed, create an index buffer
    const positions = geometry.attributes.position.array;
    const numVertices = positions.length / 3;
    indices = [];
    for (let i = 0; i < numVertices; i++) {
      indices.push(i);
    }
    geometry.setIndex(indices);
    indices = geometry.index.array;
  }

  // Create vertices and indices for Cannon.js Trimesh
  const vertices = geometry.attributes.position.array;

  boxBody = new CANNON.Body({
    mass: 0, // Static body
    shape: new CANNON.Trimesh(vertices, indices),
  });

  pointBoxBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(10, 10, 10)),
  });

  // Position and orient the Cannon.js body
  boxBody.position.copy(boxMesh.position);
  boxBody.quaternion.copy(boxMesh.quaternion);
  pointBoxBody.position.copy(boxMesh.position);
  pointBoxBody.quaternion.copy(boxMesh.quaternion);

  world.addBody(boxBody);
  world.addBody(pointBoxBody);
}
createBox();

const apples = [];
const maxApples = 200;
// Load apple texture
const appleTexture = new THREE.TextureLoader().load(
  "assets/textures/apple.jpg"
);

// Ball creation function
function createBall(skip = false) {
  if (apples.length >= maxApples) return;

  const appleRadius = 3;
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 500,
    250,
    (Math.random() - 0.5) * 25
  );

  const appleGeometry = new THREE.SphereGeometry(appleRadius);
  const appleMaterial = new THREE.MeshLambertMaterial({
    map: appleTexture,
  });
  const appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);
  appleMesh.castShadow = true;
  appleMesh.receiveShadow = true;

  const appleBody = new CANNON.Body({
    mass: 1,
    position,
    shape: new CANNON.Sphere(appleRadius),
    material: new CANNON.Material({ restitution: 0 }),
  });

  if (skip) return;

  scene.add(appleMesh);
  world.addBody(appleBody);

  apples.push({ mesh: appleMesh, body: appleBody });
  updateApplesEle();
}
// Work around a bug
createBall(true);

let mouseX = 0;
document.addEventListener("mousemove", (event) => {
  mouseX = (event.clientX / window.innerWidth) * 1000 - 500; // Map to -5 to 5 range
});

let emitterTimeout;
pointBoxBody.addEventListener("collide", (evt) => {
  const appleIndex = apples.findIndex((a) => a.body.id === evt.body.id);
  if (appleIndex === -1) return;

  const apple = apples[appleIndex];

  scene.remove(apple.mesh);
  world.removeBody(apple.body);
  apples.splice(appleIndex, 1);

  emitter.enable();
  emitterTimeout && clearTimeout(emitterTimeout);
  emitterTimeout = setTimeout(() => emitter.disable(), 50);

  points++;
  updatePointsEle();
});

// Creating particle group
let particleGroup;
let emitter;
function initParticles() {
  particleGroup = new SPE.Group({
    texture: {
      value: THREE.ImageUtils.loadTexture("assets/textures/smokeparticle.png"),
    },
  });

  emitter = new SPE.Emitter({
    maxAge: {
      value: 2,
    },
    position: {
      value: new THREE.Vector3(0, 0, 0),
      spread: new THREE.Vector3(25, 0, 25),
    },

    acceleration: {
      value: new THREE.Vector3(0, -10, 0),
      spread: new THREE.Vector3(10, 0, 10),
    },

    velocity: {
      value: new THREE.Vector3(0, 25, 0),
      spread: new THREE.Vector3(10, 7.5, 10),
    },

    color: {
      value: [new THREE.Color("green"), new THREE.Color("green")],
    },

    size: {
      value: 5,
    },

    particleCount: 2000,
  });

  emitter.disable();
  particleGroup.addEmitter(emitter);
  scene.add(particleGroup.mesh);
}
initParticles();

// Create the counters in screen
const pointsEle = document.createElement("div");
pointsEle.style.position = "absolute";
pointsEle.style.top = "20px";
pointsEle.style.left = "20px";
pointsEle.style.fontSize = "24px";
pointsEle.style.color = "white";
pointsEle.style.fontFamily = "Arial, sans-serif";
document.body.appendChild(pointsEle);

const applesEle = document.createElement("div");
applesEle.style.position = "absolute";
applesEle.style.top = "48px";
applesEle.style.left = "20px";
applesEle.style.fontSize = "24px";
applesEle.style.color = "white";
applesEle.style.fontFamily = "Arial, sans-serif";
document.body.appendChild(applesEle);

// Update points counter
function updatePointsEle() {
  pointsEle.innerText = `Pontos: ${points}`;
}
updatePointsEle();

// Update apple counter
function updateApplesEle() {
  applesEle.innerText = `Maçãs: ${apples.length}/${maxApples}`;
}
updateApplesEle();

// Animation loop
let fixedTimeStep = 1.0 / 60; // seconds
function animate() {
  requestAnimationFrame(animate);

  // Update Cannon.js world
  world.step(fixedTimeStep);

  boxBody.position.x = mouseX;
  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);
  pointBoxBody.position.copy(boxBody.position);
  pointBoxBody.quaternion.copy(boxBody.quaternion);

  const emitterPos = new THREE.Vector3().copy(boxBody.position);
  emitterPos.y = 30;

  emitter.position.value = emitterPos;

  particleGroup.tick(0.02);

  // Update ball positions
  apples.forEach((ball, index) => {
    ball.mesh.position.copy(ball.body.position);
    ball.mesh.quaternion.copy(ball.body.quaternion);

    // Remove balls that fall off screen
    if (ball.body.position.y < -350) {
      scene.remove(ball.mesh);
      world.removeBody(ball.body);
      apples.splice(index, 1);
      createBall(); // Create a new ball
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

setInterval(createBall, 1000);

function createGradientTexture() {
  const size = 512; // Size of the texture
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  // Create a linear gradient
  const gradient = context.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, "#1626b1");
  gradient.addColorStop(1, "#92c4fb");

  // Fill the canvas with the gradient
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  // Flip the canvas by rotating the context
  context.translate(size / 2, size / 2); // Move to the center
  context.rotate(Math.PI / 2); // Rotate 90 degrees (in radians)
  context.drawImage(canvas, -size / 2, -size / 2); // Draw the original canvas

  // Create a texture from the canvas
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true; // Update the texture
  return texture;
}

// Update camera and renderer on window resize
window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

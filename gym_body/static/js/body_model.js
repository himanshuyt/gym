// ----- three.js scene -------------------------------------------------
const canvas = document.getElementById('model-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45,
    canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// light
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
scene.add(hemi);
scene.add(new THREE.DirectionalLight(0xffffff, 0.8));

// ----- load model ------------------------------------------------------
const loader = new THREE.GLTFLoader();
loader.load(
    // → you can host the model elsewhere; keep the same file name
    '/static/models/human_body.glb',
    gltf => {
        const model = gltf.scene;
        model.traverse(node => {
            if (node.isMesh) {
                node.material = new THREE.MeshStandardMaterial({
                    color: 0x0f3460,
                    metalness: 0.1,
                    roughness: 0.8
                });
                // Ensure each mesh has a unique name that matches a muscle,
                // e.g. "Biceps", "Quadriceps", etc.
            }
        });
        scene.add(model);
    },
    undefined,
    err => console.error('Failed to load model', err)
);

// ----- raycaster for clicks --------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const muscle = mesh.name;               // <- must be set in the model
        if (muscle) {
            // redirect to the video list for the detected muscle
            window.location.href = `/videos/${encodeURIComponent(muscle)}`;
        }
    }
}
canvas.addEventListener('click', onClick);

// ----- animation loop --------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// ----- responsive resize -----------------------------------------------
window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});
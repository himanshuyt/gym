/**
     * Gym Freak - 3D 360° Interactive Anatomical Muscle Model
     * 100% Self-Contained, Zero CDN Failures, Zero Lag
     */

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('webglContainer');
        if (!container || typeof THREE === 'undefined') {
            console.error('Three.js container or library missing');
            return;
        }

        // ----------------------------------------------------
        // 1. Scene, Camera, Renderer Setup
        // ----------------------------------------------------
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x06080e, 0.08);

        const width = container.clientWidth || 700;
        const height = container.clientHeight || 720;

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50);
        camera.position.set(0, 0.25, 4.2);

        const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        // ----------------------------------------------------
        // 2. Dynamic Gym Studio Lighting (Neon Rim Highlights)
        // ----------------------------------------------------
        const ambientLight = new THREE.AmbientLight(0x1a2436, 2.0);
        scene.add(ambientLight);

        // Key front light
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
        keyLight.position.set(0, 3, 4);
        scene.add(keyLight);

        // Neon Cyan Rim Light (Left)
        const cyanRim = new THREE.DirectionalLight(0x00f2fe, 3.5);
        cyanRim.position.set(-4, 1.5, 1);
        scene.add(cyanRim);

        // Neon Violet/Pink Rim Light (Right Back)
        const pinkRim = new THREE.DirectionalLight(0x9d4edd, 3.0);
        pinkRim.position.set(4, 1.5, -2);
        scene.add(pinkRim);

        // ----------------------------------------------------
        // 3. Glowing Studio Pedestal Base
        // ----------------------------------------------------
        const pedestalGroup = new THREE.Group();
        const ringGeo = new THREE.RingGeometry(1.05, 1.18, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = -1.95;
        pedestalGroup.add(ringMesh);

        const innerDiskGeo = new THREE.CircleGeometry(1.02, 48);
        const innerDiskMat = new THREE.MeshBasicMaterial({ color: 0x08101e, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        const innerDisk = new THREE.Mesh(innerDiskGeo, innerDiskMat);
        innerDisk.rotation.x = Math.PI / 2;
        innerDisk.position.y = -1.96;
        pedestalGroup.add(innerDisk);
        scene.add(pedestalGroup);

        // ----------------------------------------------------
        // 4. Build Realistic Anatomical 3D Body Mesh
        // ----------------------------------------------------
        const bodyPivot = new THREE.Group();
        scene.add(bodyPivot);

        const clickableMeshes = [];

        function createMuscleMaterial(baseColorHex) {
            return new THREE.MeshStandardMaterial({
                color: baseColorHex,
                roughness: 0.35,
                metalness: 0.65,
                emissive: 0x000000,
                emissiveIntensity: 0.0
            });
        }

        const boneMat = new THREE.MeshStandardMaterial({ color: 0x111624, roughness: 0.5, metalness: 0.5 });

        function addMuscleMesh(geo, mat, name, pos, rot, scale = [1, 1, 1]) {
            const mesh = new THREE.Mesh(geo, mat.clone());
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
            mesh.userData = {
                muscleName: name,
                defaultColor: mesh.material.color.getHex(),
                defaultEmissive: 0x000000
            };
            bodyPivot.add(mesh);
            clickableMeshes.push(mesh);
            return mesh;
        }

        // --- Head & Neck ---
        const headGeo = new THREE.SphereGeometry(0.24, 32, 28);
        headGeo.scale(0.85, 1.15, 0.95);
        const headMesh = new THREE.Mesh(headGeo, boneMat);
        headMesh.position.set(0, 1.74, 0);
        bodyPivot.add(headMesh);

        const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.22, 24);
        const neckMesh = new THREE.Mesh(neckGeo, boneMat);
        neckMesh.position.set(0, 1.48, -0.01);
        bodyPivot.add(neckMesh);

        // --- Trapezius (Traps) ---
        const trapMat = createMuscleMaterial(0x1e273b);
        const trapGeo = new THREE.ConeGeometry(0.38, 0.32, 4);
        addMuscleMesh(trapGeo, trapMat, "Traps", [0, 1.44, -0.05], [0, Math.PI / 4, Math.PI], [1.3, 0.9, 0.8]);

        // --- UPPER CHEST (Clavicular Head) ---
        const upperChestMat = createMuscleMaterial(0x00d2ff);
        const upperChestGeo = new THREE.BoxGeometry(0.25, 0.13, 0.16);
        addMuscleMesh(upperChestGeo, upperChestMat, "Upper Chest", [-0.15, 1.25, 0.12], [0.15, -0.1, 0.08]);
        addMuscleMesh(upperChestGeo, upperChestMat, "Upper Chest", [0.15, 1.25, 0.12], [0.15, 0.1, -0.08]);

        // --- MID / LOWER CHEST (Sternal Head) ---
        const midChestMat = createMuscleMaterial(0x0096c7);
        const midChestGeo = new THREE.BoxGeometry(0.26, 0.20, 0.18);
        addMuscleMesh(midChestGeo, midChestMat, "Chest", [-0.15, 1.08, 0.14], [0.05, -0.08, 0.05]);
        addMuscleMesh(midChestGeo, midChestMat, "Chest", [0.15, 1.08, 0.14], [0.05, 0.08, -0.05]);

        // --- SHOULDERS: FRONT, SIDE & REAR DELTS ---
        const frontDeltMat = createMuscleMaterial(0x7209b7);
        const sideDeltMat = createMuscleMaterial(0x560bad);
        const rearDeltMat = createMuscleMaterial(0x480ca8);

        const deltGeo = new THREE.SphereGeometry(0.16, 24, 20);
        deltGeo.scale(1.0, 1.25, 1.0);

        // Left Shoulders
        addMuscleMesh(deltGeo, frontDeltMat, "Front Delts", [-0.38, 1.25, 0.08], [0.2, 0, 0.2]);
        addMuscleMesh(deltGeo, sideDeltMat, "Side Delts", [-0.44, 1.23, -0.02], [0, 0, 0.3]);
        addMuscleMesh(deltGeo, rearDeltMat, "Rear Delts", [-0.38, 1.23, -0.12], [-0.2, 0, 0.2]);

        // Right Shoulders
        addMuscleMesh(deltGeo, frontDeltMat, "Front Delts", [0.38, 1.25, 0.08], [0.2, 0, -0.2]);
        addMuscleMesh(deltGeo, sideDeltMat, "Side Delts", [0.44, 1.23, -0.02], [0, 0, -0.3]);
        addMuscleMesh(deltGeo, rearDeltMat, "Rear Delts", [0.38, 1.23, -0.12], [-0.2, 0, -0.2]);

        // --- BICEPS (Front Arms) ---
        const bicepMat = createMuscleMaterial(0x3a86ff);
        const bicepGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 20);
        bicepGeo.scale(1.15, 1, 0.95);
        addMuscleMesh(bicepGeo, bicepMat, "Biceps", [-0.46, 0.92, 0.04], [0, 0, 0.12]);
        addMuscleMesh(bicepGeo, bicepMat, "Biceps", [0.46, 0.92, 0.04], [0, 0, -0.12]);

        // --- TRICEPS (Back of Arms) ---
        const tricepMat = createMuscleMaterial(0x4361ee);
        const tricepGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.34, 20);
        addMuscleMesh(tricepGeo, tricepMat, "Triceps", [-0.46, 0.92, -0.08], [0, 0, 0.12]);
        addMuscleMesh(tricepGeo, tricepMat, "Triceps", [0.46, 0.92, -0.08], [0, 0, -0.12]);

        // --- FOREARMS ---
        const forearmMat = createMuscleMaterial(0x232e42);
        const forearmGeo = new THREE.CylinderGeometry(0.08, 0.055, 0.40, 20);
        addMuscleMesh(forearmGeo, forearmMat, "Forearms", [-0.52, 0.52, 0.01], [0, 0, 0.18]);
        addMuscleMesh(forearmGeo, forearmMat, "Forearms", [0.52, 0.52, 0.01], [0, 0, -0.18]);

        // Hands
        const handGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const handL = new THREE.Mesh(handGeo, boneMat);
        handL.position.set(-0.58, 0.28, 0);
        const handR = new THREE.Mesh(handGeo, boneMat);
        handR.position.set(0.58, 0.28, 0);
        bodyPivot.add(handL, handR);

        // --- UPPER ABS & CORE ---
        const upperAbMat = createMuscleMaterial(0x00f5d4);
        const abGeo = new THREE.BoxGeometry(0.12, 0.10, 0.10);
        addMuscleMesh(abGeo, upperAbMat, "Upper Abs", [-0.07, 0.92, 0.13]);
        addMuscleMesh(abGeo, upperAbMat, "Upper Abs", [0.07, 0.92, 0.13]);
        addMuscleMesh(abGeo, upperAbMat, "Upper Abs", [-0.07, 0.80, 0.12]);
        addMuscleMesh(abGeo, upperAbMat, "Upper Abs", [0.07, 0.80, 0.12]);

        // --- LOWER ABS ---
        const lowerAbMat = createMuscleMaterial(0x06d6a0);
        addMuscleMesh(abGeo, lowerAbMat, "Lower Abs", [-0.065, 0.68, 0.11]);
        addMuscleMesh(abGeo, lowerAbMat, "Lower Abs", [0.065, 0.68, 0.11]);

        // --- OBLIQUES ---
        const obliqueMat = createMuscleMaterial(0x192a3e);
        const obliqueGeo = new THREE.BoxGeometry(0.11, 0.32, 0.14);
        addMuscleMesh(obliqueGeo, obliqueMat, "Obliques", [-0.21, 0.80, 0.06], [0, 0.2, 0.1]);
        addMuscleMesh(obliqueGeo, obliqueMat, "Obliques", [0.21, 0.80, 0.06], [0, -0.2, -0.1]);

        // --- LATS (Latissimus Dorsi Wings) ---
        const latMat = createMuscleMaterial(0x1d3557);
        const latGeo = new THREE.CylinderGeometry(0.18, 0.10, 0.44, 16);
        latGeo.scale(1.2, 1, 0.6);
        addMuscleMesh(latGeo, latMat, "Lats", [-0.24, 0.96, -0.09], [0, -0.2, -0.2]);
        addMuscleMesh(latGeo, latMat, "Lats", [0.24, 0.96, -0.09], [0, 0.2, 0.2]);

        // --- UPPER BACK (Rhomboids) ---
        const upperBackMat = createMuscleMaterial(0x283852);
        const upperBackGeo = new THREE.BoxGeometry(0.26, 0.24, 0.12);
        addMuscleMesh(upperBackGeo, upperBackMat, "Upper Back", [0, 1.15, -0.14], [-0.1, 0, 0]);

        // --- LOWER BACK ---
        const lowerBackMat = createMuscleMaterial(0x1c2738);
        const lowerBackGeo = new THREE.BoxGeometry(0.18, 0.28, 0.11);
        addMuscleMesh(lowerBackGeo, lowerBackMat, "Lower Back", [0, 0.72, -0.11], [0.05, 0, 0]);

        // Pelvis Core
        const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.24, 24);
        const pelvis = new THREE.Mesh(pelvisGeo, boneMat);
        pelvis.position.set(0, 0.48, 0);
        bodyPivot.add(pelvis);

        // --- GLUTES ---
        const gluteMat = createMuscleMaterial(0x560bad);
        const gluteGeo = new THREE.SphereGeometry(0.18, 24, 20);
        gluteGeo.scale(1.0, 1.15, 1.05);
        addMuscleMesh(gluteGeo, gluteMat, "Glutes", [-0.15, 0.38, -0.12], [-0.1, 0, 0.15]);
        addMuscleMesh(gluteGeo, gluteMat, "Glutes", [0.15, 0.38, -0.12], [-0.1, 0, -0.15]);

        // --- QUADRICEPS ---
        const quadMat = createMuscleMaterial(0x0077b6);
        const quadGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.65, 24);
        quadGeo.scale(1.1, 1, 1.05);
        addMuscleMesh(quadGeo, quadMat, "Quads", [-0.18, -0.02, 0.05], [0.05, 0, -0.06]);
        addMuscleMesh(quadGeo, quadMat, "Quads", [0.18, -0.02, 0.05], [0.05, 0, 0.06]);

        // --- HAMSTRINGS ---
        const hamMat = createMuscleMaterial(0x023e8a);
        const hamGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.62, 24);
        addMuscleMesh(hamGeo, hamMat, "Hamstrings", [-0.18, -0.04, -0.08], [-0.05, 0, -0.05]);
        addMuscleMesh(hamGeo, hamMat, "Hamstrings", [0.18, -0.04, -0.08], [-0.05, 0, 0.05]);

        // Knees
        const kneeGeo = new THREE.SphereGeometry(0.10, 16, 16);
        const kneeL = new THREE.Mesh(kneeGeo, boneMat);
        kneeL.position.set(-0.18, -0.42, 0);
        const kneeR = new THREE.Mesh(kneeGeo, boneMat);
        kneeR.position.set(0.18, -0.42, 0);
        bodyPivot.add(kneeL, kneeR);

        // --- CALVES ---
        const calfMat = createMuscleMaterial(0x0096c7);
        const calfGeo = new THREE.CylinderGeometry(0.12, 0.075, 0.62, 20);
        calfGeo.scale(1.15, 1, 1.1);
        addMuscleMesh(calfGeo, calfMat, "Calves", [-0.18, -0.82, -0.02], [-0.04, 0, -0.02]);
        addMuscleMesh(calfGeo, calfMat, "Calves", [0.18, -0.82, -0.02], [-0.04, 0, 0.02]);

        // Feet
        const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.26);
        const footL = new THREE.Mesh(footGeo, boneMat);
        footL.position.set(-0.18, -1.22, 0.06);
        const footR = new THREE.Mesh(footGeo, boneMat);
        footR.position.set(0.18, -1.22, 0.06);
        bodyPivot.add(footL, footR);

        // --- Face: eyes, nose, smile, ears ---
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x8fb8d8, roughness: 0.5, metalness: 0.3 });
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.2 });
        const eyeGeo = new THREE.SphereGeometry(0.036, 16, 12);
        const pupilGeo = new THREE.SphereGeometry(0.018, 12, 10);
        [-1, 1].forEach(side => {
            const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
            eye.position.set(side * 0.08, 1.80, 0.195);
            const pupil = new THREE.Mesh(pupilGeo, pupilMat);
            pupil.position.set(side * 0.08, 1.80, 0.226);
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 12), skinMat);
            ear.scale.set(0.45, 1, 0.75);
            ear.position.set(side * 0.208, 1.74, -0.01);
            bodyPivot.add(eye, pupil, ear);
        });
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.08, 12), skinMat);
        nose.rotation.x = Math.PI / 2;
        nose.position.set(0, 1.735, 0.245);
        bodyPivot.add(nose);
        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xff5d8f, roughness: 0.4 }));
        smile.rotation.z = Math.PI;
        smile.position.set(0, 1.685, 0.215);
        bodyPivot.add(smile);

        bodyPivot.position.y = 0.15;

        // ----------------------------------------------------
        // 5. Touch + Mouse Orbit Controls, Hover & Tap Picking
        // ----------------------------------------------------
        let isDragging = false;
        let downPos = { x: 0, y: 0 };
        let downTime = 0;
        let previousPos = { x: 0, y: 0 };
        let velocity = { x: 0, y: 0 };
        let targetRotationY = 0;
        let isTweening = false;
        let needsPick = false;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(-999, -999);
        let hoveredMesh = null;
        let tappedMuscle = null;
        let tooltipTimer = null;
        const hudTooltip = document.getElementById('hudTooltip');
        const muscleCounts = window.INITIAL_MUSCLE_COUNTS || {};
        const domEl = renderer.domElement;
        domEl.style.touchAction = 'none';

        // Tapping the name label opens the videos (touch)
        hudTooltip.addEventListener('click', () => {
            if (!tappedMuscle) return;
            const name = tappedMuscle;
            tappedMuscle = null;
            clearTimeout(tooltipTimer);
            setHover(null);
            if (window.openMuscleVideos) window.openMuscleVideos(name);
        });

        function setMouseFromEvent(e) {
            const rect = domEl.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function pickMesh() {
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObjects(clickableMeshes, false);
            return hits.length ? hits[0].object : null;
        }

        function placeTooltip(x, y) {
            const half = 90;
            hudTooltip.style.left = `${Math.max(half, Math.min(window.innerWidth - half, x))}px`;
            hudTooltip.style.top = `${Math.max(60, y)}px`;
        }

        function setHover(mesh, x, y) {
            if (hoveredMesh && hoveredMesh !== mesh) {
                hoveredMesh.material.emissive.setHex(0x000000);
                hoveredMesh.material.emissiveIntensity = 0.0;
            }
            hoveredMesh = mesh;
            if (mesh) {
                mesh.material.emissive.setHex(0x00f2fe);
                mesh.material.emissiveIntensity = 0.95;
                const name = mesh.userData.muscleName;
                const count = muscleCounts[name] || 0;
                hudTooltip.innerHTML = `<span>${name}</span><span class="badge-count">${count} Workouts</span>`;
                placeTooltip(x, y);
                hudTooltip.classList.add('active');
            } else {
                hudTooltip.classList.remove('active');
            }
        }

        domEl.addEventListener('pointerdown', (e) => {
            isDragging = true;
            isTweening = false;
            downPos = { x: e.clientX, y: e.clientY };
            downTime = performance.now();
            previousPos = { x: e.clientX, y: e.clientY };
            velocity = { x: 0, y: 0 };
            try { domEl.setPointerCapture(e.pointerId); } catch (_) {}
            domEl.style.cursor = 'grabbing';
        });

        domEl.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'mouse' && !isDragging) {
                setMouseFromEvent(e);
                placeTooltip(e.clientX, e.clientY);
                needsPick = true;
            }
            if (!isDragging) return;

            const deltaX = e.clientX - previousPos.x;
            const deltaY = e.clientY - previousPos.y;
            bodyPivot.rotation.y += deltaX * 0.009;
            bodyPivot.rotation.x = Math.max(-0.25, Math.min(0.25, bodyPivot.rotation.x + deltaY * 0.004));
            velocity = { x: deltaX * 0.009, y: deltaY * 0.004 };
            previousPos = { x: e.clientX, y: e.clientY };
        });

        function endPointer(e, cancelled) {
            if (!isDragging) return;
            isDragging = false;
            try { domEl.releasePointerCapture(e.pointerId); } catch (_) {}
            domEl.style.cursor = 'grab';
            if (cancelled) return;

            const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
            const isTap = dist < 10 && (performance.now() - downTime) < 600;
            if (!isTap) return;

            velocity = { x: 0, y: 0 };
            setMouseFromEvent(e);
            const mesh = pickMesh();

            if (e.pointerType === 'mouse') {
                if (mesh) {
                    setHover(mesh, e.clientX, e.clientY);
                    if (window.openMuscleVideos) window.openMuscleVideos(mesh.userData.muscleName);
                }
                return;
            }

            // Touch: 1st tap shows name, 2nd tap on same muscle opens videos
            clearTimeout(tooltipTimer);
            if (!mesh) {
                tappedMuscle = null;
                setHover(null);
                return;
            }
            const name = mesh.userData.muscleName;
            if (tappedMuscle === name) {
                tappedMuscle = null;
                setHover(null);
                if (window.openMuscleVideos) window.openMuscleVideos(name);
                return;
            }
            tappedMuscle = name;
            setHover(mesh, e.clientX, e.clientY);
            tooltipTimer = setTimeout(() => {
                tappedMuscle = null;
                setHover(null);
            }, 5000);
        }

        domEl.addEventListener('pointerup', (e) => endPointer(e, false));
        domEl.addEventListener('pointercancel', (e) => endPointer(e, true));
        domEl.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse' && !isDragging) setHover(null);
        });

        function hoverPick() {
            const mesh = pickMesh();
            if (mesh !== hoveredMesh) {
                setHover(mesh, parseFloat(hudTooltip.style.left) || 0, parseFloat(hudTooltip.style.top) || 0);
                domEl.style.cursor = mesh ? 'pointer' : 'grab';
            }
        }

        // ----------------------------------------------------
        // 7. Front & Back Camera Smooth Rotation
        // ----------------------------------------------------
        const btnFront = document.getElementById('btnFront');
        const btnBack = document.getElementById('btnBack');

        function animateToRotation(targetY) {
            targetRotationY = targetY;
            isTweening = true;
        }

        if (btnFront && btnBack) {
            btnFront.addEventListener('click', () => {
                btnFront.classList.add('active');
                btnBack.classList.remove('active');
                animateToRotation(0);
            });

            btnBack.addEventListener('click', () => {
                btnBack.classList.add('active');
                btnFront.classList.remove('active');
                animateToRotation(Math.PI);
            });
        }

        // ----------------------------------------------------
        // 8. Render & Animation Loop
        // ----------------------------------------------------
        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });

        let clock = 0;
        function animate() {
            requestAnimationFrame(animate);
            clock += 0.015;

            if (isTweening) {
                let diff = targetRotationY - bodyPivot.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                bodyPivot.rotation.y += diff * 0.12;
                bodyPivot.rotation.x += (0 - bodyPivot.rotation.x) * 0.12;

                if (Math.abs(diff) < 0.01) {
                    bodyPivot.rotation.y = targetRotationY;
                    bodyPivot.rotation.x = 0;
                    isTweening = false;
                }
            } else if (!isDragging) {
                bodyPivot.rotation.y += velocity.x;
                bodyPivot.rotation.x = Math.max(-0.25, Math.min(0.25, bodyPivot.rotation.x + velocity.y));
                velocity.x *= 0.92;
                velocity.y *= 0.92;
            }

            bodyPivot.position.y = 0.15 + Math.sin(clock) * 0.025;
            pedestalGroup.rotation.z = clock * 0.15;

            if (needsPick && !isDragging) { needsPick = false; hoverPick(); }
            renderer.render(scene, camera);
        }
        animate();
    });
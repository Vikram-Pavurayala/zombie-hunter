import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";

// Add loading manager
const loadingManager = new THREE.LoadingManager();
let loadingScreen;
// Add collision objects array to store all obstacles
const collisionObjects = [];

// Add boundary radius for the island
const islandRadius = 145; // Match with the grass field outer radius
// Create and show loading screen
function createLoadingScreen() {
    loadingScreen = document.createElement("div");
    loadingScreen.style.position = "fixed";
    loadingScreen.style.top = "0";
    loadingScreen.style.left = "0";
    loadingScreen.style.width = "100%";
    loadingScreen.style.height = "100%";
    loadingScreen.style.background = "#000000";
    loadingScreen.style.display = "flex";
    loadingScreen.style.flexDirection = "column";
    loadingScreen.style.alignItems = "center";
    loadingScreen.style.justifyContent = "center";
    loadingScreen.style.zIndex = "1000";

    const spinner = document.createElement("div");
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.border = "5px solid #333";
    spinner.style.borderTop = "5px solid #fff";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "spin 1s linear infinite";

    const loadingText = document.createElement("div");
    loadingText.textContent = "Loading...";
    loadingText.style.color = "#ffffff";
    loadingText.style.marginTop = "20px";
    loadingText.style.fontSize = "20px";

    const progressText = document.createElement("div");
    progressText.id = "loading-progress";
    progressText.style.color = "#ffffff";
    progressText.style.marginTop = "10px";
    progressText.style.fontSize = "16px";

    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    loadingScreen.appendChild(spinner);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressText);
    document.body.appendChild(loadingScreen);
}

// Configure loading manager
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    const progressText = document.getElementById("loading-progress");
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
};

loadingManager.onLoad = function () {
    if (loadingScreen) {
        loadingScreen.style.display = "none";
        document.body.removeChild(loadingScreen);
    }
};

window.submitPlayerName = function () {
    const input = document.getElementById("playerNameInput");
    const name = input.value.trim();

    if (name) {
        document.getElementById("uiContainer").classList.add("hidden");
        createLoadingScreen(); // Show loading screen before starting to load
        loadGame(name);
    } else {
        alert("Please enter name");
    }
};

function loadGame(name) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    // Create Sky
    // Enhanced Sky settings
    const sky = new Sky();
    sky.scale.setScalar(50000);
    scene.add(sky);

    const sun = new THREE.Vector3();
    const sunUniforms = sky.material.uniforms;
    sunUniforms["exposure"] = 0.18;
    let sunX = -90;
    const updateInterval = 0.1;

    // Add directional light to match sun position
    const sunLight = new THREE.DirectionalLight(0xffffff, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    function updateSun() {
        sunX += updateInterval;
        sunLight.position.set(sun.x * 100, sun.y * 100, sun.z * 100);
        let phi = THREE.MathUtils.degToRad(sunX);
        const theta = THREE.MathUtils.degToRad(90);
        sun.setFromSphericalCoords(1, phi, theta);
        sunUniforms.sunPosition.value.copy(sun);
    }
    updateSun();

    const moon = new THREE.Vector3();
    const moonUniforms = sky.material.uniforms;
    let moonX = 90;

    const moonLight = new THREE.DirectionalLight(0x3686a0, 2.5);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 500;
    moonLight.shadow.camera.left = -100;
    moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100;
    moonLight.shadow.camera.bottom = -100;
    scene.add(moonLight);

    function updateMoon() {
        moonX += updateInterval;
        moonLight.position.set(moon.x * 100, moon.y * 100, moon.z * 100);
        let phi = THREE.MathUtils.degToRad(moonX);
        const theta = THREE.MathUtils.degToRad(90);
        moon.setFromSphericalCoords(1, phi, theta);
        moonUniforms.sunPosition.value.copy(moon);
    }
    updateMoon();

    // Create water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const normalMapTexture = new THREE.TextureLoader(loadingManager).load(
        "/waterNormals.jpg",
        function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
    );
    normalMapTexture.encoding = THREE.LinearEncoding;

    const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: normalMapTexture,
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);

    const textureLoader = new THREE.TextureLoader(loadingManager);

    const grassTexture = textureLoader.load("grass_texture.jpg");

    // Configure texture settings
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(4, 4);

    // Create geometry with more segments for better displacement detail
    const islandGeometry = new THREE.CylinderGeometry(150, 150, 5, 64, 64);

    // Create material with textures
    const islandMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
    });

    // Create mesh
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(0, 0, 0);
    island.receiveShadow = true;
    scene.add(island);

    class Grass {
        constructor(scene) {
            this.scene = scene;
            this.count = 1000;
            this.radius = 140;
            this.height = 2.2;
        }

        getPosition() {
            let angle = Math.random() * Math.PI * 2;
            let distance = Math.random() * this.radius;

            return {
                x: Math.cos(angle) * distance,
                z: Math.sin(angle) * distance,
            };
        }

        createGrass(model) {
            let grass = model.clone();
            let pos = this.getPosition();
            let scale = 0.8 + Math.random() * 0.4;

            grass.scale.set(scale, scale, scale);
            grass.rotation.y = Math.random() * Math.PI * 2;
            grass.position.set(pos.x, this.height, pos.z);

            return grass;
        }

        setup() {
            let loader = new GLTFLoader();

            loader.load("Grass.glb", (model) => {
                // Add shadows
                model.scene.traverse((part) => {
                    if (part.isMesh) {
                        part.castShadow = true;
                        part.receiveShadow = true;
                    }
                });

                // Create grass patches
                for (let i = 0; i < this.count; i++) {
                    let grass = this.createGrass(model.scene);
                    this.scene.add(grass);
                }
            });
        }
    }

    let grass = new Grass(scene);
    grass.setup();

    // Create detailed character
    function createCharacter(name = "Player") {
        const character = new THREE.Group();

        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
        });
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc99,
        });
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        // Modify each mesh to cast and receive shadows
        const addShadowsToMesh = (mesh) => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        };

        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.6, 0.2),
            bodyMaterial,
        );
        torso.position.y = 0.9;
        addShadowsToMesh(torso);
        character.add(torso);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25),
            headMaterial,
        );
        head.position.y = 1.325;
        addShadowsToMesh(head);
        character.add(head);

        // Eyes
        const leftEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.05),
            eyeMaterial,
        );
        leftEye.position.set(-0.08, 1.35, 0.125);
        addShadowsToMesh(leftEye);
        character.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.05),
            eyeMaterial,
        );
        rightEye.position.set(0.08, 1.35, 0.125);
        addShadowsToMesh(rightEye);
        character.add(rightEye);

        // Arms
        const leftArm = new THREE.Group();
        const leftUpperArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.2, 0.17),
            bodyMaterial,
        );
        leftUpperArm.position.y = 0;
        addShadowsToMesh(leftUpperArm);
        leftArm.add(leftUpperArm);

        // Add lower arm with skin color
        const leftLowerArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.3, 0.17),
            headMaterial, // Using the same skin color as head
        );
        leftLowerArm.position.y = -0.25;
        addShadowsToMesh(leftLowerArm);
        leftArm.add(leftLowerArm);

        leftArm.position.set(-0.25, 1.05, 0);

        character.add(leftArm);

        const rightArm = new THREE.Group();
        const rightUpperArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.2, 0.17),
            bodyMaterial,
        );
        rightUpperArm.position.y = 0;
        addShadowsToMesh(rightUpperArm);
        rightArm.add(rightUpperArm);

        // Add lower arm with skin color
        const rightLowerArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.3, 0.17),
            headMaterial, // Using the same skin color as head
        );
        rightLowerArm.position.y = -0.25;
        addShadowsToMesh(rightLowerArm);
        rightArm.add(rightLowerArm);

        rightArm.position.set(0.25, 1.05, 0);
        character.add(rightArm);

        // Legs
        const leftLeg = new THREE.Group();
        const leftUpperLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.4, 0.15),
            bodyMaterial,
        );
        leftUpperLeg.position.y = 0;
        addShadowsToMesh(leftUpperLeg);
        leftLeg.add(leftUpperLeg);

        // Add lower leg with skin color
        const leftLowerLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.2, 0.15),
            headMaterial, // Using the same skin color as head
        );
        leftLowerLeg.position.y = -0.3;
        addShadowsToMesh(leftLowerLeg);
        leftLeg.add(leftLowerLeg);

        leftLeg.position.set(-0.12, 0.5, 0);
        character.add(leftLeg);

        const rightLeg = new THREE.Group();
        const rightUpperLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.4, 0.15),
            bodyMaterial,
        );
        rightUpperLeg.position.y = 0;
        addShadowsToMesh(rightUpperLeg);
        rightLeg.add(rightUpperLeg);

        // Add lower leg with skin color
        const rightLowerLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.2, 0.15),
            headMaterial, // Using the same skin color as head
        );
        rightLowerLeg.position.y = -0.3;
        addShadowsToMesh(rightLowerLeg);
        rightLeg.add(rightLowerLeg);

        rightLeg.position.set(0.12, 0.5, 0);
        character.add(rightLeg);

        const nameSprite = createNameSprite(name);
        nameSprite.position.set(0, 2, 0); // Position above character's head
        character.add(nameSprite);

        character.userData = {
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            head,
            torso,
            nameSprite,
            leftEye,
            rightEye,
            leftUpperLeg,
            leftLowerLeg,
            rightUpperLeg,
            rightLowerLeg,
        };

        return character;
    }

    const character = createCharacter(name);
    character.position.set(0, 2.4, 0);
    scene.add(character);

    // Character state and controls
    const characterState = {
        velocity: new THREE.Vector3(),
        height: 1,
        direction: new THREE.Vector3(),
        animationTime: 0,
        isWaving: false,
        waveTime: 0,
        waveDuration: 90,
        isCrouching: false,
        crouchAmount: 0,
        normalHeight: 2.4, // Store normal height
        crouchHeight: 1.8, // Crouched height
        crouchTransitionSpeed: 0.1, // Speed of crouch animation
    };

    const cameraState = {
        distance: 5,
        rotationX: 0,
        rotationY: Math.PI / 6,
        sensitivity: 0.06,
    };

    // Movement and physics constants
    let moveSpeed = 0.4;
    const jumpForce = 0.15;
    const gravity = -0.01;

    // Key controls

    const keys = {};

    document.addEventListener("keydown", (event) => {
        keys[event.key.toLowerCase()] = true;
        keys[event.key] = true;

        /*if (event.key.toLowerCase() === 'e' && !characterState.isWaving) {
		    characterState.isWaving = true;
		    characterState.waveTime = 0;
		}*/

        if (event.key.toLowerCase() === "c") {
            characterState.isCrouching = true;
            moveSpeed = 0.3;
        }

        if (event.key.toLowerCase() === "f") {
            shoot();
        }
    });

    document.addEventListener("keyup", (event) => {
        keys[event.key.toLowerCase()] = false;
        keys[event.key] = false;

        if (event.key.toLowerCase() === "c") {
            characterState.isCrouching = false;
            moveSpeed = 0.4;
        }

        if (event.key.toLowerCase() === "f") {
            leftArm.rotation.x = 0;
        }
    });

    function animateCharacter() {
        const {
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            head,
            torso,
            nameSprite,
            leftEye,
            rightEye,
            leftUpperLeg,
            leftLowerLeg,
            rightUpperLeg,
            rightLowerLeg,
        } = character.userData;

        // Handle crouching animation
        if (characterState.isCrouching) {
            characterState.crouchAmount = Math.min(
                characterState.crouchAmount +
                    characterState.crouchTransitionSpeed,
                1,
            );
        } else {
            characterState.crouchAmount = Math.max(
                characterState.crouchAmount -
                    characterState.crouchTransitionSpeed,
                0,
            );
        }

        // Define base heights
        const baseHeight = 2.4; // Normal standing height
        const crouchHeight = 2.4; // Height when fully crouched

        // Calculate current height
        const currentHeight =
            baseHeight -
            characterState.crouchAmount * (baseHeight - crouchHeight);

        // Update character and body parts
        if (characterState.crouchAmount > 0) {
            // Main character position - prevent ground clipping
            character.position.y = currentHeight;

            // Adjust body parts
            const crouchFactor = characterState.crouchAmount;

            // Torso adjustments
            torso.position.y = 0.9 - 0.3 * crouchFactor;

            // Head and eye adjustments
            head.position.y = 1.325 - 0.3 * crouchFactor;

            // Update eye positions relative to head
            leftEye.position.y = 1.35 - 0.3 * crouchFactor;
            rightEye.position.y = 1.35 - 0.3 * crouchFactor;
            
            
            // Arms adjustments
            leftArm.position.y = 1.05 - 0.3 * crouchFactor;
            rightArm.position.y = 1.05 - 0.3 * crouchFactor;
            rightArm.rotation.x = -(Math.PI / 4) * crouchFactor;
            
            leftLowerLeg.rotation.x = (Math.PI / 2) * crouchFactor;
            rightLowerLeg.rotation.x = (Math.PI / 2) * crouchFactor;

            // Nameplate adjustment
            nameSprite.position.y = 2 - 0.6 * crouchFactor;
        } else {
            // Reset all positions
            character.position.y = baseHeight;
            torso.position.y = 0.9;
            head.position.y = 1.325;
            leftEye.position.y = 1.35;
            rightEye.position.y = 1.35;
            leftEye.position.z = 0.13;
            rightEye.position.z = 0.13;
            leftArm.position.y = 1.05;
            rightArm.position.y = 1.05;
            nameSprite.position.y = 2;

            // Reset all rotations
            torso.rotation.x = 0;
            head.rotation.x = 0;
            rightArm.rotation.x = 0;
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
        }

        // Handle waving animation
        /*if (characterState.isWaving) {
		    characterState.waveTime++;
		    
		    if (characterState.waveTime < characterState.waveDuration) {
		        const waveProgress = characterState.waveTime / characterState.waveDuration;
		        const wavePhase = (Math.sin(waveProgress * Math.PI * 8) * Math.PI);
		        
		        leftArm.rotation.x = Math.PI; 
		        leftArm.rotation.z = wavePhase / 16; 
		    } else {
		        leftArm.rotation.set(0, 0, 0);
		        characterState.isWaving = false;
		    }
    	} */
    	
        // Walking animation (only if not crouching)
        if (keys["w"] || keys["s"] ) {
            characterState.animationTime += 0.1;

            const swingAngle = Math.sin(characterState.animationTime) * 1;
            rightArm.rotation.x = swingAngle;
            leftLeg.rotation.x = swingAngle * 0.5;
            rightLeg.rotation.x = -swingAngle * 0.5;
        }

	 if (isMobile && joystickState.active) {
            if (joystickState.moveY !== 0 && joystickState.moveX !== 0) {
		characterState.animationTime += 0.1;
	
	            const swingAngle = Math.sin(characterState.animationTime) * 1;
	            rightArm.rotation.x = swingAngle;
	            leftLeg.rotation.x = swingAngle * 0.5;
	            rightLeg.rotation.x = -swingAngle * 0.5;
	    }
        }
    }
    // Update character movement speed when crouching
    function updateCharacter() {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, cameraDirection).normalize();

    characterState.direction.set(0, 0, 0);

    if (!characterState.isWaving) {
        // Handle keyboard controls
        if (keys["w"]) characterState.direction.add(cameraDirection);
        if (keys["s"]) characterState.direction.sub(cameraDirection);
        
        // Handle mobile joystick controls
        if (isMobile && joystickState.active) {
            if (joystickState.moveY !== 0) {
                characterState.direction.add(cameraDirection.clone().multiplyScalar(joystickState.moveY));
            }
            if (joystickState.moveX !== 0) {
                characterState.direction.add(right.clone().multiplyScalar(joystickState.moveX));
            }
        }

        if (characterState.direction.length() > 0) {
            characterState.direction.normalize();
            const currentMoveSpeed = characterState.isCrouching
                ? moveSpeed * 0.5
                : moveSpeed;

            // Calculate new position
            const newPosition = new THREE.Vector3(
                character.position.x +
                    characterState.direction.x * currentMoveSpeed,
                character.position.y,
                character.position.z +
                    characterState.direction.z * currentMoveSpeed,
            );

            // Only update position if no collision detected
            if (checkCollisions(newPosition)) {
                character.position.copy(newPosition);
            }

            character.rotation.y = Math.atan2(
                characterState.direction.x,
                characterState.direction.z,
            );
        }
    }
}

    function updateCamera() {
        if (keys["ArrowRight"])
            cameraState.rotationX -= cameraState.sensitivity;
        if (keys["ArrowLeft"]) cameraState.rotationX += cameraState.sensitivity;

        camera.position.x =
            character.position.x +
            Math.sin(cameraState.rotationX) * cameraState.distance;
        camera.position.z =
            character.position.z +
            Math.cos(cameraState.rotationX) * cameraState.distance;
        camera.position.y =
            character.position.y +
            Math.sin(cameraState.rotationY) * cameraState.distance;

        camera.lookAt(character.position);
    }

    function createNameSprite(name) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 256;
        canvas.height = 64;

        // Clear background
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configure text style
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Add white outline
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.strokeText(name, canvas.width / 2, canvas.height / 2);

        // Add colored text
        ctx.fillStyle = "#4CAF50"; // Material Design Green
        ctx.fillText(name, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    }

    const rockGeometry = new THREE.DodecahedronGeometry(2);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

    // Define organized placement positions
    const rockPositions = [
        // Outer circle
        { radius: 120, count: 10 },
        // Middle circle
        { radius: 80, count: 8 },
        // Inner circle
        { radius: 40, count: 3 },
    ];

    // Place rocks in concentric circles
    rockPositions.forEach((circle) => {
        const angleStep = (Math.PI * 2) / circle.count;

        for (let i = 0; i < circle.count; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);

            const angle = i * angleStep;
            rock.position.x = Math.cos(angle) * circle.radius;
            rock.position.z = Math.sin(angle) * circle.radius;
            rock.position.y = 2.5;

            rock.rotation.y = angle + Math.PI / 4;
            rock.rotation.z = Math.PI * 0.05;

            rock.castShadow = true;
            rock.receiveShadow = true;

            // Add collision radius to rock
            rock.userData.collisionRadius = 2;
            collisionObjects.push(rock);

            scene.add(rock);
        }
    });

    // Function to check collisions with objects
    function checkCollisions(newPosition) {
        // Check island boundary first
        const distanceFromCenter = Math.sqrt(
            newPosition.x * newPosition.x + newPosition.z * newPosition.z,
        );

        if (distanceFromCenter > islandRadius) {
            return false;
        }

        // Check collisions with objects
        for (const obj of collisionObjects) {
            if (zombieState.zombies.includes(obj)) {
                continue;
            }
            const collisionRadius = obj.userData.collisionRadius || 2;
            const dx = newPosition.x - obj.position.x;
            const dz = newPosition.z - obj.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < collisionRadius) {
                return false;
            }
        }

        return true;
    }

    const treeLoader = new GLTFLoader(loadingManager);

    treeLoader.load(
        "/tree.glb",
        function (gltf) {
            const treeModel = gltf.scene;
            treeModel.scale.set(1, 1, 1);

            treeModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            const numberOfTrees = 100;
            const innerRadius = 20;
            const outerRadius = 100;
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const fibonacci = [
                2, 11, 17, 22, 36, 22, 27, 33, 30, 13, 19, 16, 23, 29,
            ];

            for (let i = 0; i < numberOfTrees; i++) {
                const angle = i * goldenAngle;
                const fiboIndex = i % fibonacci.length;
                const radiusFactor =
                    fibonacci[fiboIndex] / fibonacci[fibonacci.length - 1];
                const radius =
                    innerRadius + (outerRadius - innerRadius) * radiusFactor;

                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const rotation = (angle + Math.atan2(z, x)) * ((i % 3) + 1);

                const tree = treeModel.clone();
                tree.position.set(x, 2.5, z);
                tree.rotation.y = rotation;

                const scaleFactor = 1 + Math.cos(angle * 2.4) * 0.2;
                tree.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Add collision radius to tree
                tree.userData.collisionRadius = 1;
                collisionObjects.push(tree);

                scene.add(tree);
            }
        },
        undefined,
        function (error) {
            console.error("Error loading tree:", error);
        },
    );

    // Sound management
    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    const gemCollectSound = new THREE.Audio(audioListener);
    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load("collect.mp3", function (buffer) {
        gemCollectSound.setBuffer(buffer);
        gemCollectSound.setVolume(0.5);
    });

    // Particle system for gem collection
    class GemParticleSystem {
        constructor(scene) {
            this.scene = scene;
        }

        createCollectionEffect(position) {
            const particleCount = 50;
            const particleGeometry = new THREE.BufferGeometry();
            const particleMaterial = new THREE.PointsMaterial({
                color: 0x00ffff,
                size: 0.2,
                transparent: true,
                opacity: 1,
            });

            const positions = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                // Randomize particle positions in a small sphere around the gem
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI * 2;
                const radius = Math.random() * 1;

                positions[i * 3] =
                    position.x + radius * Math.sin(theta) * Math.cos(phi);
                positions[i * 3 + 1] =
                    position.y + radius * Math.sin(theta) * Math.sin(phi);
                positions[i * 3 + 2] = position.z + radius * Math.cos(theta);
            }

            particleGeometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3),
            );

            const particles = new THREE.Points(
                particleGeometry,
                particleMaterial,
            );

            // Animate particle dispersal and fade out
            const animateParticles = () => {
                const positions = particles.geometry.getAttribute("position");
                const originalPositions = positions.array;

                for (let i = 0; i < positions.count; i++) {
                    // Move particles outward
                    originalPositions[i * 3] += (Math.random() - 0.5) * 0.1;
                    originalPositions[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
                    originalPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                }

                positions.needsUpdate = true;

                // Fade out particles
                particleMaterial.opacity -= 0.05;
                particleMaterial.needsUpdate = true;

                // Remove particles when fully transparent
                if (particleMaterial.opacity <= 0) {
                    this.scene.remove(particles);
                    // Dispose of geometry and material to free up memory
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                } else {
                    requestAnimationFrame(animateParticles);
                }
            };

            this.scene.add(particles);
            animateParticles();
        }
    }

    // Gem collection system
    const gemState = {
        count: 0,
        gems: [],
    };

    // Create particle system
    const particleSystem = new GemParticleSystem(scene);

    // Create UI for gem count
    function createGemCountUI() {
        const uiContainer = document.createElement("div");
        uiContainer.id = "gem-ui";
        uiContainer.style.position = "fixed";
        uiContainer.style.top = "10px";
        uiContainer.style.right = "10px";
        uiContainer.style.backgroundColor = "rgba(0,0,0,0.5)";
        uiContainer.style.color = "white";
        uiContainer.style.padding = "10px";
        uiContainer.style.borderRadius = "5px";
        uiContainer.style.fontFamily = "Arial, sans-serif";
        uiContainer.innerHTML = `Gems: <span id="gem-count">0</span> / 20`;
        document.body.appendChild(uiContainer);
    }

    // Update gem count in UI
    function updateGemCountUI() {
        const gemCountElement = document.getElementById("gem-count");
        if (gemCountElement) {
            gemCountElement.textContent = gemState.count;
        }
    }

    // Create gem model
    function createGemModel() {
        const gemGeometry = new THREE.OctahedronGeometry(0.5, 0);
        const gemMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff, // Cyan color
            transparent: true,
            opacity: 0.8,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
        });
        const gem = new THREE.Mesh(gemGeometry, gemMaterial);

        // Add spinning animation
        gem.userData.spin = {
            speed: Math.random() * 0.05 + 0.02,
        };

        return gem;
    }

    // Spawn gems around the island
    function spawnGems() {
        const numberOfGems = 20;
        const innerRadius = 20;
        const outerRadius = 130;

        // Function to check if a position is too close to existing objects
        function isValidGemPosition(position) {
            // Check distance from existing collision objects
            for (const obj of collisionObjects) {
                // Skip if the object is already a gem
                if (obj.userData && obj.userData.isCollectable) continue;

                const dx = position.x - obj.position.x;
                const dz = position.z - obj.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                // Minimum safe distance (adjust as needed)
                const minSafeDistance = obj.userData.collisionRadius + 2;

                if (distance < minSafeDistance) {
                    return false;
                }
            }
            return true;
        }

        const maxAttempts = 100; // Prevent infinite loop

        for (let i = 0; i < numberOfGems; i++) {
            let gem;
            let validPosition = false;
            let attempts = 0;

            while (!validPosition && attempts < maxAttempts) {
                // Randomize gem position
                const angle = Math.random() * Math.PI * 2;
                const radius =
                    innerRadius + Math.random() * (outerRadius - innerRadius);

                const position = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    3,
                    Math.sin(angle) * radius,
                );

                // Check if position is valid
                if (isValidGemPosition(position)) {
                    gem = createGemModel();
                    gem.position.copy(position);

                    // Add collision detection
                    gem.userData.collisionRadius = 0.5;
                    gem.userData.isCollectable = true;

                    gemState.gems.push(gem);
                    collisionObjects.push(gem);
                    scene.add(gem);

                    validPosition = true;
                }

                attempts++;
            }

            // If couldn't find a valid position after max attempts
            if (!validPosition) {
                console.warn(
                    `Could not place gem #${i} after ${maxAttempts} attempts`,
                );
            }
        }
    }

    // Check gem collection
    function checkGemCollection() {
        for (let i = gemState.gems.length - 1; i >= 0; i--) {
            const gem = gemState.gems[i];

            if (!gem.userData.isCollectable) continue;

            const distance = character.position.distanceTo(gem.position);

            if (distance < 1.5) {
                // Collect gem
                gemState.count++;
                updateGemCountUI();

                // Play collection sound
                if (gemCollectSound.isPlaying) {
                    gemCollectSound.stop();
                }
                gemCollectSound.play();

                // Create particle effect
                particleSystem.createCollectionEffect(gem.position);

                // Remove gem from scene
                scene.remove(gem);
                gemState.gems.splice(i, 1);

                // Remove from collision objects
                const index = collisionObjects.indexOf(gem);
                if (index > -1) {
                    collisionObjects.splice(index, 1);
                }
            }
        }
    }

    createGemCountUI();
    spawnGems();

    const bulletState = {
        bullets: [],
        speed: 1,
        maxDistance: 200,
    };

    // Create gun model
    function createGunModel() {
        const gunGroup = new THREE.Group();

        // Main body of the pistol
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.15);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Dark gray
            metalness: 0.7,
            roughness: 0.3,
        });
        const gunBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        gunBody.position.set(0.3, 1.1, 0.5);
        gunBody.rotation.z = -Math.PI / 12;
        gunGroup.add(gunBody);

        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2,
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.5, 1.1, 0.5);
        gunGroup.add(barrel);

        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.05);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222, // Black grip
            metalness: 0.2,
            roughness: 0.8,
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0.2, 0.9, 0.5);
        gunGroup.add(grip);

        // Slide (top part of the pistol)
        const slideGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const slideMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Slightly lighter gray
            metalness: 0.9,
            roughness: 0.2,
        });
        const slide = new THREE.Mesh(slideGeometry, slideMaterial);
        slide.position.set(0.35, 1.2, 0.5);
        gunGroup.add(slide);

        // Muzzle point
        const muzzlePoint = new THREE.Object3D();
        muzzlePoint.position.set(0.65, 1.1, 0.5);
        gunGroup.add(muzzlePoint);

        // Store important references
        gunGroup.userData = {
            muzzlePoint: muzzlePoint,
        };

        return gunGroup;
    }

    // Create bullet model
    function createBulletModel() {
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5,
        });
        return new THREE.Mesh(bulletGeometry, bulletMaterial);
    }

    // Shooting sound
    const shootSound = new THREE.Audio(new THREE.AudioListener());

    audioLoader.load("shoot.mp3", function (buffer) {
        shootSound.setBuffer(buffer);
        shootSound.setVolume(0.3);
    });

    // Add gun to character
    const gun = createGunModel();
    gun.position.set(0.35, -0.25, -0.6);
    gun.rotation.z = -Math.PI / 2;
    gun.rotation.y = -Math.PI / 2;
    gun.scale.set(0.7, 0.7, 0.7);
    const leftArm = character.userData.leftArm;
    leftArm.add(gun);

    // Shooting function
    function shoot() {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, cameraDirection).normalize();

        characterState.direction.set(0, 0, 0);

        characterState.direction.add(cameraDirection);

        if (characterState.direction.length() > 0) {
            characterState.direction.normalize();
            const currentMoveSpeed = characterState.isCrouching
                ? moveSpeed * 0.5
                : moveSpeed;

            character.rotation.y = Math.atan2(
                characterState.direction.x,
                characterState.direction.z,
            );
        }

        leftArm.rotation.x = -Math.PI / 2;

        // Play shooting sound
        if (shootSound.isPlaying) {
            shootSound.stop();
        }
        shootSound.play();

        // Create bullet
        const bullet = createBulletModel();

        // Get muzzle world position
        const muzzleWorldPosition = new THREE.Vector3();
        gun.userData.muzzlePoint.getWorldPosition(muzzleWorldPosition);
        bullet.position.copy(muzzleWorldPosition);

        // Get shooting direction based on character's rotation
        const shootDirection = new THREE.Vector3(0, 0, 1);
        shootDirection.applyQuaternion(character.quaternion);

        // Add bullet to scene and tracking
        scene.add(bullet);
        bulletState.bullets.push({
            mesh: bullet,
            direction: shootDirection,
            distanceTraveled: 0,
        });
    }

    // Update bullet physics (remains the same as previous implementation)
    function updateBullets() {
        for (let i = bulletState.bullets.length - 1; i >= 0; i--) {
            const bulletData = bulletState.bullets[i];

            // Move bullet
            bulletData.mesh.position.addScaledVector(
                bulletData.direction,
                bulletState.speed,
            );

            // Track distance
            bulletData.distanceTraveled += bulletState.speed;

            // Check for collisions with objects
            for (const obj of collisionObjects) {
                if (obj.userData.isCollectable) continue; // Skip gems

                const distance = bulletData.mesh.position.distanceTo(
                    obj.position,
                );

                // Collision detection
                if (distance < (obj.userData.collisionRadius || 1)) {
                    // Remove bullet
                    console.log("heloo");

                    if (zombieState.zombies.includes(obj)) {
                        // Damage zombie
                        obj.userData.health -= 25; // Adjust damage as needed
                        console.log("Zombie hit! Health:", obj.userData.health);

                        // Check if zombie is dead
                        if (obj.userData.health <= 0) {
                            scene.remove(obj);
                            const zombieIndex =
                                zombieState.zombies.indexOf(obj);
                            if (zombieIndex > -1)
                                zombieState.zombies.splice(zombieIndex, 1);
                            const collisionIndex =
                                collisionObjects.indexOf(obj);
                            if (collisionIndex > -1)
                                collisionObjects.splice(collisionIndex, 1);
                        }
                    }
                    scene.remove(bulletData.mesh);
                    bulletState.bullets.splice(i, 1);

                    // Optional: Add impact effect
                    break;
                }
            }

            // Remove bullet if it travels too far
            if (bulletData.distanceTraveled > bulletState.maxDistance) {
                scene.remove(bulletData.mesh);
                bulletState.bullets.splice(i, 1);
            }
        }
    }

    const zombieState = {
        zombies: [],
        count: 5, // Initial number of zombies
        speed: 0.1,
        detectionRadius: 200,
        attackRadius: 1, // Distance to attack player
    };

    // Player Health System
    const playerState = {
        health: 100,
        maxHealth: 100,
        isAlive: true,
    };

    // Create Health UI
    function createHealthUI() {
        const healthContainer = document.createElement("div");
        healthContainer.id = "health-ui";
        healthContainer.style.position = "fixed";
        healthContainer.style.top = "50px";
        healthContainer.style.right = "10px";
        healthContainer.style.backgroundColor = "rgba(0,0,0,0.5)";
        healthContainer.style.color = "white";
        healthContainer.style.padding = "10px";
        healthContainer.style.borderRadius = "5px";
        healthContainer.style.fontFamily = "Arial, sans-serif";

        const healthBar = document.createElement("div");
        healthBar.id = "health-bar";
        healthBar.style.width = "200px";
        healthBar.style.height = "20px";
        healthBar.style.backgroundColor = "red";
        healthBar.style.width = "100%";

        healthContainer.innerHTML = "Health: ";
        healthContainer.appendChild(healthBar);
        document.body.appendChild(healthContainer);
    }

    // Update Health UI
    function updateHealthUI() {
        const healthBar = document.getElementById("health-bar");
        if (healthBar) {
            const healthPercentage =
                (playerState.health / playerState.maxHealth) * 100;
            healthBar.style.width = `${healthPercentage}%`;
        }
    }

    // Create Game Over/Win UI
    function createGameOverUI(won = false) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.color = "white";
        overlay.style.fontSize = "2rem";
        overlay.style.zIndex = "1000";
		overlay.style.opacity = "0";
    	overlay.style.transition = "opacity 0.5s ease-in";
    	
    	
        const message = document.createElement("div");
        message.textContent = won ? "You Win!" : "Game Over";
        message.style.marginBottom = "20px";

        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
        	overlay.style.opacity = "1";
   		}, 10);
        
        setTimeout(() => {
       		location.reload();
    	}, 3000);
    }

    // Zombie Creation
    function createZombieModel() {
        const zombieGroup = new THREE.Group();

        // Updated color palette
        const colors = {
            flesh: 0x006400, // Dark green body
            dress: 0xcc0000, // Deep red dress
            eyes: 0xff0000, // Bright red eyes
            bone: 0x8a7a6a, // Bone-like tone
            gore: 0x2a1a1a, // Dark bloody undertone
        };

        // Zombie body material with decay effects
        const decayMaterial = new THREE.MeshStandardMaterial({
            color: colors.flesh,
            roughness: 0.9,
            metalness: 0.1,
            emissive: colors.gore,
            emissiveIntensity: 0.2,
        });

        // Dress material
        const dressMaterial = new THREE.MeshStandardMaterial({
            color: colors.dress,
            roughness: 0.8,
            metalness: 0.1,
        });

        // Eye material
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: colors.eyes,
            emissive: colors.eyes,
            emissiveIntensity: 0.5,
        });

        // Torso - using dress material
        const torsoGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
        const torso = new THREE.Mesh(torsoGeometry, dressMaterial);
        torso.position.y = 0.9;
        torso.rotation.z = 0.1; // Slight twist
        zombieGroup.add(torso);

        // Head - fractured box with asymmetry
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.35);
        const head = new THREE.Mesh(headGeometry, decayMaterial);
        head.position.y = 1.6;
        head.rotation.x = 0.2; // Forward tilt
        head.scale.set(1.1, 0.9, 1); // Uneven scaling
        zombieGroup.add(head);

        // Jaw - broken, hanging open
        const jawGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2);
        const jaw = new THREE.Mesh(jawGeometry, decayMaterial);
        jaw.position.set(0, 1.4, 0.2);
        jaw.rotation.x = 0.6; // Open mouth
        zombieGroup.add(jaw);

        // Eyes - bright red
        const leftEyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.65, 0.2);
        zombieGroup.add(leftEye);

        const rightEyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const rightEye = new THREE.Mesh(rightEyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.65, 0.2);
        zombieGroup.add(rightEye);

        // Left Arm - angular, torn limb
        const leftArmGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const leftArm = new THREE.Mesh(leftArmGeometry, decayMaterial);
        leftArm.position.set(-0.4, 1.3, 0);
        leftArm.rotation.z = -0.5; // Drooping
        leftArm.rotation.x = 0.2; // Slight twist
        zombieGroup.add(leftArm);

        // Right Arm - shorter, mangled
        const rightArmGeometry = new THREE.BoxGeometry(0.18, 0.5, 0.15);
        const rightArm = new THREE.Mesh(rightArmGeometry, decayMaterial);
        rightArm.position.set(0.4, 1.4, 0.1);
        rightArm.rotation.z = 0.7; // Raised
        rightArm.rotation.x = -0.3; // Twisted
        zombieGroup.add(rightArm);

        // Left Leg - damaged, uneven
        const leftLegGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.2);
        const leftLeg = new THREE.Mesh(leftLegGeometry, decayMaterial);
        leftLeg.position.set(-0.2, 0.45, 0);
        leftLeg.rotation.x = 0.2; // Slight lean
        zombieGroup.add(leftLeg);

        // Right Leg - shorter, more damaged
        const rightLegGeometry = new THREE.BoxGeometry(0.22, 0.7, 0.18);
        const rightLeg = new THREE.Mesh(rightLegGeometry, decayMaterial);
        rightLeg.position.set(0.2, 0.35, 0.05);
        rightLeg.rotation.x = -0.1; // Uneven stance
        zombieGroup.add(rightLeg);

        // Exposed bone details
        const boneMaterial = new THREE.MeshStandardMaterial({
            color: colors.bone,
            roughness: 0.7,
            metalness: 0.2,
        });

        // Broken spine piece
        const spineGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const spine = new THREE.Mesh(spineGeometry, boneMaterial);
        spine.position.set(0, 1.0, -0.2);
        spine.rotation.x = 0.2;
        zombieGroup.add(spine);

        // Additional decay detail - protruding rib fragment
        const ribGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
        const rib = new THREE.Mesh(ribGeometry, boneMaterial);
        rib.position.set(0.2, 1.1, -0.2);
        rib.rotation.z = 0.3;
        zombieGroup.add(rib);

        // Add health and body part tracking
        zombieGroup.userData = {
            health: 50,
            maxHealth: 50,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
        };

        return zombieGroup;
    }

    // Spawn Zombies
    function spawnZombies() {
        const innerRadius = 130;
        const outerRadius = 150;

        for (let i = 0; i < zombieState.count; i++) {
            const zombie = createZombieModel();

            // Randomize zombie position
            const angle = Math.random() * Math.PI * 2;
            const radius =
                innerRadius + Math.random() * (outerRadius - innerRadius);

            zombie.position.set(
                Math.cos(angle) * radius,
                2.4,
                Math.sin(angle) * radius,
            );

            // Add collision detection
            zombie.userData.collisionRadius = 1.5;

            zombieState.zombies.push(zombie);
            collisionObjects.push(zombie);
            scene.add(zombie);
        }
    }

    // Zombie AI and Movement
    function updateZombies() {
        zombieState.zombies.forEach((zombie, index) => {
            // Calculate distance to player
            const distanceToPlayer = zombie.position.distanceTo(
                character.position,
            );

            // Zombie animation (simple arm swinging)
            const swingAngle = Math.sin(Date.now() * 0.01) * 0.5;
            zombie.userData.leftArm.rotation.x = swingAngle;
            zombie.userData.rightArm.rotation.x = -swingAngle;

            // If player is within detection radius, move towards player
            if (distanceToPlayer <= zombieState.detectionRadius) {
                // Calculate direction to player
                const direction = new THREE.Vector3()
                    .subVectors(character.position, zombie.position)
                    .normalize();

                // Move zombie
                zombie.position.add(
                    direction.multiplyScalar(zombieState.speed),
                );

                // Rotate zombie to face player
                zombie.lookAt(character.position);

                // Check for player collision/attack
                if (distanceToPlayer <= zombieState.attackRadius) {
                    // Damage player
                    playerState.health -= 10;
                    updateHealthUI();

                    // Check if player is dead
                    if (playerState.health <= 0) {
                        playerState.isAlive = false;
                        createGameOverUI(false);
                    }
                }
            }
        });
    }

    function checkWinCondition() {
        if (zombieState.zombies.length === 0 && gemState.count >= 20) {
            createGameOverUI(true);
        }
    }

    createHealthUI();
    spawnZombies();
    setInterval(() => {
		if (gemState.count < 20) {
		    spawnZombies();
		}
	}, 15000);

	// First, add detection for mobile devices and orientation
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let isLandscape = window.innerWidth > window.innerHeight;

// Create mobile UI elements
function setupMobileControls() {
    // Create container for mobile controls
    const mobileControls = document.createElement('div');
    mobileControls.id = 'mobile-controls';
    mobileControls.style.position = 'fixed';
    mobileControls.style.bottom = '0';
    mobileControls.style.left = '0';
    mobileControls.style.width = '100%';
    mobileControls.style.height = '100%';
    mobileControls.style.pointerEvents = 'none';
    mobileControls.style.display = isMobile ? 'block' : 'none';
    document.body.appendChild(mobileControls);

    // Create virtual joystick for movement
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'joystick-container';
    joystickContainer.style.position = 'absolute';
    joystickContainer.style.bottom = '80px';
    joystickContainer.style.left = '80px';
    joystickContainer.style.width = '120px';
    joystickContainer.style.height = '120px';
    joystickContainer.style.borderRadius = '60px';
    joystickContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    joystickContainer.style.pointerEvents = 'auto';
    mobileControls.appendChild(joystickContainer);

    // Create joystick
    const joystick = document.createElement('div');
    joystick.id = 'joystick';
    joystick.style.position = 'absolute';
    joystick.style.top = '50%';
    joystick.style.left = '50%';
    joystick.style.width = '60px';
    joystick.style.height = '60px';
    joystick.style.borderRadius = '30px';
    joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    joystick.style.transform = 'translate(-50%, -50%)';
    joystickContainer.appendChild(joystick);

    // Create shoot button
    const shootButton = document.createElement('div');
    shootButton.id = 'shoot-button';
    shootButton.style.position = 'absolute';
    shootButton.style.bottom = '80px';
    shootButton.style.right = '80px';
    shootButton.style.width = '80px';
    shootButton.style.height = '80px';
    shootButton.style.borderRadius = '40px';
    shootButton.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    shootButton.style.display = 'flex';
    shootButton.style.justifyContent = 'center';
    shootButton.style.alignItems = 'center';
    shootButton.style.color = 'white';
    shootButton.style.fontSize = '16px';
    shootButton.style.fontWeight = 'bold';
    shootButton.style.pointerEvents = 'auto';
    shootButton.textContent = 'SHOOT';
    mobileControls.appendChild(shootButton);

    // Create crouch button
    const crouchButton = document.createElement('div');
    crouchButton.id = 'crouch-button';
    crouchButton.style.position = 'absolute';
    crouchButton.style.bottom = '80px';
    crouchButton.style.right = '180px';
    crouchButton.style.width = '80px';
    crouchButton.style.height = '80px';
    crouchButton.style.borderRadius = '40px';
    crouchButton.style.backgroundColor = 'rgba(0, 128, 255, 0.5)';
    crouchButton.style.display = 'flex';
    crouchButton.style.justifyContent = 'center';
    crouchButton.style.alignItems = 'center';
    crouchButton.style.color = 'white';
    crouchButton.style.fontSize = '16px';
    crouchButton.style.fontWeight = 'bold';
    crouchButton.style.pointerEvents = 'auto';
    crouchButton.textContent = 'CROUCH';
    mobileControls.appendChild(crouchButton);

    // Create camera rotation area
    const cameraControl = document.createElement('div');
    cameraControl.id = 'camera-control';
    cameraControl.style.position = 'absolute';
    cameraControl.style.top = '0';
    cameraControl.style.right = '0';
    cameraControl.style.width = '50%';
    cameraControl.style.height = '50%';
    cameraControl.style.pointerEvents = 'auto';
    mobileControls.appendChild(cameraControl);

    // Create landscape mode warning
    const landscapeWarning = document.createElement('div');
    landscapeWarning.id = 'landscape-warning';
    landscapeWarning.style.position = 'fixed';
    landscapeWarning.style.top = '0';
    landscapeWarning.style.left = '0';
    landscapeWarning.style.width = '100%';
    landscapeWarning.style.height = '100%';
    landscapeWarning.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    landscapeWarning.style.color = 'white';
    landscapeWarning.style.display = 'flex';
    landscapeWarning.style.justifyContent = 'center';
    landscapeWarning.style.alignItems = 'center';
    landscapeWarning.style.fontSize = '24px';
    landscapeWarning.style.zIndex = '1000';
    landscapeWarning.style.display = (isMobile && !isLandscape) ? 'flex' : 'none';
    landscapeWarning.textContent = 'Please rotate your device to landscape mode';
    document.body.appendChild(landscapeWarning);

    return {
        joystickContainer,
        joystick,
        shootButton,
        crouchButton,
        cameraControl,
        landscapeWarning
    };
}

// Initialize mobile controls
const mobileUI = setupMobileControls();

// Joystick state
const joystickState = {
    active: false,
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0,
    outer: { x: 0, y: 0, width: 0, height: 0 }
};

// Camera touch state
const cameraTouchState = {
    active: false,
    lastX: 0,
    lastY: 0
};

// Update joystick position and movement values
function updateJoystickPosition(clientX, clientY) {
    const rect = mobileUI.joystickContainer.getBoundingClientRect();
    joystickState.outer = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
    
    // Calculate center of joystick container
    const centerX = joystickState.outer.x + joystickState.outer.width / 2;
    const centerY = joystickState.outer.y + joystickState.outer.height / 2;
    
    // Calculate displacement from center
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit distance to joystick radius
    const maxRadius = joystickState.outer.width / 2 - 30;
    if (distance > maxRadius) {
        dx = dx * maxRadius / distance;
        dy = dy * maxRadius / distance;
    }
    
    // Update joystick position
    mobileUI.joystick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    
    // Normalize for direction input (between -1 and 1)
    joystickState.moveX = - dx / maxRadius;
    joystickState.moveY = -dy / maxRadius; // Negative because forward is -Z
}

// Reset joystick position
function resetJoystick() {
    mobileUI.joystick.style.transform = 'translate(-50%, -50%)';
    joystickState.moveX = 0;
    joystickState.moveY = 0;
}

// Start joystick touch
mobileUI.joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    joystickState.active = true;
    updateJoystickPosition(touch.clientX, touch.clientY);
});

// Move joystick
document.addEventListener('touchmove', (e) => {
    if (joystickState.active) {
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => {
            const rect = mobileUI.joystickContainer.getBoundingClientRect();
            const touchStartedNearJoystick = 
                Math.abs(t.clientX - (rect.left + rect.width/2)) < rect.width &&
                Math.abs(t.clientY - (rect.top + rect.height/2)) < rect.height;
            return touchStartedNearJoystick;
        });
        
        if (touch) {
            updateJoystickPosition(touch.clientX, touch.clientY);
        }
    }

    // Handle camera control touch
    if (cameraTouchState.active) {
        const touch = Array.from(e.touches).find(t => {
            const rect = mobileUI.cameraControl.getBoundingClientRect();
            return t.clientX > rect.left && t.clientX < rect.right && 
                   t.clientY > rect.top && t.clientY < rect.bottom;
        });
        
        if (touch) {
            const dx = touch.clientX - cameraTouchState.lastX;
            cameraTouchState.lastX = touch.clientX;
            
            // Adjust camera rotation based on touch movement
            cameraState.rotationX -= dx * 0.01;
        }
    }
}, { passive: false });

// End joystick touch
document.addEventListener('touchend', (e) => {
    // If no touches left on joystick container, reset joystick
    if (e.touches.length === 0 || Array.from(e.touches).every(t => {
        const rect = mobileUI.joystickContainer.getBoundingClientRect();
        return !(t.clientX > rect.left && t.clientX < rect.right && 
                t.clientY > rect.top && t.clientY < rect.bottom);
    })) {
        joystickState.active = false;
        resetJoystick();
    }
    
    // Reset camera touch if no touches on camera control
    if (e.touches.length === 0 || Array.from(e.touches).every(t => {
        const rect = mobileUI.cameraControl.getBoundingClientRect();
        return !(t.clientX > rect.left && t.clientX < rect.right && 
                t.clientY > rect.top && t.clientY < rect.bottom);
    })) {
        cameraTouchState.active = false;
    }
});

// Shoot button
mobileUI.shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys["f"] = true;
    shoot();
});

mobileUI.shootButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys["f"] = false;
    leftArm.rotation.x = 0;
});

// Crouch button
mobileUI.crouchButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys["c"] = true;
    characterState.isCrouching = true;
    moveSpeed = 0.3;
});

mobileUI.crouchButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys["c"] = false;
    characterState.isCrouching = false;
    moveSpeed = 0.4;
});

// Camera control
mobileUI.cameraControl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    cameraTouchState.active = true;
    cameraTouchState.lastX = touch.clientX;
    cameraTouchState.lastY = touch.clientY;
});


// Handle window resize
    window.addEventListener("resize", () => {
	    isLandscape = window.innerWidth > window.innerHeight;
	    if (mobileUI.landscapeWarning) {
	        mobileUI.landscapeWarning.style.display = (isMobile && !isLandscape) ? 'flex' : 'none';
	    }
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

// Modify the existing update functions to work with touch controls




	
    function animate(timestamp) {
        requestAnimationFrame(animate);
        //console.log(character.position)
        // Update water
        water.material.uniforms["time"].value += 1.0 / 60.0;

        updateCamera();
        updateCharacter();
        animateCharacter();

        updateMoon();
        updateSun();

        gemState.gems.forEach((gem) => {
            gem.rotation.y += gem.userData.spin.speed;
        });

        // Check gem collection
        checkGemCollection();
        updateBullets();
        updateZombies();

        // Check win/lose conditions
        checkWinCondition();

        character.userData.nameSprite.quaternion.copy(camera.quaternion);

        renderer.render(scene, camera);
    }

    

    // Start animation
    animate();
}


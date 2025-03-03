<!-- 1 -->

```jsx
const React = await import("https://esm.sh/react@19/?dev");
const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");
const THREE = await import("https://esm.sh/three@0.167.0?dev");

function App() {
  const canvasRef = React.useRef(null);

  // Set up Three.js scene
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;

    // Handle window resize
    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Animation loop with cleanup flag
    const isMounted = { current: true };
    const animate = () => {
      if (!isMounted.current) return;
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

const domNode = document.getElementById("root");
const root = ReactDOM.createRoot(domNode);
root.render(<App />);
```

<!-- 2 -->

```jsx
const React = await import("https://esm.sh/react@19/?dev");
const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");
const THREE = await import("https://esm.sh/three@0.167.0?dev");
const { GLTFLoader } = await import("https://esm.sh/three@0.167.0/examples/jsm/loaders/GLTFLoader.js?dev");
const { OrbitControls } = await import("https://esm.sh/three@0.167.0/examples/jsm/controls/OrbitControls.js?dev");

function App() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load glTF model
    const loader = new GLTFLoader();
    const modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf";
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0); // Center the model
        model.scale.set(1, 1, 1);    // Adjust scale if needed

        // Optional: Center the camera on the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        camera.position.set(center.x + 5, center.y + 5, center.z + 5);
        camera.lookAt(center);
      },
      undefined, // Progress callback (optional)
      (error) => console.error("Error loading glTF model:", error)
    );

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Handle window resize
    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Animation loop with cleanup flag
    const isMounted = { current: true };
    const animate = () => {
      if (!isMounted.current) return;
      requestAnimationFrame(animate);
      controls.update(); // Update orbit controls
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      window.removeEventListener("resize", handleResize);
      controls.dispose();
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

const domNode = document.getElementById("root");
const root = ReactDOM.createRoot(domNode);
root.render(<App />);
```

<!-- 3 -->

```jsx
const React = await import("https://esm.sh/react@19");
const ReactDOM = await import("https://esm.sh/react-dom@19/client");
const { Canvas } = await import("https://esm.sh/@react-three/fiber@9.0.4");
const { OrbitControls, useGLTF } = await import("https://esm.sh/@react-three/drei@10.0.3");

function DuckModel() {
  const gltf = useGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf");
  return <primitive object={gltf.scene} scale={[1, 1, 1]} position={[0, 0, 0]} />;
}

function Scene() {
  return (
    <Canvas style={{ height: "500px" }} camera={{ position: [5, 5, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <DuckModel />
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}

const domNode = document.getElementById("root");
const root = ReactDOM.createRoot(domNode);
root.render(<Scene />);
```

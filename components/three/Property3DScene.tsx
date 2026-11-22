import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  SunIcon,
  MoonIcon,
  ArrowPathIcon,
  CameraIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import type { Property } from '../../types';
import { PropertyType } from '../../types';

interface Property3DSceneProps {
  property: Property | null;
}

type CameraPresetKey = 'hero' | 'terrace' | 'aerial' | 'roof';

interface CameraPreset {
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: Record<CameraPresetKey, CameraPreset> = {
  hero: {
    label: 'Exterior 3/4',
    position: [19, 10.5, 21],
    target: [0, 2.2, 0],
  },
  terrace: {
    label: 'Pool & Terrace',
    position: [-12.5, 4.2, 14.5],
    target: [1.5, 2.0, -1],
  },
  aerial: {
    label: 'Site Plan',
    position: [0.5, 27, 11],
    target: [0, 0.5, 0],
  },
  roof: {
    label: 'Roof & Utilities',
    position: [13, 15, -13],
    target: [0, 4.2, -1],
  },
};

// Pre-allocated scratch vectors for zero-GC animation loop
const _scratchTargetPos = new THREE.Vector3();
const _scratchLookAt = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyEuler = new THREE.Euler();

function createProceduralCanvasTexture(
  kind: 'plaster' | 'timber' | 'stone' | 'water',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'plaster') {
    ctx.fillStyle = '#ece6dc';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = 0.025 + Math.random() * 0.04;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(140,126,105,${alpha})` : `rgba(255,252,246,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (kind === 'timber') {
    ctx.fillStyle = '#7c4d2b';
    ctx.fillRect(0, 0, size, size);
    const planks = 12;
    const h = size / planks;
    for (let p = 0; p < planks; p++) {
      const y = p * h;
      const tone = 105 + Math.floor(Math.random() * 26);
      ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.62)}, ${Math.floor(tone * 0.35)})`;
      ctx.fillRect(0, y, size, h - 1.5);
      ctx.fillStyle = 'rgba(35, 18, 8, 0.35)';
      ctx.fillRect(0, y + h - 1.5, size, 1.5);
      for (let g = 0; g < 18; g++) {
        ctx.fillStyle = 'rgba(42, 22, 10, 0.12)';
        ctx.fillRect(0, y + Math.random() * (h - 2), size, 1);
      }
    }
  } else if (kind === 'stone') {
    ctx.fillStyle = '#9b968c';
    ctx.fillRect(0, 0, size, size);
    const rows = 8;
    const cols = 4;
    const rh = size / rows;
    const cw = size / cols;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : cw * 0.5;
      for (let c = -1; c <= cols; c++) {
        const shade = 142 + Math.floor(Math.random() * 24);
        ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`;
        ctx.fillRect(c * cw + offset + 1.5, r * rh + 1.5, cw - 3, rh - 3);
      }
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 24;
      ctx.strokeStyle = 'rgba(224, 247, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.45, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, maxAnisotropy);
  return texture;
}

const Property3DScene: React.FC<Property3DSceneProps> = ({ property }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'dusk'>('day');
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('hero');
  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [hudExpanded, setHudExpanded] = useState<boolean>(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const presetAnimRef = useRef<{ active: boolean; pos: THREE.Vector3; target: THREE.Vector3 }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.hero.position),
    target: new THREE.Vector3(...CAMERA_PRESETS.hero.target),
  });
  const lightingRefs = useRef<{
    scene: THREE.Scene | null;
    renderer: THREE.WebGLRenderer | null;
    sunLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    interiorLights: THREE.PointLight[];
    fog: THREE.FogExp2 | null;
    windowGlassMat: THREE.MeshPhysicalMaterial | null;
  }>({
    scene: null,
    renderer: null,
    sunLight: null,
    hemiLight: null,
    interiorLights: [],
    fog: null,
    windowGlassMat: null,
  });
  const autoOrbitRef = useRef(autoOrbit);

  useEffect(() => {
    autoOrbitRef.current = autoOrbit;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoOrbit;
    }
  }, [autoOrbit]);

  // Apply Day/Dusk transition dynamically without recreating WebGL context
  useEffect(() => {
    const refs = lightingRefs.current;
    if (!refs.scene || !refs.renderer || !refs.sunLight || !refs.hemiLight || !refs.fog) return;

    if (timeOfDay === 'day') {
      refs.scene.background = new THREE.Color('#dfe8ef');
      refs.fog.color.set('#dfe8ef');
      refs.fog.density = 0.011;
      refs.sunLight.color.set('#fff3db');
      refs.sunLight.intensity = 2.6;
      refs.sunLight.position.set(22, 26, 16);
      refs.hemiLight.color.set('#cbe5ff');
      refs.hemiLight.groundColor.set('#5a5042');
      refs.hemiLight.intensity = 0.9;
      refs.renderer.toneMappingExposure = 1.05;
      refs.interiorLights.forEach((l) => {
        l.intensity = 1.6;
      });
      if (refs.windowGlassMat) {
        refs.windowGlassMat.emissive.set('#223344');
        refs.windowGlassMat.emissiveIntensity = 0.12;
      }
    } else {
      refs.scene.background = new THREE.Color('#131b26');
      refs.fog.color.set('#131b26');
      refs.fog.density = 0.014;
      refs.sunLight.color.set('#ff9d5c');
      refs.sunLight.intensity = 1.25;
      refs.sunLight.position.set(-24, 9, 18);
      refs.hemiLight.color.set('#3c527a');
      refs.hemiLight.groundColor.set('#1b1a20');
      refs.hemiLight.intensity = 0.48;
      refs.renderer.toneMappingExposure = 0.92;
      refs.interiorLights.forEach((l) => {
        l.intensity = 8.5;
      });
      if (refs.windowGlassMat) {
        refs.windowGlassMat.emissive.set('#ffb86c');
        refs.windowGlassMat.emissiveIntensity = 0.34;
      }
    }
  }, [timeOfDay]);

  const handleSelectPreset = (key: CameraPresetKey) => {
    setActivePreset(key);
    const preset = CAMERA_PRESETS[key];
    presetAnimRef.current = {
      active: true,
      pos: new THREE.Vector3(...preset.position),
      target: new THREE.Vector3(...preset.target),
    };
    setAutoOrbit(false);
  };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envRenderTarget: THREE.WebGLRenderTarget | null = null;
    const createdTextures: THREE.Texture[] = [];

    try {
      const width = host.clientWidth || 960;
      const height = host.clientHeight || 540;

      // Probe WebGL renderer capabilities & detect software emulation
      const probeCanvas = document.createElement('canvas');
      const probeGl =
        probeCanvas.getContext('webgl2') ||
        probeCanvas.getContext('webgl') ||
        probeCanvas.getContext('experimental-webgl');
      if (!probeGl) {
        setWebglError('WebGL is unavailable in this browser session.');
        return;
      }
      const glRendererName = String((probeGl as WebGLRenderingContext).getParameter((probeGl as WebGLRenderingContext).RENDERER) || '');
      const isSoftwareRenderer = /swiftshader|llvmpipe|software/i.test(glRendererName);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareRenderer,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.setPixelRatio(isSoftwareRenderer ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#dfe8ef');
      const fog = new THREE.FogExp2('#dfe8ef', 0.011);
      scene.fog = fog;

      // Physically plausible IBL environment via RoomEnvironment
      pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      scene.environment = envRenderTarget.texture;
      roomEnv.dispose();
      pmremGenerator.dispose();
      pmremGenerator = null;

      const camera = new THREE.PerspectiveCamera(44, width / height, 0.25, 160);
      camera.position.set(...CAMERA_PRESETS.hero.position);
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...CAMERA_PRESETS.hero.target);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.minDistance = 8.5;
      controls.maxDistance = 42;
      controls.autoRotate = autoOrbitRef.current;
      controls.autoRotateSpeed = 0.55;
      controls.update();
      controlsRef.current = controls;

      const stopPresetOnInteract = () => {
        presetAnimRef.current.active = false;
        setAutoOrbit(false);
      };
      controls.addEventListener('start', stopPresetOnInteract);

      // Lighting rig
      const hemiLight = new THREE.HemisphereLight('#cbe5ff', '#5a5042', 0.9);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight('#fff3db', 2.6);
      sunLight.position.set(22, 26, 16);
      sunLight.castShadow = true;
      const shadowRes = isSoftwareRenderer ? 1024 : 2048;
      sunLight.shadow.mapSize.set(shadowRes, shadowRes);
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 75;
      sunLight.shadow.camera.left = -22;
      sunLight.shadow.camera.right = 22;
      sunLight.shadow.camera.top = 22;
      sunLight.shadow.camera.bottom = -22;
      sunLight.shadow.bias = -0.0005;
      scene.add(sunLight);

      // Procedural PBR Textures
      const plasterTex = createProceduralCanvasTexture('plaster', maxAniso);
      plasterTex.repeat.set(3, 2);
      const timberTex = createProceduralCanvasTexture('timber', maxAniso);
      timberTex.repeat.set(2, 2);
      const stoneTex = createProceduralCanvasTexture('stone', maxAniso);
      stoneTex.repeat.set(6, 4);
      const waterTex = createProceduralCanvasTexture('water', maxAniso);
      waterTex.repeat.set(3, 2);
      createdTextures.push(plasterTex, timberTex, stoneTex, waterTex);

      // Materials
      const groundMat = new THREE.MeshStandardMaterial({
        color: '#6e8158',
        roughness: 0.94,
        metalness: 0.0,
      });
      const terraceStoneMat = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.82,
        metalness: 0.04,
      });
      const plasterMat = new THREE.MeshStandardMaterial({
        map: plasterTex,
        roughness: 0.78,
        metalness: 0.02,
      });
      const darkBronzeMat = new THREE.MeshStandardMaterial({
        color: '#1f262a',
        roughness: 0.35,
        metalness: 0.78,
      });
      const timberMat = new THREE.MeshStandardMaterial({
        map: timberTex,
        roughness: 0.68,
        metalness: 0.04,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: '#8ec7de',
        roughness: 0.08,
        metalness: 0.1,
        transmission: 0.62,
        transparent: true,
        opacity: 0.82,
        ior: 1.5,
        reflectivity: 0.85,
        emissive: new THREE.Color('#223344'),
        emissiveIntensity: 0.12,
      });
      const waterMat = new THREE.MeshStandardMaterial({
        map: waterTex,
        roughness: 0.12,
        metalness: 0.18,
        transparent: true,
        opacity: 0.9,
      });
      const interiorGlowMat = new THREE.MeshStandardMaterial({
        color: '#f5ead6',
        roughness: 0.65,
        emissive: new THREE.Color('#ffcf86'),
        emissiveIntensity: 0.32,
      });

      // Estate Site Base & Garden Lawn
      const estateGroup = new THREE.Group();
      scene.add(estateGroup);

      const earthPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(36, 1.1, 32),
        new THREE.MeshStandardMaterial({ color: '#453d34', roughness: 0.95 })
      );
      earthPlinth.position.set(0, -0.56, 0);
      earthPlinth.receiveShadow = true;
      estateGroup.add(earthPlinth);

      const gardenLawn = new THREE.Mesh(new THREE.BoxGeometry(35.6, 0.08, 31.6), groundMat);
      gardenLawn.position.set(0, -0.02, 0);
      gardenLawn.receiveShadow = true;
      estateGroup.add(gardenLawn);

      // Stone Driveway & Motor Court
      const terraceDeck = new THREE.Mesh(new THREE.BoxGeometry(20, 0.22, 17), terraceStoneMat);
      terraceDeck.position.set(-0.5, 0.11, 0.5);
      terraceDeck.receiveShadow = true;
      terraceDeck.castShadow = true;
      estateGroup.add(terraceDeck);

      const entryWalkway = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 8), terraceStoneMat);
      entryWalkway.position.set(5.5, 0.08, 10.5);
      entryWalkway.receiveShadow = true;
      estateGroup.add(entryWalkway);

      // Architectural Infinity Pool
      const poolBasin = new THREE.Mesh(
        new THREE.BoxGeometry(8.8, 0.5, 4.4),
        new THREE.MeshStandardMaterial({ color: '#0c3b4a', roughness: 0.4 })
      );
      poolBasin.position.set(-4.6, 0.02, 5.2);
      poolBasin.receiveShadow = true;
      estateGroup.add(poolBasin);

      const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(8.3, 3.9, 1, 1), waterMat);
      poolWater.rotation.x = -Math.PI / 2;
      poolWater.position.set(-4.6, 0.29, 5.2);
      estateGroup.add(poolWater);

      // Determine Architectural Profile from Property Type & Bedrooms
      const beds = property?.details?.beds || 4;
      const isMultiLevel =
        beds >= 3 ||
        property?.propertyType === PropertyType.LUXURY_ESTATE ||
        property?.propertyType === PropertyType.APARTMENT ||
        property?.propertyType === PropertyType.COMMERCIAL ||
        property?.propertyType === PropertyType.HOTEL;
      const isTower =
        property?.propertyType === PropertyType.APARTMENT ||
        property?.propertyType === PropertyType.COMMERCIAL ||
        property?.propertyType === PropertyType.HOTEL;

      // Ground Floor Living Pavilion
      const groundCore = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.3, 6.2), plasterMat);
      groundCore.position.set(1.2, 1.85, -2.5);
      groundCore.castShadow = true;
      groundCore.receiveShadow = true;
      estateGroup.add(groundCore);

      // Interior Living Showcase Box + Glazed Front Wall
      const glazedWingFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 5.4), timberMat);
      glazedWingFloor.position.set(-4.6, 0.35, -1.6);
      glazedWingFloor.receiveShadow = true;
      estateGroup.add(glazedWingFloor);

      const interiorCore = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.7, 4.2), interiorGlowMat);
      interiorCore.position.set(-4.6, 1.8, -1.8);
      estateGroup.add(interiorCore);

      const glassPavilion = new THREE.Mesh(new THREE.BoxGeometry(7.0, 3.0, 5.1), glassMat);
      glassPavilion.position.set(-4.6, 1.95, -1.6);
      glassPavilion.castShadow = false;
      estateGroup.add(glassPavilion);

      // Bronze Architectural Mullions on Glazed Pavilion
      for (let i = -3; i <= 3; i += 2) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.1, 0.16), darkBronzeMat);
        mullion.position.set(-4.6 + i * 1.1, 1.95, 0.96);
        mullion.castShadow = true;
        estateGroup.add(mullion);
      }

      // Ground Floor Cantilever Slab + Timber Soffit
      const groundSlab = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.34, 8.2), plasterMat);
      groundSlab.position.set(-1.2, 3.55, -1.8);
      groundSlab.castShadow = true;
      groundSlab.receiveShadow = true;
      estateGroup.add(groundSlab);

      const soffit = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.1, 7.8), timberMat);
      soffit.position.set(-1.2, 3.36, -1.8);
      estateGroup.add(soffit);

      // Timber Pergola Shade Beams over Terrace
      for (let i = 0; i < 8; i++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 3.8), timberMat);
        beam.position.set(-7.6 + i * 0.9, 3.45, 2.6);
        beam.castShadow = true;
        estateGroup.add(beam);
      }

      // Upper Stories (2nd Level Master Suite or Multi-Story Tower)
      let roofTopY = 3.72;
      if (isMultiLevel) {
        const upperHeight = isTower ? 6.2 : 3.2;
        const upperVolume = new THREE.Mesh(new THREE.BoxGeometry(11.4, upperHeight, 5.8), plasterMat);
        upperVolume.position.set(1.6, 3.72 + upperHeight / 2, -2.0);
        upperVolume.castShadow = true;
        upperVolume.receiveShadow = true;
        estateGroup.add(upperVolume);

        // Upper Glazed Window Band
        const upperGlass = new THREE.Mesh(
          new THREE.BoxGeometry(9.6, isTower ? 4.6 : 2.3, 0.16),
          glassMat
        );
        upperGlass.position.set(1.4, 3.72 + upperHeight * 0.52, 0.92);
        estateGroup.add(upperGlass);

        // Teak Brise-Soleil Privacy Louvres
        for (let s = 0; s < 10; s++) {
          const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, upperHeight - 0.3, 0.48),
            timberMat
          );
          fin.position.set(3.8 + s * 0.32, 3.72 + upperHeight / 2, 1.05);
          fin.castShadow = true;
          estateGroup.add(fin);
        }

        // Upper Roof Canopy
        roofTopY = 3.72 + upperHeight + 0.18;
        const upperRoof = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.36, 7.2), plasterMat);
        upperRoof.position.set(1.4, roofTopY, -1.8);
        upperRoof.castShadow = true;
        upperRoof.receiveShadow = true;
        estateGroup.add(upperRoof);

        // Glass Terrace Balustrade on 2nd level cantilever
        const balconyGlass = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.0, 0.08), glassMat);
        balconyGlass.position.set(-6.8, 4.2, 2.2);
        estateGroup.add(balconyGlass);
      }

      // Solar Array Panels on Roof (when property hasSolar or eco-estate)
      if (property?.hasSolar !== false) {
        const solarMat = new THREE.MeshStandardMaterial({
          color: '#11254a',
          roughness: 0.2,
          metalness: 0.65,
        });
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 1.15), darkBronzeMat);
            panelFrame.position.set(-2.2 + col * 2.2, roofTopY + 0.34, -2.8 + row * 1.6);
            panelFrame.rotation.x = 0.22;
            panelFrame.castShadow = true;
            estateGroup.add(panelFrame);

            const cellSurface = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.03, 1.04), solarMat);
            cellSurface.position.set(0, 0.04, 0);
            panelFrame.add(cellSurface);
          }
        }
      }

      // Borehole / Water Storage Utility Enclosure (back east corner)
      if (property?.hasBorehole || property?.hasWaterTank) {
        const tankMat = new THREE.MeshStandardMaterial({ color: '#274c43', roughness: 0.45, metalness: 0.2 });
        const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 18), tankMat);
        waterTank.position.set(10.8, 1.1, -6.2);
        waterTank.castShadow = true;
        waterTank.receiveShadow = true;
        estateGroup.add(waterTank);
      }

      // Interior Architectural Point Lights (Warm Day Subtle, Strong Evening Glow)
      const interiorLightA = new THREE.PointLight('#ffd28a', 1.6, 16, 1.6);
      interiorLightA.position.set(-4.6, 2.6, -1.4);
      estateGroup.add(interiorLightA);

      const interiorLightB = new THREE.PointLight('#ffd28a', 1.6, 16, 1.6);
      interiorLightB.position.set(1.6, 2.6, 0.2);
      estateGroup.add(interiorLightB);

      // Perimeter Architectural Bollard Lights
      const bollardGlowMat = new THREE.MeshStandardMaterial({
        color: '#ffe4a8',
        emissive: new THREE.Color('#ffbe55'),
        emissiveIntensity: 1.5,
      });
      [
        [3.6, 6.2],
        [7.4, 6.2],
        [3.6, 10.6],
        [7.4, 10.6],
        [-9.2, 5.2],
      ].forEach(([bx, bz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), darkBronzeMat);
        post.position.set(bx, 0.34, bz);
        post.castShadow = true;
        estateGroup.add(post);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), bollardGlowMat);
        cap.position.set(bx, 0.7, bz);
        estateGroup.add(cap);
      });

      // Instanced Perimeter Foliage (strictly outside building/terrace footprint)
      const treeCount = isSoftwareRenderer ? 16 : 36;
      const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.2, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4433', roughness: 0.9 });
      const canopyGeo = new THREE.DodecahedronGeometry(1.35, 1);
      const canopyMat = new THREE.MeshStandardMaterial({ color: '#3b643b', roughness: 0.85 });

      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
      trunks.castShadow = true;
      canopies.castShadow = true;
      canopies.receiveShadow = true;

      let placed = 0;
      let attempts = 0;
      while (placed < treeCount && attempts < 240) {
        attempts++;
        const angle = (placed / treeCount) * Math.PI * 2 + (attempts % 5) * 0.19;
        const radius = 12.2 + ((attempts * 17) % 55) * 0.08;
        const tx = Math.cos(angle) * radius;
        const tz = Math.sin(angle) * (radius * 0.86);

        // Enforce exclusion around terrace deck + driveway + pool
        const insideBuildingZone = tx > -11.2 && tx < 10.5 && tz > -9.2 && tz < 9.5;
        const insideDriveway = tx > 2.8 && tx < 8.4 && tz > 6 && tz < 15;
        if (insideBuildingZone || insideDriveway) continue;

        const scale = 0.8 + ((placed * 7) % 10) * 0.055;
        _dummyPos.set(tx, 1.05 * scale, tz);
        _dummyEuler.set(0, (placed * 1.1) % Math.PI, 0);
        _dummyQuat.setFromEuler(_dummyEuler);
        _dummyScale.set(scale, scale, scale);
        _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
        trunks.setMatrixAt(placed, _dummyMatrix);

        _dummyPos.set(tx, 2.45 * scale, tz);
        _dummyScale.set(scale * 1.25, scale * 0.72, scale * 1.25);
        _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
        canopies.setMatrixAt(placed, _dummyMatrix);

        placed++;
      }
      trunks.count = placed;
      canopies.count = placed;
      trunks.instanceMatrix.needsUpdate = true;
      canopies.instanceMatrix.needsUpdate = true;
      estateGroup.add(trunks);
      estateGroup.add(canopies);

      lightingRefs.current = {
        scene,
        renderer,
        sunLight,
        hemiLight,
        interiorLights: [interiorLightA, interiorLightB],
        fog,
        windowGlassMat: glassMat,
      };

      // Responsive ResizeObserver
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0 && renderer) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        }
      });
      resizeObserver.observe(host);

      // Render Loop (strictly bounded, zero heap allocations)
      const animate = () => {
        rafId = requestAnimationFrame(animate);

        waterTex.offset.x = (waterTex.offset.x + 0.0004) % 1;
        waterTex.offset.y = (waterTex.offset.y + 0.00025) % 1;

        if (presetAnimRef.current.active) {
          _scratchTargetPos.copy(presetAnimRef.current.pos);
          _scratchLookAt.copy(presetAnimRef.current.target);
          camera.position.lerp(_scratchTargetPos, 0.08);
          controls.target.lerp(_scratchLookAt, 0.08);
          if (
            camera.position.distanceTo(_scratchTargetPos) < 0.08 &&
            controls.target.distanceTo(_scratchLookAt) < 0.05
          ) {
            presetAnimRef.current.active = false;
          }
        }

        controls.update();
        renderer?.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();
        controls.removeEventListener('start', stopPresetOnInteract);
        controls.dispose();
        createdTextures.forEach((t) => t.dispose());
        envRenderTarget?.dispose();
        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m?.dispose());
          }
        });
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement.parentNode === host) {
            host.removeChild(renderer.domElement);
          }
        }
      };
    } catch (err: any) {
      setWebglError(err?.message || 'Unable to initialize 3D architectural view.');
      return () => {
        cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();
        pmremGenerator?.dispose();
        envRenderTarget?.dispose();
        renderer?.dispose();
      };
    }
  }, [property?.id, property?.propertyType, property?.details?.beds, property?.hasSolar, property?.hasBorehole, property?.hasWaterTank]);

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            3D Architectural Twin Unavailable
          </p>
          <p className="text-sm text-slate-300">{webglError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#dfe8ef] select-none">
      {/* Isolated WebGL Host — Zero backdrop-blur overlays above */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-left Property Architectural Badge (compact, opaque dark slate without blur) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none max-w-xs sm:max-w-sm">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-white/15 text-white shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
            Interactive 3D Architectural Twin
          </p>
          <p className="text-xs sm:text-sm font-bold truncate mt-0.5">
            {property?.title || 'African Modernist Villa'}
          </p>
          {property && (
            <p className="text-[11px] text-slate-300 truncate">
              {property.address.city}, {property.country || 'Africa'} · {property.details.beds} Bed ·{' '}
              {Math.round(property.details.area * 0.0929)} m²
            </p>
          )}
        </div>
      </div>

      {/* Collapsible Compact Bottom Control Dock (<= 12% viewport height) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 max-w-[95vw]">
        <button
          type="button"
          onClick={() => setHudExpanded((prev) => !prev)}
          className="px-3 py-1 rounded-full bg-slate-950/90 border border-white/15 text-[11px] font-semibold text-slate-200 hover:text-amber-300 inline-flex items-center gap-1 shadow-lg"
        >
          <span>{hudExpanded ? 'Hide 3D Controls' : 'Show 3D Controls'}</span>
          {hudExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUpIcon className="w-3 h-3" />}
        </button>

        {hudExpanded && (
          <div className="px-3 py-2 rounded-2xl bg-slate-950/92 border border-white/15 text-white shadow-2xl flex flex-wrap items-center justify-center gap-2">
            {/* Camera Presets */}
            <div className="flex flex-wrap items-center gap-1">
              <CameraIcon className="w-3.5 h-3.5 text-amber-300 mr-1 hidden sm:block" />
              {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    activePreset === key
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  {CAMERA_PRESETS[key].label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* Day / Dusk Lighting */}
            <button
              type="button"
              onClick={() => setTimeOfDay((prev) => (prev === 'day' ? 'dusk' : 'day'))}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
            >
              {timeOfDay === 'day' ? (
                <>
                  <MoonIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Dusk Lighting</span>
                </>
              ) : (
                <>
                  <SunIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Daylight</span>
                </>
              )}
            </button>

            {/* Auto-Orbit Toggle */}
            <button
              type="button"
              onClick={() => setAutoOrbit((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                autoOrbit ? 'bg-emerald-700 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>{autoOrbit ? 'Orbiting' : 'Auto-Orbit'}</span>
            </button>

            {property?.hasSolar && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 text-[10px] font-semibold border border-emerald-800">
                <BoltIcon className="w-3 h-3" />
                <span>Solar Roof Active</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Property3DScene;

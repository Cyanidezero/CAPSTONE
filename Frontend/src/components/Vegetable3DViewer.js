import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import './Vegetable3DViewer.css';

/**
 * Procedural 3D Vegetable Model Generator for ClimaYield-X
 * Real-time WebGL Three.js models of Philippine short-cycle vegetables:
 * Pechay, Mustard Greens, Water Spinach, Cucumber, String Beans, Tomato,
 * Eggplant, Chili, White Radish, Lettuce, Okra, etc.
 */

// Normalize crop name / tag to standard key
export function getCropKey(crop) {
  if (!crop) return 'pechay';
  const name = (crop.name || crop.filipinoName || crop.id || '').toLowerCase();
  if (name.includes('pechay') || name.includes('bok choy')) return 'pechay';
  if (name.includes('mustasa') || name.includes('mustard')) return 'mustasa';
  if (name.includes('kangkong') || name.includes('water spinach') || name.includes('spinach')) return 'kangkong';
  if (name.includes('pipino') || name.includes('cucumber')) return 'cucumber';
  if (name.includes('sitaw') || name.includes('sitao') || name.includes('beans')) return 'sitaw';
  if (name.includes('kamatis') || name.includes('tomato')) return 'tomato';
  if (name.includes('talong') || name.includes('eggplant')) return 'talong';
  if (name.includes('sili') || name.includes('chili') || name.includes('pepper')) return 'sili';
  if (name.includes('labanos') || name.includes('radish')) return 'labanos';
  if (name.includes('letsugas') || name.includes('lettuce')) return 'lettuce';
  if (name.includes('okra')) return 'okra';
  return 'pechay';
}

// ----------------------------------------------------------------------
// Procedural Geometry & Mesh Builders
// ----------------------------------------------------------------------

function buildTomatoGroup(wireframe = false) {
  const group = new THREE.Group();

  // Shiny red heirloom tomato body with subtle lobed shape
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xef233c,
    roughness: 0.22,
    metalness: 0.1,
    wireframe
  });

  // Base central sphere slightly squashed vertically
  const bodyGeo = new THREE.SphereGeometry(1.05, 32, 24);
  const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
  mainBody.scale.set(1.15, 0.92, 1.15);
  group.add(mainBody);

  // Subtle surrounding lobe swells for organic heirloom look
  const lobeGeo = new THREE.SphereGeometry(0.55, 16, 16);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const lobe = new THREE.Mesh(lobeGeo, bodyMat);
    lobe.position.set(Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.65);
    lobe.scale.set(1.1, 0.9, 1.1);
    group.add(lobe);
  }

  // Green calyx sepals (star shape) on top
  const calyxMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.45,
    wireframe
  });

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const sepalGeo = new THREE.ConeGeometry(0.18, 0.65, 4);
    const sepal = new THREE.Mesh(sepalGeo, calyxMat);
    sepal.position.set(Math.cos(angle) * 0.35, 0.92, Math.sin(angle) * 0.35);
    sepal.rotation.z = Math.PI / 2.3;
    sepal.rotation.y = angle + Math.PI / 2;
    group.add(sepal);
  }

  // Curved vine stalk
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x40916c,
    roughness: 0.5,
    wireframe
  });
  const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.55, 8);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.set(0.08, 1.15, 0);
  stem.rotation.z = -0.25;
  group.add(stem);

  return group;
}

function buildCucumberGroup(wireframe = false) {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x1b4332,
    roughness: 0.32,
    metalness: 0.05,
    wireframe
  });

  // Elongated curved body composed of segmented slices
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const y = (t - 0.5) * 2.5;
    const curveOffset = Math.sin(t * Math.PI) * 0.22;
    const radius = Math.sin(t * Math.PI) * 0.45 + 0.15;

    const sliceGeo = new THREE.CylinderGeometry(radius * 0.95, radius, 2.5 / segments, 16);
    const slice = new THREE.Mesh(sliceGeo, skinMat);
    slice.position.set(curveOffset, y, 0);
    slice.rotation.z = curveOffset * 0.3;
    group.add(slice);
  }

  // Top and bottom rounded caps
  const capGeo = new THREE.SphereGeometry(0.32, 16, 12);
  const topCap = new THREE.Mesh(capGeo, skinMat);
  topCap.position.set(0.05, 1.25, 0);
  group.add(topCap);

  const bottomCap = new THREE.Mesh(capGeo, skinMat);
  bottomCap.position.set(0.05, -1.25, 0);
  group.add(bottomCap);

  // Tiny bumpy nodules along cucumber surface
  const bumpMat = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.5, wireframe });
  const bumpGeo = new THREE.SphereGeometry(0.07, 8, 8);
  for (let i = 0; i < 18; i++) {
    const bump = new THREE.Mesh(bumpGeo, bumpMat);
    const angle = (i * 1.6);
    const yPos = ((i % 9) / 9 - 0.5) * 2.0;
    bump.position.set(Math.cos(angle) * 0.42, yPos, Math.sin(angle) * 0.42);
    group.add(bump);
  }

  // Stem end
  const stemGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.35, 8);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.4, wireframe });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.set(0.05, 1.45, 0);
  stem.rotation.z = 0.2;
  group.add(stem);

  group.rotation.z = 0.25;
  return group;
}

function buildPechayGroup(wireframe = false) {
  const group = new THREE.Group();

  // Crisp pearly-white / pale-mint succulent stalks
  const stalkMat = new THREE.MeshStandardMaterial({
    color: 0xf1f8f5,
    roughness: 0.28,
    metalness: 0.05,
    wireframe
  });

  // Deep vibrant emerald green leaf fan blades
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.4,
    side: THREE.DoubleSide,
    wireframe
  });

  // Inner tender lime-yellow heart
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x74c69d,
    roughness: 0.35,
    side: THREE.DoubleSide,
    wireframe
  });

  // Outer ring of 6 curved leaf stalks in a rosette
  const stalkCount = 6;
  for (let i = 0; i < stalkCount; i++) {
    const angle = (i / stalkCount) * Math.PI * 2;
    const leafGroup = new THREE.Group();

    // White curved base stem
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.1, 10);
    const stem = new THREE.Mesh(stemGeo, stalkMat);
    stem.position.set(0, 0.4, 0);
    stem.scale.set(0.6, 1.0, 1.4);
    leafGroup.add(stem);

    // Broad wavy spoon-shaped leaf blade
    const bladeGeo = new THREE.SphereGeometry(0.55, 16, 12);
    const blade = new THREE.Mesh(bladeGeo, leafMat);
    blade.position.set(0, 1.1, 0.15);
    blade.scale.set(1.0, 1.3, 0.15);
    leafGroup.add(blade);

    // Arrange in outward flaring cup
    leafGroup.position.set(Math.cos(angle) * 0.28, -0.6, Math.sin(angle) * 0.28);
    leafGroup.rotation.y = angle;
    leafGroup.rotation.x = 0.38;
    group.add(leafGroup);
  }

  // Inner tender core
  for (let j = 0; j < 3; j++) {
    const angle = (j / 3) * Math.PI * 2 + 0.5;
    const innerBladeGeo = new THREE.SphereGeometry(0.42, 14, 10);
    const innerBlade = new THREE.Mesh(innerBladeGeo, heartMat);
    innerBlade.position.set(Math.cos(angle) * 0.12, 0.2, Math.sin(angle) * 0.12);
    innerBlade.scale.set(0.7, 1.2, 0.18);
    innerBlade.rotation.y = angle;
    innerBlade.rotation.x = 0.15;
    group.add(innerBlade);
  }

  // Base root bulb / trimmed cut
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.3, 16);
  const baseMesh = new THREE.Mesh(baseGeo, stalkMat);
  baseMesh.position.set(0, -0.65, 0);
  group.add(baseMesh);

  return group;
}

function buildMustasaGroup(wireframe = false) {
  const group = new THREE.Group();

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x52b788,
    roughness: 0.45,
    side: THREE.DoubleSide,
    wireframe
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x95d5b2,
    roughness: 0.35,
    wireframe
  });

  // Frilled, crinkled cluster of leafy lobes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const leafGroup = new THREE.Group();

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.9, 8);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.35, 0);
    leafGroup.add(stem);

    // Serrated wavy leaf cluster
    const bladeGeo = new THREE.ConeGeometry(0.6, 1.2, 6);
    const blade = new THREE.Mesh(bladeGeo, leafMat);
    blade.position.set(0, 0.9, 0.1);
    blade.scale.set(1.2, 1.0, 0.2);
    blade.rotation.x = 0.2;
    leafGroup.add(blade);

    leafGroup.position.set(Math.cos(angle) * 0.25, -0.5, Math.sin(angle) * 0.25);
    leafGroup.rotation.y = angle;
    leafGroup.rotation.x = 0.45;
    group.add(leafGroup);
  }

  return group;
}

function buildWaterSpinachGroup(wireframe = false) {
  const group = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x74c69d,
    roughness: 0.3,
    wireframe
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.38,
    side: THREE.DoubleSide,
    wireframe
  });

  // Upright bamboo-like jointed hollow stem
  const stemGeo = new THREE.CylinderGeometry(0.09, 0.12, 2.4, 12);
  const mainStem = new THREE.Mesh(stemGeo, stemMat);
  mainStem.position.set(-0.1, 0, 0);
  mainStem.rotation.z = -0.12;
  group.add(mainStem);

  // Nodes with alternating lanceolate pointed leaves
  const nodeCount = 5;
  for (let i = 0; i < nodeCount; i++) {
    const y = (i / nodeCount - 0.4) * 1.9;
    const side = i % 2 === 0 ? 1 : -1;
    const leafGroup = new THREE.Group();

    // Leaf petiole
    const petioleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6);
    const petiole = new THREE.Mesh(petioleGeo, stemMat);
    petiole.position.set(0.12 * side, 0, 0);
    petiole.rotation.z = -0.7 * side;
    leafGroup.add(petiole);

    // Elongated arrowhead / lance leaf
    const leafGeo = new THREE.ConeGeometry(0.28, 1.1, 4);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0.55 * side, 0.1, 0);
    leaf.scale.set(1.0, 1.0, 0.15);
    leaf.rotation.z = -Math.PI / 2.8 * side;
    leafGroup.add(leaf);

    leafGroup.position.set(-0.1 + y * 0.12, y, 0);
    group.add(leafGroup);
  }

  return group;
}

function buildStringBeansGroup(wireframe = false) {
  const group = new THREE.Group();

  const podMat = new THREE.MeshStandardMaterial({
    color: 0x40916c,
    roughness: 0.35,
    wireframe
  });

  const bumpMat = new THREE.MeshStandardMaterial({
    color: 0x52b788,
    roughness: 0.4,
    wireframe
  });

  // Pair of long slender drooping bean pods
  const createPod = (offsetX, curveDir) => {
    const podGroup = new THREE.Group();
    const segments = 10;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const y = (0.5 - t) * 2.6;
      const x = Math.sin(t * Math.PI) * 0.35 * curveDir;

      const segGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.6 / segments, 10);
      const seg = new THREE.Mesh(segGeo, podMat);
      seg.position.set(x, y, 0);
      seg.rotation.z = (curveDir * (t - 0.5)) * 0.4;
      podGroup.add(seg);

      // Bean swelling bumps inside the pod
      if (i % 2 === 1) {
        const bumpGeo = new THREE.SphereGeometry(0.13, 8, 8);
        const bump = new THREE.Mesh(bumpGeo, bumpMat);
        bump.position.set(x, y, 0);
        bump.scale.set(1.2, 1.5, 1.1);
        podGroup.add(bump);
      }
    }
    podGroup.position.set(offsetX, 0, 0);
    return podGroup;
  };

  group.add(createPod(-0.25, 1));
  group.add(createPod(0.25, -0.8));

  // Top stem tying them together
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.5, wireframe });
  const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.3, 8);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.set(0, 1.35, 0);
  cap.rotation.z = Math.PI / 2;
  group.add(cap);

  return group;
}

function buildEggplantGroup(wireframe = false) {
  const group = new THREE.Group();

  // Glossy royal violet / aubergine body
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x3a0ca3,
    roughness: 0.15,
    metalness: 0.15,
    wireframe
  });

  const bodyGeo = new THREE.SphereGeometry(0.95, 32, 24);
  const body = new THREE.Mesh(bodyGeo, skinMat);
  body.scale.set(0.9, 1.6, 0.9);
  body.position.set(0, -0.15, 0);
  group.add(body);

  // Calyx collar (green lobes)
  const calyxMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.4, wireframe });
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const lobeGeo = new THREE.ConeGeometry(0.28, 0.7, 4);
    const lobe = new THREE.Mesh(lobeGeo, calyxMat);
    lobe.position.set(Math.cos(angle) * 0.45, 1.05, Math.sin(angle) * 0.45);
    lobe.rotation.z = Math.PI / 1.7;
    lobe.rotation.y = angle;
    group.add(lobe);
  }

  // Curved stem
  const stemGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8);
  const stem = new THREE.Mesh(stemGeo, calyxMat);
  stem.position.set(0.08, 1.45, 0);
  stem.rotation.z = -0.3;
  group.add(stem);

  return group;
}

function buildChiliGroup(wireframe = false) {
  const group = new THREE.Group();

  const chiliMat = new THREE.MeshStandardMaterial({
    color: 0xd90429,
    roughness: 0.18,
    metalness: 0.08,
    wireframe
  });

  // Tapered curved horn pepper
  const segments = 10;
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const y = (0.5 - t) * 2.2;
    const radius = (1 - t * 0.85) * 0.35;
    const curve = Math.sin(t * Math.PI) * 0.35;

    const segGeo = new THREE.CylinderGeometry(radius * 0.9, radius, 2.2 / segments, 12);
    const seg = new THREE.Mesh(segGeo, chiliMat);
    seg.position.set(curve, y, 0);
    seg.rotation.z = curve * 0.4;
    group.add(seg);
  }

  // Sharp tip
  const tipGeo = new THREE.ConeGeometry(0.1, 0.25, 8);
  const tip = new THREE.Mesh(tipGeo, chiliMat);
  tip.position.set(0.12, -1.2, 0);
  tip.rotation.z = Math.PI;
  group.add(tip);

  // Calyx & Stem
  const calyxMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.4, wireframe });
  const capGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.2, 10);
  const cap = new THREE.Mesh(capGeo, calyxMat);
  cap.position.set(0, 1.15, 0);
  group.add(cap);

  const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.45, 8);
  const stem = new THREE.Mesh(stemGeo, calyxMat);
  stem.position.set(0.08, 1.4, 0);
  stem.rotation.z = -0.35;
  group.add(stem);

  group.rotation.z = -0.2;
  return group;
}

function buildRadishGroup(wireframe = false) {
  const group = new THREE.Group();

  const rootMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.35,
    wireframe
  });

  // White tapered root
  const rootGeo = new THREE.ConeGeometry(0.65, 2.4, 20);
  const root = new THREE.Mesh(rootGeo, rootMat);
  root.position.set(0, -0.4, 0);
  root.rotation.x = Math.PI;
  group.add(root);

  // Top leafy green crown
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.4,
    side: THREE.DoubleSide,
    wireframe
  });

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.3, 1.0, 4);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 0.18, 1.1, Math.sin(angle) * 0.18);
    leaf.scale.set(1.0, 1.0, 0.2);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.45;
    group.add(leaf);
  }

  return group;
}

function buildLettuceGroup(wireframe = false) {
  const group = new THREE.Group();

  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x52b788,
    roughness: 0.45,
    side: THREE.DoubleSide,
    wireframe
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x74c69d,
    roughness: 0.35,
    side: THREE.DoubleSide,
    wireframe
  });

  // Layered wavy rosette petals forming a lettuce head
  for (let layer = 0; layer < 3; layer++) {
    const count = 4 + layer * 2;
    const radius = 0.45 + layer * 0.35;
    const mat = layer === 0 ? innerMat : outerMat;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (layer * 0.5);
      const petalGeo = new THREE.SphereGeometry(0.5, 12, 10);
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(Math.cos(angle) * radius, (2 - layer) * 0.2 - 0.2, Math.sin(angle) * radius);
      petal.scale.set(1.1, 1.0, 0.25);
      petal.rotation.y = angle;
      petal.rotation.x = 0.25 * (layer + 1);
      group.add(petal);
    }
  }

  return group;
}

function buildOkraGroup(wireframe = false) {
  const group = new THREE.Group();

  const podMat = new THREE.MeshStandardMaterial({
    color: 0x40916c,
    roughness: 0.4,
    wireframe
  });

  // 5-sided pentagonal cone pod
  const podGeo = new THREE.ConeGeometry(0.48, 2.3, 5);
  const pod = new THREE.Mesh(podGeo, podMat);
  pod.rotation.x = Math.PI;
  group.add(pod);

  // Pod cap and stem
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.5, wireframe });
  const capGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.25, 5);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.set(0, 1.25, 0);
  group.add(cap);

  const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8);
  const stem = new THREE.Mesh(stemGeo, capMat);
  stem.position.set(0, 1.5, 0);
  group.add(stem);

  return group;
}

function buildDefaultPlantGroup(wireframe = false) {
  const group = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.35, wireframe });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.4, side: THREE.DoubleSide, wireframe });

  const stemGeo = new THREE.CylinderGeometry(0.1, 0.14, 1.8, 12);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  group.add(stem);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const leafGeo = new THREE.SphereGeometry(0.45, 12, 10);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 0.45, (i - 1.5) * 0.35, Math.sin(angle) * 0.45);
    leaf.scale.set(1.0, 0.2, 1.2);
    leaf.rotation.y = angle;
    group.add(leaf);
  }

  return group;
}

// Model router
export function createVegetable3DGroup(cropKey, wireframe = false) {
  switch (cropKey) {
    case 'tomato':
      return buildTomatoGroup(wireframe);
    case 'cucumber':
      return buildCucumberGroup(wireframe);
    case 'pechay':
      return buildPechayGroup(wireframe);
    case 'mustasa':
      return buildMustasaGroup(wireframe);
    case 'kangkong':
      return buildWaterSpinachGroup(wireframe);
    case 'sitaw':
      return buildStringBeansGroup(wireframe);
    case 'talong':
      return buildEggplantGroup(wireframe);
    case 'sili':
      return buildChiliGroup(wireframe);
    case 'labanos':
      return buildRadishGroup(wireframe);
    case 'lettuce':
      return buildLettuceGroup(wireframe);
    case 'okra':
      return buildOkraGroup(wireframe);
    default:
      return buildDefaultPlantGroup(wireframe);
  }
}

// ----------------------------------------------------------------------
// 🌟 1. INLINE 3D VEGETABLE CANVAS COMPONENT (For Crop Cards)
// ----------------------------------------------------------------------
export const Vegetable3DCanvas = ({
  crop,
  height = 125,
  interactive = true,
  autoRotate = true,
  onInspect = null,
  showBadge = true,
  className = ''
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const groupRef = useRef(null);
  const rendererRef = useRef(null);
  const reqAnimRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const rotVelRef = useRef({ x: 0, y: 0 });

  const cropKey = getCropKey(crop);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 200;
    const h = height;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 100);
    camera.position.set(0, 0.5, 4.4);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'v3d-canvas';

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x86efac, 0.7);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xfef08a, 0.4);
    warmFill.position.set(0, -3, 2);
    scene.add(warmFill);

    // 4. Ground Contact Shadow Disc
    const shadowGeo = new THREE.RingGeometry(0.1, 1.4, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x14532d,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.y = -1.45;
    scene.add(shadowMesh);

    // 5. Build Vegetable Model Group
    const vegGroup = createVegetable3DGroup(cropKey, false);
    groupRef.current = vegGroup;
    scene.add(vegGroup);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (vegGroup) {
        // Damped user rotation
        vegGroup.rotation.y += rotVelRef.current.x;
        vegGroup.rotation.x += rotVelRef.current.y;
        rotVelRef.current.x *= 0.92;
        rotVelRef.current.y *= 0.92;

        // Auto rotation and gentle float when idle
        if (!isPointerDownRef.current) {
          if (autoRotate) {
            vegGroup.rotation.y += 0.012;
          }
          vegGroup.position.y = Math.sin(time * 2.2) * 0.06;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 200;
      camera.aspect = newW / h;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [cropKey, height, autoRotate]);

  // Pointer Interaction
  const handlePointerDown = (e) => {
    if (!interactive) return;
    isPointerDownRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!interactive || !isPointerDownRef.current) return;
    const deltaX = e.clientX - pointerPosRef.current.x;
    const deltaY = e.clientY - pointerPosRef.current.y;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };

    rotVelRef.current.x = deltaX * 0.012;
    rotVelRef.current.y = deltaY * 0.012;
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  return (
    <div
      className={`v3d-canvas-wrapper ${className}`}
      style={{ height: `${height}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      title="3D Vegetable Model - Drag to rotate 360°"
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* 3D Indicator Badge */}
      {showBadge && (
        <span className="v3d-pill-badge">
          <span>✨</span>
          <span>3D Model</span>
        </span>
      )}

      {/* Hover Spin Hint */}
      <span className="v3d-spin-hint">
        🔄 Drag to rotate 360°
      </span>

      {/* Inspect Button */}
      {onInspect && (
        <button
          type="button"
          className="v3d-inspect-btn"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(crop);
          }}
          title="Open interactive 3D inspection studio"
        >
          <span>🔍</span>
          <span>Inspect 3D</span>
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 🌟 2. FULL INTERACTIVE 3D INSPECTION STUDIO MODAL
// ----------------------------------------------------------------------
export const Vegetable3DModal = ({ crop, isOpen, onClose, lang = 'en' }) => {
  const modalCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const reqAnimRef = useRef(null);
  const vegGroupRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [activeLighting, setActiveLighting] = useState('studio'); // 'studio' | 'sun' | 'night'
  const [zoomLevel, setZoomLevel] = useState(3.8);
  const [selectedStage, setSelectedStage] = useState(crop?.stageStep || 4);

  const isPointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const rotVelRef = useRef({ x: 0, y: 0 });

  const isFil = lang === 'fil';
  const cropKey = getCropKey(crop);

  useEffect(() => {
    if (!isOpen) return;

    const container = modalCanvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.5, zoomLevel);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'v3d-modal-canvas';

    // Lighting Presets
    const ambientLight = new THREE.AmbientLight(
      activeLighting === 'night' ? 0x1e293b : 0xffffff,
      activeLighting === 'night' ? 0.4 : 0.85
    );
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(
      activeLighting === 'sun' ? 0xfef08a : activeLighting === 'night' ? 0x38bdf8 : 0xffffff,
      activeLighting === 'night' ? 0.7 : 1.3
    );
    mainLight.position.set(3, 4, 3);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x86efac, 0.6);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Ground Shadow
    const shadowGeo = new THREE.RingGeometry(0.1, 1.5, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x14532d,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.y = -1.45;
    scene.add(shadowMesh);

    // Vegetable Model
    const vegGroup = createVegetable3DGroup(cropKey, wireframe);
    // Apply growth stage scale factor
    const stageScales = { 1: 0.5, 2: 0.75, 3: 0.9, 4: 1.05, 5: 1.15 };
    const s = stageScales[selectedStage] || 1;
    vegGroup.scale.set(s, s, s);

    vegGroupRef.current = vegGroup;
    scene.add(vegGroup);

    let clock = new THREE.Clock();
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (vegGroup) {
        vegGroup.rotation.y += rotVelRef.current.x;
        vegGroup.rotation.x += rotVelRef.current.y;
        rotVelRef.current.x *= 0.92;
        rotVelRef.current.y *= 0.92;

        if (!isPointerDownRef.current) {
          vegGroup.rotation.y += 0.008;
          vegGroup.position.y = Math.sin(time * 2) * 0.05;
        }
      }

      camera.position.z = zoomLevel;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 400;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [isOpen, cropKey, wireframe, activeLighting, zoomLevel, selectedStage]);

  if (!isOpen || !crop) return null;

  const displayName = isFil ? (crop.filipinoName || crop.name) : (crop.name || crop.filipinoName);

  return (
    <div className="v3d-modal-overlay" onClick={onClose}>
      <div className="v3d-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="v3d-modal-header">
          <div className="v3d-modal-title-group">
            <div className="v3d-modal-icon-badge">{crop.icon || '🥬'}</div>
            <div className="v3d-modal-title-text">
              <h3>
                <span>{displayName}</span>
                <span style={{ fontSize: '0.78rem', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                  Interactive 3D Studio
                </span>
              </h3>
              <p>
                {isFil 
                  ? 'Real-time 3D Botanical Model • Pag-aralan ang anyo at yugto ng paglaki' 
                  : 'Real-time 3D Botanical Mesh • Inspect morphology and growth development'}
              </p>
            </div>
          </div>
          <button type="button" className="v3d-modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="v3d-modal-body">
          {/* Left Column: 3D Canvas & Controls */}
          <div className="v3d-viewer-column">
            <div
              className="v3d-modal-canvas-frame"
              onPointerDown={(e) => {
                isPointerDownRef.current = true;
                pointerPosRef.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerMove={(e) => {
                if (!isPointerDownRef.current) return;
                const deltaX = e.clientX - pointerPosRef.current.x;
                const deltaY = e.clientY - pointerPosRef.current.y;
                pointerPosRef.current = { x: e.clientX, y: e.clientY };
                rotVelRef.current.x = deltaX * 0.012;
                rotVelRef.current.y = deltaY * 0.012;
              }}
              onPointerUp={() => { isPointerDownRef.current = false; }}
              onPointerLeave={() => { isPointerDownRef.current = false; }}
            >
              <div ref={modalCanvasRef} style={{ width: '100%', height: '100%' }} />
              <span className="v3d-pill-badge" style={{ top: 12, right: 12 }}>
                WebGL 60 FPS
              </span>
            </div>

            {/* Viewer Controls Bar */}
            <div className="v3d-controls-bar">
              {/* Reset Angle */}
              <button
                type="button"
                className="v3d-ctrl-btn"
                onClick={() => {
                  if (vegGroupRef.current) {
                    vegGroupRef.current.rotation.set(0, 0, 0);
                  }
                }}
              >
                🔄 {isFil ? 'I-reset ang Anggulo' : 'Reset Angle'}
              </button>

              {/* Wireframe Toggle */}
              <button
                type="button"
                className={`v3d-ctrl-btn ${wireframe ? 'active' : ''}`}
                onClick={() => setWireframe(!wireframe)}
              >
                📐 {wireframe ? 'Shaded View' : 'Wireframe 3D'}
              </button>

              {/* Lighting Presets */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`v3d-ctrl-btn ${activeLighting === 'studio' ? 'active' : ''}`}
                  onClick={() => setActiveLighting('studio')}
                  title="Studio Light"
                >
                  💡 Studio
                </button>
                <button
                  type="button"
                  className={`v3d-ctrl-btn ${activeLighting === 'sun' ? 'active' : ''}`}
                  onClick={() => setActiveLighting('sun')}
                  title="Tropical Sun"
                >
                  ☀️ Sun
                </button>
              </div>

              {/* Zoom In / Out */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  className="v3d-ctrl-btn"
                  onClick={() => setZoomLevel((z) => Math.min(5.2, z + 0.5))}
                  title="Zoom Out"
                >
                  🔍-
                </button>
                <button
                  type="button"
                  className="v3d-ctrl-btn"
                  onClick={() => setZoomLevel((z) => Math.max(2.5, z - 0.5))}
                  title="Zoom In"
                >
                  🔍+
                </button>
              </div>
            </div>

            {/* Growth Stage Interactive Stepper */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '700', marginBottom: '6px' }}>
                🌱 {isFil ? 'Yugto ng Paglaki sa 3D Canvas:' : 'Simulate Growth Stage in 3D:'}
              </div>
              <div className="v3d-stages-nav">
                {[
                  { num: 1, label: isFil ? '1. Punla' : '1. Seedling' },
                  { num: 2, label: isFil ? '2. Paglaki' : '2. Vegetative' },
                  { num: 3, label: isFil ? '3. Bulaklak' : '3. Flowering' },
                  { num: 4, label: isFil ? '4. Bunga' : '4. Fruiting' },
                  { num: 5, label: isFil ? '5. Pag-ani' : '5. Harvest' }
                ].map((st) => (
                  <button
                    key={st.num}
                    type="button"
                    className={`v3d-stage-pill ${selectedStage === st.num ? 'active' : ''}`}
                    onClick={() => setSelectedStage(st.num)}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Agronomic Specifications */}
          <div className="v3d-details-column">
            <div className="v3d-spec-card">
              <div className="v3d-spec-title">
                <span>📊</span>
                <span>{isFil ? 'Katangian ng Gulay' : 'Agronomic Profile'}</span>
              </div>
              <div className="v3d-spec-grid">
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Araw ng Paglaki' : 'Days to Harvest'}</div>
                  <div className="v3d-spec-val">
                    {isFil ? (crop.daysToGrowFil || crop.daysToGrowEn || crop.daysToGrow) : (crop.daysToGrowEn || crop.daysToGrowFil || crop.daysToGrow)}
                  </div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Kategorya' : 'Classification'}</div>
                  <div className="v3d-spec-val">⚡ Short-Cycle</div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Tamang Init' : 'Optimal Temp'}</div>
                  <div className="v3d-spec-val">24°C – 32°C</div>
                </div>
                <div className="v3d-spec-item">
                  <div className="v3d-spec-label">{isFil ? 'Dalas ng Patubig' : 'Irrigation'}</div>
                  <div className="v3d-spec-val">{isFil ? '2x lingguhan' : '2x weekly'}</div>
                </div>
              </div>
            </div>

            <div className="v3d-spec-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
              <div className="v3d-spec-title" style={{ color: '#0f172a' }}>
                <span>💡</span>
                <span>{isFil ? 'Payo sa Pagtatanim sa QC' : 'QC Cultivation Advisory'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.45' }}>
                {isFil
                  ? 'Angkop na angkop itong itanim sa urban container gardens at vegetable plots sa Quezon City. Maganda ang proteksyon nito kapag may kasamang companion plants tulad ng basil at marigold.'
                  : 'Highly viable for Quezon City urban raised beds and container gardens. Pair with companion aromatics (basil, marigolds) to suppress flea beetles and hornworms naturally.'}
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'auto' }}>
              <button
                type="button"
                className="fd-modal-btn submit"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onClose}
              >
                ✓ {isFil ? 'Bumalik sa Dashboard' : 'Return to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

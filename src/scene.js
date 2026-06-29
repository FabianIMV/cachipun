// 3D presentation layer for Cachipún, built on Three.js.
// Visual techniques borrowed from the recent viral Three.js games:
//  · PMREM room environment for realistic reflections
//  · refractive "liquid glass" board (MeshPhysicalMaterial transmission)
//  · emissive neon pieces lit up by UnrealBloom post-processing
//  · soft PCF shadows, rim lights, floating dust + confetti particles
//  · eased, springy animations and a gently breathing camera.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { tween, Ease, updateTweens } from "./tween.js";

const S = 1.9;            // spacing between cell centres
const BOARD_TOP = 0.32;   // y of the board surface
const COLORS = {
  X: new THREE.Color("#38e8ff"),
  O: new THREE.Color("#ff5edb"),
};

export function createScene(canvas, { onCellClick }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0820, 0.022);

  // Reflective environment for the glass + metal highlights.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  const CAM_HOME = new THREE.Vector3(0, 8.2, 8.6);
  camera.position.copy(CAM_HOME);
  camera.lookAt(0, 0, 0);

  buildBackground(scene);
  buildLights(scene);
  buildFloor(scene);

  const board = buildBoard(scene);
  const dust = buildDust(scene);

  // ---------- post processing ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85, 0.55, 0.8
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- interaction ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = -1;
  let interactive = true;

  const pieces = new Array(9).fill(null);
  const confetti = [];

  function setPointerFromEvent(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    pointer.x = (x / window.innerWidth) * 2 - 1;
    pointer.y = -(y / window.innerHeight) * 2 + 1;
  }

  function pickCell() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(board.hitAreas, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }

  function onMove(e) {
    setPointerFromEvent(e);
    if (!interactive) { setHover(-1); return; }
    setHover(pickCell());
  }

  function onClick(e) {
    if (!interactive) return;
    setPointerFromEvent(e);
    const idx = pickCell();
    if (idx >= 0 && !pieces[idx]) onCellClick(idx);
  }

  function setHover(idx) {
    if (idx === hovered) return;
    hovered = idx;
    canvas.style.cursor = idx >= 0 ? "pointer" : "default";
    const target = idx >= 0 ? board.cellPos(idx) : null;
    if (target) {
      board.hover.visible = true;
      board.hover.position.set(target.x, BOARD_TOP + 0.02, target.z);
    }
    tween({
      duration: 0.25,
      ease: Ease.outCubic,
      onUpdate: (v) => {
        const from = board.hover.material.opacity;
        board.hover.material.opacity = idx >= 0
          ? THREE.MathUtils.lerp(from, 0.5, v)
          : THREE.MathUtils.lerp(from, 0, v);
      },
      onComplete: () => { if (idx < 0) board.hover.visible = false; },
    });
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onClick);
  window.addEventListener("pointerleave", () => setHover(-1));

  // mouse parallax target
  const parallax = new THREE.Vector2(0, 0);
  window.addEventListener("pointermove", (e) => {
    parallax.x = (e.clientX / window.innerWidth - 0.5);
    parallax.y = (e.clientY / window.innerHeight - 0.5);
  });

  // ---------- piece factory ----------
  function makePiece(player) {
    const group = new THREE.Group();
    const color = COLORS[player];
    const mat = new THREE.MeshPhysicalMaterial({
      color: color.clone().multiplyScalar(0.25),
      emissive: color,
      emissiveIntensity: 1.5,
      metalness: 0.6,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    });

    if (player === "X") {
      const geo = new THREE.BoxGeometry(1.55, 0.34, 0.34);
      for (const r of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(geo, mat);
        bar.rotation.y = r;
        bar.castShadow = true;
        group.add(bar);
      }
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 24, 60), mat);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      group.add(ring);
    }
    group.userData.mat = mat;
    return group;
  }

  function placePiece(index, player, animate = true) {
    if (pieces[index]) return;
    const piece = makePiece(player);
    const pos = board.cellPos(index);
    piece.position.set(pos.x, BOARD_TOP + 0.25, pos.z);
    scene.add(piece);
    pieces[index] = piece;

    if (animate) {
      piece.scale.setScalar(0.01);
      piece.position.y = BOARD_TOP + 2.4;
      piece.rotation.y = Math.PI;
      tween({
        duration: 0.65, ease: Ease.outBack,
        onUpdate: (v) => {
          piece.scale.setScalar(0.01 + v * 0.99);
          piece.position.y = THREE.MathUtils.lerp(BOARD_TOP + 2.4, BOARD_TOP + 0.25, v);
          piece.rotation.y = Math.PI * (1 - v);
        },
        onComplete: () => {
          piece.scale.setScalar(1);
          piece.position.y = BOARD_TOP + 0.25;
          piece.rotation.y = 0;
        },
      });
    }
  }

  function clearBoard(animate = true) {
    pieces.forEach((p, i) => {
      if (!p) return;
      if (animate) {
        tween({
          duration: 0.42, ease: Ease.inOutCubic,
          onUpdate: (v) => {
            p.scale.setScalar(1 - v);
            p.position.y = BOARD_TOP + 0.25 + v * 1.6;
            p.userData.mat.emissiveIntensity = 1.5 * (1 - v);
          },
          onComplete: () => { scene.remove(p); disposePiece(p); },
        });
      } else {
        scene.remove(p);
        disposePiece(p);
      }
    });
    pieces.fill(null);
    board.cells.forEach((c) => resetCellGlow(c));
  }

  function disposePiece(p) {
    p.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    if (p.userData.mat) p.userData.mat.dispose();
  }

  function highlightWin(line, player) {
    const color = COLORS[player];
    line.forEach((idx, k) => {
      const cell = board.cells[idx];
      tween({
        duration: 0.5, delay: k * 0.09, ease: Ease.outCubic,
        onUpdate: (v) => {
          cell.material.emissive.copy(color);
          cell.material.emissiveIntensity = v * 1.2;
          cell.position.y = THREE.MathUtils.lerp(0, 0.18, v);
        },
      });
      const piece = pieces[idx];
      if (piece) {
        tween({
          duration: 1.4, delay: k * 0.09, ease: Ease.outElastic,
          onUpdate: (v) => { piece.position.y = BOARD_TOP + 0.25 + Math.sin(v * Math.PI) * 0.35; },
        });
      }
    });
    spawnConfetti(player);
  }

  function resetCellGlow(cell) {
    cell.material.emissive.setHex(0x000000);
    cell.material.emissiveIntensity = 0;
    cell.position.y = 0;
  }

  // ---------- confetti ----------
  function spawnConfetti(player) {
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];
    const palette = [COLORS[player], new THREE.Color("#ffd84d"), new THREE.Color("#b388ff"), new THREE.Color("#ffffff")];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = 2 + Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      const c = palette[(Math.random() * palette.length) | 0];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        4 + Math.random() * 5,
        (Math.random() - 0.5) * 6
      ));
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.22, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    confetti.push({ points, velocities, life: 0, max: 2.6 });
  }

  function updateConfetti(dt) {
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.life += dt;
      const pos = c.points.geometry.attributes.position.array;
      for (let j = 0; j < c.velocities.length; j++) {
        const v = c.velocities[j];
        v.y -= 9.8 * dt;
        pos[j * 3] += v.x * dt;
        pos[j * 3 + 1] += v.y * dt;
        pos[j * 3 + 2] += v.z * dt;
      }
      c.points.geometry.attributes.position.needsUpdate = true;
      c.points.material.opacity = Math.max(0, 1 - c.life / c.max);
      if (c.life >= c.max) {
        scene.remove(c.points);
        c.points.geometry.dispose();
        c.points.material.dispose();
        confetti.splice(i, 1);
      }
    }
  }

  // ---------- loop ----------
  // Drive timing off the rAF timestamp (monotonic, performance.now based)
  // rather than THREE.Clock — more robust across browsers/headless.
  let camPulse = 0;
  let startTime = 0;
  let lastTime = 0;

  function celebrate() { camPulse = 1; }

  function animate(now) {
    requestAnimationFrame(animate);
    if (!startTime) { startTime = now; lastTime = now; }
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const t = (now - startTime) / 1000;

    updateTweens(dt);
    updateConfetti(dt);

    // breathing + parallax camera
    const sweep = camPulse * Math.sin(t * 2) * 0.6;
    camera.position.x = CAM_HOME.x + parallax.x * 1.6 + Math.sin(t * 0.4) * 0.25 + sweep;
    camera.position.y = CAM_HOME.y - parallax.y * 1.0 + Math.sin(t * 0.55) * 0.18;
    camera.position.z = CAM_HOME.z + Math.cos(t * 0.4) * 0.2;
    camera.lookAt(0, 0.2, 0);
    camPulse *= 0.985;

    dust.rotation.y += dt * 0.02;
    board.hover.material.opacity > 0 && (board.hover.rotation.z += dt * 0.4);

    composer.render();
  }
  requestAnimationFrame(animate);

  // ---------- resize ----------
  window.addEventListener("resize", () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  });

  return {
    placePiece,
    clearBoard,
    highlightWin,
    celebrate,
    setInteractive: (v) => { interactive = v; if (!v) setHover(-1); },
  };
}

// ---------------- scene building helpers ----------------

function buildBackground(scene) {
  const geo = new THREE.SphereGeometry(60, 32, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color("#3a1d6e") },
      mid: { value: new THREE.Color("#160c33") },
      bottom: { value: new THREE.Color("#080418") },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      void main() {
        float h = normalize(vPos).y;
        vec3 col = h > 0.0 ? mix(mid, top, h) : mix(mid, bottom, -h);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(geo, mat));
}

function buildLights(scene) {
  scene.add(new THREE.HemisphereLight(0x9ad6ff, 0x2a1457, 0.45));

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(5, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);

  const rimA = new THREE.PointLight(0x38e8ff, 60, 30);
  rimA.position.set(-7, 4, 5);
  scene.add(rimA);

  const rimB = new THREE.PointLight(0xff5edb, 60, 30);
  rimB.position.set(7, 3, -5);
  scene.add(rimB);
}

function buildFloor(scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);
}

function buildBoard(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // glass slab
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.6, 6.4),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#6f5bd0"),
      metalness: 0,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 1.4,
      ior: 1.35,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      attenuationColor: new THREE.Color("#8a6bff"),
      attenuationDistance: 3.5,
    })
  );
  base.position.y = 0;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // glowing grid lines
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x111122, emissive: new THREE.Color("#9ad6ff"), emissiveIntensity: 1.1,
    roughness: 0.4, metalness: 0.2,
  });
  const lenLong = 5.6, thick = 0.07, hgt = 0.1;
  for (const x of [-S / 2, S / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(thick, hgt, lenLong), lineMat);
    bar.position.set(x, BOARD_TOP, 0);
    group.add(bar);
  }
  for (const z of [-S / 2, S / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(lenLong, hgt, thick), lineMat);
    bar.position.set(0, BOARD_TOP, z);
    group.add(bar);
  }

  // per-cell highlight tiles (used for win glow)
  const cells = [];
  const tileGeo = new THREE.BoxGeometry(S * 0.86, 0.12, S * 0.86);
  for (let i = 0; i < 9; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a1b54, emissive: 0x000000, emissiveIntensity: 0,
      roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.55,
    });
    const tile = new THREE.Mesh(tileGeo, mat);
    const p = cellPos(i);
    tile.position.set(p.x, BOARD_TOP - 0.05, p.z);
    tile.receiveShadow = true;
    group.add(tile);
    cells.push(tile);
  }

  // hover indicator
  const hover = new THREE.Mesh(
    new THREE.PlaneGeometry(S * 0.8, S * 0.8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  hover.rotation.x = -Math.PI / 2;
  hover.visible = false;
  group.add(hover);

  // invisible raycast targets
  const hitAreas = [];
  const hitGeo = new THREE.PlaneGeometry(S, S);
  for (let i = 0; i < 9; i++) {
    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hit.rotation.x = -Math.PI / 2;
    const p = cellPos(i);
    hit.position.set(p.x, BOARD_TOP + 0.05, p.z);
    hit.userData.index = i;
    group.add(hit);
    hitAreas.push(hit);
  }

  return { group, cells, hover, hitAreas, cellPos };
}

function cellPos(i) {
  const col = i % 3, row = Math.floor(i / 3);
  return { x: (col - 1) * S, z: (row - 1) * S };
}

function buildDust(scene) {
  const count = 350;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 22;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.3) * 18;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xb9a8ff, size: 0.08, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

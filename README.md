<div align="center">

# 🇨🇱 Cachipún 3D

### Un tres en línea chileno, hecho hermoso con Three.js
### A Chilean tic-tac-toe, made beautiful with Three.js

[**▶ Jugar / Play**](https://fabianimv.github.io/cachipun/) · Three.js · WebGL · GitHub Pages

*Vidrio refractivo · neón con bloom · sombras suaves · partículas · cero dependencias en runtime*

</div>

---

## 🎯 Propósito · Purpose

**ES** — El propósito de este `cachipun.github.io` es simple: **usar Three.js para algo
hermoso**. Tomé las técnicas visuales de los juegos web que se volvieron virales hace
poco (la estética *liquid glass*, el bloom, las sombras suaves, las partículas) y las
llevé a un clásico de patio chileno. No es solo un gato: es una excusa para hacer que
algo cotidiano se vea espectacular en el navegador.

**EN** — The purpose of this `cachipun.github.io` is simple: **use Three.js to make
something beautiful**. I took the visual techniques from the web games that recently
went viral (the *liquid glass* look, bloom, soft shadows, particles) and brought them
to a Chilean playground classic. It's not just tic-tac-toe: it's an excuse to make
something ordinary look stunning in the browser.

---

## ✨ Características · Features

| ES | EN |
|----|----|
| Tablero de **vidrio refractivo** (`transmission`) con reflejos por entorno PMREM | **Refractive glass** board (`transmission`) with PMREM environment reflections |
| Piezas de **neón** (X cian, O magenta) que brillan con **UnrealBloom** | **Neon** pieces (cyan X, magenta O) glowing via **UnrealBloom** |
| **Sombras PCF suaves**, luces de relleno de color y fondo con shader + niebla | **Soft PCF shadows**, colored rim lights and a shader gradient sky + fog |
| **Animaciones con easing** (rebote, resorte) con un motor de tweens propio | **Eased animations** (bounce, spring) via a tiny custom tween engine |
| **Cámara que respira** con parallax del mouse, **confeti** y línea ganadora iluminada | **Breathing camera** with mouse parallax, **confetti** and a lit winning line |
| **CPU imbatible** (minimax) y modo **2 jugadores** | **Unbeatable CPU** (minimax) and **2-player** mode |
| Partida y marcador guardados en **localStorage** | Game and scoreboard saved in **localStorage** |
| **Sonido** WebAudio silenciable · responsive (mouse + touch) | Mutable WebAudio **sound** · responsive (mouse + touch) |

---

## 🎮 Cómo jugar · How to play

**ES** — Abre [la versión en línea](https://fabianimv.github.io/cachipun/). En local, como
usa módulos ES, necesitas un servidor estático (no funciona con `file://`):

**EN** — Open [the live version](https://fabianimv.github.io/cachipun/). Locally, since it
uses ES modules, you need a static server (it won't work over `file://`):

```bash
python3 -m http.server 8000     # → http://localhost:8000
# o / or
npx serve .
```

---

## 🗂️ Estructura · Structure

```
index.html      · markup + import map (Three.js vendorizado / vendored)
styles.css      · UI glassmorphism (HUD, marcador, banner)
src/
  main.js       · une lógica, escena, sonido y persistencia / glue layer
  scene.js      · escena 3D, efectos y animaciones / 3D scene & effects
  game.js       · reglas, ganador, CPU minimax, localStorage / rules & AI
  tween.js      · motor de animación con easing / easing tween engine
vendor/         · Three.js r160 (build + addons) — sin CDN en runtime / no runtime CDN
```

---

## 🚀 Despliegue · Deployment (GitHub Pages)

**ES** — Incluye un workflow en `.github/workflows/deploy.yml` que publica solo.
Activa Pages una vez en **Settings → Pages → Source: GitHub Actions** y haz push.

**EN** — Ships with `.github/workflows/deploy.yml` that auto-publishes. Enable Pages
once at **Settings → Pages → Source: GitHub Actions** and push.

> El deploy corre solo en `main` (GitHub Pages publica desde la rama por defecto).
> / Deploy runs on `main` only (GitHub Pages publishes from the default branch).

---

## 🛠️ Técnicas Three.js usadas · Three.js techniques used

- `MeshPhysicalMaterial` con `transmission`, `ior`, `thickness`, `clearcoat` (vidrio / glass)
- `PMREMGenerator` + `RoomEnvironment` (reflejos realistas / realistic reflections)
- `EffectComposer` → `RenderPass` + `UnrealBloomPass` + `OutputPass` (post-proceso / post-processing)
- `PCFSoftShadowMap`, `ACESFilmicToneMapping`, `SRGBColorSpace`
- `Points` + `BufferGeometry` (confeti y polvo / confetti and dust)
- `ShaderMaterial` para el degradado del cielo / for the sky gradient
- `Raycaster` para seleccionar casillas en 3D / for picking 3D cells

---

## 📝 Nota cultural · Cultural note

**ES** — En Chile, *cachipún* es estrictamente "piedra, papel o tijera"; a esto se le dice
*gato* o *tres en línea*. Mantengo el nombre por cariño al proyecto. 😄

**EN** — In Chile, *cachipún* is strictly "rock, paper, scissors"; this game is usually
called *gato* or *tres en línea*. I keep the name out of affection for the project. 😄

---

## ⚖️ Licencia · License

[MIT](./LICENSE) © 2026 Fabián Maturana. Incluye Three.js (MIT). / Bundles Three.js (MIT).

<div align="center">

*Hecho con cariño y Three.js · Made with care and Three.js*

</div>

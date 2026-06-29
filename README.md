# 🇨🇱 Cachipún 3D

Un **tres en línea (gato / "cachipún") a la chilena** con visuales impresionantes,
hecho 100% con [Three.js](https://threejs.org/) y sin paso de compilación.

Inspirado en los juegos virales de Three.js que circularon hace poco (estética
*liquid glass*, bloom, sombras suaves y partículas), pero llevado a un clásico
de patio.

## ✨ Qué tiene

- **Tablero de vidrio refractivo** (`MeshPhysicalMaterial` con `transmission`) y
  reflejos realistas vía entorno PMREM.
- **Piezas de neón** (X cian, O magenta) que brillan gracias al post-proceso
  **UnrealBloom**.
- **Sombras PCF suaves**, luces de relleno con color (rim lights) y un fondo
  con degradado por shader + niebla.
- **Animaciones con easing** (rebote al colocar, resorte al ganar) mediante un
  mini motor de tweens propio, sin dependencias extra.
- **Cámara que respira** con parallax según el mouse y barrido al celebrar.
- **Confeti** y línea ganadora iluminada.
- **Dos modos**: contra una **CPU imbatible** (minimax) o **2 jugadores**.
- **Marcador persistente** y partida en curso guardada en `localStorage`:
  cierra la pestaña y vuelve justo donde quedaste.
- **Sonido** sintetizado con WebAudio (se puede silenciar).
- Responsive y jugable con mouse o touch.

## 🎮 Jugar

Abre la versión publicada en GitHub Pages o, en local, sirve la carpeta con
cualquier servidor estático (se usan módulos ES, así que `file://` no funciona):

```bash
# opción 1
npx serve .
# opción 2
python3 -m http.server 8000
```

Luego entra a `http://localhost:8000`.

## 🗂️ Estructura

```
index.html      · markup + import map de Three.js (desde CDN)
styles.css      · UI glassmorphism (HUD, marcador, banner)
src/
  main.js       · une lógica, escena, sonido y persistencia
  scene.js      · toda la escena 3D, efectos y animaciones
  game.js       · reglas, detección de ganador, CPU minimax, localStorage
  tween.js      · motor de animación con easing, sin dependencias
```

## 🚀 Despliegue en GitHub Pages

El repo incluye un workflow en `.github/workflows/deploy.yml` que publica el
sitio automáticamente. Solo hay que activar Pages una vez:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz push a la rama configurada (`main` o `claude/3d-cachipun-game-d23abx`).
3. El workflow sube todo el repositorio tal cual (no hay build) y queda en línea.

> Nota: el entorno `github-pages` puede estar restringido por defecto a la rama
> por defecto. Si despliegas desde otra rama, permite esa rama en
> *Settings → Environments → github-pages → Deployment branches*.

## 📝 Nota cultural

En Chile el *cachipún* es estrictamente el "piedra, papel o tijera", mientras que
a esto se le suele decir *gato* o *tres en línea*. Aquí seguimos el nombre que
pidió el proyecto. 😄

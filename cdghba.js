// 1. Declaración global explícita en window
window.targetDist = 450;
let currentDist = 450,
    rotX = .4,
    rotY = 0;

// 2. Ajuste en el evento de la rueda del mouse (wheel)
addEventListener("wheel", (e => {
  window.targetDist += .3 * e.deltaY;
  window.targetDist = Math.max(15, Math.min(1200, window.targetDist));
}), { passive: true });

// 3. Ajuste dentro de la función tick()
function tick() {
  requestAnimationFrame(tick);
  time += .01;

  // ...
  currentDist += .06 * (window.targetDist - currentDist);
  // ...
}

// --- ESCENA 3D Y CONFIGURACIÓN ---
const canvas = document.getElementById("c"),
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 5e3);

// Grupo Pivote para la Cámara Libre
const cameraPivot = new THREE.Group();
scene.add(cameraPivot);

let targetDist = 450,
    currentDist = 450,
    rotX = .4,
    rotY = 0;

// Fondo de espacio
const loader = new THREE.TextureLoader(),
      nebulaTex = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/space/px.jpg");
scene.background = nebulaTex;

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 2000);
scene.add(sunLight);

// Campo de estrellas
(function(count = 3000, radius = 3500) {
  const geo = new THREE.BufferGeometry(),
        pos = new Float32Array(3 * count);
  for (let i = 0; i < count; i++) {
    const r = radius * (.3 + .7 * Math.random()),
          theta = Math.random() * Math.PI * 2,
          phi = Math.acos(2 * Math.random() - 1);
    pos[3 * i + 0] = r * Math.sin(phi) * Math.cos(theta);
    pos[3 * i + 1] = r * Math.cos(phi);
    pos[3 * i + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, depthWrite: false })));
})();

// --- EL SOL ---
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
      sun = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 32), sunMat);
sun.userData = { 
  name: "El Sol", 
  desc: "Estrella de secuencia principal de tipo espectral G2V. Representa aproximadamente el 99.86% de toda la masa del Sistema Solar y genera su energía mediante la fusión nuclear de hidrógeno en helio en su núcleo.",
  stats: { 
    "Temp. Núcleo": "~15,000,000 °C",
    "Temp. Superficie": "5,500 °C", 
    "Diámetro ecuatorial": "1,392,700 km", 
    "Clasificación": "Enana Amarilla (G2V)",
    "Masa": "333,000 Tierras"
  },
  size: 30
};
scene.add(sun);

// Resplandor del Sol
function makeGlow(size = 512, colorInner = "255,200,50", colorOuter = "255,50,0") {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d"),
        g = ctx.createRadialGradient(size/2, size/2, size*0.05, size/2, size/2, size*0.5);
  g.addColorStop(0, "rgba(" + colorInner + ", 0.9)");
  g.addColorStop(0.4, "rgba(" + colorOuter + ", 0.4)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlow(), transparent: true, depthWrite: false }));
sunGlow.scale.set(300, 300, 1);
scene.add(sunGlow);

// --- BASE DE DATOS E INFORMACIÓN DE PLANETAS ---
const planetData = [
  { 
    name: "Mercurio", color: 0xaaaaaa, size: 3, dist: 50, speed: 0.030,
    desc: "El planeta más pequeño del Sistema Solar y el más cercano al Sol. Carece prácticamente de atmósfera (exosfera tenue), lo que provoca fluctuaciones térmicas extremas entre el día y la noche.",
    stats: { 
      "Distancia al Sol": "57.9M km", 
      "Periodo Orbital": "88 días", 
      "Temp. Extremas": "-180 °C a 430 °C",
      "Gravedad": "3.7 m/s²",
      "Satélites": "0" 
    }
  },
  { 
    name: "Venus", color: 0xe3bb76, size: 5, dist: 75, speed: 0.022,
    desc: "Similar a la Tierra en tamaño, pero con una densa atmósfera compuesta por un 96% de CO2. Esto genera un violento efecto invernadero que lo convierte en el planeta más caliente del Sistema Solar.",
    stats: { 
      "Distancia al Sol": "108.2M km", 
      "Periodo Orbital": "225 días", 
      "Temp. Media": "464 °C",
      "Press. Atmosférica": "92 atm (nivel de mar)",
      "Rotación": "Retrógrada (243 días)"
    }
  },
  { 
    name: "Tierra", color: 0x2277ff, size: 5.5, dist: 105, speed: 0.015,
    desc: "Nuestro hogar. Es el único planeta conocido que posee agua líquida estable en su superficie, un campo magnético protector activo y las condiciones necesarias para la vida orgánica.",
    stats: { 
      "Distancia al Sol": "149.6M km", 
      "Periodo Orbital": "365.25 días", 
      "Diámetro": "12,742 km",
      "Gravedad": "9.81 m/s²",
      "Satélites": "1 (La Luna)" 
    }
  },
  { 
    name: "Marte", color: 0xcc4422, size: 4, dist: 140, speed: 0.012,
    desc: "El planeta rojo debe su color al óxido de hierro en su superficie. Posee valles secos, casquetes polares de hielo de agua y CO2, y el volcán más grande del Sistema Solar (Monte Olimpo).",
    stats: { 
      "Distancia al Sol": "227.9M km", 
      "Periodo Orbital": "687 días", 
      "Atmósfera": "Dióxido de carbono (95%)",
      "Gravedad": "3.72 m/s²",
      "Satélites": "2 (Fobos y Deimos)" 
    }
  },
  { 
    name: "Júpiter", color: 0xd8ca9d, size: 14, dist: 190, speed: 0.007,
    desc: "El planeta más masivo del sistema, compuesto principalmente de hidrógeno y helio. Su icónica 'Gran Mancha Roja' es un anticiclón gigantesco en el que cabría la Tierra por completo.",
    stats: { 
      "Distancia al Sol": "778.5M km", 
      "Periodo Orbital": "11.86 años", 
      "Diámetro": "139,820 km",
      "Gravedad": "24.79 m/s²",
      "Satélites": "95 confirmados" 
    }
  },
  { 
    name: "Saturno", color: 0xe2bf7d, size: 11, dist: 245, speed: 0.005, hasRings: true,
    desc: "Famoso por su intrincado sistema de anillos formados por miles de millones de fragmentos de hielo y roca. Es un gigante gaseoso menos denso que el agua.",
    stats: { 
      "Distancia al Sol": "1,434M km", 
      "Periodo Orbital": "29.45 años", 
      "Composición Anillos": "99% hielo de agua",
      "Gravedad": "10.44 m/s²",
      "Satélites": "146 confirmados" 
    }
  },
  { 
    name: "Urano", color: 0x66ccff, size: 8, dist: 295, speed: 0.003,
    desc: "Un gigante helado cuya atmósfera contiene metano, lo que le da su característico tono cian. Gira 'de lado' debido a un ángulo de inclinación axial extremo de 97.8 grados.",
    stats: { 
      "Distancia al Sol": "2,871M km", 
      "Periodo Orbital": "84 años", 
      "Inclinación Axial": "97.8°",
      "Temp. Mínima": "-224 °C",
      "Satélites": "28 confirmados" 
    }
  },
  { 
    name: "Neptuno", color: 0x2244ff, size: 8, dist: 340, speed: 0.002,
    desc: "El planeta más distante del sistema. Este gigante helado registra los vientos más rápidos conocidos en el Sistema Solar, alcanzando velocidades de más de 2,000 km/h.",
    stats: { 
      "Distancia al Sol": "4,495M km", 
      "Periodo Orbital": "164.8 años", 
      "Velocidad del Viento": "Hasta 2,100 km/h",
      "Gravedad": "11.15 m/s²",
      "Satélites": "16 confirmados" 
    }
  }
];

const planets = [];
const clickables = [sun]; // Arreglo para detectar clics en Raycaster

function makeTextTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 40);
  return new THREE.CanvasTexture(canvas);
}

planetData.forEach(data => {
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  const mat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8 }),
        geo = new THREE.SphereGeometry(data.size, 32, 32),
        mesh = new THREE.Mesh(geo, mat);

  mesh.position.x = data.dist;
  mesh.userData = data; // Almacenamos datos para recuperarlos al hacer clic
  orbitGroup.add(mesh);
  clickables.push(mesh);

  if (data.hasRings) {
    const ringGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.3, 32),
          ringMat = new THREE.MeshBasicMaterial({ color: 0xc2a366, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }),
          ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    mesh.add(ringMesh);
  }

  const labelTex = makeTextTexture(data.name),
        labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true }),
        labelSprite = new THREE.Sprite(labelMat);
  labelSprite.scale.set(30, 7.5, 1);
  labelSprite.position.set(0, data.size + 6, 0);
  mesh.add(labelSprite);

  const orbitGeo = new THREE.BufferGeometry(),
        points = [];
  for (let i = 0; i <= 128; i++) {
    const theta = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * data.dist, 0, Math.sin(theta) * data.dist));
  }
  orbitGeo.setFromPoints(points);
  const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
  scene.add(orbitLine);

  planets.push({ group: orbitGroup, mesh: mesh, speed: data.speed });
});

// --- LÓGICA DE INTERACCIÓN Y RAYCASTING ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let focusedTarget = null;
let isAnimating = false;
let pointerDownPos = { x: 0, y: 0 };

// Referencias del DOM
const infoPanel = document.getElementById("info-panel");
const planetTitle = document.getElementById("planet-title");
const planetDesc = document.getElementById("planet-desc");
const planetStats = document.getElementById("planet-stats");
const btnReset = document.getElementById("btn-reset");

function showPlanetInfo(data) {
  planetTitle.textContent = data.name;
  planetDesc.textContent = data.desc;
  
  planetStats.innerHTML = "";
  if (data.stats) {
    Object.entries(data.stats).forEach(([key, val]) => {
      const row = document.createElement("div");
      row.className = "planet-stat";
      row.innerHTML = `<span>${key}</span><span>${val}</span>`;
      planetStats.appendChild(row);
    });
  }
  infoPanel.classList.add("active");
}

function hidePlanetInfo() {
  infoPanel.classList.remove("active");
}

function focusOnObject(mesh) {
  focusedTarget = mesh;
  const data = mesh.userData;

  showPlanetInfo(data);

  // Distancia adaptativa según el tamaño del astro
  const idealDist = data.size * 4 + 12;
  
  // Animación de acercamiento con GSAP
  gsap.to(cameraPivot.position, {
    x: 0, y: 0, z: 0,
    duration: 1.2,
    ease: "power2.inOut"
  });

  gsap.to(window, {
    targetDist: idealDist,
    duration: 1.2,
    ease: "power2.inOut"
  });
}

function resetFocus() {
  focusedTarget = null;
  hidePlanetInfo();

  gsap.to(cameraPivot.position, {
    x: 0, y: 0, z: 0,
    duration: 1.2,
    ease: "power2.inOut"
  });

  gsap.to(window, {
    targetDist: 450,
    duration: 1.2,
    ease: "power2.inOut"
  });
}

btnReset.addEventListener("click", resetFocus);

// --- CONTROLES Y EVENTOS DE MOUSE/TOUCH ---
let dragging = false, lastX = 0, lastY = 0;

function onDown(e) {
  dragging = true;
  const t = e.touches ? e.touches[0] : e;
  lastX = t.clientX; lastY = t.clientY;
  pointerDownPos = { x: t.clientX, y: t.clientY };
}

function onMove(e) {
  if (!dragging) return;
  const t = e.touches ? e.touches[0] : e,
        nX = (t.clientX - lastX) / innerWidth,
        nY = (t.clientY - lastY) / innerHeight;
  rotY -= 3 * nX;
  rotX = Math.max(-1.4, Math.min(1.4, rotX - 2.2 * nY));
  lastX = t.clientX; lastY = t.clientY;
}

function onUp(e) { 
  dragging = false; 
  const t = e.changedTouches ? e.changedTouches[0] : e;
  
  // Si el usuario arrastró la pantalla, no contar como clic
  const distDragged = Math.hypot(t.clientX - pointerDownPos.x, t.clientY - pointerDownPos.y);
  if (distDragged > 5) return;

  // Detectar clic en objetos 3D
  mouse.x = (t.clientX / innerWidth) * 2 - 1;
  mouse.y = -(t.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickables);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    focusOnObject(clickedMesh);
  }
}

addEventListener("mousedown", onDown);
addEventListener("mousemove", onMove);
addEventListener("mouseup", onUp);
addEventListener("touchstart", onDown, { passive: true });
addEventListener("touchmove", onMove, { passive: true });
addEventListener("touchend", onUp, { passive: true });

addEventListener("wheel", (e => {
  targetDist += .3 * e.deltaY;
  targetDist = Math.max(15, Math.min(1200, targetDist));
}), { passive: true });

// --- BUCLE DE ANIMACIÓN ---
let time = 0;
const worldPos = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  time += .01;

  const scaleGlow = 300 * (1 + .02 * Math.sin(.8 * time));
  sunGlow.scale.set(scaleGlow, scaleGlow, 1);

  // Animación de rotación y traslación orbital
  planets.forEach(p => {
    p.group.rotation.y += p.speed;
    p.mesh.rotation.y += 0.02;
  });

  // Interpolación de distancia (Zoom)
  currentDist += .06 * (targetDist - currentDist);

  const cosX = Math.cos(rotX),
        sinX = Math.sin(rotX),
        cosY = Math.cos(rotY),
        sinY = Math.sin(rotY);

  // Si hay un planeta enfocado, el pivote sigue al planeta dinámicamente
  if (focusedTarget) {
    focusedTarget.getWorldPosition(worldPos);
    cameraPivot.position.lerp(worldPos, 0.08);
  }

  // Posicionar la cámara con respecto al pivote activo
  camera.position.set(
    cameraPivot.position.x + currentDist * sinY * cosX, 
    cameraPivot.position.y + currentDist * sinX, 
    cameraPivot.position.z + currentDist * cosY * cosX
  );
  
  camera.lookAt(cameraPivot.position);

  renderer.render(scene, camera);
}

tick();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
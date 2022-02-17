let camera, scene, renderer, mouse, raycaster; // Three.js globals
let ambientMusic, intro; // p5.sound globals

// Canvas size/ratio
let widthFull = window.innerWidth,
  heightFull = window.innerHeight,
  fov = 70,
  ratio = widthFull / heightFull;

// Camera control globals
let isUserInteracting = false,
  onMouseDownMouseX = 0,
  onMouseDownMouseY = 0,
  lon = 0,
  onMouseDownLon = 0,
  lat = 0,
  onMouseDownLat = 0,
  phi = 0,
  theta = 0;

// Audio file paths
let audioPathArray = [
  "sound/ancientrome_sc1_poi_001.mp3",
  "sound/ancientrome_sc1_poi_002.mp3",
  "sound/ancientrome_sc1_poi_003.mp3",
  "sound/ancientrome_sc1_poi_004.mp3",
  "sound/ancientrome_sc1_poi_005.mp3",
  "sound/ancientrome_sc1_poi_006.mp3",
  "sound/ancientrome_sc1_poi_007.mp3",
  "sound/ancientrome_sc1_poi_008.mp3"
];

let audioArray = [];
let poiArray = [];

// Function preloads audio files into memory before everything else
function preload() {
  soundFormats("mp3", "wav");
  intro = loadSound("sound/ancientrome_sc1_title.mp3");
  ambientMusic = loadSound("sound/roman_music_loop.wav");
  for (let i = 0; i < audioPathArray.length; i++) {
    let audioToLoad = loadSound(audioPathArray[i]);
    audioArray.push(audioToLoad);
  }
}

// Required setup() function for p5. Used to start intro audio and ambient music
function setup() {
  intro.play();
  ambientMusic.play();
  ambientMusic.loop();
  ambientMusic.setVolume(0.2);
}

function stopIntro() {
  if (intro.isPlaying()) {
    intro.stop();
  }
}

init();
animate();

function init() {
  // Hide text entries on page load
  $("#entry1").hide();
  $("#entry2").hide();
  $("#entry3").hide();
  $("#entry4").hide();
  $("#entry5").hide();
  $("#entry6").hide();
  $("#entry7").hide();
  $("#entry8").hide();

  // Three.js Camera, scene, mouse
  let container, mesh;
  container = document.getElementById("canvas");

  camera = new THREE.PerspectiveCamera(fov, ratio, 1, 1000);
  camera.target = new THREE.Vector3(0, 0, 0);

  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  scene = new THREE.Scene();

  /////////////////////////////Image Mapped Sphere/////////////////////////////

  // Panoramic Image created here
  let geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);
  let material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load("img/rome1_mono.jpg"),
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //////////////////////////////////////Interact Points///////////////////////////////////////
  // Positions of each poi. For more poi's add new positions in format below
  let positionsArray = [
    { x: -130, y: -70, z: -80 },
    { x: -150, y: -50, z: 30 },
    { x: -150, y: -20, z: 70 },
    { x: -120, y: -60, z: 130 },
    { x: -15, y: 0, z: -155 },
    { x: 55, y: 50, z: -150 },
    { x: -150, y: 0, z: 50 },
    { x: 140, y: 0, z: 80 },
  ];

  // Create poi's and set them to their positions
  for (let i = 0; i < 8; i++) {
    // Poi's instantiated from class
    poiArray.push(new PointOfInterest());
    // Poi's have unique names for switch statement
    poiArray[i].poi.name = "pointOfInterest" + i;
    poiArray[i].poi.position.set(
      positionsArray[i].x,
      positionsArray[i].y,
      positionsArray[i].z
    );
    poiArray[i].sound = audioPathArray[i];
  }

  // Configure renderer and append it to div with id '#canvas'
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(widthFull, heightFull); // WIDTH HEIGHT
  container.appendChild(renderer.domElement);

  // Event management
  document.addEventListener("mousedown", onDocumentMouseDown, false);
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("mouseup", onDocumentMouseUp, false);
  document.addEventListener("wheel", onDocumentMouseWheel, false);
  document.addEventListener("click", onMouseClick);

  window.addEventListener("resize", onWindowResize, false);
}

// Rescale renderer if dynamic scaling i.e. full screen
function onWindowResize() {
  camera.aspect = widthFull / heightFull;
  camera.updateProjectionMatrix();
  renderer.setSize(widthFull, heightFull);
}

// Controls for looking around panoramic
function onDocumentMouseDown(event) {
  event.preventDefault();

  isUserInteracting = true;

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onDocumentMouseMove(event) {
  if (isUserInteracting === true) {
    lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
  }
}

function onDocumentMouseUp(event) {
  isUserInteracting = false;
}

// Zoom in and out
function onDocumentMouseWheel(event) {
  camera.fov += event.deltaY * 0.05;
  console.log(camera.fov);
  camera.updateProjectionMatrix();
}

// Raycaster for clicking objects
function onMouseClick(event) {
  event.preventDefault();

  let canvasBounds = renderer.domElement.getBoundingClientRect();
  mouse.x =
    ((event.clientX - canvasBounds.left) /
      (canvasBounds.right - canvasBounds.left)) *
      2 -
    1;
  mouse.y =
    -(
      (event.clientY - canvasBounds.top) /
      (canvasBounds.bottom - canvasBounds.top)
    ) *
      2 +
    1;
  raycaster.setFromCamera(mouse, camera);

  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    // Can manipulate clicked objects from here
    switch (intersects[0].object.name) {
      // Switch, if name of object matches play appropriate audio, stop other audio and update text
      case "pointOfInterest0":
        stopIntro();
        if (audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying() || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[0].play();
        $("#entry1").show();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;

      case "pointOfInterest1":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying() || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[1].play();
        $("#entry1").hide();
        $("#entry2").show();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;

      case "pointOfInterest2":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[3].isPlaying() || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[2].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").show();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;
        
      case "pointOfInterest3":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[3].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").show();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;
        
      case "pointOfInterest4":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[5].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[4].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").show();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;
        
      case "pointOfInterest5":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying()  || audioArray[4].isPlaying() || audioArray[6].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[6].stop();
          audioArray[7].stop();
        }
        audioArray[5].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").show();
        $("#entry7").hide();
        $("#entry8").hide();
        moveBox();
        break;
        
      case "pointOfInterest6":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying()  || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[7].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[7].stop();
        }
        audioArray[6].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").show();
        $("#entry8").hide();
        moveBox();
        break;
        
      case "pointOfInterest7":
        stopIntro();
        if (audioArray[0].isPlaying() || audioArray[1].isPlaying() || audioArray[2].isPlaying() || audioArray[3].isPlaying()  || audioArray[4].isPlaying() || audioArray[5].isPlaying() || audioArray[6].isPlaying()) {
          audioArray[0].stop();
          audioArray[1].stop();
          audioArray[2].stop();
          audioArray[3].stop();
          audioArray[4].stop();
          audioArray[5].stop();
          audioArray[6].stop();
        }
        audioArray[7].play();
        $("#entry1").hide();
        $("#entry2").hide();
        $("#entry3").hide();
        $("#entry4").hide();
        $("#entry5").hide();
        $("#entry6").hide();
        $("#entry7").hide();
        $("#entry8").show();
        moveBox();
        break;
        
    }
  }
}

// Greensock tween text onto page
let box = $("#description");
function moveBox() {
  const tl = new TimelineMax();
  tl.fromTo(box, 0.5, { x: "5000" }, { x: "0" });
}

// Animate loop, runs once per frame
function animate() {
  requestAnimationFrame(animate);
  if (camera.fov < 50) {
    camera.fov = 50;
  } else if (camera.fov > 70) {
    camera.fov = 70;
  }

  update();
}

// Update camera orientation
function update() {
  if (isUserInteracting === false) {
    lon += 0.1; // Rotate Camera
  }

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.Math.degToRad(90 - lat);
  theta = THREE.Math.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(camera.target);

  renderer.render(scene, camera);
}

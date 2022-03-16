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
  "sound/ancientrome_sc6_title",
  "sound/ancientrome_sc6_poi_001.mp3",
  "sound/ancientrome_sc6_poi_002.mp3",
  "sound/ancientrome_sc6_poi_003.mp3",
  "sound/ancientrome_sc6_poi_004.mp3",
  "sound/ancientrome_sc6_poi_005.mp3",
  "sound/ancientrome_sc6_poi_006.mp3",
  "sound/ancientrome_sc6_poi_007.mp3",
  "sound/ancientrome_sc6_poi_008.mp3",
  "sound/ancientrome_sc6_poi_009.mp3",
];

let entryArray = [
  "entry1",
  "entry2",
  "entry3",
  "entry4",
  "entry5",
  "entry6",
  "entry7",
  "entry8",
  "entry9",
  "entry10",
];

let audioArray = [];
let poiArray = [];
let currentAudioFile = audioArray[0],
  previousAudioFile = audioArray[0];

//var x = document.getElementById("myAudio");
function toggleMute() {
  console.log("Mute button pressed");
  let audioSources = $("source"); // Gets all audio sources as string
  console.log(audioSources[0].src);
  audioSources[0].src.setVolume(0);
}

function hideDescription() {
  let showButton = $("#showButton");
  showButton.show();
  let descTarget = $("#description");
  descTarget.hide();
}

function showDescription() {
  let showButton = $("#showButton");
  showButton.hide();
  let descTarget = $("#description");
  descTarget.show();
}

// Function preloads audio files into memory before everything else
function preload() {
  soundFormats("mp3", "wav");
  intro = loadSound("sound/ancientrome_intro.mp3");
  ambientMusic = loadSound("sound/roman town.mp3");
  for (let i = 0; i < audioPathArray.length; i++) {
    let audioToLoad = loadSound(audioPathArray[i]);
    audioArray.push(audioToLoad);
  }
}

// Required setup() function for p5. Used to start intro audio and ambient music
function setup() {
  ambientMusic.play();
  ambientMusic.loop();
  ambientMusic.setVolume(0.1);
}

function stopIntro() {
  if (intro.isPlaying()) {
    intro.stop();
  }
}

function playAudio() {
  if (currentAudioFile.isPlaying()) {
    currentAudioFile.pause();
  } else {
    currentAudioFile.play();
  }
}

function resetAudio() {
  if (currentAudioFile.isPlaying()) {
    currentAudioFile.stop();
    currentAudioFile.play();
  } else {
    currentAudioFile.stop();
  }
}

init();
animate();

function init() {
  // Hide text entries on page load
  $("#showButton").hide();
  $("#entry1").hide();
  $("#entry2").hide();
  $("#entry3").hide();
  $("#entry4").hide();
  $("#entry5").hide();
  $("#entry6").hide();
  $("#entry7").hide();
  $("#entry8").hide();
  $("#entry9").hide();
  $("#entry10").show();

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
    map: new THREE.TextureLoader().load("img/rome6_mono.jpg"),
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //////////////////////////////////////Interact Points///////////////////////////////////////
  // Positions of each poi. For more poi's add new positions in format below
  let positionsArray = [
    { x: -180, y: -100, z: 180 },
    { x: 195, y: -50, z: -150 },
    { x: -20, y: -130, z: -180 },
    { x: 0, y: -100, z: 220 },
    { x: 0, y: -10, z: 250 },
    { x: 75, y: -100, z: -180 },
    { x: 200, y: -50, z: 140 },
    { x: 200, y: 30, z: 80 },
    { x: -160, y: -140, z: -145 },
    { x: -1000, y: -1000, z: -80 },
  ];

  // Create poi's and set them to their positions
  for (let i = 0; i < 10; i++) {
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
  camera.fov += event.deltaY * 0.35;
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
  //raycaster.setFromCamera(mouse, camera);
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    // Can manipulate clicked objects from here
    switch (intersects[0].object.name) {
      // Switch, if name of object matches play appropriate audio, stop other audio and update text
      case "pointOfInterest0":
        stopIntro();
        setActivePoi("pointOfInterest0");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[1];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry1").show();
          if (entryArray[i] != "entry1") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest1":
        stopIntro();
        setActivePoi("pointOfInterest1");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[2];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry2").show();
          if (entryArray[i] != "entry2") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest2":
        stopIntro();
        setActivePoi("pointOfInterest2");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[3];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry3").show();
          if (entryArray[i] != "entry3") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest3":
        stopIntro();
        setActivePoi("pointOfInterest3");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[4];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry4").show();
          if (entryArray[i] != "entry4") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest4":
        stopIntro();
        setActivePoi("pointOfInterest4");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[5];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry5").show();
          if (entryArray[i] != "entry5") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest5":
        stopIntro();
        setActivePoi("pointOfInterest5");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[6];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry6").show();
          if (entryArray[i] != "entry6") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest6":
        stopIntro();
        setActivePoi("pointOfInterest6");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[7];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry7").show();
          if (entryArray[i] != "entry7") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest7":
        stopIntro();
        setActivePoi("pointOfInterest7");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[8];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry8").show();
          if (entryArray[i] != "entry8") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest8":
        stopIntro();
        setActivePoi("pointOfInterest8");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[9];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry9").show();
          if (entryArray[i] != "entry9") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;

      case "pointOfInterest9":
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[10];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry10").show();
          if (entryArray[i] != "entry10") {
            $("#" + entryArray[i]).hide();
          }
        }

        moveBox();
        break;
    }
  }
}

function setActivePoi(poi) {
  for (let i = 0; i < poiArray.length; i++) {
    if (poiArray[i].poi.name === poi) {
      poiArray[i].material.color = new THREE.Color(0x006aff);
    } else {
      poiArray[i].material.color = new THREE.Color(0xffffff);
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

function isItPlaying() {
  for (let i = 0; i < audioArray.length; i++) {
    if (audioArray[i].isPlaying()) {
      console.log(audioArray[i] + " is playing");
    } else {
      console.log(audioArray[i] + " is not playing");
    }
  }
}

// Update camera orientation
function update() {
  if (isUserInteracting === false) {
    lon += 0; // Rotate Camera
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

let camera, scene, renderer, mouse, raycaster; // Three.js globals
let ambientMusic, intro, hotSpotSFX, infoShowHideSFX, previousAudioFile, currentAudioFile;; // p5.sound globals

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
  "sound/ancientrome_sc1_title",
  "sound/ancientrome_sc1_poi_001.mp3",
  "sound/ancientrome_sc1_poi_002.mp3",
  "sound/ancientrome_sc1_poi_003.mp3",
  "sound/ancientrome_sc1_poi_004.mp3",
  "sound/ancientrome_sc1_poi_005.mp3",
  "sound/ancientrome_sc1_poi_006.mp3",
  "sound/ancientrome_sc1_poi_007.mp3",
  "sound/ancientrome_sc1_poi_008.mp3",
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
];

// Function preloads audio files into memory before everything else
function preload() {
  soundFormats("mp3", "wav");
  intro = loadSound("sound/ancientrome_sc1_title.mp3");
  hotSpotSFX = loadSound("sound/hotspot_sfx.mp3");
  infoShowHideSFX = loadSound("sound/info_button_2.wav");
  ambientMusic = loadSound("sound/battle.mp3");
  for (let i = 0; i < audioPathArray.length; i++) {
    let audioToLoad = loadSound(audioPathArray[i]);
    audioArray.push(audioToLoad);
  }
  setDefaultAudio();
}


function setDefaultAudio()
{
  currentAudioFile = audioArray[0];
}

// Required setup() function for p5. Used to start intro audio and ambient music
function setup() {
  ambientMusic.play();
  ambientMusic.loop();
  ambientMusic.setVolume(0.1);
}

let audioArray = [];
let poiArray = [];

function toggleMute() 
{ 
  let audioSources = $("source"); // Gets all audio sources as string
  audioSources[0].src.setVolume(0);
} 

function playhotSpotSFX()
{
  hotSpotSFX.play();
  hotSpotSFX.setVolume(0.5);
}

function playinfoShowHideSFX()
{
  infoShowHideSFX.play();
  infoShowHideSFX.setVolume(0.75);
}

function hideDescription()
{
  let showButton = $('#showButton')
  showButton.show();
  let descTarget = $('#description');
  descTarget.hide();

}

function showDescription()
{
  let showButton = $('#showButton')
  showButton.hide();
  let descTarget = $('#description');
  descTarget.show();
}

function stopIntro() {
  if (intro.isPlaying()) {
    intro.stop();
  }
}

function playAudio(item) 
{
  if (currentAudioFile.isPlaying()) 
  {
    currentAudioFile.pause();
    item.classList.remove("active");
  }
  else 
  {
    currentAudioFile.play();
    item.classList.add("active");
  }
}

function resetAudio() 
{
  if (currentAudioFile.isPlaying()) 
  {
    currentAudioFile.stop();
    currentAudioFile.play();
  }
  else
  {
    currentAudioFile.stop();
  }
}

// Mute button functionality
/* function muteAudio()
{
  if(currentAudioFile.getVolume() > 0)
  {
    ambientMusic.setVolume(0)
    currentAudioFile.setVolume(0);
    alert("Audio Muted!"); // Placeholder alerts for testing
  }

  else
  {
    ambientMusic.setVolume(0.1)
    currentAudioFile.setVolume(1);
    alert("Audio Unmuted!"); // Placeholder alerts for testing
  }
*/

init();
animate();

function init() {
  // Hide text entries on page load
  $('#showButton').hide();
  for(let i = 0; i < entryArray.length; i++)
  {
    $("#entry9").show();
    if(entryArray[i] != "entry9")
    {
      $('#' + entryArray[i]).hide();
    }
  }

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
    { x: 120, y: -60, z: -80 },
    { x: -150, y: -50, z: 0 },
    { x: -140, y: 5, z: 70 },
    { x: -40, y: 5, z: 140 },
    { x: -15, y: -10, z: -155 },
    { x: 120, y: 20, z: -100 },
    { x: -145, y: 10, z: 35 },
    { x: 105, y: -10, z: 125 },
    { x: 120, y: 0, z: 0 },
  ];

  // Create poi's and set them to their positions
  for (let i = 0; i < 9; i++) {
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
  document.querySelector( '#canvas' ).addEventListener("mousedown", onDocumentMouseDown, false);
  document.addEventListener("touchstart", handleTouchStart, false);
  document.querySelector( '#canvas' ).addEventListener("mousemove", onDocumentMouseMove, false);
  document.querySelector( '#canvas' ).addEventListener("touchmove", handleTouchMove, false);
  document.querySelector( '#canvas' ).addEventListener("mouseup", onDocumentMouseUp, false);
  document.querySelector( '#canvas' ).addEventListener("touchend", handleTouchEnd, false);
  document.querySelector( '#canvas' ).addEventListener("wheel", onDocumentMouseWheel, false);

  document.querySelector('#canvas').addEventListener("click", onMouseClick);

  window.addEventListener("resize", onWindowResize, false);
}

document.onkeydown = (e) => {
  switch (e.keyCode)
  {
    case 37:
      console.log("Left key pressed");
      lon -= 3;
      break;
    case 38:
      console.log("Up key pressed");
      lat += 3;
      break;
    case 39:
      console.log("Right key pressed");
      lon += 3;
      break;
    case 40:
      console.log("Down key pressed");
      lat -= 3;
      break;
  }
}

// Rescale renderer if dynamic scaling i.e. full screen
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handler for looking around on touch screen
function handleTouchStart(event) {
  event.preventDefault();
  //event.stopPropagation();
  isUserInteracting = true;

  onPointerDownPointerX = event.touches[0].clientX;
  onPointerDownPointerY = event.touches[0].clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

// Controls for looking around panoramic
function onDocumentMouseDown(event) {
  event.preventDefault();
  event.stopPropagation();
  isUserInteracting = true;

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function handleTouchMove(event) {
  event.stopPropagation();
  if (isUserInteracting === true) {
    lon = (onPointerDownPointerX - event.touches[0].clientX) * 0.1 + onPointerDownLon;
    lat = (event.touches[0].clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
  }
}

function onDocumentMouseMove(event) {
  event.stopPropagation();
  if (isUserInteracting === true) {
    lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
  }
}

// Stop User Interaction
function onDocumentMouseUp(event) {
  event.stopPropagation();
  isUserInteracting = false;
}

function handleTouchEnd(event) {
  event.stopPropagation();
  isUserInteracting = false;
}

// Zoom in and out
function onDocumentMouseWheel(event) {
  event.stopPropagation();
  camera.fov += event.deltaY * 0.35;
  camera.updateProjectionMatrix();
}

// Raycaster for clicking objects
function onMouseClick(event) {
  event.preventDefault();
  event.stopPropagation();
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
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[0].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest1":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[1].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest2":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[2].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest3":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[3].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest4":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[4].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest5":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[5].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest6":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[6].active = true;
        animatePoi();
        moveBox();
        break;

      case "pointOfInterest7":
        stopIntro();
        playhotSpotSFX();
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

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[7].active = true;
        animatePoi();
        moveBox();
        break;


      case "pointOfInterest8":        
        stopIntro();
        playhotSpotSFX();
        setActivePoi("pointOfInterest8");
        previousAudioFile = currentAudioFile;
        currentAudioFile = audioArray[0];
        if (previousAudioFile.isPlaying()) {
          previousAudioFile.stop();
        }

        for (let i = 0; i < entryArray.length; i++) {
          $("#entry9").show();
          if (entryArray[i] != "entry9") {
            $("#" + entryArray[i]).hide();
          }
        }

        for(let i = 0; i < poiArray.length; i++)
        {
          if(poiArray[i].active === true)
          {
            poiArray[i].active = false
          }  
        } 

        poiArray[8].active = true;
        animatePoi();
        moveBox();
        break;
    }
  }
}

function animatePoi()
{
  for(let i = 0; i < poiArray.length; i++)
  {
    if(poiArray[i].active === true)
    {
      console.log(poiArray[i]);
      let tl = new TimelineMax();
      tl.from(poiArray[i].poi.scale, .5, {x: 1, y: 1, z: 1}, {x: 2, y: 2, z: 2})
      .from(poiArray[i].poi.scale, .75, {x: 2, y:2, z: 2}, {x: 1, y: 1, z: 1});
    }
  }
}

function setActivePoi(poi) {
  for (let i = 0; i < poiArray.length; i++) 
  {
    if (poiArray[i].poi.name === poi) 
    {
      poiArray[i].material.color = new THREE.Color(0x006aff);
    } 
    
    else 
    {
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

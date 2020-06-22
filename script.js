import * as THREE from './build/three.module.js';
import { ControllerHelper } from './jsm/webxr/ControllerHelper.js';
import { VRButton } from './jsm/webxr/VRButton.js';

let camera, scene, renderer, light, testCube, playerRig, controllers;
init();

function init() {
  let container = document.createElement('div');
  document.body.appendChild(container);

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.xr.enabled = true;

  scene = new THREE.Scene();

  light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  scene.add(light);

  // The player rig acts as a container for our camera and controls, allowing us to easily move the player
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  playerRig = new THREE.Group();
  playerRig.position.set(0, 0, 0);
  playerRig.add(camera);
  scene.add(playerRig);

  testCube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  testCube.position.z -= 1.5;
  testCube.position.y += 0.5;
  scene.add(testCube);

  setupControllers();

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('unload', closeSession);

  // Switch these lines to use the button or auto-session request
  // document.body.appendChild(VRButton.createButton(renderer));
  requestSession();
}

function setupControllers() {
  // Save the controllers and grips and add them to the player rig
  document.addEventListener('controllerHelperReady', function (ev) {
    controllers = ev.detail;
    for (const hand in controllers) {
      if (!controllers.hasOwnProperty(hand)) continue;
      console.log(`Setup ${hand} hand controller`);
      playerRig.add(controllers[hand].model);
      playerRig.add(controllers[hand].grip);
    }
  });

  document.addEventListener('controllerHelperStateChange', function (ev) {
    console.log('Controller State Changed:', ev.detail);
  });

  document.addEventListener('controllerHelperValueChange', function (ev) {
    console.log('Controller Value Changed:', ev.detail);
  });

  document.addEventListener('controllerHelperAxisChange', function (ev) {
    console.log('Controller Axis Changed:', ev.detail);
  });

  document.addEventListener('controllerHelperChange', function () {
    console.log('Controller Changed:', ControllerHelper.state);
  });
}

function requestSession() {
  navigator.xr.isSessionSupported('immersive-vr').then(function (supported) {
    let options = { optionalFeatures: ['local-floor', 'bounded-floor'] };
    navigator.xr.requestSession('immersive-vr', options).then(onSessionStarted);
  });
}

function onSessionStarted(session) {
  renderer.xr.setSession(session);
  renderer.setAnimationLoop(render);
  ControllerHelper.setupControllers(renderer);
}

async function closeSession() {
  await renderer.xr.getSession().end();
}

function render() {
  if (renderer.xr.isPresenting) ControllerHelper.updateControls();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}


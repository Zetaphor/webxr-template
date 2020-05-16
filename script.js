// --------------------------- three js scene setup ---------------------------

// set up scene
var scene = new THREE.Scene();

// set up camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = 5;

// set up light and adding it to the scene
var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

// making a cube for testing then adding it to the scene
var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshLambertMaterial({
  color: 0x00ff00
});
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// creating basic controller meshes for visualizing the controllers later
var con0 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({
  color: 0xff0000
}));
var con1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({
  color: 0x0000ff
}));
scene.add(con0, con1);

// set up renderer
var renderer = new THREE.WebGLRenderer({
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// set up animation loop
renderer.setAnimationLoop(function () {
  // render frame
  renderer.render(scene, camera);
})

// --------------------------- VR Setup ---------------------------

// enable xr for the renderer
renderer.xr.enabled = true;

// get the controller information thingy (provides position, rotation, and basic inputs like the trigger)
var controller0 = renderer.xr.getController(0);
var controller1 = renderer.xr.getController(1);

// asking if xr is supported and if so, request to do a vr session
navigator.xr.isSessionSupported('immersive-vr').then(function (supported) {
  // basic options, idk what they do honestly lol
  var options = {
    optionalFeatures: ['local-floor', 'bounded-floor']
  };
  navigator.xr.requestSession('immersive-vr', options).then(onSessionStarted); // this callbacks to the function below after requesting
});

// previous request sends session to this callback function "onSessionStarted"
function onSessionStarted(session) {
  // set the renderer to the xr session we requested for
  renderer.xr.setSession(session);

  // setting new animation loop for when the vr session starts (to update controllers)
  renderer.setAnimationLoop(function () {
    // set con0 to the pos/rot of controller0
    con0.position.x = controller0.position.x;
    con0.position.y = controller0.position.y;
    con0.position.z = controller0.position.z;
    con0.rotation.x = controller0.rotation.x;
    con0.rotation.y = controller0.rotation.y;
    con0.rotation.z = controller0.rotation.z;
    // set con1 to the pos/rot of controller1
    con1.position.x = controller1.position.x;
    con1.position.y = controller1.position.y;
    con1.position.z = controller1.position.z;
    con1.rotation.x = controller1.rotation.x;
    con1.rotation.y = controller1.rotation.y;
    con1.rotation.z = controller1.rotation.z;

    // render frame
    renderer.render(scene, camera);
  });
}
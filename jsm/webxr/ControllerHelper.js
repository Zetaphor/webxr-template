const controllerMaps = {
  'oculus-touch': {
    left: {
      'xr-standard-trigger': 'trigger',
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-thumbstick': 'thumbstick',
      'x-button': 'btnPrimary',
      'y-button': 'btnSecondary',
      'thumbrest': 'btnSpecial'
    },
    right: {
      'xr-standard-trigger': 'trigger',
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-thumbstick': 'thumbstick',
      'a-button': 'btnPrimary',
      'b-button': 'btnSecondary',
      'thumbrest': 'btnSpecial'
    },
  },
  'htc-vive': {
    left: {
      'xr-standard-trigger': 'trigger',
      'xr-standard-squeeze': 'btnSecondary',
      'xr-standard-touchpad': 'btnPrimaryThumbstick',
    },
    right: {
      'xr-standard-trigger': 'trigger',
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-touchpad': 'btnPrimaryThumbstick',
    },
  },
  'microsoft-mixed-reality': {
    left: {
      'xr-standard-trigger': 'btnPrimary',
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-touchpad': 'touchpad',
      'xr-standard-thumbstick': 'thumbstick',
    },
    right: {
      'xr-standard-trigger': 'btnPrimary',
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-touchpad': 'touchpad',
      'xr-standard-thumbstick': 'thumbstick',
    },
  },
  'valve-index': {
    left: {
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-touchpad': 'touchpad',
      'xr-standard-thumbstick': 'thumbstick',
      'xr-standard-trigger': 'btnSecondary',
      'a-button': 'btnPrimary',
    },
    right: {
      'xr-standard-squeeze': 'squeeze',
      'xr-standard-touchpad': 'touchpad',
      'xr-standard-thumbstick': 'thumbstick',
      'xr-standard-trigger': 'btnSecondary',
      'a-button': 'btnPrimary',
    },
  }
};

const controllerMapAliases = {
  'samsung-odyssey': 'microsoft-mixed-reality',
  'htc-vive-cosmos': 'oculus-touch',
  'oculus-touch-v2': 'oculus-touch',
  'htc-vive-focus-plus': 'htc-vive'
};

import * as THREE from '../../build/three.module.js';
import { XRControllerModelFactory } from './XRControllerModelFactory.js';

var ControllerHelper = {
  _controllerMap: null,
  _useMaps: true,
  state: {},
  controllerType: null,
  totalInputs: 1,
  controllersReady: false,

  setupControllers: function (renderer, useMaps = true) {
    const session = renderer.xr.getSession();
    this.totalInputs = session.inputSources.length - 1;
    for (let i = 0; i <= this.totalInputs; i++) {
      let controllerModelFactory = new XRControllerModelFactory();
      let controllerGrip = renderer.xr.getControllerGrip(i);
      controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));

      let controller = renderer.xr.getController(i);
      let that = this;
      controller.addEventListener('connected', function(event) {
        this.add(that.buildControllerPointer(event.data));
        that.assignController(i, controller, controllerGrip, event.data);
      });

      controller.addEventListener('disconnected', function() {
        this.remove(this.children[i]);
      });
    }
  },

  // Setup pointer lines for each controller
  buildControllerPointer: function(data) {
    switch (data.targetRayMode) {
      case 'tracked-pointer':
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
        var material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });
        return new THREE.Line(geometry, material);

      case 'gaze':
        var geometry = new THREE.RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1);
        var material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
        return new THREE.Mesh(geometry, material);
    }
  },

  // Map each hand to its respective controller and grip object
  // Handedness keys are left, right, and none (for single controllers ie: Oculus Go)
  assignController: function(index, controller, grip, data) {
    controllers[data.handedness] = {
      model: controller,
      grip: grip,
      index: index
    };

    if (index + 1 >= this.totalInputs) {
      let that = this;
      let interval = setInterval(function() {
        if (that.controllerType && !that.controllersReady) {
          clearInterval(interval);
          that.controllersReady = true;
          document.dispatchEvent(new CustomEvent('controllerHelperReady', { detail: {
            hands: controllers,
            type: that.controllerType
          }}));
        }
      }, 300);
    }
  },

  updateControls: function () {
    if (!this.controllerType) {
      if (controllers.left != undefined && controllers.left.grip.children[0].motionController !== null) {
        this.controllerType = controllers.left.grip.children[0].motionController.id;
      } else if (controllers.right != undefined && controllers.right.grip.children[0].motionController !== null) {
        this.controllerType = controllers.right.grip.children[0].motionController.id;
      } else if (controllers.none != undefined && controllers.none.grip.children[0].motionController !== null) {
        this.controllerType = controllers.none.grip.children[0].motionController.id;
      }

      if (!Object.keys(controllerMaps).includes(this.controllerType) && Object.keys(controllerMapAliases).includes(this.controllerType)) {
        console.error('Unable to setup controller with type', this.controllerType);
        this.controllerType = null;
        return;
      }

      if (typeof controllerMaps[this.controllerType] !== 'undefined') {
        this._controllerMap = controllerMaps[this.controllerType];
      } else if (typeof controllerMapAliases[this.controllerType] !== 'undefined') {
        this._controllerMap = controllerMaps[this.controllerMapAliases[this.controllerType]];
      }
    }

    if (!this.controllerType) return;

    for (const hand in controllers) {
      if (!controllers.hasOwnProperty(hand)) continue;
      if (controllers[hand].grip.children[0].motionController == null) continue;

      if (typeof this.state[hand] === 'undefined') this.state[hand] = {};

      const components = controllers[hand].grip.children[0].motionController.components;
      for (const name in components) {
        if (!components.hasOwnProperty(name)) continue;

        let mapName = name;
        if (this._useMaps) mapName = this._controllerMap[hand][name];

        if (typeof this.state[hand][mapName] === 'undefined') {
          this.state[hand][mapName] = {
            btnValue: components[name].values.button,
            btnState: components[name].values.state,
            xrInputName: name
          };

          // TODO: This is a debug, uncomment when done
          if (components[name].type === 'thumbstick' || components[name].type === 'touchpad') {
            this.state[hand][mapName]['xAxis'] = 0;
            this.state[hand][mapName]['yAxis'] = 0;
          }
        }

        let valueChange = false;
        let stateChange = false;
        let axisChange = false;

        if (this.state[hand][mapName].btnValue !== components[name].values.button) {
          valueChange = true;
          this.state[hand][mapName].btnValue = components[name].values.button;
        }
        if (this.state[hand][mapName].btnState !== components[name].values.state) {
          stateChange = true;
          this.state[hand][mapName].btnState = components[name].values.state;
        }

        if (components[name].type === 'thumbstick' || components[name].type === 'touchpad') {
          if (this.state[hand][mapName]['xAxis'] !== components[name].values.xAxis) {
            axisChange = true;
            this.state[hand][mapName]['xAxis'] = components[name].values.xAxis;
          }
          if (this.state[hand][mapName]['yAxis'] !== components[name].values.yAxis) {
            axisChange = true;
            this.state[hand][mapName]['yAxis'] = components[name].values.yAxis;
          }
        }

        if (stateChange || valueChange || axisChange) {
          if (stateChange) {
            const stateName = mapName;
            if (stateName === 'btnPrimaryThumbstick') stateName = 'btnPrimary';
            else if (stateName === 'btnSecondaryThumbstick') stateName = 'btnSecondary';
            else if (stateName === 'btnSpecialThumbstick') stateName = 'btnSpecial';
            document.dispatchEvent(new CustomEvent('controllerHelperStateChange', { detail: {
              hand: hand,
              name: stateName,
              state: components[name].values.state
            }}));
          }

          if (valueChange) {
            const valName = mapName;
            if (valName === 'btnPrimaryThumbstick') valName = 'btnPrimary';
            else if (valName === 'btnSecondaryThumbstick') valName = 'btnSecondary';
            else if (valName === 'btnSpecialThumbstick') valName = 'btnSpecial';
            document.dispatchEvent(new CustomEvent('controllerHelperValueChange', { detail: {
              hand: hand,
              name: valName,
              value: components[name].values.button
            }}));
          }

          if (axisChange) {
            const axisName = mapName;
            if (axisName === 'btnPrimaryThumbstick') axisName = 'btnPrimary';
            else if (axisName === 'btnSecondaryThumbstick') axisName = 'btnSecondary';
            else if (axisName === 'btnSpecialThumbstick') axisName = 'btnSpecial';
            document.dispatchEvent(new CustomEvent('controllerHelperAxisChange', { detail: {
              hand: hand,
              name: axisName,
              xAxis: components[name].values.xAxis,
              yAxis: components[name].values.yAxis
            }}));
          }

          document.dispatchEvent(new Event('controllerHelperChange'));
        }
      }
    }
  }
};

export { ControllerHelper };
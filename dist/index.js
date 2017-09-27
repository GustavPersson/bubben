/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _client = __webpack_require__(1);

var _immutable = __webpack_require__(2);

var _homeassistant = __webpack_require__(3);

var _homeassistant2 = _interopRequireDefault(_homeassistant);

var _moment = __webpack_require__(4);

var _moment2 = _interopRequireDefault(_moment);

var _axios = __webpack_require__(5);

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var channel = void 0;
_moment2.default.locale('sv');

function bubben(opts) {
  var slackToken = opts.token,
      apiPassword = opts.apiPassword,
      host = opts.host,
      googleApi = opts.googleApi,
      autoReconnect = opts.autoReconnect || true,
      autoMark = opts.autoMark || true;

  var slack = new _client.RtmClient(slackToken);

  var hass = new _homeassistant2.default({
    // Your Home Assistant host
    // Optional, defaults to http://locahost
    host: host,

    // Your Home Assistant port number
    // Optional, defaults to 8123
    port: 8123,

    // Your Home Assistant API password
    // Optional
    password: apiPassword,

    // Ignores SSL certificate errors, use with caution
    // Optional, defaults to false
    ignoreCert: false
  });
  hass.status().then(function (res) {
    console.log(res);
  }).catch(function (err) {
    return console.log(err);
  });

  hass.config().then(function (res) {
    return console.log('config', res);
  }).catch(function (err) {
    return console.log('error', err);
  });
  hass.discoveryInfo().then(function (res) {
    return console.log('discoveryInfo', res);
  });
  hass.states.list().then(function (res) {
    return console.log('states', res);
  });

  slack.on(_client.CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    console.log('Logged in as ' + rtmStartData.self.name + ' of team ' + rtmStartData.team.name);
  });

  slack.on(_client.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log(channel);
  });

  slack.on(_client.RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    function handleError(err) {
      console.error(err);
      slack.sendMessage('jag känner inte för att svara just nu', message.channel);
    }

    console.log('Message:', message);
    if (message.text) {
      var msg = message.text.toLowerCase();
      var args = msg.split(' ');

      if (!msg.includes('bubben')) {
        return;
      }

      var responseMessage = '';

      switch (true) {
        case msg.includes('hej bubben'):
          var responses = [':zzz:', 'jag är hungrig!', 'jag kan inte svara nu, ligger i min kalsonglåda'];

          responseMessage = responses[Math.floor(Math.random() * responses.length)];
          slack.sendMessage(responseMessage, message.channel);
          break;
        case args.includes('släcka'):
          {
            var roomToToggle = '';
            if (msg.includes('släcka i')) {
              roomToToggle = args[args.indexOf('släcka') + 2];
            } else {
              roomToToggle = args[args.indexOf('släcka') + 1];
            }

            console.log(roomToToggle);

            hass.services.call('toggle', 'light', {
              entity_id: 'light.' + roomToToggle
            }).then(function () {
              return slack.sendMessage("okej om jag orkar", message.channel);
            }).catch(function (err) {
              return slack.sendMessage("det gick inte! når inte upp :(", message.channel);
            });
            break;
          }
        case args.includes('tända'):
          {
            var _roomToToggle = '';
            if (msg.includes('tända i')) {
              _roomToToggle = args[args.indexOf('tända') + 2];
            } else {
              _roomToToggle = args[args.indexOf('tända') + 1];
            }

            console.log(_roomToToggle);

            hass.services.call('toggle', 'light', {
              entity_id: 'light.' + _roomToToggle
            }).then(function () {
              return slack.sendMessage("okej jag tänder väl då", message.channel);
            }).catch(function (err) {
              return slack.sendMessage("det gick inte! når inte upp :(", message.channel);
            });
            break;
          }
        case args.includes('läget'):
          {
            hass.states.list().then(function (res) {
              var status = (0, _immutable.fromJS)(res);

              slack.sendMessage('Ska kolla!', message.channel);

              var lights = status.filter(function (item) {
                return item.get('entity_id').includes('light.');
              });
              lights.forEach(function (light) {
                var name = light.getIn(['attributes', 'friendly_name']);
                var on = light.get('state') === 'on';
                slack.sendMessage(name + ' \xE4r ' + (on ? 'tänd' : 'släckt') + ' sedan ' + (0, _moment2.default)(light.get('last_changed')).fromNow(), message.channel);
              });

              responseMessage = 'det var allt, nu ska jag lägga mig och titta ut genom fönstret igen';
              slack.sendMessage(responseMessage, message.channel);
            }).catch(function (err) {
              return handleError(err);
            });
            break;
          }
        case msg.includes('var är'):
          {
            if (msg.includes('plumsan')) {
              var responses = ['hon har klättrat upp på nått högt!', 'gömmer sig på balkongen!!! nej skojade, hon sover i soffan', 'hon jagar en laserpekare', 'hon är och bajsar!', 'hon har gömt sig i en papperspåse', 'hon ligger i fönstret!', 'hon ligger i soffan'];

              responseMessage = responses[Math.floor(Math.random() * responses.length)];
              slack.sendMessage(responseMessage, message.channel);
              return;
            }

            hass.states.list().then(function (res) {
              var status = (0, _immutable.fromJS)(res);
              var searchterm = args[args.indexOf('är') + 1].replace(/[&\/\\#,+()$~%.'":*?!<>{}]/g, '');

              var people = status.filter(function (item) {
                return item.get('entity_id').includes(searchterm);
              });

              if (people.size < 1) {
                slack.sendMessage('det vet jag inte vem det är ju, jag är bara en katt, inte google.', message.channel);
                return;
              }

              var person = people.first();

              if (person.get('state') === 'home') {
                slack.sendMessage(searchterm + ' \xE4r hemma!', message.channel);
              } else if (person.get('state') === 'not_home') {
                var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + person.getIn(['attributes', 'latitude']) + ',' + person.getIn(['attributes', 'longitude']) + '&key=' + googleApi;

                _axios2.default.get(url).then(function (res) {
                  var formatted_address = res.data.results[0].formatted_address;
                  slack.sendMessage(searchterm + ' \xE4r p\xE5 ' + formatted_address, message.channel);
                }).catch(function () {
                  return slack.sendMessage(searchterm + ' \xE4r inte hemma :crying_cat_face:', message.channel);
                });
              } else {
                slack.sendMessage(searchterm + ' \xE4r p\xE5 ' + person.get('state'), message.channel);
              }
            }).catch(function (err) {
              return handleError(err);
            });
            break;
          }
      }
    }
  });

  slack.start();

  slack.on('error', function (err) {
    console.log('Error:', err);
  });
};

function upper(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getChannels(allChannels) {
  var channels = [];

  for (var id in allChannels) {
    var channel = allChannels[id];
    if (channel.is_member) {
      channels.push(channel.name);
    }
  }

  return channels;
}

bubben({
  token: process.env.SLACK_TOKEN,
  apiPassword: process.env.HASS_PASSWORD,
  host: process.env.HOST,
  googleApi: process.env.GOOGLE_API,
  autoReconnect: true,
  autoMark: true
});

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("@slack/client");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("immutable");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("homeassistant");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("axios");

/***/ })
/******/ ]);
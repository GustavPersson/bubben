import {
  RtmClient,
  CLIENT_EVENTS,
  RTM_EVENTS
} from '@slack/client';
import HomeAssistant from 'homeassistant';

let channel;

function bubben(opts) {
  var slackToken = opts.token,
      autoReconnect = opts.autoReconnect || true,
      autoMark = opts.autoMark || true;

  var slack = new RtmClient(slackToken);

  const hass = new HomeAssistant({
    // Your Home Assistant host
    // Optional, defaults to http://locahost
    // host: 'http://dj-friendzone.local',

    // Your Home Assistant port number
    // Optional, defaults to 8123
    port: 8123,

    // Your Home Assistant API password
    // Optional
    // password: 'api_password',

    // Ignores SSL certificate errors, use with caution
    // Optional, defaults to false
    ignoreCert: false
  });
  hass.status().then(res => console.log(res));
  hass.config().then(res => console.log(res));
  hass.discoveryInfo().then(res => console.log(res));
  hass.states.list().then(res => console.log(res));

  slack.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
  });

  slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log(channel);
  });

  slack.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    console.log('Message:', message);
    if (message.text) {
      var msg = message.text.toLowerCase();
      var args = msg.split(' ');

      if (!args.includes('bubben')) {
        return;
      }

      let responseMessage = '';

      switch (true) {
        case (msg.includes('hej bubben')):
          var responses = [
            ':zzz:',
            'jag är hungrig!'
          ];

          responseMessage = responses[Math.floor(Math.random() * responses.length)];

          break;
        case (args.includes('släcka')): {
          let roomToToggle = '';
          if (msg.includes('släcka i')) {
            roomToToggle = args[args.indexOf('släcka') + 2];
          } else {
            roomToToggle = args[args.indexOf('släcka') + 1];
          }

          console.log(roomToToggle);

          hass.services.call('toggle', 'light', {
            entity_id: `light.${roomToToggle}`
          })
            .then(() => responseMessage = "okej om jag orkar")
            .catch(err => responseMessage = "det gick inte! når inte upp :(");
          break;
        }
        case (args.includes('tända')): {
          let roomToToggle = '';
          if (msg.includes('tända i')) {
            roomToToggle = args[args.indexOf('tända') + 2];
          } else {
            roomToToggle = args[args.indexOf('tända') + 1];
          }

          console.log(roomToToggle);

          hass.services.call('toggle', 'light', {
            entity_id: `light.${roomToToggle}`
          })
            .then(() => responseMessage = "okej jag tänder väl då")
            .catch(err => responseMessage = "det gick inte! når inte upp :(")
          break;
        }
      }
      slack.sendMessage(responseMessage, message.channel);
    }
  });


  slack.start();

  slack.on('error', function(err) {
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
  autoReconnect: true,
  autoMark: true
});

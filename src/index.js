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
    host: 'http://dj-friendzone.local',

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
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
    for (const c of rtmStartData.channels) {
      if (c.is_member && c.name ==='test') { channel = c.id }
    }
  });

  slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log(channel);
    // slack.sendMessage("Hello!", channel);
  });

  slack.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    console.log('Message:', message); //this is no doubt the lamest possible message handler, but you get the idea
    // sometimes the message is an image, so check that there's actual text first
    if (message.text) {
      var msg = message.text.toLowerCase();
      var args = msg.split(' ');

      if (!args.includes('bubben')) {
        return;
      }

      switch (true) {
        // say hi!
        case (msg.includes('hej bubben')):
          var responses = [
            ':zzz:',
            'jag är hungrig!'
          ];

          var res = responses[Math.floor(Math.random() * responses.length)];

          slack.sendMessage(res, channel);
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
            .then(() => slack.sendMessage("okej om jag orkar", channel))
            .catch(err => slack.sendMessage("det gick inte! når inte upp :(", channel));
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
            .then(() => slack.sendMessage("okej jag tänder väl då", channel))
            .catch(err => slack.sendMessage("det gick inte! når inte upp :(", channel))
          break;
        }
      }
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
  token: 'xoxb-237046551718-dsF8uWpby1ugL5bS9mJAftkX',
  autoReconnect: true,
  autoMark: true
});

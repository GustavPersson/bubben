import {
  RtmClient,
  CLIENT_EVENTS,
  RTM_EVENTS
} from '@slack/client';
import { fromJS } from 'immutable';
import HomeAssistant from 'homeassistant';
import moment from 'moment';

let channel;
moment.locale('sv');

function bubben(opts) {
  var slackToken = opts.token,
      apiPassword = opts.apiPassword,
      host = opts.host,
      autoReconnect = opts.autoReconnect || true,
      autoMark = opts.autoMark || true;

  var slack = new RtmClient(slackToken);

  const hass = new HomeAssistant({
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
  hass.status().then((res) => {
    console.log(res);
  }).catch((err) => console.log(err));

  hass.config().then(res => console.log('config', res)).catch((err) => console.log('error', err));
  hass.discoveryInfo().then(res => console.log('discoveryInfo', res));
  hass.states.list().then(res => console.log('states',res));

  slack.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
  });

  slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log(channel);
  });

  slack.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
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

      let responseMessage = '';

      switch (true) {
        case (msg.includes('hej bubben')):
          var responses = [
            ':zzz:',
            'jag är hungrig!',
            'jag kan inte svara nu, ligger i min kalsonglåda'
          ];

          responseMessage = responses[Math.floor(Math.random() * responses.length)];
          slack.sendMessage(responseMessage, message.channel);
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
            .then(() => slack.sendMessage("okej om jag orkar", message.channel))
            .catch(err => slack.sendMessage("det gick inte! når inte upp :(", message.channel))
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
            .then(() => slack.sendMessage("okej jag tänder väl då", message.channel))
            .catch(err => slack.sendMessage("det gick inte! når inte upp :(", message.channel))
          break;
        }
        case (args.includes('läget')): {
          hass.states.list().then((res) => {
            const status = fromJS(res);

            slack.sendMessage('Ska kolla!', message.channel);

            const lights = status.filter(item => item.get('entity_id').includes('light.'));
            lights.forEach((light) => {
              const name = light.getIn(['attributes', 'friendly_name']);
              const on = light.get('state') === 'on';
              slack.sendMessage(`${name} är ${on ? 'tänd' : 'släckt'} sedan ${moment(light.get('last_changed')).fromNow()}`, message.channel);
            });

            responseMessage = 'det var allt, nu ska jag lägga mig och titta ut genom fönstret igen';
            slack.sendMessage(responseMessage, message.channel);
          })
          .catch((err) => handleError(err));
          break;
        }
        case (msg.includes('var är')): {
          if (msg.includes('plumsan')) {
            var responses = [
              'hon har klättrat upp på nått högt!',
              'gömmer sig på balkongen!!! nej skojade, hon sover i soffan',
              'hon jagar en laserpekare',
              'hon är och bajsar!',
              'hon har gömt sig i en papperspåse',
              'hon ligger i fönstret!',
              'hon ligger i soffan'
            ];

            responseMessage = responses[Math.floor(Math.random() * responses.length)];
            slack.sendMessage(responseMessage, message.channel);
            return;
          }

          hass.states.list().then((res) => {
            const status = fromJS(res);
            const searchterm = args[args.indexOf('är') + 1].replace(/[&\/\\#,+()$~%.'":*?!<>{}]/g, '');

            const people = status.filter(item => item.get('entity_id').includes(searchterm));

            if (people.size < 1) {
              slack.sendMessage('det vet jag inte vem det är ju, jag är bara en katt, inte google.', message.channel);
              return;
            }

            const person = people.first();

            if (person.get('state') === 'home') {
              slack.sendMessage(`${searchterm} är hemma!`, message.channel);
            } else if (person.get('state') === 'not_home') {
              slack.sendMessage(`${searchterm} är inte hemma :crying_cat_face:`, message.channel);
            } else {
              slack.sendMessage(`${searchterm} är på ${person.get('state')}`, message.channel);
            }
          })
          .catch((err) => handleError(err));
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
  token: process.env.SLACK_TOKEN,
  apiPassword: process.env.HASS_PASSWORD,
  host: process.env.HOST,
  autoReconnect: true,
  autoMark: true
});

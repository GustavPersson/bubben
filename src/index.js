import {
  RtmClient,
  WebClient,
  CLIENT_EVENTS,
  RTM_EVENTS,
} from '@slack/client';
import { fromJS } from 'immutable';
import HomeAssistant from 'homeassistant';
import moment from 'moment';
import axios from 'axios';

let channel;
moment.locale('sv');

function bubben(opts) {
  const {
    slackToken,
    apiPassword,
    host,
    googleApi,
  } = opts;

  const slack = new RtmClient(slackToken);
  const slackWeb = new WebClient(slackToken);

  const hass = new HomeAssistant({
    // Your Home Assistant host
    // Optional, defaults to http://locahost
    host,

    // Your Home Assistant port number
    // Optional, defaults to 8123
    port: 8123,

    // Your Home Assistant API password
    // Optional
    password: apiPassword,

    // Ignores SSL certificate errors, use with caution
    // Optional, defaults to false
    ignoreCert: false,
  });
  hass.status().then((res) => {
    console.log(res);
  }).catch(err => console.log(err));

  hass.config().then(res => console.log('config', res)).catch(err => console.log('error', err));
  hass.discoveryInfo().then(res => console.log('discoveryInfo', res));
  hass.states.list().then(res => console.log('states', res));

  slack.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
  });

  slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
    console.log(channel);
  });

  slack.on(RTM_EVENTS.MESSAGE, (message) => {
    function handleError(err) {
      console.error(err);
      slack.sendMessage('jag känner inte för att svara just nu', message.channel);
    }


    console.log('Message:', message);
    if (message.text) {
      const msg = message.text.toLowerCase();
      const args = msg.split(' ');

      if (!msg.includes('bubben')) {
        return;
      }

      let responseMessage = '';

      switch (true) {
        case (msg.includes('hej bubben')):
          const responses = [
            ':zzz:',
            'jag är hungrig!',
            'jag kan inte svara nu, ligger i min kalsonglåda',
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
            entity_id: `light.${roomToToggle}`,
          })
            .then(() => slack.sendMessage('okej om jag orkar', message.channel))
            .catch(err => slack.sendMessage('det gick inte! når inte upp :(', message.channel));
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
            entity_id: `light.${roomToToggle}`,
          })
            .then(() => slack.sendMessage('okej jag tänder väl då', message.channel))
            .catch(err => slack.sendMessage('det gick inte! når inte upp :(', message.channel));
          break;
        }
        case (args.includes('läget')): {
          hass.states.list().then((res) => {
            const status = fromJS(res);

            slack.sendMessage('Ska kolla!', message.channel);

            const lights = status.filter(item => item.get('entity_id').includes('light.'));
            const mediaPlayers = status.filter(item => item.get('entity_id').includes('media_player.'));

            lights.forEach((light) => {
              const name = light.getIn(['attributes', 'friendly_name']);
              const on = light.get('state') === 'on';
              slack.sendMessage(`${name} är ${on ? 'tänd' : 'släckt'} sedan ${moment(light.get('last_changed')).fromNow()}`, message.channel);
            });

            mediaPlayers.forEach((mediaPlayer) => {
              const name = mediaPlayer.getIn(['attributes', 'friendly_name']);
              const on = mediaPlayer.get('state') === 'playing';

              slack.sendMessage(`${name} spelar ${on ? mediaPlayer.getIn(['attributes', 'media_title']) : 'inget'}`, message.channel);
            });

            responseMessage = 'det var allt, nu ska jag lägga mig och titta ut genom fönstret igen';
            slack.sendMessage(responseMessage, message.channel);
          })
            .catch(err => handleError(err));
          break;
        }
        case (msg.includes('var är')): {
          if (msg.includes('plumsan')) {
            const responses = [
              'hon har klättrat upp på nått högt!',
              'gömmer sig på balkongen!!! nej skojade, hon sover i soffan',
              'hon jagar en laserpekare',
              'hon är och bajsar!',
              'hon har gömt sig i en papperspåse',
              'hon ligger i fönstret!',
              'hon ligger i soffan',
              'hon ligger på en fyrkant på golvet!'
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
              const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${person.getIn(['attributes', 'latitude'])},${person.getIn(['attributes', 'longitude'])}&key=${googleApi}`;

              axios.get(url).then((res) => {
                const formatted_address = res.data.results[0].formatted_address;
                slack.sendMessage(`${searchterm} är på ${formatted_address}`, message.channel);
              }).catch(() => slack.sendMessage(`${searchterm} är inte hemma :crying_cat_face:`, message.channel));
            } else {
              slack.sendMessage(`${searchterm} är på ${person.get('state')}`, message.channel);
            }
          })
            .catch(err => handleError(err));
          break;
        }
        case (msg.includes('vem är bäst')): {
          slackWeb.users.info(message.user, (err, response) => {
            if (response.user.real_name.toLowerCase().includes('gustav')) {
              slack.sendMessage('Matte!', message.channel);
            } else {
              slack.sendMessage('Husse!', message.channel);
            }
          });
          break;
        }
        case (msg.includes('hur varmt är det')): {
          slack.sendMessage('Ska kolla på balkongen', message.channel);

          const promises = [];
          promises.push(hass.states.get('sensor', 'dark_sky_temperature'));
          promises.push(hass.states.get('sensor', 'dark_sky_apparent_temperature'));

          Promise.all(promises).then((response) => {
            slack.sendMessage(`Det är ${response[0].state} grader varmt, men känns som ${response[1].state} grader.`, message.channel);
          });
          break;
        }
        case (msg.includes('ska vädret bli')): {
          slack.sendMessage('Ska skicka upp plumsan i väderballongen.', message.channel);
          switch (true) {
            case msg.includes('morgon'):
              hass.states.get('sensor', 'dark_sky_hourly_summary').then((response) => {
                slack.sendMessage(`Hon säger såhär: ${response.state}`, message.channel);
              });
              break;
            case msg.includes('timme') || msg.includes('dag'):
              hass.states.get('sensor', 'dark_sky_minutely_summary').then((response) => {
                slack.sendMessage(`Hon säger såhär: ${response.state}`, message.channel);
              });
              break;
            case msg.includes('vecka'):
            default:
              hass.states.get('sensor', 'dark_sky_daily_summary').then((response) => {
                slack.sendMessage(`Hon säger såhär: ${response.state}`, message.channel);
              });
              break;
          }
          break;
        }
        default: {
          break;
        }
      }
    }
  });


  slack.start();

  slack.on('error', (err) => {
    console.log('Error:', err);
  });
}

bubben({
  slackToken: process.env.SLACK_TOKEN,
  apiPassword: process.env.HASS_PASSWORD,
  host: process.env.HOST,
  googleApi: process.env.GOOGLE_API
});

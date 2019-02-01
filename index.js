  'use strict';
  const express = require('express');
  const bodyParser = require('body-parser');
  const axios = require('axios');
  const qs = require('querystring');
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  const server = app.listen(3000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
  });

  var dotenv = require('dotenv');
  dotenv.load();

  var dialogData = require('./dlgData.json');
  var whenButton = require('./whenMsgBtn.json');

  app.post('/', (req, res) => {
    const {text, trigger_id, channel_id, user_id} = req.body;
    console.log(JSON.stringify(req.body, null, 2));
    if (! /^[1-9][0-9]{0,1}$/.test(text)) {
      // not a one or two-digit number
      res.send('`1 hour to 99 hours works well here :smile:`').status(400);
      return;
    }
    else {
      let buttonMsg = {
        token: process.env.BOT_ACCESS_TOKEN,
        channel: channel_id,
        text: whenButton.text,
        user: user_id,
        as_user: true,
        attachments: JSON.stringify(whenButton.attachments)
      };

      axios.post('https://slack.com/api/chat.postEphemeral',
      qs.stringify(buttonMsg)).then((result) => {
        console.log('message posted: %o', result);
        if(result.data.ok)
        {
          res.send('ok..').status(200);
          /* let dialog = {
            token: process.env.BOT_ACCESS_TOKEN,
            trigger_id,
            dialog: JSON.stringify(dialogData)
          };
      
          axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog)).then((result) => {
            console.log('dialog.open: %o', result.data);
          }).catch((err) => {
            console.log('dialog.open call failed: %o', err);
            res.send("`Can't open dialog!`").status(500);
          }); */
        }
        else 
        {
          console.log('Log time message post failed!');
        }
      }).catch((err) => {
        console.log('message post failed: %o', err);
        res.send("`Can't send message`").status(500);
      });

    }
  });

  app.post('/getProjectsForUser', (req, res) => {
    const {callback_id} = JSON.parse(req.body.payload);
    if(callback_id === "timeLogDialog")
    {
      axios({
        method: 'get',
        url: 'https://ranger.42hertz.com/api/v3/projects/',
        headers: {
          Authorization: 'Basic '+process.env.RANGER_ACCESS_TOKEN
        }
      }).then(function (response) {     

        /*res.send(JSON.stringify({
              "options": [
                {
                  "label": "[UXD-342] The button color should be artichoke green, not jalapeño",
                  "value": "UXD-342"
                },
                {
                  "label": "[FE-459] Remove the marquee tag",
                  "value": "FE-459"
                },
                {
                  "label": "[FE-238] Too many shades of gray in master CSS",
                  "value": "FE-238"
                }
              ]
            })
          );*/
        });
    }
    else
    {

    }
    
  });
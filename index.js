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

  var dialogData = require('./UI_Element_json/dlgData.json');
  var whenButton = require('./UI_Element_json/whenMsgBtn.json');
  var selectWP   = require('./UI_Element_json/selectWP.json');

  app.post('/', (req, res) => {
    const {text, trigger_id, channel_id, user_id, payload, command} = req.body;
    console.log(JSON.stringify(req.body, null, 2));

    if (! /^[1-9][0-9]{0,1}$/.test(text) && command === "/logtime") {
      // not a one or two-digit number
      res.send('*1 hour to 99 hours works well here :) *').status(400);
      return;
    }
    else if(payload)
    {
        const {trigger_id, callback_id} = JSON.parse(payload);
        if(callback_id === "wp_selection")
        {
          let dialog = {
          token: process.env.BOT_ACCESS_TOKEN,
          trigger_id,
          dialog: JSON.stringify(dialogData)
          };
          axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog)).then((result) => {
           console.log('dialog.open: %o', result.data);
          }).catch((err) => {
           console.log('dialog.open call failed: %o', err);
           res.send("`Can't open dialog!`").status(500);
          });
        }   
        else if(callback_id === "timeLogDialog")
        {
          /*save data to open project*/
          //TODO
        }
    }
    else {
      let selectWPMsg = {
        token: process.env.BOT_ACCESS_TOKEN,
        channel: channel_id,
        text: selectWP.text,
        user: user_id,
        as_user: true,
        attachments: JSON.stringify(selectWP.attachments)
      };

      axios.post('https://slack.com/api/chat.postEphemeral',
      qs.stringify(selectWPMsg)).then((result) => {
        console.log('message posted: %o', result);
        if(result.data.ok)
        {
          return;
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
    const {callback_id, value} = JSON.parse(req.body.payload);
    if(callback_id === "wp_selection")
    {
      axios({
        url: '/projects',
        method: 'get',
        baseURL: 'https://ranger.42hertz.com/api/v3',
        auth: {
          username: 'apikey',
          password: process.env.RANGER_ACCESS_TOKEN
        }
      }).then(function (response) {  
        console.log("Response from ranger: %o", response);
        let optArray = [];
        response.data._embedded.elements.forEach(element => {
          if(element.identifier.match(value.toLowerCase()))
          {
            optArray.push({
            "text": element.name,
            "value": element.id
            });
          }
        });
        res.type('application/json').send(JSON.stringify({"options": optArray})).status(200);
      });
    }
    if(callback_id === "when_button")
    {

    }
    else
    {

    }
    
  });
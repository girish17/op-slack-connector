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
  var selProject = require('./UI_Element_json/selectProject.json');

  let projectId = '';
  let hoursLog = 0;

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
        hoursLog = parseInt(text);
        const {trigger_id, callback_id, actions, type} = JSON.parse(payload);
        if(callback_id === "project_selection")
        {
          let dialog = {
          token: process.env.BOT_ACCESS_TOKEN,
          trigger_id,
          dialog: JSON.stringify(dialogData)
          };
          axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog)).then((result) => {
            console.log('dialog.open: %o', result.data);
            /*set projectId for callback*/
            projectId = actions.pop().selected_options.pop().value;
            res.send('').status(200);  
            return;
          }).catch((err) => {
            console.log('dialog.open call failed: %o', err);
            res.send("`Can't open dialog!`").status(500);
          });
        }   
        else if(callback_id === "timeLogDialog")
        {
          if(type === "dialog_submission")
          {
            const {submission} = JSON.parse(req.body.payload);
              /*log time data to open project*/
              axios({
                url: '/time_entries',
                method: 'post',
                baseURL: 'https://ranger.42hertz.com/api/v3',
                data: {
                  "_links": {
                    "project": {
                      "href": "/api/v3/projects/"+projectId
                    },
                    "activity": {
                      "href": "/api/v3/time_entries/activities/"+submission.activity_id
                    },
                    "workPackage": {
                      "href": "/api/v3/work_packages/"+submission.work_package_id
                    }
                  },
                  "hours": hoursLog,
                  "comment": submission.comments,
                  "spentOn": submission.spent_on,
                  "customField2": submission.billable_hours,
                },
                auth: {
                  username: 'apikey',
                  password: process.env.RANGER_ACCESS_TOKEN
                }
              }).then((response) => {
                  console.log("Time entry save response: %o", response);
              }).catch((error) => {
                console.log("Ranger time entries create error: %o", error.message);
              });
          }
          else if(type === "dialog_cancellation")
          {
            res.send("Time not logged!").status(400);
          }
          
        }
    }
    else {
      let selectProjectMsg = {
        token: process.env.BOT_ACCESS_TOKEN,
        channel: channel_id,
        text: selProject.text,
        user: user_id,
        as_user: true,
        attachments: JSON.stringify(selProject.attachments)
      };

      axios.post('https://slack.com/api/chat.postEphemeral',
      qs.stringify(selectProjectMsg)).then((result) => {
        console.log('message posted: %o', result);
        if(result.data.ok)
        {
          res.send().status(200);
          return;
        }
        else 
        {
          console.log('select project post failed!');
          res.send().status(400);
          return;
        }
      }).catch((err) => {
        console.log('message post failed: %o', err);
        res.send("`Can't send message`").status(500);
      });
    }
  });

  app.post('/getProjectsForUser', (req, res) => {
    const {callback_id, value, type} = JSON.parse(req.body.payload);
    if(callback_id === "project_selection")
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
        console.log("Projects obtained from ranger: %o", response);
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
        return;
      });
    }
    if(callback_id === "timeLogDialog")
    {
      let optArray = [];
        axios({
          url: '/work_packages',
          method: 'get',
          baseURL: 'https://ranger.42hertz.com/api/v3',
          params: {
            id: projectId
          }, 
          auth: {
            username: 'apikey',
            password: process.env.RANGER_ACCESS_TOKEN
          }
        }).then((response) => {  
          console.log("WP obtained from ranger: %o", response);
          response.data._embedded.elements.forEach(element => {
            if(element.subject.toLowerCase().match(value.toLowerCase()))
            {
              optArray.push({
              "label": element.subject,
              "value": element.id
              });
            }
          });
          res.send({"options": optArray}).status(200);
          return;
        });
      }
    if(callback_id === "when_button")
    {

    }
    else
    {

    }
    
  });
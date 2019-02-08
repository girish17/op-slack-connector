  'use strict';
  const express = require('express');
  const bodyParser = require('body-parser');
  const axios = require('axios');
  const qs = require('querystring');
  const moment = require('moment');
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

  let hoursLog = 0;
  let project = {
    id: '', name: ''
  };

  function checkHours(txt)
  {
    /*check if hours are between 1 and 99*/
    if(/^[1-9][0-9]{0,1}$/.test(txt))
    {
       return true;
    }
    else
      return false;
  }

  function checkDate(dateTxt)
  {
    /*Valid dates within last one year*/
    let dateDiff = moment().diff(moment(dateTxt, 'YYYY-MM-DD', true), 'days');
    if(dateDiff >= 0 && dateDiff < 366)
      return true;
    
    return false;
  }

  app.post('/', (req, res) => {
    const {text, trigger_id, channel_id, user_id, payload, command} = req.body;
    console.log(JSON.stringify(req.body, null, 2));

    if (!checkHours(text) && (command === "/logtime")) {
      // not a one or two-digit number
      res.send("*1 hour to 99 hours works well here :) Let's try again...* \n `/logtime [hours]`").status(400);
      return;
    }
    else if(payload)
    {
        hoursLog = parseInt(text);
        const {trigger_id, callback_id, actions, type} = JSON.parse(payload);
        if(callback_id === "project_selection")
        {
           showDlg(res, trigger_id, actions);
        }   
        else if(callback_id === "timeLogDialog")
        {
          if(type === "dialog_submission")
          {
            if(handleSubmission(req, res))
            {
              res.send('').status(200);
              return;
            }
            else
              res.send("creation failed").status(400);
          }
          else if(type === "dialog_cancellation")
          {
            res.send("Time not logged!").status(400);
          }   
        }
    }
    else {
      showSelProject(res, channel_id, user_id);
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
            id: project.id
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

  function showSelProject(res, channel_id, user_id)
  {
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

  function showDlg(res, trigger_id, actions)
  {
    let dialog = {
      token: process.env.BOT_ACCESS_TOKEN,
      trigger_id,
      dialog: JSON.stringify(dialogData)
      };
      axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog)).then((result) => {
        console.log('dialog.open: %o', result.data);
        /*set projectId for callback*/
        project.id = actions.pop().selected_options.pop().value;
        res.send('').status(200);  
        return;
      }).catch((err) => {
        console.log('dialog.open call failed: %o', err);
        res.send("`Can't open dialog!`").status(500);
      });
  }

  function handleSubmission(req, res)
  {
    const {submission} = JSON.parse(req.body.payload);
    /*validate for date and billable hours*/
    if(checkDate(submission.spent_on) && checkHours(submission.billable_hours))
    {
      /*log time data to open project*/
      axios({
        url: '/time_entries',
        method: 'post',
        baseURL: 'http://localhost:8080/api/v3',
        data: {
          "_links": {
            "project": {
              "href": "/api/v3/projects/2"//+project.id
            },
            "activity": {
              "href": "/api/v3/time_entries/activities/3"//+submission.activity_id
            },
            "workPackage": {
              "href": "/api/v3/work_packages/30"//+submission.work_package_id
            },
            "user": {
              "href": "/api/v3/users/1"
            }
          },
          "hours": "PT1H", //replace later with data in period format
          "comment": submission.comments,
          "spentOn": submission.spent_on,
          "customField2": submission.billable_hours,
        },
        auth: {
          username: 'apikey',
          password: process.env.RANGER_ACCESS_TOKEN_2
        }
      }).then((response) => {
          console.log("Time entry save response: %o", response);
          //res.send('').status(200);
          return true;
      }).catch((error) => {
        console.log("Ranger time entries create error: %o", error.message);
        //res.send("").status(400);
        return false;
      });
    }
    else
    {
      res.send("*Hmmm... Please check the date and billable hours*").status(400);
      return false;
    }
  }


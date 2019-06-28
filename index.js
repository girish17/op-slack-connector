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
  var timeLoggedMsgBtn = require('./UI_Element_json/timeLoggedMsg.json');
  var selProject = require('./UI_Element_json/selectProject.json');

  var hoursLog = 0;
  let project = {
    id: '', name: ''
  };
  var msg_ts = '';

  function checkHours(txt)
  {
    /*check if hours are between 1 and 99*/
    if(/^[1-9][0-9]{0,1}$/.test(txt))
    {
       if(hoursLog != 0)
       {
         /*Check for billable hours to be less than hours log*/
         if(parseInt(txt) <= hoursLog)
         {
           return true;
         }
         else 
           return false;
       }
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

  function showSuccessMsg(req, res)
  {
    let payload = JSON.parse(req.body.payload);
    let successMsg = {
      token: process.env.BOT_ACCESS_TOKEN,
      channel: payload.channel.id,
      text: timeLoggedMsgBtn.text,
      user: payload.user.id,
      ts: msg_ts,
      as_user: true,
      attachments: JSON.stringify(timeLoggedMsgBtn.attachments)
    };
    axios.post('https://slack.com/api/chat.update',
    qs.stringify(successMsg)).then((result) => {
      console.log('message posted: %o', result);
      if(result.data.ok)
      {
        msg_ts = result.data.message_ts;
        res.send().status(200);
        return;
      }
      else 
      {
        console.log('Show success message post failed!');
        res.send().status(400);
        return;
      }
    }).catch((err) => {
      console.log('Show success message post failed: %o', err);
      res.type("application/json").send(JSON.stringify({
        "response_type": "ephemeral",
        "replace_original": false,
        "text": "Sorry, that didn't work. Please try again."
      })).status(500);
    });
  }

  function showFailMsg(req, res)
  {
    let payload = JSON.parse(req.body.payload);
    let failMsg = {
      token: process.env.BOT_ACCESS_TOKEN,
      channel: payload.channel.id,
      text: "*Time entry save didn't work. Seems like OP server is down!*",
      user: payload.user.id,
      ts: msg_ts,
      as_user: true
    };
    axios.post('https://slack.com/api/chat.update',
    qs.stringify(failMsg)).then((result) => {
      console.log('message posted: %o', result);
      if(result.data.ok)
      {
        res.send().status(200);
        return;
      }
      else 
      {
        console.log('Show fail message failed!');
        res.send().status(400);
        return;
      }
    }).catch((err) => {
      console.log('Show fail message post failed: %o', err);
      res.type("application/json").send(JSON.stringify({
        "response_type": "ephemeral",
        "replace_original": false,
        "text": "Sorry, that didn't work. Please try again."
      })).status(500);
    });
  }

  app.post('/', (req, res) => {
    const {text, channel_id, user_id, payload, command} = req.body;

    console.log("Request Body to / ", JSON.stringify(req.body, null, 2));
    if(text != undefined)
    {
      hoursLog = parseInt(text);
    }
    if (!checkHours(hoursLog) && (command === "/logtime")) {
      // not a one or two-digit number
      res.send("*1 hour to 99 hours works well here :) Let's try again...* \n `/logtime [hours]`").status(400);
      return;
    }
    else if(payload)
    {
        const {trigger_id, callback_id, actions, type, message_ts} = JSON.parse(payload);
        if(callback_id === "project_selection")
        {
           showDlg(res, trigger_id, actions);
        }   
        else if(callback_id === "timeLogDialog")
        {
          if(type === "dialog_submission")
          {
            handleSubmission(req, res);
          }
          else if(type === "dialog_cancellation")
          {
            res.send("Time not logged!").status(400);
          }   
        }
        else if(type === "interactive_message")
        {
            res.send().status(200);
        }
        else
        {
            res.send("Unknown type").status(400);
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
        baseURL: 'http://localhost:8080/api/v3',
        auth: {
          username: 'apikey',
          password: process.env.OP_ACCESS_TOKEN_2
        }
      }).then(function (response) {  
        console.log("Projects obtained from OP: %o", response);
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
          baseURL: 'http://localhost:8080/api/v3',
          params: {
            id: project.id
          }, 
          auth: {
            username: 'apikey',
            password: process.env.OP_ACCESS_TOKEN_2
          }
        }).then((response) => {  
          console.log("WP obtained from OP: %o", response);
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
    
  });

  app.get('/', (req, res) => {
      res.send("Hello there! Good to see you here :) We don't know what to show here yet!").status(200);
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

    axios.post('https://slack.com/api/chat.postMessage',
    qs.stringify(selectProjectMsg)).then((result) => {
      console.log('select project message posted: %o', result);
      if(result.data.ok)
      {
        console.log("setting global var msg_ts for use in show success/fail msg");
        msg_ts = result.data.ts;
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
      res.type("application/json").send(JSON.stringify({
        "response_type": "ephemeral",
        "replace_original": false,
        "text": "Sorry, that didn't work. Please try again."
      })).status(500);
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
    const {submission, response_url} = JSON.parse(req.body.payload);
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
                "href": "/api/v3/projects/"+project.id
              },
              "activity": {
                "href": "/api/v3/time_entries/activities/"+submission.activity_id
              },
              "workPackage": {
                "href": "/api/v3/work_packages/"+submission.work_package_id
              },
              "user": {
                "href": "/api/v3/users/1"
              }
            },
            "hours": moment.duration(hoursLog, 'h').toISOString(),
            "comment": submission.comments,
            "spentOn": submission.spent_on,
            "customField2": submission.billable_hours,
          },
          auth: {
            username: 'apikey',
            password: process.env.OP_ACCESS_TOKEN_2
          }
      }).then((response) => {
          console.log("Time entry save response: %o", response);
          res.send().status(200);
          showSuccessMsg(req, res);
          return true;
      }).catch((error) => {
        console.log("OP time entries create error: %o", error);
        res.send().status(400);
        showFailMsg(req, res);
        return false;
      });
    }
    else
    {
      axios.post(response_url, {
        "text": "It seems that date or billable hours was incorrect :thinking_face:",
        "attachments": [
            {
                "color": "F41B07",
                "text":"Please try again :bug:"
            }
        ],
        "response_type": "in_channel"
     });
     res.send().status(400);
    }
  }


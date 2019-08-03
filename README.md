# op-slack-connector
This app provides a connector for [Slack](https://api.slack.com/) and [Open Project](http://docs.openproject.org/apiv3-doc/) implementation integration.

## Currently supported feature:
- Log time using a Slack bot for a work-package in Open Project.

# Prerequisites
- IDE - VS Code
- OpenProject 8
- Slack app
- ngrok
- node
- git
- docker

# Setup and contribution guidelines
- Fork and `git clone` the repo using HTTPS
- Install [VS Code](https://code.visualstudio.com/Download)(Preferred IDE for development) and open the cloned directory
- Create a `.env` file in the home directory of project with `OP_ACCESS_TOKEN_2` and `BOT_ACCESS_TOKEN`. These will be assigned to tokens obtained from Open Project and Slack after installation
- Install [Node](https://nodejs.org/en/download/) and do the following -  
  - In the project root directory do `npm init` to generate a package.json file
  - Install [Node express](https://expressjs.com/), [Nodemon](https://nodemon.io/), [Axios](https://www.npmjs.com/package/axios), [QueryString](https://www.npmjs.com/package/query-string) and [Moment](https://momentjs.com/) by running `npm install express nodemon axios query-string moment --save` in the project root folder
- Install [Open project setup using docker](https://www.openproject.org/docker/) and launch it on a port
- Install [ngrok](https://ngrok.com/download) and run it (`ngrok http 3000`) to get a public IP address
- Using the above IP address create a Slack app and bot in https://api.slack.com and install it to the workspace
- Run the op-slack-connector code in VS code `^F5`
- Follow the demo below to test the working
- Make any code changes and raise a pull request
- To see the flowchart: Open the [LogTimeFlow.xml](LogTimeFlow.xml) file in www.draw.io

# Demo
![Demo](demo_op_slack_connector.gif)

# Learning resources
- [Creating a Slack Command Bot from Scratch with Node.js & Distribute It](https://tutorials.botsfloor.com/creating-a-slack-command-bot-from-scratch-with-node-js-distribute-it-25cf81f51040)

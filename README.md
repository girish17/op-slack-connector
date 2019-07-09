# op-slack-connector
This app provides a connector for [Slack](https://api.slack.com/) and [Open Project](http://docs.openproject.org/apiv3-doc/) implementation integration.

## Currently supported feature:
Log time using a Slack bot for a work-package in Open Project.

# Dependencies
1. IDE - VS Code
2. Open project 8
3. Slack app
4. ngrok
5. node express
6. git

# Setup and contribution guidelines
1. Fork and `git clone` the repo using HTTPS
2. Install [VS Code](https://code.visualstudio.com/Download)(Preferred IDE for development) and open the cloned directory
3. Create a .env file in the home directory of project with OP_ACCESS_TOKEN_2 and BOT_ACCESS_TOKEN. These will be assigned to tokens obtained from Open Project and Slack after installation
4. Install [Node](https://nodejs.org/en/download/) and [Node express](https://expressjs.com/) by running `npm install express --save`
5. Install [Open project setup using docker](https://www.openproject.org/docker/) and launch it on port 8080 (preferably)
6. Install [ngrok](https://ngrok.com/download) and run it (`ngrok http 3000`) to get a public IP address
7. Using the above IP address create a Slack app and bot in https://api.slack.com and install it to the workspace
8. Run the op-slack-connector code in VS code `^F5`
9. Follow the demo below to test the working
10. Make any code changes and raise a pull request
11. To see the flowchart: Open the [LogTimeFlow.xml](LogTimeFlow.xml) file in www.draw.io

# Demo
![Demo](demo_op_slack_connector.gif)

# Learning resources
1. [Creating a Slack Command Bot from Scratch with Node.js & Distribute It](https://tutorials.botsfloor.com/creating-a-slack-command-bot-from-scratch-with-node-js-distribute-it-25cf81f51040)

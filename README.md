hey welcome to my bot

this is a simple bot based on an old version of penguinbot

this bot is designed to safely run arbitrary nodejs and python3 code using a docker container

one of the biggest safety features is that the docker container that runs all code has all of its internet traffic forcefully routed through tor and there is as far as i'm aware no way to bypass it

this bot has been exlusively tested on linux

to run you'll need docker and nodejs, docker MUST be setup properly and in path, this bot relies on running shell commands to do docker stuff(see index.js and commands/eval.js)

you will need to edit commands/eval.js and index.js

if you can read my shitty code you will need to edit some id's and possibly a small bit of code logic in commands/eval.js and index.js, look for comments lol

this command is needed before running the bot: `docker build -t eval-runner:latest --network host # build the eval runner docker image`

after this just do `node index.js <args>`

available args:
- `--restart-container / -r`: `is needed for first bot run, is not needed if both the tor-router and eval-runner containers are already running, good for resetting the eval-runner environment`
- `--lock`: `simply disallows using the bots eval command outside of debug channels(see commands/eval.js)`
- `--anychannel`: `the exact opposite of --lock, lets anyone use the eval command anywhere in any channel anywhere`
btw running without --lock or --anychannel will by default only let the bot be used in the pm discord commands channel(can be changed, see eval.js) and literally no where else, not even debug channels

also put the given bot token in the .env file(make if non existant yet) under the "TOKEN" key

.env:
```
TOKEN=my-bot-token-here
```

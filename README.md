# PomPom
I'd checked out all the other pomodoro bots on top.gg and I wasn't happy with any of them. They either lacked something or the other. So I decided to make my own.

PomPom is a real-time Pomodoro app with slash commands. It's highly customizable, please be aware that this is a very early prototype and I would appreciate any help I could get in terms of development. The source code is on GitHub: https://github.com/atavako5/PomPom/issues Don't be scared, it's literally only 2 JS files and it runs on the latest version of NodeJS.

You can write slash commands such as:

/start:
This starts a Pomodoro, you can have one Pomodoro running per channel, although if I get requests for it, I can make it so you can run multiple Pomodoros per channel if you name your Pomodoros

optional parameters:

work: How long you want to work for (in minutes, default is 25)
shortbreak: How long should the short break be (in minutes, default is 5)

longbreak: How long should the long breaks be (in minutes, defaults to 3X short break length)

sessions: How many short sessions do you want to go to before long break (Default is 4, long break on 4th)

Note you can put fractions in any of these fields, PomPom doesn't like it. (like 0.25 min). Although with enough requests, I may be able to change PomPom's mind 😉

/stop
stops the current running Pomodoro

/status
get the status of the current running Pomodoro

/pause
pauses the current session and saves progress to db

/unpause
unpauses the current session

There is a persistance layer on this bot, if I ever restart the server from Nov 28th, 2021, you will not lose progress and it will automatically restore your sessions. As a bonus you now have access to how many pomodoros you have gone through.

Future update:
- Add total time spent per session
- add total time for all sessions in a channel

Feature progress:
https://trello.com/b/dRwS0fJF/pompom

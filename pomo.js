const { MessageActionRow, MessageButton } = require('discord.js');

class Pomo {
    constructor(guildId,channelId,work,shortBreak,longBreak,sessions,channel) {

        this.guildId = guildId;
        this.channelId = channelId;
        this.work = work;
        this.shortBreak = shortBreak;
        this.longBreak = longBreak;
        this.sessions = sessions;
        this.channel = channel

        this.session_status = null
        this.session_time = null
        this.pomodoro_counter = 0

        this.interval = null
        this.tick = 1000
        this.tick_frequency = 60
        this.sessions_remaining =  this.sessions
        this.mode = 1
        this.count = 0
        this.halting = false
    }

    dateCreator(sessionTime){
        var dateObj =  Date.now()
        dateObj += sessionTime*this.tick*this.tick_frequency;
        return new Date(dateObj)
     }

    timeSubtractor(){
        var now = new Date();
        var session = this.session_time;
        var diffMs = (session-now); // milliseconds between now & Christmas
        var diffDays = Math.floor(diffMs / 86400000); // days
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.floor(((diffMs % 86400000) % 3600000) / 60000); // minutes
        var diffSeconds = Math.round((((diffMs % 86400000) % 3600000) % 60000) / 1000); // minutes
        var diffString = ``
        if (diffDays > 0)
        {
            diffString += `${diffDays} days, `
        }
        if (diffHrs > 0)
        {
            diffString += `${diffHrs} hours, `
        }
        if (diffMins > 0)
        {
            diffString += `${diffMins} minutes, `
        }
        diffString += `${diffSeconds} seconds`
        return diffString
    }

    getStatus(){
        let statusString = `Current Status: ${this.session_status}\nTime remaining in current session is: ${this.timeSubtractor()}\nThis channel has completed ${this.pomodoro_counter} pomodoros so far (before canceling the pomodoro)!\nsessions remaining until long break: ${this.sessions_remaining}`
        this.log("got status update!")
        return statusString;
    }

    start()
    {   
        this.session_status = "Work session is in progress!"
        this.session_time =  this.dateCreator(this.work)
        this.log(this.session_status)
        this.interval = setInterval(()=>{this.doWork()}, this.tick)
        
    }

    log(text){
        console.log("%s-%s: %s",this.guildId,this.channelId,text)
    }

    doWork(){
        if (this.halting)
            return

        var count_in_min = Math.floor(this.count / this.tick_frequency)
        if (count_in_min == this.work && this.sessions_remaining > 1 && this.mode == 1)
        {
            this.pomodoro_counter++
            this.session_time = this.dateCreator(this.shortBreak)
            this.session_status = "Short break session is in progress!"
            this.log(this.session_status)
            this.channel.send(`Work session ended! Short Break starts now!!\n${this.getStatus()}`)
            this.sessions_remaining--
            this.mode = 2
            this.count = 0 
        }else if (count_in_min == this.work && this.sessions_remaining == 1 && this.mode == 1){
            this.pomodoro_counter++
            this.session_time = this.dateCreator(this.longBreak)
            this.session_status = "Long break session is in progress!"
            this.log(this.session_status)
            this.channel.send(`Work session ended! Long Break starts now!!\n${this.getStatus()}`)
            this.sessions_remaining = this.sessions
            this.mode = 3
            this.count = 0 
        } else if (count_in_min == this.shortBreak && this.mode == 2 ) {
            this.halting = true
            const StartNextButton = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                    .setCustomId('StartNextPomodoro')
                    .setLabel('Start')
                    .setStyle('SUCCESS')
                );  
        
            this.channel.send({ content: 'Start the next pomodoro!', components: [StartNextButton] });

        } else if (count_in_min == this.longBreak && this.mode == 3) {
            this.halting = true
            const StartNextButton = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                    .setCustomId('StartNextPomodoro')
                    .setLabel('Start')
                    .setStyle('SUCCESS')
                );  
        
            this.channel.send({ content: 'Start the next pomodoro!', components: [StartNextButton] });

        }
        this.count++;
    }

    stop(){
        this.log("PomPom has stopped")
        clearInterval(this.interval)
    }

    startNextPomodoroButton(){
        if (this.mode === 2){
            this.session_time = this.dateCreator(this.work)
            this.session_status = "Work session is in progress!"
            this.log(this.session_status)
            this.channel.send(`Short break session ended! Work starts now!!\n${this.getStatus()}`)
            this.mode = 1
            this.count = 0 
            this.halting = false
        }else if (this.mode === 3){
            this.session_time = this.dateCreator(this.work)
            this.session_status = "Work session is in progress!"
            this.log(this.session_status)
            this.channel.send(`Long break session ended! Work starts now!!\n\n${this.getStatus()}`)
            this.mode = 1
            this.count = 0 
            this.halting = false
        }
    }
}

module.exports = Pomo;
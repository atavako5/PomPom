var Logger = require('./logger');
const dotenv = require('dotenv');

dotenv.config();

const { MessageActionRow, MessageButton } = require('discord.js');

class Pomo {
    constructor(channelId,
        work,
        short_break,
        long_break,
        sessions,
        channel,
        pausable,
        User,
        paused = false, 
        paused_time = null,
        paused_tick = 0,
        stopped = false,
        session_status = null,
        session_time = null,
        pomodoro_counter = 0,
        total_pomodoros = 0,
        interval = null,
        tick = 1000,
        count_in_min = 0,
        session_time_raw = 0,
        sessions_remaining = 0,
        mode = 1,
        count = 0
        ) {
        // guild and channel
        this.channelId = channelId;
        this.work = work;
        this.short_break = short_break;
        this.long_break = long_break;
        this.sessions = sessions;

        // current channel
        this.channel = channel

        //pause stuff
        this.pausable = pausable
        this.paused = paused
        this.paused_time = paused_time
        this.paused_tick = paused_tick

        //stopped
        this.stopped = stopped

        //counters and status
        this.session_status = session_status
        this.session_time = session_time
        this.pomodoro_counter = pomodoro_counter
        this.total_pomodoros = total_pomodoros

        //time related
        this.interval = interval
        this.tick = tick
        this.count_in_min = count_in_min
        this.session_time_raw = session_time_raw
        this.tick_frequency = process.env.TICK_FREQUENCY || 60

        //DB stuff
        this.User = User
        this.MyUser = null


        // session
        if (sessions_remaining == 0){
            this.sessions_remaining = this.sessions
        }else{
            this.sessions_remaining = sessions_remaining
        }
        
        this.mode = mode
        this.count = count
        
        // logger
        this.logger = new Logger().getInstance()

        // process
        this.myProcess()

    }

    async exitHandler(evtOrExitCodeOrError) {
        try {
            await this.updateDB(false,true)
            
        } catch (e) {
            console.error('EXIT HANDLER ERROR', e);
        }
        process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
        
    }

    myProcess(){
   
        [
        'beforeExit', 'uncaughtException', 'unhandledRejection', 
        'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 
        'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 
        'SIGUSR2', 'SIGTERM', 
        ].forEach(evt => process.on(evt, (evt)=> {this.exitHandler(evt)}));
    
    }

    dateCreator(session_time){
        var dateObj =  Date.now()
        this.session_time_raw = session_time
        dateObj += session_time*this.tick*this.tick_frequency;
        return new Date(dateObj)
     }

    timeSubtractor(){
        var now
        if (this.paused || this.stopped){
            now = this.paused_time
        }else{
            now = new Date();
        }
        
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
        var currentOrPaused

        if (this.paused){
            currentOrPaused = ">>PAUSED<<"
        }else{
            currentOrPaused = ">>RUNNING<<"  
        }

        let statusString = `
Current Status: ${this.session_status}
Time remaining in the ${currentOrPaused} session is: ${this.timeSubtractor()}
You have done ${this.pomodoro_counter} in this session and
this channel has completed ${this.total_pomodoros} pomodoros so far!
sessions remaining until long break: ${this.sessions_remaining}
`

        this.log("got status update!")
        return statusString;
    }

    async updateDB(increment = false,exiting = false){
        if (exiting){
            this.pause(false)
        }
        this.MyUser.work = this.work
        this.MyUser.short_break = this.short_break
        this.MyUser.long_break = this.long_break
        this.MyUser.sessions = this.sessions
        this.MyUser.pausable = this.pausable
        this.MyUser.paused = this.paused
        this.MyUser.paused_tick = this.paused_tick
        this.MyUser.stopped = this.stopped
        this.MyUser.session_status = this.session_status
        this.MyUser.session_time = this.session_time
        this.MyUser.pomodoro_counter = this.pomodoro_counter
        if (increment === true){
            
            this.MyUser.total_pomodoros += 1
            this.log("Total Pomodoros: " + this.MyUser.total_pomodoros )
        }
        this.MyUser.tick = this.tick
        this.MyUser.count_in_min = this.count_in_min
        this.MyUser.session_time_raw = this.session_time_raw
        this.MyUser.sessions_remaining = this.sessions_remaining
        this.MyUser.mode = this.mode
        this.MyUser.count = this.count

        this.total_pomodoros = this.MyUser.total_pomodoros

        this.log("Saving User");
        await this.MyUser.save()
        this.log("User Saved");

    }

    start()
    {   
        this.stopped = false
        this.session_status = "Work session is in progress!"
        this.session_time =  this.dateCreator(this.work)
        this.log(this.session_status)
        this.interval = setInterval(()=>{this.doWork()}, this.tick)

        var myobj = { _id: this.channelId, total_pomodoros: 0 };
        this.User.findById(this.channelId, (err,user) => {
            if (err || !user){
                this.MyUser = new this.User(myobj)
                this.MyUser.save((err) => {
                    if (!err){
                        this.log("User saved in to DB")
                    }else{
                        this.log(err)
                    }
                    
                })
            }else{
                this.MyUser = user
                this.total_pomodoros = this.MyUser.total_pomodoros
                this.log("User already exists in the DB!")
            }
        })
    }

    log(text){
       
        var text = `${this.channelId}>> ${text}`
        this.logger.info(text)
    }

    doWork(){
        try{
            this.count_in_min = Math.floor(this.count / this.tick_frequency)
           console.log(this.count_in_min, this.sessions_remaining,this.mode,this.session_time )
            if (this.count_in_min == this.work && this.sessions_remaining > 1 && this.mode == 1)
            {
                this.pomodoro_counter++
                console.log(this.session_time,this.short_break, this.dateCreator(this.short_break))
                this.session_time = this.dateCreator(this.short_break)
                this.session_status = "Short break session is in progress!"
                this.log(this.session_status)
                this.channel.send(`Work session ended! Short Break starts now!!\n${this.getStatus()}`)
                this.sessions_remaining--
                this.mode = 2
                this.count = 0 
            }else if (this.count_in_min == this.work && this.sessions_remaining === 1 && this.mode == 1){
                this.pomodoro_counter++
                this.session_time = this.dateCreator(this.long_break)
                this.session_status = "Long break session is in progress!"
                this.log(this.session_status)
                this.channel.send(`Work session ended! Long Break starts now!!\n${this.getStatus()}`)
                this.sessions_remaining = this.sessions
                this.mode = 3
                this.count = 0 
            } else if (this.count_in_min == this.short_break && this.mode == 2 ) {


                const StartNextButton = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                        .setCustomId('StartNextPomodoro')
                        .setLabel('Start')
                        .setStyle('SUCCESS')
                    );  
                this.paused = true
                this.session_time = Date.now()
                this.paused_time = Date.now()
                this.channel.send({ content: 'Start the next pomodoro!', components: [StartNextButton] });
                clearInterval(this.interval)
                this.updateDB(true)
            } else if (this.count_in_min == this.long_break && this.mode == 3) {
                const StartNextButton = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                        .setCustomId('StartNextPomodoro')
                        .setLabel('Start')
                        .setStyle('SUCCESS')
                    );  
                this.paused = true
                this.session_time = Date.now()
                this.paused_time = Date.now()
                this.channel.send({ content: 'Start the next pomodoro!', components: [StartNextButton] });
                clearInterval(this.interval)
                this.updateDB(true)
            }
            this.count++;
        } catch(e){
            this.log(e)
        }

    }

    stop(){
        this.log("PomPom has stopped")
        clearInterval(this.interval)
        this.stopped = true
    }

    pause(save = true){
        this.paused_time = Date.now()
        this.paused = true
        this.paused_tick = this.count_in_min
        clearInterval(this.interval)
        if (save)
            this.updateDB()
        this.log("PomPom is paused")
    }

    unpause(save = true){
        this.paused = false
        this.session_time = this.dateCreator(this.session_time_raw - this.paused_tick)
        if (save)
            this.updateDB()
        this.interval = setInterval(()=>{this.doWork()}, this.tick)
        this.log("PomPom is unpaused")
    }

    restore(){
        this.User.findById(this.channelId, (err,user) => {
            if (!err && user){
                this.MyUser = user
                this.total_pomodoros = this.MyUser.total_pomodoros
                this.log("User already exists in the DB!")
                
                if (this.stopped === false && this.mode === 1){
                    this.log("User Restored")
                    this.log(this.session_status)
                    this.unpause(false)
                }else if(this.stopped === true){
                    this.session_time = Date.now()
                    this.paused_time = Date.now()
                }else if (this.mode > 1){
                    this.session_time = Date.now()
                    this.paused_time = Date.now()
                }
            }
        })


    }

    startNextPomodoroButton(){
        if (this.mode >= 2){
            clearInterval(this.interval)
            this.session_time = this.dateCreator(this.work)
            this.session_status = "Work session is in progress!"
            this.paused = false
            this.log(this.session_status)

            if (this.mode === 2){
                this.channel.send(`Short break session ended! Work starts now!!\n${this.getStatus()}`)
            }else if (this.mode === 3){
                this.channel.send(`Long break session ended! Work starts now!!\n\n${this.getStatus()}`)
            }

            this.mode = 1
            this.count = 0 
            this.updateDB()
            this.interval = setInterval(()=>{this.doWork()}, this.tick)
            
        }
    }
}

module.exports = Pomo;
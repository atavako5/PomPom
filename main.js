const {Client, Intents,Constants} = require("discord.js")
const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const Pomo = require("./pomo")
process.setMaxListeners(0);
const dotenv = require('dotenv');
dotenv.config();

const wait = require('util').promisify(setTimeout);


var Logger = require('./logger');
var logger = new Logger().getInstance()

const userSchema = require('./userSchema')
const mongoose = require('mongoose');
main().catch(err => logger.info(err));


async function main() {
    await mongoose.connect(process.env.MONGO_URL);
}


const User = mongoose.model('PomPom-User', userSchema);


var Pomos = {}

client.once('ready', async ()=> {
    logger.info("PomPom is ready!");
    const guildId = process.env.GUILD_ID
    const guild = client.guilds.cache.get(guildId)
    let commands
    if (guild){
        logger.info("Built guild commands")
        commands = guild.commands;
    }else{
        logger.info("Built global commands")
        commands = client.application?.commands
    }
    const cursor = User.find({}).cursor();

    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
        var channel = client.channels.cache.get(user._id)
        Pomos[`${user._id}`] = new Pomo(
            user._id,
            user.work,
            user.short_break,
            user.long_break,
            user.sessions,
            channel,
            user.pausable,
            User,
            user.paused,
            user.paused_time,
            user.paused_tick,
            user.stopped,
            user.session_status,
            user.session_time,
            user.pomodoro_counter,
            user.total_pomodoros,
            undefined,
            user.tick,
            user.count_in_min,
            user.session_time_raw,
            user.sessions_remaining,
            user.mode,
            user.count
            )
            Pomos[`${user._id}`].restore()
    }


    commands?.create({
        name: 'status',
        customId:'status',
        description: 'replies with the current status of the pomodoro',
        ephemeral: true
    });

    commands?.create({
        name: 'pause',
        customId:'pause',
        description: 'pauses the current pomodoro (if pausable)',
        ephemeral: false
    });

    commands?.create({
        name: 'unpause',
        customId:'unpause',
        description: 'unpauses the current pomodoro',
        ephemeral: false
    });

    commands?.create({
        name: 'stop',
        customId:'stop',
        description: 'stops the current pomodoro',
        ephemeral: false
    });    

    commands?.create({
        name: 'start',
        customId:'start',
        description: 'starts the pomodoro',
        ephemeral: false,
        options:[
            {
                name: 'work',
                description: 'How long you want to work for (in minutes, default is 25)',
                required: false,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'shortbreak',
                description: 'How long should the short break be (in minutes, default is 5)',
                required: false,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'longbreak',
                description: 'How long should the long breaks be (in minutes, defaults to 3X short break length)',
                required: false,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'sessions',
                description: 'How many short sesssions do you want to go before long break (Default is 4, long break on 4th)',
                required: false,
                type: Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'pausable',
                description: 'Should you be able to pause this pomodor (defaulse to false)',
                required: false,
                type: Constants.ApplicationCommandOptionTypes.BOOLEAN
            },
        ]
    })
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()){
        return
    }

    const {commandName, options} = interaction

    if (commandName === 'start'){
        const work = options.getNumber("work") || 25
        const shortbreak = options.getNumber("shortbreak") || 5
        const longbreak = options.getNumber("longbreak") || 10
        const sessions = options.getNumber("sessions") || 4
        const pausable = options.getBoolean("pausable") || false

        if ( parseInt(work) !== work || parseInt(shortbreak) !== shortbreak || parseInt(longbreak) !== longbreak || parseInt(sessions) !== sessions){
            interaction.reply({
                content: `Pom Pom doesn't like factions, please use whole numbers...`,
                ephemeral: false,
            })
            return
        }
        
        if (work <= 0 || work > 600 ){
            interaction.reply({
                content: `Work can only have values between 1 and 600`,
                ephemeral: false,
            })
            return
        }

        if (shortbreak <= 0 || shortbreak > 180 ){
            interaction.reply({
                content: `ShortBbreak can only have values between 1 and 180`,
                ephemeral: false,
            })
            return
        }

        if (longbreak <= 0 || longbreak > 600 ){
            interaction.reply({
                content: `Shortbreak can only have values between 1 and 600`,
                ephemeral: false,
            })
            return
        }

        if (sessions <= 0 || sessions > 10 ){
            interaction.reply({
                content: `Sessions can only have values between 1 and 10`,
                ephemeral: false,
            })
            return
        }
       
        if (Pomos.hasOwnProperty(`${interaction.channelId}`) === false)
            Pomos[`${interaction.channelId}`] = new Pomo(
                interaction.channelId,
                work,
                shortbreak,
                longbreak,
                sessions,
                interaction.channel,
                pausable,
                User)
        
        Pomos[`${interaction.channelId}`].start()

        interaction.reply({
            content: `Pomodoro Has Started`,
            ephemeral: false,
        })
    } 
    else if (commandName === 'stop'){
        if (Pomos.hasOwnProperty(`${interaction.channelId}`) === false || Pomos[`${interaction.channelId}`].stopped === true){
            interaction.reply({
                content: `You have not started a pomodoro yet, please start a pomodoro by entering /start`,
                ephemeral: true,
            }) 
        }else{
            Pomos[`${interaction.channelId}`].stop()
            delete Pomos[`${interaction.channelId}`]
            interaction.reply({
                content: `Pomodoro Has been canceled`,
                ephemeral: false,
            })

        }

    }
    else if (commandName === 'status'){

        if (Pomos.hasOwnProperty(`${interaction.channelId}`) === true && Pomos[`${interaction.channelId}`].stopped === false){
            interaction.reply({
                content: `${Pomos[`${interaction.channelId}`].getStatus()}`,
                ephemeral: true,
            })
        }else{
            User.findById(interaction.channelId, (err,user)=>{
                if (!err && user){
                    interaction.reply({
                        content: `A pomodoro is not running, try starting one by typing /start\nThis channel has done ${user.total_pomodoros} pomodoros so far!`,
                        ephemeral: true,
                    })
                }else{
                    interaction.reply({
                        content: `A pomodoro is not running, try starting one by typing /start`,
                        ephemeral: true,
                    })
                }
            })

        }

       
    }
    else if (commandName === 'pause'){

        if (Pomos.hasOwnProperty(`${interaction.channelId}`) === true){

            if (Pomos[`${interaction.channelId}`].pausable === true){
                Pomos[`${interaction.channelId}`].pause()
                interaction.reply({
                    content: `You paused the pomodoro`,
                    ephemeral: false,
                })
            }else{
                interaction.reply({
                    content: `Current running pomodoro is not pausable`,
                    ephemeral: true,
                })                
            }
           
        }else{
            interaction.reply({
                content: `A pomodoro is not running, try starting one by typing /start`,
                ephemeral: true,
            })
        } 
    }
    else if (commandName === 'unpause'){

        if (Pomos.hasOwnProperty(`${interaction.channelId}`) === true){

            if (Pomos[`${interaction.channelId}`].paused === true){
                Pomos[`${interaction.channelId}`].unpause()
                interaction.reply({
                    content: `You have unpaused the pomodoro`,
                    ephemeral: false,
                })
            }else{
                interaction.reply({
                    content: `Current running pomodoro is not paused`,
                    ephemeral: true,
                })                
            }
           
        }else{
            interaction.reply({
                content: `A pomodoro is not running, try starting one by typing /start`,
                ephemeral: true,
            })
        } 
    }
})

client.on('interactionCreate', async interaction => {
    if(interaction.customId === "StartNextPomodoro" && Pomos.hasOwnProperty(`${interaction.channelId}`)){
        await interaction.deferReply();
        interaction.editReply("Next pomodoro starts in")
        await wait(1000);
        interaction.editReply("3")
        await wait(1000);
        interaction.editReply("2")
        await wait(1000);
        interaction.editReply("1")
        await wait(1000);
        await interaction.editReply({
            content: `Here we go!`,
            ephemeral: false,
        
        })
    
        Pomos[`${interaction.channelId}`].startNextPomodoroButton()
      }else if (interaction.customId === "StartNextPomodoro") {
        interaction.reply({
            content: `Something went wrong, can't find your session, please start a new pomodoro session by using /start`,
            ephemeral: false,
        
        })
    
        logger.info(`Could not find pomodoro sesssion for ${interaction.channelId}`)
      }
});

client.login(process.env.TOKEN)
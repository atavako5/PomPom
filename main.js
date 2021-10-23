const {Client, Intents,Constants} = require("discord.js")
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const Pomo = require("./pomo")
const dotenv = require('dotenv');
const wait = require('util').promisify(setTimeout);
dotenv.config();

var Pomos = {}

client.once('ready', ()=> {
    console.log("PomPom is ready!");
    const guildId = process.env.GUILD_ID
    const guild = client.guilds.cache.get(guildId)
    let commands

    if (guild){
        console.log("building guild commands")
        commands = guild.commands;
    }else{
        console.log("building global commands")
        commands = client.application?.commands
    }

    commands?.create({
        name: 'status',
        description: 'replies with the current status of the pomodoro',
        ephemeral: false
    });

    commands?.create({
        name: 'stop',
        description: 'stops the current pomodoro',
        ephemeral: false
    });    

    commands?.create({
        name: 'start',
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
            }
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

        Pomos[`${interaction.guildId} ${interaction.channelId}`] = new Pomo(interaction.guildId,interaction.channelId,work,shortbreak,longbreak,sessions,interaction.channel)
        
        Pomos[`${interaction.guildId} ${interaction.channelId}`].start()

        interaction.reply({
            content: `Pomodoro Has Started`,
            ephemeral: false,
        })
    } 
    else if (commandName === 'stop'){
        Pomos[`${interaction.guildId} ${interaction.channelId}`].stop()
        delete Pomos[`${interaction.guildId} ${interaction.channelId}`]
        interaction.reply({
            content: `Pomodoro Has been canceled`,
            ephemeral: false,
        })
        interaction.channel.send()
    }
    else if (commandName === 'status'){

        if (Pomos.hasOwnProperty(`${interaction.guildId} ${interaction.channelId}`) === true){
            interaction.reply({
                content: `${Pomos[`${interaction.guildId} ${interaction.channelId}`].getStatus()}`,
                ephemeral: false,
            })
        }else{
            interaction.reply({
                content: `A pomodoro is not running, try starting one by typing /start`,
                ephemeral: false,
            })
        }

       
    }
})

client.on('interactionCreate', async interaction => {
    if(interaction.customId === "StartNextPomodoro"){
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
        Pomos[`${interaction.guildId} ${interaction.channelId}`].startNextPomodoroButton()
        console.log("%s-%s: %s",interaction.guild,interaction.channelId,"Next Pomodoro button was pressed!")
      }
});

client.login(process.env.TOKEN)
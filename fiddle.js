const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const token = "OTAwODU2ODE4MDg2MDY4Mjg2.YXHaSg.3IqBBxMTzv7kDq5XkYO7ocyaAzM";
const clientId = "900856818086068286";
const guildId = "900863774855139378";
    
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
    })
    .then((commands)=>rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }))
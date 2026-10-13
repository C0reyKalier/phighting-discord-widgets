const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const data = new SlashCommandBuilder()
    .setName('widget')
    .setDescription('Manage widgets-related commands');

const subcommands = new Map();

const subcommandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of subcommandFiles) {
    const filePath = path.join(__dirname, file);
    const subcommand = require(filePath);

    if ('data' in subcommand && 'execute' in subcommand) {
        data.addSubcommand(subcommand.data);
        subcommands.set(subcommand.data.name, subcommand.execute);
    } else {
        console.log(`[WARNING] The subcommand at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

module.exports = {
    data,
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const executeSubcommand = subcommands.get(subcommandName);

        if (!executeSubcommand) {
            return interaction.reply({ content: 'No matching subcommand was found.', ephemeral: true });
        }

        try {
            await executeSubcommand(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error while executing this subcommand!', 
                ephemeral: true 
            });
        }
    },
};
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Manage statistics');

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

const groupFolders = fs.readdirSync(__dirname, { withFileTypes: true }).filter(entry => entry.isDirectory());

for (const folder of groupFolders) {
    const groupPath = path.join(__dirname, folder.name);
    const indexPath = path.join(groupPath, 'index.js');

    if (!fs.existsSync(indexPath)) continue;

    const groupCommand = require(indexPath);
    if (!(groupCommand.data instanceof SlashCommandSubcommandGroupBuilder)) {
        console.log(`[WARNING] The command group at ${indexPath} is missing a valid subcommand group "data" property.`);
        continue;
    }

    const existingNames = new Set(groupCommand.data.toJSON().options.map(option => option.name));
    const groupFiles = fs.readdirSync(groupPath).filter(file => file.endsWith('.js') && file !== 'index.js');

    for (const file of groupFiles) {
        const filePath = path.join(groupPath, file);
        const subcommand = require(filePath);

        if ('data' in subcommand && 'execute' in subcommand) {
            if (!existingNames.has(subcommand.data.name)) {
                groupCommand.data.addSubcommand(subcommand.data);
                existingNames.add(subcommand.data.name);
            }
            subcommands.set(`${folder.name}.${subcommand.data.name}`, subcommand.execute);
        } else {
            console.log(`[WARNING] The subcommand at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    data.addSubcommandGroup(groupCommand.data);
}

module.exports = {
    data,
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const groupName = interaction.options.getSubcommandGroup(false);
        const executeSubcommand = subcommands.get(groupName ? `${groupName}.${subcommandName}` : subcommandName);

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
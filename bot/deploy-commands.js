const {
    REST,
    Routes,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
} = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

function addNestedCommands(parentData, directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const indexPath = path.join(directory, 'index.js');
    let nestedGroup = null;

    if (fs.existsSync(indexPath)) {
        const indexCommand = require(indexPath);
        if (indexCommand.data instanceof SlashCommandSubcommandGroupBuilder) {
            parentData.addSubcommandGroup(indexCommand.data);
            nestedGroup = indexCommand.data;
        } else if (indexCommand.data instanceof SlashCommandSubcommandBuilder) {
            parentData.addSubcommand(indexCommand.data);
        }
    }

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            addNestedCommands(nestedGroup || parentData, entryPath);
        } else if (entry.name.endsWith('.js') && entry.name !== 'index.js') {
            const nestedCommand = require(entryPath);
            if (nestedCommand.data instanceof SlashCommandSubcommandBuilder) {
                (nestedGroup || parentData).addSubcommand(nestedCommand.data);
            } else if (nestedCommand.data instanceof SlashCommandSubcommandGroupBuilder) {
                parentData.addSubcommandGroup(nestedCommand.data);
            }
        }
    }
}

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const entries = fs.readdirSync(commandsPath, { withFileTypes: true });
    const commandFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));
    let parentCommand = null;

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file.name);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            if (command.data instanceof SlashCommandBuilder) {
                commands.push(command.data.toJSON());
                if (!parentCommand || command.data.name === folder) {
                    parentCommand = command.data;
                }
            } else {
                console.log(`[INFO] Skipping subcommand file: ${file.name} (Handled by parent command)`);
            }
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    if (parentCommand) {
        for (const entry of entries) {
            if (entry.isDirectory()) {
                addNestedCommands(parentCommand, path.join(commandsPath, entry.name));
            }
        }
        const parentIndexPath = path.join(commandsPath, 'index.js');
        if (fs.existsSync(parentIndexPath) && !commandFiles.some((file) => file.name === 'index.js')) {
            addNestedCommands(parentCommand, commandsPath);
        }
    }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID), 
            { body: commands }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
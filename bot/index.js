const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, 'assets.env') });
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

if (process.env.VERBOSE === 'TRUE') {
    const logsPath = path.join(__dirname, 'logs');
    fs.mkdirSync(logsPath, { recursive: true });
    const logFile = path.join(logsPath, `${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

    for (const method of ['log', 'info', 'warn', 'error']) {
        const original = console[method];
        console[method] = (...args) => {
            const timestamp = new Date().toISOString();
            const message = args.map(arg => arg instanceof Error ? `${arg.stack || arg.message}` : typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
            fs.appendFileSync(logFile, `[${timestamp}] [${method.toUpperCase()}] ${message}\n`);
            original(...args);
        };
    }
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.BOT_TOKEN);
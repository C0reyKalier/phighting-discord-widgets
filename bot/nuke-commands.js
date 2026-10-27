const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(process.env.APPLICATION_ID),
			{ body: [] },
		);
		await rest.put(
			Routes.applicationGuildCommands(
				process.env.APPLICATION_ID,
				process.env.GUILD_ID,
			),
			{ body: [] },
		);

		console.log('Removed all global and guild Discord commands.');
	} catch (error) {
		console.error(error);
	}
})();

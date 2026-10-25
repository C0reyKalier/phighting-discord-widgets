const { SlashCommandSubcommandGroupBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const data = new SlashCommandSubcommandGroupBuilder()
	.setName('batchedit')
	.setDescription('Edit multiple statistics');

const subcommands = new Map();

const subcommandFiles = fs.readdirSync(__dirname)
	.filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of subcommandFiles) {
	const filePath = path.join(__dirname, file);
	const subcommand = require(filePath);

	if (subcommand.data && typeof subcommand.execute === 'function') {
		subcommands.set(subcommand.data.name, subcommand.execute);
	} else {
		console.warn(`[WARNING] The subcommand at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

module.exports = {
	data,
	async execute(interaction) {
		const subcommandName = interaction.options.getSubcommand();
		const executeSubcommand = subcommands.get(subcommandName);

		if (!executeSubcommand) {
			return interaction.reply({
				content: 'No matching subcommand was found.',
				ephemeral: true,
			});
		}

		await executeSubcommand(interaction);
	},
};

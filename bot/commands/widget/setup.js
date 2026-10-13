const { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('setup')
		.setDescription('Perform first time setup for the widget'),

	async execute(interaction) {
		const targetUser = interaction.user;
		const oauthLink = `https://discord.com/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&response_type=token&redirect_uri=https%3A%2F%2Fdiscord.com&scope=openid+sdk.social_layer`;

		const actionRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel('Authorize Widget Application')
				.setStyle(ButtonStyle.Link)
				.setURL(oauthLink),
		);

		return interaction.reply({
			content: `ℹ️ **Note:** This command only serves as a first-time setup.\n\nPlease click the button below to authorize the widget application for **${targetUser.username}**.`,
			components: [actionRow],
			ephemeral: true,
		});
	},
};

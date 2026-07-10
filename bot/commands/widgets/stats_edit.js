const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: 'assets.env' });

const data = new SlashCommandBuilder()
	.setName('stats_edit')
	.setDescription('Edit your player stats data');

async function execute(interaction) {
	await interaction.deferReply({ ephemeral: true });

	const discordId = interaction.user.id;

	try {
		const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
		const db = new Database(dbPath);

		let userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);

		if (!userData) {
			// Create new entry for user if it doesn't exist
			try {
				db.prepare('INSERT INTO user_data (discord_id) VALUES (?)').run(discordId);
				userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);
			} catch (error) {
				db.close();
				console.error('Database Insert Error:', error);
				return interaction.editReply('Failed to create user data entry. Please contact an administrator.');
			}
		}

		db.close();

		// Create select menu for stats selection
		const statOptions = [
			new StringSelectMenuOptionBuilder()
				.setLabel('Maining')
				.setValue('maining')
				.setDescription('Phighters you main'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Level')
				.setValue('level')
				.setDescription('Your current in-game level'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Honorary Title')
				.setValue('honorary_title')
				.setDescription('Your Title'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Scrimming Status')
				.setValue('scrimming_status')
				.setDescription('Your scrimming status'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Best K/D/A')
				.setValue('best_kda')
				.setDescription('Your best K/D/A ratio'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Best Damage')
				.setValue('best_dmg')
				.setDescription('Your best damage dealt'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Best Heals')
				.setValue('best_heals')
				.setDescription('Your best healing done'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Hours Played')
				.setValue('hours_played')
				.setDescription('Total hours played'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Daily Streak')
				.setValue('best_dailystreak')
				.setDescription('Your longest daily streak'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Brokercoins Donated')
				.setValue('brokercoins_donated')
				.setDescription('Brokercoins donated'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Best Win Streak')
				.setValue('best_winstreak')
				.setDescription('Your longest win streak'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Total Kills')
				.setValue('total_kills')
				.setDescription('Total kills'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Total Deaths')
				.setValue('total_deaths')
				.setDescription('Total deaths'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Total Assists')
				.setValue('total_assists')
				.setDescription('Total assists'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Win Rate')
				.setValue('winrate')
				.setDescription('Your win rate percentage'),
		];

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('select_stat')
			.setPlaceholder('Select a stat to edit')
			.addOptions(statOptions)
			.setMaxValues(1);

		const actionRow = new ActionRowBuilder().addComponents(selectMenu);

		await interaction.editReply({
			content: 'Select which stat you would like to edit:',
			components: [actionRow]
		});

		// Wait for menu selection
		const menuInteraction = await interaction.channel.awaitMessageComponent({
			filter: i => i.user.id === discordId && i.customId === 'select_stat',
			time: 60000
		});

		const selectedStat = menuInteraction.values[0];

		// Create modal for editing
		const modal = new ModalBuilder()
			.setCustomId('edit_stat_modal')
			.setTitle('Edit Stat');

		const textInput = new TextInputBuilder()
			.setCustomId('stat_value')
			.setLabel(`Enter new value for ${selectedStat}`)
			.setStyle(TextInputStyle.Short)
			.setPlaceholder(`Current value: ${userData[selectedStat] || 'N/A'}`)
			.setRequired(true);

		const modalActionRow = new ActionRowBuilder().addComponents(textInput);
		modal.addComponents(modalActionRow);

		await menuInteraction.showModal(modal);

		// Wait for modal submission, timeout after 5 minutes
		const modalSubmission = await interaction.awaitModalSubmit({
			filter: i => i.user.id === discordId && i.customId === 'edit_stat_modal',
			time: 300000
		});

		const newValue = modalSubmission.fields.getTextInputValue('stat_value');

		// Update database
		const dbUpdate = new Database(dbPath);
		try {
			const updateQuery = `UPDATE user_data SET ${selectedStat} = ? WHERE discord_id = ?`;
			dbUpdate.prepare(updateQuery).run(newValue, discordId);
			dbUpdate.close();

			await modalSubmission.deferReply({ ephemeral: true });
			await modalSubmission.editReply({
				content: `Successfully updated **${selectedStat}** to \`${newValue}\``,
				ephemeral: true
			});
		} catch (error) {
			dbUpdate.close();
			console.error('Database Update Error:', error);
			await modalSubmission.deferReply({ ephemeral: true });
			await modalSubmission.editReply({
				content: `Failed to update stat. Error: \`${error.message}\``,
				ephemeral: true
			});
		}

	} catch (error) {
		if (error.code === 'InteractionCollectorError') {
			await interaction.editReply({
				content: 'Selection timed out. Please try again.',
				components: []
			});
			return;
		}
		console.error('Stats Edit Error:', error);
		await interaction.editReply(`An error occurred: \`${error.message}\``);
	}
}

module.exports = { data, execute };

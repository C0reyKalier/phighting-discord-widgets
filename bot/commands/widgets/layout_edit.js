const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: 'assets.env' });

const data = new SlashCommandBuilder()
	.setName('layout_edit')
	.setDescription('Configure your widget layout and stats display');

async function execute(interaction) {
	const discordId = interaction.user.id;

	try {
		// Create select menu for slot selection
		const slotOptions = [
			new StringSelectMenuOptionBuilder()
				.setLabel('Phighter Header')
				.setValue('header'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 1')
				.setValue('1'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 2')
				.setValue('2'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 3')
				.setValue('3'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 4')
				.setValue('4'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 5')
				.setValue('5'),
			new StringSelectMenuOptionBuilder()
				.setLabel('Slot 6')
				.setValue('6')
		];

		const slotSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('select_slot_number')
			.setPlaceholder('Select a slot')
			.addOptions(slotOptions)
			.setMaxValues(1);

		const slotActionRow = new ActionRowBuilder().addComponents(slotSelectMenu);

		// Show select menu to choose slot
		await interaction.reply({
			content: 'Select which slot you would like to configure:',
			components: [slotActionRow],
			ephemeral: true
		});

		// Wait for slot selection
		const slotSelection = await interaction.channel.awaitMessageComponent({
			filter: i => i.user.id === discordId && i.customId === 'select_slot_number',
			time: 60000
		});

		const slotValue = slotSelection.values[0];
		const isHeader = slotValue === 'header';

		if (isHeader) {
			// Phighter header selection
			const phighterOptions = [
				new StringSelectMenuOptionBuilder()
					.setLabel('Sword')
					.setValue('Sword'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Skateboard')
					.setValue('Skateboard'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Biograft')
					.setValue('Biograft'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Katana')
					.setValue('Katana'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Ban Hammer')
					.setValue('Ban Hammer'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Rocket')
					.setValue('Rocket'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Slingshot')
					.setValue('Slingshot'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Hyperlaser')
					.setValue('Hyperlaser'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Shuriken')
					.setValue('Shuriken'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Scythe')
					.setValue('Scythe'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Medkit')
					.setValue('Medkit'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Boombox')
					.setValue('Boombox'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Subspace')
					.setValue('Subspace'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Vine Staff')
					.setValue('Vine Staff'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Coil')
					.setValue('Coil')
			];

			const phighterSelectMenu = new StringSelectMenuBuilder()
				.setCustomId('select_phighter_header')
				.setPlaceholder('Select a phighter for the hero image of the widget')
				.addOptions(phighterOptions)
				.setMaxValues(1);

			const phighterActionRow = new ActionRowBuilder().addComponents(phighterSelectMenu);

			await slotSelection.update({
				content: 'Select a phighter to display in the header:',
				components: [phighterActionRow],
				ephemeral: true
			});

			// Wait for phighter selection
			const phighterSelection = await interaction.channel.awaitMessageComponent({
				filter: i => i.user.id === discordId && i.customId === 'select_phighter_header',
				time: 60000
			}).catch(() => null);

			if (!phighterSelection) {
				return;
			}

			const selectedPhighter = phighterSelection.values[0];

			// Update database
			const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
			const db = new Database(dbPath);

			try {
				const updateQuery = `UPDATE user_data SET phighter_header = ? WHERE discord_id = ?`;
				const result = db.prepare(updateQuery).run(selectedPhighter, discordId);

				if (result.changes === 0) {
					// If no rows were updated, insert a new row
					db.prepare(`INSERT INTO user_data (discord_id, phighter_header) VALUES (?, ?)`).run(discordId, selectedPhighter);
				}

				db.close();

				await phighterSelection.reply({
					content: `Successfully set header to display **${selectedPhighter}**`,
					ephemeral: true
				});
			} catch (error) {
				db.close();
				console.error('Database Update Error:', error);
				await phighterSelection.deferUpdate();
				await phighterSelection.followUp({
					content: `Failed to update layout. Error: \`${error.message}\``,
					ephemeral: true
				});
			}
		} else {
			// Stats slot selection
			const slotNum = parseInt(slotValue);

			// Create modal with stat selection menu
			const statOptions = [
				new StringSelectMenuOptionBuilder()
					.setLabel('Maining')
					.setValue('maining')
					.setDescription('Phighters you currently main'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Best K/D/A')
					.setValue('best_kda')
					.setDescription('Your best Kill/Death/Assist ratio'),
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
					.setLabel('Best Phestival Title')
					.setValue('best_phestival_title')
					.setDescription('Your highest phestival title'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Win Rate')
					.setValue('winrate')
					.setDescription('Your win rate percentage'),
			];

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('select_stat_for_slot')
				.setPlaceholder('Select a stat for this slot')
				.addOptions(statOptions)
				.setMaxValues(1);

			const selectActionRow = new ActionRowBuilder().addComponents(selectMenu);

			await slotSelection.update({
				content: 'Select a stat to display in this slot:',
				components: [selectActionRow],
				ephemeral: true
			});

			// Wait for stat selection
			const statSelection = await interaction.channel.awaitMessageComponent({
				filter: i => i.user.id === discordId && i.customId === 'select_stat_for_slot',
				time: 60000
			}).catch(() => null);

			if (!statSelection) {
				return;
			}

			const selectedStat = statSelection.values[0];

			// Update database
			const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
			const db = new Database(dbPath);

			try {
				const updateQuery = `UPDATE widget_layout SET stats_${slotNum} = ? WHERE discord_id = ?`;
				const result = db.prepare(updateQuery).run(selectedStat, discordId);

				if (result.changes === 0) {
					// If no rows were updated, insert a new row
					db.prepare(`INSERT INTO widget_layout (discord_id, stats_${slotNum}) VALUES (?, ?)`).run(discordId, selectedStat);
				}

				db.close();

				await statSelection.reply({
					content: `Successfully set slot ${slotNum} to display **${selectedStat}**`,
					ephemeral: true
				});
			} catch (error) {
				db.close();
				console.error('Database Update Error:', error);
				await statSelection.deferUpdate();
				await statSelection.followUp({
					content: `Failed to update layout. Error: \`${error.message}\``,
					ephemeral: true
				});
			}
		}

	} catch (error) {
		if (error.code === 'InteractionCollectorError') {
			console.log('Interaction collector timed out');
			return;
		}
		console.error('Layout Edit Error:', error);
		await interaction.reply({
			content: `An error occurred: \`${error.message}\``,
			ephemeral: true
		});
	}
}

module.exports = { data, execute };

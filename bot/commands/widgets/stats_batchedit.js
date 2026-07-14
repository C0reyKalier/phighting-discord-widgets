const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: 'assets.env' });

const data = new SlashCommandBuilder()
	.setName('exp_stats')
	.setDescription('Batch edit and update multiple player stats to the database')
	.addSubcommand((subcommand) =>
		subcommand
			.setName('batch_edit')
			.setDescription('Edit multiple stats and save to database')
			.addStringOption(option =>
				option.setName('maining')
					.setDescription('Phighters you main')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('level')
					.setDescription('Your current in-game level')
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName('honorary_title')
					.setDescription('Your title')
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName('scrimming_status')
					.setDescription('Your scrimming status')
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName('best_kda')
					.setDescription('Your best K/D/A ratio')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('best_dmg')
					.setDescription('Your best damage dealt')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('best_heals')
					.setDescription('Your best healing done')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('hours_played')
					.setDescription('Total hours played')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('best_dailystreak')
					.setDescription('Your longest daily streak')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('brokercoins_donated')
					.setDescription('Brokercoins donated')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('best_winstreak')
					.setDescription('Your longest win streak')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('total_kills')
					.setDescription('Total kills')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('total_deaths')
					.setDescription('Total deaths')
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName('total_assists')
					.setDescription('Total assists')
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName('winrate')
					.setDescription('Your win rate percentage')
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName('phighter_header')
					.setDescription('Your favorite Phighter')
					.setRequired(false)
			)
	);

async function execute(interaction) {
	const subcommand = interaction.options.getSubcommand();
	if (subcommand === 'edit') {
		await interaction.deferReply({ ephemeral: true });

		const discordId = interaction.user.id;

		try {
			const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
			const db = new Database(dbPath);

			let userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);

			if (!userData) {
				// Create new entry for user if it doesn't exist
				db.prepare('INSERT INTO user_data (discord_id) VALUES (?)').run(discordId);
				userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);
			}

			// Collect all provided stats
			const statFields = [
				'maining', 'level', 'honorary_title', 'scrimming_status', 'best_kda',
				'best_dmg', 'best_heals', 'hours_played', 'best_dailystreak', 'brokercoins_donated',
				'best_winstreak', 'total_kills', 'total_deaths', 'total_assists', 'winrate', 'phighter_header'
			];

			const updates = {};
			let updateCount = 0;

			for (const field of statFields) {
				let value;
				if (field === 'level' || field === 'best_dmg' || field === 'best_heals' || 
					field === 'hours_played' || field === 'best_dailystreak' || field === 'brokercoins_donated' ||
					field === 'best_winstreak' || field === 'total_kills' || field === 'total_deaths' || field === 'total_assists') {
					value = interaction.options.getInteger(field);
				} else {
					value = interaction.options.getString(field);
				}

				if (value !== null && value !== undefined && value !== '') {
					updates[field] = value;
					updateCount++;
				}
			}

			if (updateCount === 0) {
				db.close();
				return interaction.editReply('You must provide at least one stat to update.');
			}

			const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
			const values = Object.values(updates);
			values.push(discordId);

			const updateQuery = `UPDATE user_data SET ${setClause} WHERE discord_id = ?`;
			db.prepare(updateQuery).run(...values);

			// Fetch updated user data
			const updatedUserData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);
			db.close();

			// Create preview embed
			const previewEmbed = new EmbedBuilder()
				.setTitle('Stats Updated Successfully')
				.setDescription(`Successfully updated **${updateCount}** stat(s) to the database.`)
				.addFields(
					{
						name: 'Updated Fields',
						value: Object.keys(updates).map(key => `• ${key}: \`${updates[key]}\``).join('\n'),
						inline: false
					},
					{
						name: 'Current Profile Data',
						value: [
							`**Level**: ${updatedUserData.level || 'N/A'}`,
							`**Honorary Title**: ${updatedUserData.honorary_title || 'N/A'}`,
							`**Hours Played**: ${updatedUserData.hours_played || 'N/A'}`,
							`**Scrimming Status**: ${updatedUserData.scrimming_status || 'N/A'}`,
							`**Best K/D/A**: ${updatedUserData.best_kda || 'N/A'}`,
							`**Best Damage**: ${updatedUserData.best_dmg || 'N/A'}`,
							`**Best Heals**: ${updatedUserData.best_heals || 'N/A'}`,
							`**Total Kills**: ${updatedUserData.total_kills || 'N/A'}`,
							`**Total Deaths**: ${updatedUserData.total_deaths || 'N/A'}`,
							`**Total Assists**: ${updatedUserData.total_assists || 'N/A'}`,
							`**Best Win Streak**: ${updatedUserData.best_winstreak || 'N/A'}`,
							`**Best Daily Streak**: ${updatedUserData.best_dailystreak || 'N/A'}`,
							`**Brokercoins Donated**: ${updatedUserData.brokercoins_donated || 'N/A'}`,
							`**Win Rate**: ${updatedUserData.winrate || 'N/A'}`,
						].join('\n'),
						inline: false
					}
				)
				.setColor('#00b0f4')
				.setFooter({
					text: 'PHIGHTING! x Discord Widget Integration',
				})
				.setTimestamp();

			await interaction.editReply({ embeds: [previewEmbed] });

		} catch (error) {
			console.error('Batch Stats Edit Error:', error);
			await interaction.editReply(`Failed to update stats. Error: \`${error.message}\``);
		}
	}
}

module.exports = { data, execute };

const {SlashCommandSubcommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, LabelBuilder, RadioGroupBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const path = require('node:path');
const Database = require('better-sqlite3');
const VERBOSE = String(process.env.VERBOSE).toLowerCase() === 'true';
const databaseOptions = { verbose: VERBOSE ? console.log : undefined };

const PHIGHTERS = [
	'sword', 'rocket', 'medkit', 'skateboard', 'slingshot', 'boombox', 'biograft', 'hyperlaser',
	'subspace', 'katana', 'shuriken', 'vine_staff', 'ban_hammer', 'scythe', 'coil'
];

const PHIGHTER_STATS = [
	['Mastery Level', 'mastery_level', 'Your mastery level with this phighter'],
	['Playtime Hours', 'playtime_hours', 'Hours played with this phighter'],
	['Games Played', 'games_played', 'Number of games played with this phighter'],
	['Win Rate', 'win_rate', 'Enter a percentage from 0 to 100'],
	['Wins', 'wins', 'Total wins with this phighter'],
	['Kills', 'kills', 'Total kills with this phighter'],
	['Deaths', 'deaths', 'Total deaths with this phighter'],
	['Assists', 'assists', 'Total assists with this phighter'],
	['Damage', 'damage', 'Total damage dealt with this phighter'],
	['Points', 'points', 'Total points earned with this phighter'],
	['Best K/D/A', 'best_kda', 'Your best K/D/A ratio with this phighter'],
	['Best Damage', 'best_dmg', 'Your best damage dealt with this phighter']
];
const HEALER_PHIGHTERS = new Set(['medkit', 'vine_staff', 'coil']);

const STATS = [
	['Maining', 'maining', 'Phighters you main'],
	['Level', 'level', 'Your current in-game level (integer)', 'integer'],
	['Join Date', 'joindate', 'The date you joined (YYYY-MM-DD)', 'date'],
	['Title', 'title', 'Your chosen title'],
	['Competitive Status', 'comp_status', 'Your competitive or mastery status'],
	['Best K/D/A', 'best_kda', 'Your best K/D/A ratio'],
	['Best Damage', 'best_dmg', 'Your best damage dealt'],
	['Best Heals', 'best_heals', 'Your best healing done'],
	['Hours Played', 'total_playtime_hours', 'Total hours played'],
	['Brokercoins Donated', 'brokercoins_donated', 'Brokercoins donated'],
	['Total Kills', 'total_kills', 'Total kills'],
	['Total Deaths', 'total_deaths', 'Total deaths'],
	['Total Assists', 'total_assists', 'Total assists'],
	['Total Wins', 'total_wins', 'Total wins'],
	['Total Damage', 'total_dmg', 'Total damage dealt'],
	['Total Heals', 'total_heals', 'Total healing done'],
	['Win Rate', 'win_rate', 'Enter a percentage from 0 to 100'],
	['Endorsements Received', 'endorsements_recieved', 'Endorsements received'],
	['Endorsements Given', 'endorsements_given', 'Endorsements given']
];

const data = new SlashCommandSubcommandBuilder()
	.setName('edit')
	.setDescription('Edit your player stats data');

async function execute(interaction) {
	const discordId = interaction.user.id;
	const dbPath = path.join(__dirname, '..', '..', 'user_database.db');

	try {
		let userData;
		const db = new Database(dbPath, databaseOptions);
		try {
			userData = db.prepare('SELECT * FROM user_stats WHERE discord_id = ?').get(discordId);
			if (!userData) {
				db.prepare('INSERT INTO user_stats (discord_id) VALUES (?)').run(discordId);
				userData = db.prepare('SELECT * FROM user_stats WHERE discord_id = ?').get(discordId);
			}
		} finally {
			db.close();
		}

		const categoryMenu = new StringSelectMenuBuilder()
			.setCustomId('stats_edit_category')
			.setPlaceholder('Select a stats category')
			.setMaxValues(1)
			.addOptions(
				new StringSelectMenuOptionBuilder().setLabel('General stats').setValue('general'),
				new StringSelectMenuOptionBuilder().setLabel('Phighter-specific stats').setValue('phighter')
			);

		await interaction.reply({
			content: 'Would you like to edit general stats or phighter-specific stats?',
			components: [new ActionRowBuilder().addComponents(categoryMenu)],
			ephemeral: true
		});

		const categoryInteraction = await interaction.channel.awaitMessageComponent({
			filter: component => component.user.id === discordId && component.customId === 'stats_edit_category',
			time: 60000
		});

		let targetTable = 'user_stats';
		let availableStats = STATS;
		let menuInteraction = categoryInteraction;
		if (categoryInteraction.values[0] === 'phighter') {
			const phighterDb = new Database(dbPath, databaseOptions);
			let availablePhighters;
			try {
				const tables = new Set(phighterDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name));
				availablePhighters = PHIGHTERS.filter(phighter => tables.has(`${phighter}_stats`));
			} finally {
				phighterDb.close();
			}
			if (availablePhighters.length === 0) {
				await categoryInteraction.update({ content: 'No phighter-specific stats are available.', components: [] });
				return;
			}
			const phighterMenu = new StringSelectMenuBuilder()
				.setCustomId('stats_edit_phighter')
				.setPlaceholder('Select a phighter')
				.setMaxValues(1)
				.addOptions(availablePhighters.map(phighter => new StringSelectMenuOptionBuilder()
					.setLabel(phighter.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()))
					.setValue(phighter)));
			await categoryInteraction.update({
				content: 'Select the phighter whose stats you would like to edit:',
				components: [new ActionRowBuilder().addComponents(phighterMenu)]
			});
			const phighterInteraction = await interaction.channel.awaitMessageComponent({
				filter: component => component.user.id === discordId && component.customId === 'stats_edit_phighter',
				time: 60000
			});
			targetTable = `${phighterInteraction.values[0]}_stats`;
			const statsDb = new Database(dbPath, databaseOptions);
			try {
				const columns = statsDb.prepare(`PRAGMA table_info("${targetTable}")`).all()
					.filter(column => column.name !== 'discord_id');
				const normalizedColumns = new Map(columns.map(column => [
					column.name.toLowerCase().replace(/[^a-z0-9]/g, ''), column
				]));
				const requestedStats = [
					...PHIGHTER_STATS,
					...(HEALER_PHIGHTERS.has(phighterInteraction.values[0]) ? [
						['Heals', 'heals', 'Total healing done with this phighter'],
						['Best Heals', 'best_heals', 'Your best healing done with this phighter']
					] : [])
				];
				availableStats = requestedStats.map(([label, value, description]) => {
					const column = normalizedColumns.get(value.toLowerCase().replace(/[^a-z0-9]/g, ''));
					return column ? [
						label,
						column.name,
						description,
						/^INTEGER$/i.test(column.type) ? 'integer' : undefined
					] : null;
				}).filter(Boolean);
			} finally {
				statsDb.close();
			}
			menuInteraction = phighterInteraction;
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('stats_edit_select')
			.setPlaceholder('Select a stat to edit')
			.setMaxValues(1)
			.addOptions(availableStats.map(([label, value, description]) =>
				new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(description)
			));
		await menuInteraction.update({
			content: 'Select which stat you would like to edit:',
			components: [new ActionRowBuilder().addComponents(selectMenu)]
		});
		menuInteraction = await interaction.channel.awaitMessageComponent({
			filter: component => component.user.id === discordId && component.customId === 'stats_edit_select',
			time: 60000
		});
		const selectedStat = menuInteraction.values[0];
		const stat = availableStats.find(([, value]) => value === selectedStat);
		if (!stat) {
			await menuInteraction.update({ content: 'That stat is not available.', components: [] });
			return;
		}

		let currentValue = userData[selectedStat] ?? 'N/A';
		if (selectedStat === 'win_rate' && currentValue !== 'N/A') {
			const percentage = Number(currentValue) * 100;
			if (Number.isFinite(percentage)) currentValue = String(Number(percentage.toFixed(2)));
		}
		const modal = new ModalBuilder()
			.setCustomId('stats_edit_modal')
			.setTitle(`Edit ${stat[0]}`)
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('stat_value')
						.setLabel(selectedStat === 'joindate' ? 'Date (YYYY-MM-DD)' : `New value for ${stat[0]}`)
						.setStyle(TextInputStyle.Short)
						.setPlaceholder(selectedStat === 'joindate' ? 'YYYY-MM-DD' : `Current value: ${currentValue}`.slice(0, 100))
						.setRequired(true)
				),
				...(selectedStat === 'total_playtime_hours' || selectedStat === 'playtime_hours' ? [
					new LabelBuilder()
						.setLabel('How accurate is this playtime value?')
						.setRadioGroupComponent(new RadioGroupBuilder()
							.setCustomId('playtime_precision')
							.setRequired(true)
							.addOptions(
								{ label: 'Exact', value: 'exact' },
								{ label: 'Approximate (~)', value: 'approx' },
								{ label: 'More than (+)', value: 'more_than' }
							))
				] : [])
			);
		await menuInteraction.showModal(modal);

		const modalSubmission = await interaction.awaitModalSubmit({
			filter: submitted => submitted.user.id === discordId && submitted.customId === 'stats_edit_modal',
			time: 300000
		});
		const newValue = modalSubmission.fields.getTextInputValue('stat_value').trim();
		let valueToStore = newValue;
		if (selectedStat === 'total_playtime_hours' || selectedStat === 'playtime_hours') {
			const precisionField = modalSubmission.fields.getField('playtime_precision');
			const precision = precisionField.values?.[0] ?? precisionField.value;
			const isApproximate = precision === 'approx';
			const isExact = precision === 'exact';
			const isMoreThan = precision === 'more_than';
			if ((!isExact && !isApproximate && !isMoreThan) || !/^\d+(?:\.\d+)?$/.test(newValue)) {
				await modalSubmission.reply({ content: 'Enter a number of hours and choose exact, approximate, or more than.', ephemeral: true });
				return;
			}
			valueToStore = `${isApproximate ? '~' : ''}${newValue}${isMoreThan ? '+' : ''}`;
		}
		if (stat[3] === 'integer' && !/^\d+$/.test(newValue)) {
			await modalSubmission.reply({ content: 'Level must be a whole number.', ephemeral: true });
			return;
		}
		if (stat[3] === 'date') {
			const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(newValue);
			const date = dateMatch && new Date(`${newValue}T00:00:00Z`);
			if (!date || Number.isNaN(date.getTime()) || date.getUTCFullYear() !== Number(dateMatch[1]) ||
				date.getUTCMonth() + 1 !== Number(dateMatch[2]) || date.getUTCDate() !== Number(dateMatch[3])) {
				await modalSubmission.reply({ content: 'Join date must be a valid date in YYYY-MM-DD format.', ephemeral: true });
				return;
			}
			valueToStore = newValue;
		}
		if (selectedStat === 'win_rate') {
			const percentage = Number(newValue);
			if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
				await modalSubmission.reply({ content: 'Win rate must be a percentage from 0 to 100.', ephemeral: true });
				return;
			}
			valueToStore = String(percentage / 100);
		}
		const updateDb = new Database(dbPath, databaseOptions);
		try {
			const result = updateDb.prepare(`UPDATE "${targetTable}" SET "${selectedStat}" = ? WHERE discord_id = ?`).run(valueToStore, discordId);
			if (result.changes === 0 && targetTable !== 'user_stats') {
				updateDb.prepare(`INSERT INTO "${targetTable}" (discord_id, "${selectedStat}") VALUES (?, ?)`).run(discordId, valueToStore);
			}
		} finally {
			updateDb.close();
		}

		await modalSubmission.reply({
			content: `Successfully updated **${stat[0]}** to \`${selectedStat === 'total_playtime_hours' || selectedStat === 'playtime_hours' ? valueToStore : `${newValue}${selectedStat === 'win_rate' ? '%' : ''}`}\`.`,
			ephemeral: true
		});
	} catch (error) {
		if (error.code === 'InteractionCollectorError') {
			const response = { content: 'Selection timed out. Please try again.', components: [] };
			if (interaction.replied || interaction.deferred) await interaction.editReply(response).catch(() => {});
			else await interaction.reply({ ...response, ephemeral: true }).catch(() => {});
			return;
		}
		console.error('Stats Edit Error:', error);
		const response = { content: 'Unable to update your stats.', components: [] };
		if (interaction.replied || interaction.deferred) await interaction.editReply(response).catch(() => {});
		else await interaction.reply({ ...response, ephemeral: true }).catch(() => {});
	}
}

module.exports = { data, execute };

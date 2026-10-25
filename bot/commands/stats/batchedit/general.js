const {SlashCommandSubcommandBuilder} = require('discord.js');
const path = require('node:path');
const Database = require('better-sqlite3');
const VERBOSE = String(process.env.VERBOSE).toLowerCase() === 'true';
const databaseOptions = { verbose: VERBOSE ? console.log : undefined };

const GENERAL_STATS = [
	['Maining', 'maining', 'string', 'Phighters you main'],
	['Level', 'level', 'integer', 'Your current in-game level'],
	['Join Date', 'joindate', 'string', 'The date you joined (YYYY-MM-DD)'],
	['Title', 'title', 'string', 'Your chosen title'],
	['Competitive Status', 'comp_status', 'string', 'Your competitive or mastery status'],
	['Best K/D/A', 'best_kda', 'string', 'Your best K/D/A ratio'],
	['Best Damage', 'best_dmg', 'integer', 'Your best damage dealt'],
	['Best Heals', 'best_heals', 'integer', 'Your best healing done'],
	['Hours Played', 'total_playtime_hours', 'string', 'Total hours played'],
	['Brokercoins Donated', 'brokercoins_donated', 'integer', 'Brokercoins donated'],
	['Total Kills', 'total_kills', 'integer', 'Total kills'],
	['Total Deaths', 'total_deaths', 'integer', 'Total deaths'],
	['Total Assists', 'total_assists', 'integer', 'Total assists'],
	['Total Wins', 'total_wins', 'integer', 'Total wins'],
	['Total Damage', 'total_dmg', 'integer', 'Total damage dealt'],
	['Total Heals', 'total_heals', 'integer', 'Total healing done'],
	['Win Rate', 'win_rate', 'string', 'Win rate percentage from 0 to 100'],
	['Endorsements Received', 'endorsements_recieved', 'integer', 'Endorsements received'],
	['Endorsements Given', 'endorsements_given', 'integer', 'Endorsements given']
];

const data = GENERAL_STATS.reduce((command, [, key, type, description]) => {
	const addOption = type === 'integer' ? 'addIntegerOption' : 'addStringOption';
	return command[addOption](option => option
		.setName(key)
		.setDescription(description)
		.setRequired(false));
}, new SlashCommandSubcommandBuilder()
	.setName('general')
	.setDescription('Batch edit one or more general stats'));

async function execute(interaction) {
	const dbPath = path.join(__dirname, '..', '..', '..', 'user_database.db');
	let db;

	try {
		db = new Database(dbPath, databaseOptions);
		const columns = new Map(
			db.prepare('PRAGMA table_info(user_stats)').all().map(column => [column.name, column])
		);
		const availableStats = GENERAL_STATS.filter(([, key]) => columns.has(key));
		if (availableStats.length === 0) {
			await interaction.reply({ content: 'No editable general stats are available.', ephemeral: true });
			return;
		}

		const updates = new Map();
		const errors = [];
		for (const [, key, type] of GENERAL_STATS) {
			if (!columns.has(key)) continue;
			const value = type === 'integer'
				? interaction.options.getInteger(key)
				: interaction.options.getString(key);
			if (value === null) continue;

			if (key === 'win_rate') {
				const percentage = Number(value);
				if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
					errors.push('Win rate must be between 0 and 100.');
					continue;
				}
				updates.set(key, String(percentage / 100));
			} else if (key === 'joindate') {
				const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
				const date = dateMatch && new Date(`${value}T00:00:00Z`);
				if (!date || Number.isNaN(date.getTime()) || date.getUTCFullYear() !== Number(dateMatch[1]) ||
					date.getUTCMonth() + 1 !== Number(dateMatch[2]) || date.getUTCDate() !== Number(dateMatch[3])) {
					errors.push('Join date must be a valid date in YYYY-MM-DD format.');
					continue;
				}
				updates.set(key, value);
			} else if (key === 'total_playtime_hours') {
				if (!/^(?:~)?\d+(?:\.\d+)?(?:\+)?$/.test(value)) {
					errors.push('Hours played must be a number, optionally prefixed with ~ or suffixed with +.');
					continue;
				}
				updates.set(key, value);
			} else {
				updates.set(key, value);
			}
		}
		if (updates.size === 0 && errors.length === 0) {
			errors.push('Provide at least one stat to update.');
		}

		if (errors.length > 0) {
			await interaction.reply({ content: `${errors.join('\n')}\n\nNo stats were changed.`, ephemeral: true });
			return;
		}
		const applyUpdates = db.transaction(() => {
			db.prepare('INSERT OR IGNORE INTO user_stats (discord_id) VALUES (?)').run(interaction.user.id);
			for (const [key, value] of updates) {
				db.prepare(`UPDATE user_stats SET "${key}" = ? WHERE discord_id = ?`).run(value, interaction.user.id);
			}
		});
		applyUpdates();

		const labels = new Map(availableStats.map(([label, key]) => [key, label]));
		const updated = [...updates].map(([key, value]) => {
			const displayValue = key === 'win_rate' ? `${Number(value) * 100}%` : value;
			return `• ${labels.get(key)}: ${displayValue}`;
		}).join('\n');
		await interaction.reply({ content: `Updated ${updates.size} general stat(s):\n${updated}`, ephemeral: true });
	} catch (error) {
		console.error('Stats Batch Edit Error:', error);
		const response = { content: 'Unable to batch edit your general stats.', ephemeral: true };
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(response).catch(() => {});
		} else {
			await interaction.reply(response).catch(() => {});
		}
	} finally {
		if (db) db.close();
	}
}

module.exports = { data, execute };

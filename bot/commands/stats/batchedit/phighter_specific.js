const { SlashCommandSubcommandBuilder } = require('discord.js');
const path = require('node:path');
const Database = require('better-sqlite3');

const PHIGHTERS = [
	'sword', 'rocket', 'medkit', 'skateboard', 'slingshot', 'boombox', 'biograft', 'hyperlaser',
	'subspace', 'katana', 'shuriken', 'vine_staff', 'ban_hammer', 'scythe', 'coil'
];
const HEALER_PHIGHTERS = new Set(['medkit', 'vine_staff', 'coil']);

const PHIGHTER_STATS = [
	['Mastery Level', 'mastery_level', 'integer', 'Your mastery level with this phighter'],
	['Playtime Hours', 'playtime_hours', 'string', 'Hours played with this phighter'],
	['Games Played', 'games', 'integer', 'Number of games played with this phighter'],
	['Win Rate', 'win_rate', 'string', 'Win rate percentage from 0 to 100'],
	['Wins', 'wins', 'integer', 'Total wins with this phighter'],
	['Kills', 'kills', 'integer', 'Total kills with this phighter'],
	['Deaths', 'deaths', 'integer', 'Total deaths with this phighter'],
	['Assists', 'assists', 'integer', 'Total assists with this phighter'],
	['Damage', 'damage', 'integer', 'Total damage dealt with this phighter'],
	['Points', 'points', 'integer', 'Total points earned with this phighter'],
	['Best K/D/A', 'best_kda', 'string', 'Your best K/D/A ratio with this phighter'],
	['Best Damage', 'best_dmg', 'integer', 'Your best damage dealt with this phighter'],
	['Heals', 'healing', 'integer', 'Total healing done with this phighter'],
	['Best Heals', 'best_heals', 'integer', 'Your best healing done with this phighter']
	// You can add your custom stats here, but do remember that this has a limit of 25 total.
];

const data = PHIGHTER_STATS.reduce((command, [, key, type, description]) => {
	const addOption = type === 'integer' ? 'addIntegerOption' : 'addStringOption';
	return command[addOption](option => option
		.setName(key)
		.setDescription(description)
		.setRequired(false));
}, new SlashCommandSubcommandBuilder()
	.setName('phighter')
	.setDescription('Batch edit stats for one phighter')
	.addStringOption(option => option
		.setName('phighter')
		.setDescription('The phighter whose stats you want to edit')
		.setRequired(true)
		.addChoices(...PHIGHTERS.map(phighter => ({
			name: phighter.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()),
			value: phighter
		})))));

async function execute(interaction) {
	const phighter = interaction.options.getString('phighter', true);
	const tableName = `${phighter}_stats`;
	const dbPath = path.join(__dirname, '..', '..', '..', 'user_database.db');
	let db;

	try {
		db = new Database(dbPath);
		const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name));
		if (!PHIGHTERS.includes(phighter) || !tables.has(tableName)) {
			await interaction.reply({ content: 'Stats for that phighter are not available.', ephemeral: true });
			return;
		}

		const columns = new Map(db.prepare(`PRAGMA table_info("${tableName}")`).all().map(column => [column.name, column]));
		const updates = new Map();
		const errors = [];
		const notices = [];
		for (const [label, key, type] of PHIGHTER_STATS) {
			const value = type === 'integer'
				? interaction.options.getInteger(key)
				: interaction.options.getString(key);
			if (value === null) continue;

			if ((key === 'heals' || key === 'best_heals') && !HEALER_PHIGHTERS.has(phighter)) {
				if (!notices.includes('Healing stats were skipped because this phighter does not have healing stats.')) {
					notices.push('Healing stats were skipped because this phighter does not have healing stats.');
				}
				continue;
			}
			if (!columns.has(key)) {
				notices.push(`${label} was skipped because it is not available for this phighter.`);
				continue;
			}
			if (key === 'win_rate') {
				const percentage = Number(value);
				if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
					errors.push('Win rate must be between 0 and 100.');
					continue;
				}
				updates.set(key, String(percentage / 100));
			} else {
				updates.set(key, value);
			}
		}

		if (errors.length > 0) {
			await interaction.reply({ content: `${errors.join('\n')}\n\nNo stats were changed.`, ephemeral: true });
			return;
		}
		if (updates.size === 0) {
			const message = notices.length ? notices.join('\n') : 'Provide at least one stat to update.';
			await interaction.reply({ content: message, ephemeral: true });
			return;
		}

		const applyUpdates = db.transaction(() => {
			db.prepare(`INSERT OR IGNORE INTO "${tableName}" (discord_id) VALUES (?)`).run(interaction.user.id);
			for (const [key, value] of updates) {
				db.prepare(`UPDATE "${tableName}" SET "${key}" = ? WHERE discord_id = ?`).run(value, interaction.user.id);
			}
		});
		applyUpdates();

		const labels = new Map(PHIGHTER_STATS.map(([label, key]) => [key, label]));
		const updated = [...updates].map(([key, value]) => {
			const displayValue = key === 'win_rate' ? `${Number(value) * 100}%` : value;
			return `• ${labels.get(key)}: ${displayValue}`;
		}).join('\n');
		const noticeText = notices.length ? `\n\n${notices.join('\n')}` : '';
		await interaction.reply({ content: `Updated ${updates.size} ${phighter.replace(/_/g, ' ')} stat(s):\n${updated}${noticeText}`, ephemeral: true });
	} catch (error) {
		console.error('(Phighter Batch Edit) Error:', error);
		const response = { content: 'Unable to batch edit your phighter stats.', ephemeral: true };
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

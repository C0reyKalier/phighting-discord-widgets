const { Events } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');

const normalizeDbKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const columnToDisplayMap = {
	maining: 'Maining', best_kda: 'Best K/D/A', best_dmg: 'Best Damage', best_heals: 'Best Heals',
	hours_played: 'Hours Played', total_playtime_hours: 'Hours Played', highest_daily_streak: 'Daily Streak',
	brokercoins_donated: 'Brokercoins Donated', highest_win_streak: 'Best Win Streak', total_kills: 'Total Kills',
	total_deaths: 'Total Deaths', total_assists: 'Total Assists', total_wins: 'Total Wins', total_dmg: 'Total Damage',
	total_heals: 'Total Heals', win_rate: 'Win Rate', comp_status: 'Competitive Status',
	endorsements_received: 'Endorsements Received', endorsements_given: 'Endorsements Given',
	mastery_level: 'Mastery Level', playtime_hours: 'Playtime Hours', games_played: 'Games Played',
	wins: 'Wins', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', damage: 'Damage', points: 'Points', healing: 'Heals',
};
const formatStatValue = {
	'Best Damage': (value) => `${Number(value) || 0} DMG`, 'Total Damage': (value) => `${Number(value) || 0} DMG`,
	'Damage': (value) => `${Number(value) || 0} DMG`, 'Best Heals': (value) => `${Number(value) || 0} Healed`,
	'Total Heals': (value) => `${Number(value) || 0} Healed`, 'Heals': (value) => `${Number(value) || 0} Healed`,
	'Hours Played': (value) => `${Number(value) || 0} hours`, 'Playtime Hours': (value) => `${Number(value) || 0} hours`,
	'Daily Streak': (value) => `${Number(value) || 	0} days`, 'Brokercoins Donated': (value) => `${Number(value) || 0} Donated`,
	'Best Win Streak': (value) => `${Number(value) || 0} Wins`, 'Total Kills': (value) => `${Number(value) || 0} Kills`,
	'Kills': (value) => `${Number(value) || 0} Kills`, 'Total Deaths': (value) => `${Number(value) || 0} Deaths`,
	'Deaths': (value) => `${Number(value) || 0} Deaths`, 'Total Assists': (value) => `${Number(value) || 0} Assists`,
	'Assists': (value) => `${Number(value) || 0} Assists`, 'Total Wins': (value) => `${Number(value) || 0} Wins`,
	'Wins': (value) => `${Number(value) || 0} Wins`,
	'Win Rate': (value) => {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return 'N/A';
		const percentage = numeric > 1 ? numeric : numeric * 100;
		return `${Math.round((percentage + Number.EPSILON) * 100) / 100}%`;
	},
	'Mastery Level': (value) => `Level ${Number(value) || 0}`, 'Games Played': (value) => `${Number(value) || 0} games`,
	'Points': (value) => `${Number(value) || 0} points`, 'Best K/D/A': (value) => String(value || 'N/A'),
};
const defaultStatIconAssets = {
	'Hours Played': 'ASSETS_BADGE_SIDEKICK', 'Playtime Hours': 'ASSETS_BADGE_SIDEKICK',
	'Daily Streak': 'ASSETS_BADGE_BULWARK', 'Best K/D/A': 'ASSETS_BADGE_PERFECTION',
	'Best Damage': 'ASSETS_BADGE_BESERKER', 'Best Heals': 'ASSETS_BADGE_GUARDIAN',
	'Best Win Streak': 'ASSETS_BADGE_UNSTOPPABLE', 'Brokercoins Donated': 'ASSETS_BROKERCOIN',
};

function resolveIconAsset(iconValue, statLabel, phighterName) {
	if (iconValue === 'hidden') return null;
	if (iconValue && iconValue !== 'default') {
		if (/^https?:\/\//i.test(iconValue)) return iconValue;
		const [category, ...keyParts] = String(iconValue).split('.');
		const key = keyParts.join('_').toUpperCase();
		if (category && key) {
			const assetName = category.toLowerCase() === 'badge'
				? `ASSETS_BADGE_${key}`
				: `ASSETS_${category.toUpperCase()}_${key}`;
			return process.env[assetName] || null;
		}
		return null;
	}
	if (phighterName) {
		const assetName = `ASSETS_${phighterName.replace(/[^a-z0-9]/gi, '').toUpperCase()}_ICON`;
		if (process.env[assetName]) return process.env[assetName];
	}
	return process.env[defaultStatIconAssets[statLabel]] || null;
}

async function getFullName(discordId) {
	const linkedRes = await fetch(
		`https://api.blox.link/v4/public/guilds/${process.env.GUILD_ID}/discord-to-roblox/${discordId}`,
		{ headers: { Authorization: process.env.BLOXLINK_API_KEY } },
	);
	const linkedData = await linkedRes.json();
	if (!linkedRes.ok || !linkedData.robloxID) throw new Error('No linked Roblox account found.');
	const profileRes = await fetch(`https://users.roblox.com/v1/users/${linkedData.robloxID}`);
	if (!profileRes.ok) throw new Error('Failed to retrieve Roblox profile.');
	const profile = await profileRes.json();
	return `${profile.displayName} (@${profile.name})`;
}

function resolveLayoutStat(db, userData, discordId, slotValue) {
	if (!slotValue || !String(slotValue).trim()) return null;
	const parts = String(slotValue).trim().split('.');
	const rawTable = parts[0];
	const columnName = parts.length > 1 ? parts.slice(1).join('.') : rawTable;
	const sourceTable = rawTable === 'user_stats' || rawTable === 'general' || parts.length <= 1
		? 'user_stats'
		: `${rawTable}_stats`;
	let row = userData;
	if (sourceTable !== 'user_stats') {
		if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(sourceTable)) return null;
		const quotedTable = `"${sourceTable.replace(/"/g, '""')}"`;
		row = db.prepare(`SELECT * FROM ${quotedTable} WHERE discord_id = ?`).get(discordId);
	}
	if (!row || row[columnName] === undefined || row[columnName] === null) return null;
	const phighterName = sourceTable === 'user_stats'
		? null
		: sourceTable.replace(/_stats$/, '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
	return { columnName, value: row[columnName], phighterName };
}

async function syncUser(client, db, userData) {
	const discordId = userData.discord_id;
	const layout = db.prepare('SELECT * FROM widget_layout WHERE discord_id = ?').get(discordId);
	if (!layout) return 'skipped: no widget layout';

	const fullName = await getFullName(discordId);
	const dynamic = [{ type: 1, name: 'full_name', value: fullName }];
	if (userData.title) dynamic.push({ type: 1, name: 'title', value: userData.title });
	if (userData.level !== null && userData.level !== undefined) dynamic.push({ type: 1, name: 'level', value: `Level ${userData.level}` });
	if (userData.comp_status) dynamic.push({ type: 1, name: 'comp_status', value: userData.comp_status });

	const phighterAssetMap = {
		sword: 'ASSETS_SWORD', skateboard: 'ASSETS_SKATEBOARD', biograft: 'ASSETS_BIOGRAFT', katana: 'ASSETS_KATANA',
		ban_hammer: 'ASSETS_BANHAMMER', rocket: 'ASSETS_ROCKET', slingshot: 'ASSETS_SLINGSHOT', hyperlaser: 'ASSETS_HYPERLASER',
		shuriken: 'ASSETS_SHURIKEN', scythe: 'ASSETS_SCYTHE', medkit: 'ASSETS_MEDKIT', boombox: 'ASSETS_BOOMBOX',
		subspace: 'ASSETS_SUBSPACE', vine_staff: 'ASSETS_VINESTAFF', coil: 'ASSETS_COIL',
	};
	const headerValue = userData.phighter_heroimg;
	if (typeof headerValue === 'string') {
		let imgUrl;
		if (/^https?:\/\//i.test(headerValue)) {
			imgUrl = headerValue;
		} else {
			const matchedPhighter = Object.keys(phighterAssetMap)
				.sort((a, b) => b.length - a.length)
				.find((name) => headerValue === name || headerValue.startsWith(`${name}_`));
			if (matchedPhighter) {
				const baseAssetName = phighterAssetMap[matchedPhighter];
				const skinValue = headerValue.slice(matchedPhighter.length).replace(/^_/, '');
				const skinName = skinValue.replace(/^skin_/, '').toUpperCase();
				const skinAsset = process.env[`${baseAssetName}_${skinName || 'DEFAULT'}`]
					|| (skinName && skinName !== 'DEFAULT' ? process.env[`${baseAssetName}_SKIN_${skinName}`] : null);
				imgUrl = skinAsset || process.env[baseAssetName];
			}
		}
		if (imgUrl) dynamic.push({ type: 3, name: 'phighter_header', value: { url: imgUrl } });
	}

	for (let index = 1; index <= 6; index++) {
		const stat = resolveLayoutStat(db, userData, discordId, layout[`stats_${index}`]);
		if (!stat) continue;
		const label = Object.entries(columnToDisplayMap)
			.find(([key]) => normalizeDbKey(key) === normalizeDbKey(stat.columnName))?.[1];
		if (!label) continue;
		const displayLabel = stat.phighterName ? `${label} (as ${stat.phighterName})` : label;
		const value = formatStatValue[label] ? formatStatValue[label](stat.value) : stat.value;
		dynamic.push({ type: 1, name: `stats_${index}`, value: displayLabel });
		dynamic.push({ type: 1, name: `stats_${index}_data`, value: String(value) });
		const icon = resolveIconAsset(layout[`stats_${index}_icon`], label, stat.phighterName);
		if (icon) dynamic.push({ type: 3, name: `stats_${index}_icon`, value: { url: icon } });
	}

	const user = await client.users.fetch(discordId).catch(() => null);
	if (!user) return 'skipped: Discord user unavailable';
	const response = await fetch(
		`https://discord.com/api/v9/applications/${client.user.id}/users/${discordId}/identities/${discordId}/profile`,
		{
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: `Bot ${client.token}` },
			body: JSON.stringify({ username: user.username, data: { dynamic } }),
		},
	);
	if (!response.ok) throw new Error(`Discord profile update failed (${response.status}).`);
	return 'synced';
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		if (String(process.env.AUTOSYNC_ENABLED).toUpperCase() !== 'TRUE') return;
		const verbose = String(process.env.VERBOSE).toUpperCase() === 'TRUE';
		const logVerbose = (...args) => {
			if (verbose) console.info(...args);
		};
		const intervalSeconds = Number(process.env.AUTOSYNC_INTERVAL);
		const intervalMs = (Number.isFinite(intervalSeconds) && intervalSeconds > 0 ? intervalSeconds : 3600) * 1000;
		logVerbose(`Widget autosync enabled; running every ${intervalMs / 1000} second(s).`);
		const runSync = async () => {
			const startedAt = Date.now();
			let db;
			let users = [];
			try {
				db = new Database(path.join(__dirname, '..', 'user_database.db'), { readonly: true });
				logVerbose('Widget autosync fetching discord_id values from user_stats.');
				users = db.prepare('SELECT *, CAST(discord_id AS TEXT) AS discord_id FROM user_stats WHERE discord_id IS NOT NULL').all();
				logVerbose(`Widget autosync fetched ${users.length} discord_id value(s).`);
				for (const userData of users) {
					logVerbose(`Widget autosync fetched discord_id: ${userData.discord_id}`);
				}
				logVerbose(`Widget autosync started; found ${users.length} user(s).`);
				for (const [index, userData] of users.entries()) {
					logVerbose(`Widget autosync progress: ${index + 1}/${users.length} — ${userData.discord_id}`);
					try {
						const result = await syncUser(client, db, userData);
						logVerbose(`Widget autosync ${result}: ${userData.discord_id}`);
					} catch (error) {
						console.error(`Autosync failed for ${userData.discord_id}:`, error);
					}
				}
			} catch (error) {
				console.error('Widget autosync database error:', error);
			} finally {
				if (db) db.close();
				logVerbose(`Widget autosync finished; processed ${users.length} user(s) in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);
			}
		};
		await runSync();
		setInterval(runSync, intervalMs);
	},
};

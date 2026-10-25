const {SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('setup')
		.setDescription('Perform first time setup for the widget'),

	async execute(interaction) {
		const targetUser = interaction.user;
		console.log(`[Widget setup] Starting setup for Discord user ${targetUser.id} (${targetUser.username})`);
		const oauthLink = `https://discord.com/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&response_type=token&redirect_uri=https%3A%2F%2Fdiscord.com&scope=openid+sdk.social_layer`;
		const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
		let defaultLayoutCreated = false;
		let joinDate = null;
		let joinDateUnavailable = false;

		try {
			const guildId = interaction.guildId || process.env.GUILD_ID;
			if (!guildId) throw new Error('No guild ID is available');
			console.log(`[Widget setup] Discord user ID: ${targetUser.id}; guild ID: ${guildId}`);

			const headers = process.env.BLOXLINK_API_KEY
				? { Authorization: process.env.BLOXLINK_API_KEY }
				: {};
			console.log(`[Widget setup] Looking up the Roblox account linked to Discord user ${targetUser.id}`);
			const linkResponse = await fetch(
				`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${targetUser.id}`,
				{ headers },
			);
			console.log(`[Widget setup] Bloxlink response for Discord user ${targetUser.id}: HTTP ${linkResponse.status}`);
			if (!linkResponse.ok) throw new Error(`Bloxlink returned HTTP ${linkResponse.status}`);

			const { robloxID } = await linkResponse.json();
			if (!robloxID) throw new Error('No Roblox account is linked');
			console.log(`[Widget setup] Discord user ${targetUser.id} is linked to Roblox user ${robloxID}`);

			const badgeResponse = await fetch(
				`https://badges.roblox.com/v1/users/${robloxID}/badges/awarded-dates?badgeIds=2124945579`,
			);
			console.log(`[Widget setup] Badge lookup for Roblox user ${robloxID}: HTTP ${badgeResponse.status}`);
			if (!badgeResponse.ok) {
				joinDateUnavailable = true;
				throw new Error(`Roblox returned HTTP ${badgeResponse.status}`);
			}

			const badge = (await badgeResponse.json()).data?.find(
				(entry) => String(entry.badgeId) === '2124945579',
			);
			if (badge?.awardedDate) joinDate = badge.awardedDate.slice(0, 10);
			if (!joinDate) joinDateUnavailable = true;
			console.log(`[Widget setup] Join date for Discord user ${targetUser.id} / Roblox user ${robloxID}: ${joinDate || 'not found'}`);
		} catch (error) {
			joinDateUnavailable = true;
			console.warn(`[Widget setup] Unable to retrieve badge date for Discord user ${targetUser.id}:`, error.message);
		}

		console.log(`[Widget setup] Opening database for Discord user ${targetUser.id}`);
		const db = new Database(dbPath);
		try {
				const tables = db.prepare(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
				).all();

				for (const { name } of tables) {
					if (name === 'widget_layout') continue;
					const tableName = `"${name.replace(/"/g, '""')}"`;
					const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
					if (!columns.some((column) => column.name === 'discord_id')) continue;

					const userExists = db.prepare(
						`SELECT 1 FROM ${tableName} WHERE discord_id = ? LIMIT 1`,
					).get(targetUser.id);
					if (!userExists) {
						console.log(`[Widget setup] Creating database entry in ${name} for Discord user ${targetUser.id}`);
						db.prepare(`INSERT INTO ${tableName} (discord_id) VALUES (?)`).run(targetUser.id);
					}
				}

			console.log(`[Widget setup] Creating default widget layout for Discord user ${targetUser.id} if it does not exist`);
			const layoutInsert = db.prepare(`
				INSERT INTO widget_layout (
					discord_id,
					stats_1, stats_1_icon,
					stats_2, stats_2_icon,
					stats_3, stats_3_icon,
					stats_4, stats_4_icon,
					stats_5, stats_5_icon,
					stats_6, stats_6_icon
				)
				SELECT ?, ?, 'default', ?, 'default', ?, 'default', ?, 'default', ?, 'default', ?, 'default'
				WHERE NOT EXISTS (
					SELECT 1 FROM widget_layout WHERE discord_id = ?
				)
			`).run(
				targetUser.id,
				'maining',
				'total_playtime_hours',
				'joindate',
				'total_kills',
				'total_deaths',
				'total_assists',
				targetUser.id,
			);
			defaultLayoutCreated = layoutInsert.changes > 0;

			if (joinDate) {
				console.log(`[Widget setup] Saving join date ${joinDate} for Discord user ${targetUser.id}`);
				db.prepare('UPDATE user_stats SET joindate = ? WHERE discord_id = ?')
					.run(joinDate, targetUser.id);
			}
		} finally {
			db.close();
		}
		console.log(`[Widget setup] Database setup complete for Discord user ${targetUser.id}`);

		const actionRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel('Authorize Widget Application')
				.setStyle(ButtonStyle.Link)
				.setURL(oauthLink),
		);

		return interaction.reply({
			content: `${defaultLayoutCreated ? '✅ Widget layout does not exist for this user ID, so the default layout has been set up.\n\n' : ''}${joinDateUnavailable ? '⚠️ The bot could not retrieve your Join badge acquisition date, possibly due to a Roblox rate limit or inventory privacy settings. Please enter this information yourself.\n\n' : ''}ℹ️ **Note:** This command only serves as a first-time setup.\n\nPlease click the button below to authorize the widget application for **${targetUser.username}**.`,
			components: [actionRow],
			ephemeral: true,
		});
	},
};

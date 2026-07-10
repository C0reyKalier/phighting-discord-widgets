const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: 'assets.env' });

const data = new SlashCommandBuilder()
	.setName('stats_widget_sync')
	.setDescription('Update your customized stats widget from your profile');

async function execute(interaction) {
	await interaction.deferReply({ ephemeral: true });

	const discordId = interaction.user.id;
	let fullNameValue = '';

	try {
		// Fetch Roblox ID from Bloxlink v4 API
		const bloxlinkRes = await fetch(`https://api.blox.link/v4/public/guilds/${process.env.GUILD_ID}/discord-to-roblox/${discordId}`, {
			headers: { 'Authorization': process.env.BLOXLINK_API_KEY }
		});
		const bloxlinkData = await bloxlinkRes.json();

		if (!bloxlinkRes.ok || !bloxlinkData.robloxID) {
			return interaction.editReply('Could not find a linked Roblox account for you via Bloxlink.');
		}

		const robloxId = bloxlinkData.robloxID;

		// Fetch Display Name & Username from Roblox API
		const robloxRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
		if (!robloxRes.ok) {
			throw new Error('Failed to retrieve profile data from Roblox servers.');
		}
		const robloxUser = await robloxRes.json();
		
		// Format: [Display Name] (@[username])
		fullNameValue = `${robloxUser.displayName} (@${robloxUser.name})`;
        console.log(`Fetched Roblox data for Discord ID ${discordId}: ${fullNameValue}`);

	} catch (error) {
		console.error('Roblox Sync Error:', error);
		return interaction.editReply('An error occurred while linking your Roblox account data. Please try again.');
	}

	try {
		// Connect to database
		const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
		const db = new Database(dbPath);

		// Get widget layout for the user executing the command
		const layoutRow = db.prepare('SELECT * FROM widget_layout WHERE discord_id = ?').get(discordId);
        console.log(`Fetched widget layout for Discord ID ${discordId}:`, layoutRow);
		if (!layoutRow) {
			db.close();
			return interaction.editReply('No widget layout found for your profile. Please configure your widget first.');
		}

		// Get user data
		const userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);
        console.log(`Fetched user data for Discord ID ${discordId}:`, userData);
		if (!userData) {
			db.close();
			return interaction.editReply('No user data found in database.');
		}

		db.close();

		// Map database column names to display names to send off to Discord API later
		const columnToDisplayMap = {
			'maining': 'Maining',
			'best_kda': 'Best K/D/A',
			'best_dmg': 'Best Damage',
			'best_heals': 'Best Heals',
			'hours_played': 'Hours Played',
			'best_dailystreak': 'Daily Streak',
			'brokercoins_donated': 'Brokercoins Donated',
			'best_winstreak': 'Best Win Streak',
			'total_kills': 'Total Kills',
			'total_deaths': 'Total Deaths',
			'total_assists': 'Total Assists',
			'best_phestival_title': 'Best Phestival Title',
			'winrate': 'Win Rate'
		};

		// Append formatting for specific stats
		const formatStatValue = {
			'Best Damage': (val) => `${val} DMG`,
			'Best Heals': (val) => `${val} Healed`,
			'Hours Played': (val) => `${val} hours`,
			'Daily Streak': (val) => `${val} days`,
			'Brokercoins Donated': (val) => `${val} Donated`,
			'Best Win Streak': (val) => `${val} Wins`,
			'Total Kills': (val) => `${val} Kills`,
			'Total Deaths': (val) => `${val} Deaths`,
			'Total Assists': (val) => `${val} Assists`,
			'Win Rate': (val) => `${val}%`,
		};

		// Build stats display from layout
		const statsDisplay = {};
		for (let i = 1; i <= 6; i++) {
			const columnName = layoutRow[`stats_${i}`];
			if (columnName) {
				const statLabel = columnToDisplayMap[columnName];
				let statValue = userData[columnName] || 'N/A';
				
				// Format stat value based on type
				if (formatStatValue[statLabel]) {
					statValue = formatStatValue[statLabel](statValue);
				}

				statsDisplay[`stats_${i}`] = statLabel;
				statsDisplay[`stats_${i}_data`] = statValue;
			}
		}
        console.log(`Prepared stats display for Discord ID ${discordId}:`, statsDisplay);

		// Get phighter header image from user data
		let imgUrl = null;
		const phighterHeader = userData.phighter_header;
		if (phighterHeader) {
			const phighterMap = {
				'Sword': 'ASSETS_SWORD',
				'Skateboard': 'ASSETS_SKATEBOARD',
				'Biograft': 'ASSETS_BIOGRAFT',
				'Katana': 'ASSETS_KATANA',
				'Ban Hammer': 'ASSETS_BANHAMMER',
				'Rocket': 'ASSETS_ROCKET',
				'Slingshot': 'ASSETS_SLINGSHOT',
				'Hyperlaser': 'ASSETS_HYPERLASER',
				'Shuriken': 'ASSETS_SHURIKEN',
				'Scythe': 'ASSETS_SCYTHE',
				'Medkit': 'ASSETS_MEDKIT',
				'Boombox': 'ASSETS_BOOMBOX',
				'Subspace': 'ASSETS_SUBSPACE',
				'Vine Staff': 'ASSETS_VINESTAFF',
				'Coil': 'ASSETS_COIL'
			};
			imgUrl = process.env[phighterMap[phighterHeader]];
            console.log(`Using phighter header image for ${phighterHeader}: ${imgUrl}`);
		}

		// Build embed preview
		const previewEmbed = new EmbedBuilder()
			.addFields(
				{
					name: `${fullNameValue}`,
					value: `Level ${userData.level || 'N/A'}\n${userData.honorary_title || 'N/A'}\n${userData.scrimming_status || 'N/A'}`,
					inline: false
				},
                {
                    name: `${statsDisplay.stats_1 || 'N/A'}`,
                    value: `${statsDisplay.stats_1_data || 'N/A'}`,
                    inline: true
                },
                {
                    name: `${statsDisplay.stats_2 || 'N/A'}`,
                    value: `${statsDisplay.stats_2_data || 'N/A'}`,
                    inline: true
                },
                {
                    name: `${statsDisplay.stats_3 || 'N/A'}`,
                    value: `${statsDisplay.stats_3_data || 'N/A'}`,
                    inline: true
                },
                {
                    name: `${statsDisplay.stats_4 || 'N/A'}`,
                    value: `${statsDisplay.stats_4_data || 'N/A'}`,
                    inline: true
                },
                {
                    name: `${statsDisplay.stats_5 || 'N/A'}`,
                    value: `${statsDisplay.stats_5_data || 'N/A'}`,
                    inline: true
                },
                {
                    name: `${statsDisplay.stats_6 || 'N/A'}`,
                    value: `${statsDisplay.stats_6_data || 'N/A'}`,
                    inline: true
                }
            )
            .setThumbnail(`${imgUrl}`)
            .setColor("#00b0f4")
            .setFooter({
              text: "PHIGHTING! x Discord Widget Integration",
            })
            .setTimestamp();

		const confirmButton = new ButtonBuilder()
			.setCustomId('confirm_widget')
			.setLabel('Confirm and Sync')
			.setStyle(ButtonStyle.Success);

		const cancelButton = new ButtonBuilder()
			.setCustomId('cancel_widget')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Danger);

		const actionRow = new ActionRowBuilder()
			.addComponents(confirmButton, cancelButton);

		await interaction.editReply({ content: 'Review the information before confirming:', embeds: [previewEmbed], components: [actionRow] });

		// Wait for button interaction
		try {
			const buttonInteraction = await interaction.channel.awaitMessageComponent({
				filter: i => i.user.id === discordId && (i.customId === 'confirm_widget' || i.customId === 'cancel_widget'),
				time: 60000 // 60 second timeout
			});

			if (buttonInteraction.customId === 'cancel_widget') {
				await buttonInteraction.deferUpdate();
				await interaction.editReply({ content: 'Widget sync operation cancelled, your stats on your widget are not changed.', embeds: [], components: [] });
				return;
			}

			// User confirmed, prepare payload and send to Discord API
			await buttonInteraction.deferUpdate();

			const dynamicData = [];
			dynamicData.push({ type: 1, name: "full_name", value: fullNameValue });

			if (userData.honorary_title) dynamicData.push({ type: 1, name: "honorary_title", value: userData.honorary_title });
			if (userData.level !== null) dynamicData.push({ type: 1, name: "level", value: `Level ${userData.level}` });
			if (userData.scrimming_status) dynamicData.push({ type: 1, name: "scrim_status", value: userData.scrimming_status });

			// Add stats data
			for (let i = 1; i <= 6; i++) {
				const statLabel = statsDisplay[`stats_${i}`];
				const statValue = statsDisplay[`stats_${i}_data`];
				if (statLabel) {
					const columnName = layoutRow[`stats_${i}`];
					dynamicData.push({ type: 1, name: `stats_${i}`, value: statLabel });
					dynamicData.push({ type: 1, name: `stats_${i}_data`, value: statValue });
				}
			}

			if (imgUrl) {
				dynamicData.push({ 
					type: 3, 
					name: "phighter_header", 
					value: { url: imgUrl } 
				});
			}

			const payload = {
				username: interaction.user.username,
				data: {
					dynamic: dynamicData
				}
			};

			const clientId = interaction.client.user.id;
			const url = `https://discord.com/api/v9/applications/${clientId}/users/${discordId}/identities/${discordId}/profile`;

			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bot ${interaction.client.token}`
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const resText = await response.text();
				throw new Error(resText);
			}

			await interaction.editReply({ content: 'Your widget data has been successfully updated!', ephemeral: true, embeds: [], components: [] });

		} catch (error) {
			if (error.code === 'InteractionCollectorError') {
				await interaction.editReply({ components: [] });
				return;
			}
			console.error('Discord API Error:', error);
			await interaction.editReply({ components: [] });
			await interaction.followUp({ content: `Failed to sync with Discord API. Error: \`${error.message}\``, ephemeral: true });
		}

	} catch (error) {
		console.error('Database Error:', error);
		await interaction.editReply(`Failed to retrieve widget data. Error: \`${error.message}\``);
	}
}

module.exports = { data, execute };

const { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const path = require('path');
const Database = require('better-sqlite3');

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('sync')
		.setDescription('Update your customized stats widget from your profile'),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const discordId = interaction.user.id;
		let fullNameValue;

		try {
			const bloxlinkRes = await fetch(
				`https://api.blox.link/v4/public/guilds/${process.env.GUILD_ID}/discord-to-roblox/${discordId}`,
				{ headers: { Authorization: process.env.BLOXLINK_API_KEY } },
			);
			const bloxlinkData = await bloxlinkRes.json();

			if (!bloxlinkRes.ok || !bloxlinkData.robloxID) {
				return interaction.editReply('Could not find a linked Roblox account for you via Bloxlink.');
			}

			const robloxRes = await fetch(`https://users.roblox.com/v1/users/${bloxlinkData.robloxID}`);
			if (!robloxRes.ok) throw new Error('Failed to retrieve profile data from Roblox servers.');

			const robloxUser = await robloxRes.json();
			fullNameValue = `${robloxUser.displayName} (@${robloxUser.name})`;
		} catch (error) {
			console.error('Roblox Sync Error:', error);
			return interaction.editReply('An error occurred while linking your Roblox account data. Please try again.');
		}

		try {
			const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
			const db = new Database(dbPath);
			const layoutRow = db.prepare('SELECT * FROM widget_layout WHERE discord_id = ?').get(discordId);
			if (!layoutRow) {
				db.close();
				return interaction.editReply('No widget layout found for your profile. Please configure your widget first.');
			}

			const userData = db.prepare('SELECT * FROM user_data WHERE discord_id = ?').get(discordId);
			db.close();
			if (!userData) return interaction.editReply('No user data found in database.');

			const columnToDisplayMap = {
				maining: 'Maining',
				best_kda: 'Best K/D/A',
				best_dmg: 'Best Damage',
				best_heals: 'Best Heals',
				hours_played: 'Hours Played',
				best_dailystreak: 'Daily Streak',
				brokercoins_donated: 'Brokercoins Donated',
				best_winstreak: 'Best Win Streak',
				total_kills: 'Total Kills',
				total_deaths: 'Total Deaths',
				total_assists: 'Total Assists',
				best_phestival_title: 'Best Phestival Title',
				winrate: 'Win Rate',
			};
			const formatStatValue = {
				'Best Damage': (value) => `${value} DMG`,
				'Best Heals': (value) => `${value} Healed`,
				'Hours Played': (value) => `${value} hours`,
				'Daily Streak': (value) => `${value} days`,
				'Brokercoins Donated': (value) => `${value} Donated`,
				'Best Win Streak': (value) => `${value} Wins`,
				'Total Kills': (value) => `${value} Kills`,
				'Total Deaths': (value) => `${value} Deaths`,
				'Total Assists': (value) => `${value} Assists`,
				'Win Rate': (value) => `${value}%`,
			};

			const statsDisplay = {};
			for (let i = 1; i <= 6; i++) {
				const columnName = layoutRow[`stats_${i}`];
				if (!columnName) continue;

				const statLabel = columnToDisplayMap[columnName];
				if (!statLabel) continue;
				let statValue = userData[columnName] || 'N/A';
				if (formatStatValue[statLabel]) statValue = formatStatValue[statLabel](statValue);
				statsDisplay[`stats_${i}`] = statLabel;
				statsDisplay[`stats_${i}_data`] = statValue;
			}

			let imgUrl;
			const phighterMap = {
				Sword: 'ASSETS_SWORD',
				Skateboard: 'ASSETS_SKATEBOARD',
				Biograft: 'ASSETS_BIOGRAFT',
				Katana: 'ASSETS_KATANA',
				'Ban Hammer': 'ASSETS_BANHAMMER',
				Rocket: 'ASSETS_ROCKET',
				Slingshot: 'ASSETS_SLINGSHOT',
				Hyperlaser: 'ASSETS_HYPERLASER',
				Shuriken: 'ASSETS_SHURIKEN',
				Scythe: 'ASSETS_SCYTHE',
				Medkit: 'ASSETS_MEDKIT',
				Boombox: 'ASSETS_BOOMBOX',
				Subspace: 'ASSETS_SUBSPACE',
				'Vine Staff': 'ASSETS_VINESTAFF',
				Coil: 'ASSETS_COIL',
			};
			if (userData.phighter_header === 'Custom') {
				imgUrl = userData.custom_phighter_header;
			} else if (phighterMap[userData.phighter_header]) {
				imgUrl = process.env[phighterMap[userData.phighter_header]];
			}

			const previewEmbed = new EmbedBuilder()
				.addFields(
					{
						name: fullNameValue,
						value: `Level ${userData.level || 'N/A'}\n${userData.honorary_title || 'N/A'}\n${userData.scrimming_status || 'N/A'}`,
						inline: false,
					},
					...Array.from({ length: 6 }, (_, index) => {
						const number = index + 1;
						return {
							name: statsDisplay[`stats_${number}`] || 'N/A',
							value: `${statsDisplay[`stats_${number}_data`] || 'N/A'}`,
							inline: true,
						};
					}),
				)
				.setColor('#00b0f4')
				.setFooter({ text: 'PHIGHTING! x Discord Widget Integration' })
				.setTimestamp();
			if (imgUrl) previewEmbed.setThumbnail(imgUrl);

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('confirm_widget').setLabel('Confirm and Sync').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId('cancel_widget').setLabel('Cancel').setStyle(ButtonStyle.Danger),
			);
			await interaction.editReply({
				content: 'Review the information before confirming:',
				embeds: [previewEmbed],
				components: [actionRow],
			});

			try {
				const buttonInteraction = await interaction.channel.awaitMessageComponent({
					filter: (i) => i.user.id === discordId && ['confirm_widget', 'cancel_widget'].includes(i.customId),
					time: 60000,
				});

				if (buttonInteraction.customId === 'cancel_widget') {
					await buttonInteraction.deferUpdate();
					return interaction.editReply({
						content: 'Widget sync operation cancelled, your stats on your widget are not changed.',
						embeds: [],
						components: [],
					});
				}

				await buttonInteraction.deferUpdate();
				const dynamicData = [{ type: 1, name: 'full_name', value: fullNameValue }];
				if (userData.honorary_title) dynamicData.push({ type: 1, name: 'honorary_title', value: userData.honorary_title });
				if (userData.level !== null) dynamicData.push({ type: 1, name: 'level', value: `Level ${userData.level}` });
				if (userData.scrimming_status) dynamicData.push({ type: 1, name: 'scrim_status', value: userData.scrimming_status });

				for (let i = 1; i <= 6; i++) {
					const statLabel = statsDisplay[`stats_${i}`];
					if (statLabel) {
						dynamicData.push({ type: 1, name: `stats_${i}`, value: statLabel });
						dynamicData.push({ type: 1, name: `stats_${i}_data`, value: statsDisplay[`stats_${i}_data`] });
					}
				}
				if (imgUrl) dynamicData.push({ type: 3, name: 'phighter_header', value: { url: imgUrl } });

				const url = `https://discord.com/api/v9/applications/${interaction.client.user.id}/users/${discordId}/identities/${discordId}/profile`;
				const response = await fetch(url, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bot ${interaction.client.token}`,
					},
					body: JSON.stringify({ username: interaction.user.username, data: { dynamic: dynamicData } }),
				});

				if (!response.ok) throw new Error(await response.text());
				await interaction.editReply({
					content: 'Your widget data has been successfully updated!',
					embeds: [],
					components: [],
				});
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
	},
};

const { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const gifFrames = require('gif-frames');
const verbose = String(process.env.VERBOSE).toLowerCase() === 'true';
const verboseLog = (...args) => {
	if (verbose) console.log('[/widget sync]', ...args);
};

// Easy-to-configure lists
const columnToDisplayMap = {
	maining: 'Maining',
	best_kda:'Best K/D/A',
	best_dmg: 'Best Damage',
	best_heals: 'Best Heals',
	hours_played: 'Hours Played',
	joindate: 'Join Date',
	total_playtime_hours: 'Hours Played',
	highest_daily_streak: 'Daily Streak',
	brokercoins_donated: 'Brokercoins Donated',
	highest_win_streak: 'Best Win Streak',
	total_kills: 'Total Kills',
	total_deaths: 'Total Deaths',
	total_assists: 'Total Assists',
	total_wins: 'Total Wins',
	total_dmg: 'Total Damage',
	total_heals: 'Total Heals',
	win_rate: 'Win Rate',
	comp_status: 'Competitive Status',
	endorsements_received: 'Endorsements Received',
	endorsements_given: 'Endorsements Given',
	mastery_level: 'Mastery Level',
	playtime_hours: 'Playtime Hours',
	games_played: 'Games Played',
	wins: 'Wins',
	kills: 'Kills',
	deaths: 'Deaths',
	assists: 'Assists',
	damage: 'Damage',
	points: 'Points',
	healing: 'Heals',
};
const defaultStatIconAssets = {
	'Join Date': 'ping.hello',
	'Playtime Hours': 'badge.sidekick',
	'Daily Streak': 'badge.bulwark',
	'Best K/D/A': 'badge.perfection',
	'Best Damage': 'badge.beserker',
	'Best Heals': 'badge.guardian',
	'Best Win Streak': 'badge.unstoppable',
	'Brokercoins Donated': 'brokercoin',
	'Total Kills': 'badge.beserker',
	'Total Deaths': 'badge.scourge',
	'Total Assists': 'badge.sidekick',
};
const phighterAssetMap = {
	sword: 'sword', skateboard: 'skateboard', biograft: 'biograft', katana: 'katana',
	ban_hammer: 'banhammer', rocket: 'rocket', slingshot: 'slingshot', hyperlaser: 'hyperlaser',
	shuriken: 'shuriken', scythe: 'scythe', medkit: 'medkit', boombox: 'boombox',
	subspace: 'subspace', vine_staff: 'vinestaff', coil: 'coil',
};
const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('sync')
		.setDescription('Update your customized stats widget from your profile'),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		verboseLog('Sync started.');

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
			verboseLog('Linked Roblox profile retrieved.');
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

			const userData = db.prepare('SELECT * FROM user_stats WHERE discord_id = ?').get(discordId);
			if (!userData) {
				db.close();
				return interaction.editReply('No user data found in database.');
			}

			const normalizeDbKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
			const formatNumber = (value) => {
				const numeric = Number(value);
				return Number.isFinite(numeric) ? String(Number(numeric.toFixed(2))) : '0';
			};
			const formatTextHours = (value) => {
				const text = String(value).trim();
				return /\bhours?\b/i.test(text) ? text : `${text} hours`;
			};
			const formatStatValue = {
				'Best Damage': (value) => `${formatNumber(value)} DMG`,
				'Total Damage': (value) => `${formatNumber(value)} DMG`,
				'Damage': (value) => `${formatNumber(value)} DMG`,
				'Best Heals': (value) => `${formatNumber(value)} Healed`,
				'Total Heals': (value) => `${formatNumber(value)} Healed`,
				'Heals': (value) => `${formatNumber(value)} Healed`,
				'Hours Played': (value) => `${String(value)} hours`,
				'Playtime Hours': (value) => `${String(value)} hours`,
				'Daily Streak': (value) => `${formatNumber(value)} days`,
				'Brokercoins Donated': (value) => `${formatNumber(value)} Donated`,
				'Best Win Streak': (value) => `${formatNumber(value)} Wins`,
				'Total Kills': (value) => `${formatNumber(value)} Kills`,
				'Kills': (value) => `${formatNumber(value)} Kills`,
				'Total Deaths': (value) => `${formatNumber(value)} Deaths`,
				'Deaths': (value) => `${formatNumber(value)} Deaths`,
				'Total Assists': (value) => `${formatNumber(value)} Assists`,
				'Assists': (value) => `${formatNumber(value)} Assists`,
				'Total Wins': (value) => `${formatNumber(value)} Wins`,
				'Wins': (value) => `${formatNumber(value)} Wins`,
				'Win Rate': (value) => {
					const numeric = Number(value);
					if (!Number.isFinite(numeric)) return 'N/A';
					const percent = numeric > 1 ? numeric : numeric * 100;
					return `${formatNumber(percent)}%`;
				},
				'Mastery Level': (value) => `Level ${formatNumber(value)}`,
				'Games Played': (value) => `${formatNumber(value)} games`,
				'Points': (value) => `${formatNumber(value)} points`,
				'Best K/D/A': (value) => `${String(value) || "N/A"}`,
			};
			const resolveIconAsset = (iconValue, statLabel, phighterName) => {
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
			};
			const resolvePhighterAsset = (assetKey, skinName = '') => {
				const key = skinName ? `${assetKey}.${skinName}` : assetKey;
				const normalizedKey = key.toUpperCase();
				return process.env[key]
					|| process.env[normalizedKey]
					|| process.env[`ASSETS_${normalizedKey}`]
					|| (skinName && process.env[`ASSETS_${assetKey.toUpperCase()}_SKIN_${skinName.toUpperCase()}`])
					|| process.env[`ASSETS_${assetKey.toUpperCase()}`]
					|| null;
			};

			const resolveLayoutStat = (slotValue) => {
				if (!slotValue) return null;
				const trimmedValue = String(slotValue).trim();
				if (!trimmedValue) return null;

				const parts = trimmedValue.split('.');
				const rawTable = parts[0];
				const columnName = parts.length > 1 ? parts.slice(1).join('.') : rawTable;
				const sourceTable = rawTable === 'user_stats' || rawTable === 'general' || parts.length <= 1 ? 'user_stats' : `${rawTable}_stats`;
				const phighterName = sourceTable === 'user_stats'
					? null
					: sourceTable.replace(/_stats$/, '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

				if (sourceTable !== 'user_stats') {
					const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(sourceTable);
					if (!tableExists) return { columnName, value: null, phighterName };
				}

				const row = sourceTable === 'user_stats'
					? userData
					: db.prepare(`SELECT * FROM "${sourceTable}" WHERE discord_id = ?`).get(discordId);
				return { columnName, value: row?.[columnName] ?? null, phighterName };
			};

			const statsDisplay = {};
			const statsIcons = {};
			for (let i = 1; i <= 6; i++) {
				const resolvedStat = resolveLayoutStat(layoutRow[`stats_${i}`]);
				if (!resolvedStat) continue;

				const normalizedKey = normalizeDbKey(resolvedStat.columnName);
				let statLabel = Object.entries(columnToDisplayMap).find(([key]) => normalizeDbKey(key) === normalizedKey)?.[1];
				if (!statLabel) continue;
				const formatLabel = statLabel;
				if (resolvedStat.phighterName) statLabel += ` (as ${resolvedStat.phighterName})`;

				const hasStatData = resolvedStat.value !== null
					&& resolvedStat.value !== undefined
					&& String(resolvedStat.value).trim() !== '';
				let statValue = hasStatData ? resolvedStat.value : 'Stats Data N/A';
				if (statValue !== '' && normalizeDbKey(resolvedStat.columnName) === 'totalplaytimehours') {
					statValue = formatTextHours(statValue);
				} else if (statValue !== '' && formatStatValue[formatLabel]) {
					statValue = formatStatValue[formatLabel](statValue);
				}
				statsDisplay[`stats_${i}`] = statLabel;
				statsDisplay[`stats_${i}_data`] = statValue;
				statsIcons[`stats_${i}`] = resolveIconAsset(
					layoutRow[`stats_${i}_icon`],
					formatLabel,
					resolvedStat.phighterName,
				);
			}
			verboseLog('Widget layout and stats loaded.');
			db.close();

			let imgUrl;
			const headerValue = userData.phighter_heroimg;
			if (typeof headerValue === 'string') {
				if (/^https?:\/\//i.test(headerValue)) {
					imgUrl = headerValue;
				} else {
					const matchedPhighter = Object.keys(phighterAssetMap)
						.sort((a, b) => b.length - a.length)
						.find((name) => headerValue === name || headerValue.startsWith(`${name}_`));
					if (matchedPhighter) {
						const assetKey = phighterAssetMap[matchedPhighter];
						const skinValue = headerValue.slice(matchedPhighter.length).replace(/^_/, '');
						const skinName = skinValue.replace(/^skin_/, '');
						imgUrl = resolvePhighterAsset(assetKey, skinName);
					}
				}
			}

			const assetsPath = path.join(__dirname, '..', '..', '..', 'assets');
			verboseLog('Working directory:', process.cwd());
			verboseLog('Assets directory:', assetsPath, 'exists:', fs.existsSync(assetsPath));
			const resolveLocalAsset = (assetValue, fallbackName, directories = []) => {
				const value = String(assetValue || fallbackName || '').trim();
				if (!value) return null;
				const requestedName = path.basename(value);
				const candidates = [requestedName];
				if (!path.extname(requestedName)) {
					for (const extension of imageExtensions) candidates.push(`${requestedName}${extension}`);
				}
				const attemptedPaths = [...directories, assetsPath]
					.flatMap((directory) => candidates.map((candidate) => path.join(directory, candidate)))
				verboseLog('Asset path lookup.', {
					value,
					attemptedPaths,
				});
				return attemptedPaths.find((candidate) => fs.existsSync(candidate)) || null;
			};

			const phighterName = Object.keys(phighterAssetMap)
				.sort((a, b) => b.length - a.length)
				.find((name) => typeof headerValue === 'string' && (headerValue === name || headerValue.startsWith(`${name}_`)));
			const localHero = (() => {
				if (!phighterName) return resolveLocalAsset(headerValue);

				const skinValue = headerValue.slice(phighterName.length).replace(/^_/, '').replace(/^skin_/, '');
				const skinName = skinValue || 'default';
				const assetKey = phighterAssetMap[phighterName];
				const skinDirectory = path.join(assetsPath, 'phighters_skins', phighterName);
				const portraitDirectory = path.join(assetsPath, 'phighters_portraits');
				const names = skinName.toLowerCase() === 'default'
					? [
						assetKey,
						phighterName,
					]
					: [
						`${assetKey}.${skinName}`,
						headerValue,
						`${phighterName}_skin_${skinName}`,
						skinName,
					];
				for (const name of names) {
					const asset = resolveLocalAsset(name, null, skinName.toLowerCase() === 'default'
						? [portraitDirectory]
						: [skinDirectory]);
					if (asset) return asset;
				}
				return resolveLocalAsset(headerValue);
			})();
			const bannerValue = String(userData.heroimg_banner || '').trim().toLowerCase();
			const bannerDirectory = path.join(assetsPath, 'banners');
			const bannerName = bannerValue.replace(/^banner[._-]/, '');
			const localBanner = bannerValue
				? resolveLocalAsset(bannerValue, null, [bannerDirectory])
					|| resolveLocalAsset(`banner_${bannerName}`, null, [bannerDirectory])
					|| resolveLocalAsset(`banner.${bannerName}`, null, [bannerDirectory])
					|| resolveLocalAsset(bannerName, null, [bannerDirectory])
				: null;
			const experimentalAnimatedBackground = String(process.env.EXPERIMENTAL_ANIMATED_BACKGROUND).toLowerCase() === 'true';
			verboseLog('Banner assets resolved.', {
				banner: bannerValue || 'none',
				bannerPath: localBanner || 'not found',
				heroPath: localHero || 'not found',
			});
			const previewImgUrl = imgUrl;
			if (experimentalAnimatedBackground && localBanner && localHero) {
				try {
					verboseLog('Starting banner composition with canvas and gifencoder.');
					const heroImage = await loadImage(localHero);
					const isGif = path.extname(localBanner).toLowerCase() === '.gif';
					let bannerFrames;
					if (isGif) {
						const decodedFrames = await gifFrames({
							url: localBanner,
							frames: 'all',
							outputType: 'png',
							cumulative: true,
						});
						bannerFrames = await Promise.all(decodedFrames.map(async (frame) => {
							const imageStream = frame.getImage();
							const chunks = [];
							await new Promise((resolve, reject) => {
								imageStream.on('data', (chunk) => chunks.push(chunk));
								imageStream.once('end', resolve);
								imageStream.once('error', reject);
							});
							return {
								image: await loadImage(Buffer.concat(chunks)),
								delay: Math.max(20, (frame.frameInfo.delay || 10) * 10),
							};
						}));
					} else {
						bannerFrames = [{ image: await loadImage(localBanner), delay: 100 }];
					}
					const outputWidth = 300;
					const outputHeight = 450;
					const canvas = createCanvas(outputWidth, outputHeight);
					const context = canvas.getContext('2d');
					const drawCover = (image, x, y, width, height, position = 'center') => {
						const scale = Math.max(width / image.width, height / image.height);
						const scaledWidth = image.width * scale;
						const scaledHeight = image.height * scale;
						const offsetX = position === 'right top' ? width - scaledWidth : (width - scaledWidth) / 2;
						const offsetY = position === 'right top' ? 0 : (height - scaledHeight) / 2;
						context.drawImage(image, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
					};
					verboseLog('Banner metadata loaded.', {
						width: bannerFrames[0].image.width,
						height: bannerFrames[0].image.height,
						frames: bannerFrames.length,
						animated: bannerFrames.length > 1,
					});
					const encoder = new GIFEncoder(outputWidth, outputHeight, 'neuquant');
					encoder.start();
					encoder.setRepeat(0);

					for (const { image, delay } of bannerFrames) {
						context.clearRect(0, 0, outputWidth, outputHeight);
						context.drawImage(image, 0, 0);
						drawCover(heroImage, 0, 0, outputWidth, outputHeight, 'right top');
						encoder.setDelay(delay);
						encoder.addFrame(context);
					}
					encoder.finish();
					const combinedImage = encoder.out.getData();
					const animatedBannerChannel = await interaction.client.channels.fetch(process.env.ANIMATED_BANNER_CHANNELID);
					if (!animatedBannerChannel || !animatedBannerChannel.isTextBased()) {
						throw new Error('Animated banner channel was not found or is not text-based.');
					}
					const uploadedBanner = await animatedBannerChannel.send({
						files: [{ attachment: combinedImage, name: `banner-${discordId}.gif` }],
					});
					const mediaLink = uploadedBanner.attachments.first()?.url;
					if (!mediaLink) throw new Error('Discord did not return a media link for the uploaded banner.');
					imgUrl = mediaLink;
					verboseLog('Banner composition completed.', {
						outputFormat: 'gif',
						outputBytes: combinedImage.length,
						mediaLink,
						frames: bannerFrames.length,
					});
				} catch (error) {
					verboseLog('Banner composition failed.', { message: error.message });
					console.error('Hero banner composition error:', error);
				}
			} else if (experimentalAnimatedBackground) {
				verboseLog('Skipping banner composition because a banner or hero asset was not found.');
			}

			const previewEmbed = new EmbedBuilder()
				.addFields(
					{
						name: fullNameValue,
						value: `Level ${userData.level || 'N/A'}\n${userData.title || 'N/A'}\n${userData.comp_status || 'N/A'}`,
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
			if (previewImgUrl) previewEmbed.setThumbnail(previewImgUrl);

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('confirm_widget').setLabel('Confirm and Sync').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId('cancel_widget').setLabel('Cancel').setStyle(ButtonStyle.Danger),
			);
			await interaction.editReply({
				content: 'Review the information before confirming:',
				embeds: [previewEmbed],
				components: [actionRow],
			});
			verboseLog('Awaiting sync confirmation.');

			try {
				const buttonInteraction = await interaction.channel.awaitMessageComponent({
					filter: (i) => i.user.id === discordId && ['confirm_widget', 'cancel_widget'].includes(i.customId),
					time: 60000,
				});

				if (buttonInteraction.customId === 'cancel_widget') {
					verboseLog('Sync cancelled by user.');
					await buttonInteraction.deferUpdate();
					return interaction.editReply({
						content: 'Widget sync operation cancelled, your stats on your widget are not changed.',
						embeds: [],
						components: [],
					});
				}

				await buttonInteraction.deferUpdate();
				const dynamicData = [{ type: 1, name: 'full_name', value: fullNameValue }];
				if (userData.title) dynamicData.push({ type: 1, name: 'title', value: userData.title });
				if (userData.level !== null) dynamicData.push({ type: 1, name: 'level', value: `Level ${userData.level}` });
				if (userData.comp_status) dynamicData.push({ type: 1, name: 'comp_status', value: userData.comp_status });

				for (let i = 1; i <= 6; i++) {
					const statLabel = statsDisplay[`stats_${i}`];
					if (statLabel) {
						dynamicData.push({ type: 1, name: `stats_${i}`, value: statLabel });
						dynamicData.push({ type: 1, name: `stats_${i}_data`, value: statsDisplay[`stats_${i}_data`] });
						const icon = statsIcons[`stats_${i}`];
						if (icon) {
							dynamicData.push({
								type: 3,
								name: `stats_${i}_icon`,
								value: { url: icon },
							});
						}
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
				verboseLog('Widget data synced successfully.');
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

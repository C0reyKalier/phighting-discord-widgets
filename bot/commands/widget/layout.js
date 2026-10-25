const {SlashCommandSubcommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const path = require('node:path');
const Database = require('better-sqlite3');
const VERBOSE = process.env.VERBOSE?.toUpperCase() === 'TRUE';

function verboseLog(...args) {
	if (VERBOSE) console.log('[/widget layout]', ...args);
}

const PHIGHTERS = [
	'sword', 'rocket', 'medkit', 'skateboard', 'slingshot',
	'boombox', 'biograft', 'hyperlaser', 'subspace', 'katana',
	'shuriken', 'vine_staff', 'ban_hammer', 'scythe', 'coil'
];
const PHIGHTER_SKINS = {
	sword: [['Default', 'default'], ['True Sword', 'skin_truesword']],
	rocket: [['Default', 'default'], ['True Rocket', 'skin_truerocket'], ['Stargazer Rocket', 'skin_stargazerrocket']],
	medkit: [['Default', 'default'], ['True Medkit', 'skin_truemedkit'], ['7MK0', 'skin_7mk0'], ['Bivekit', 'skin_bivekit']],
	skateboard: [['Default', 'default'], ['True Skateboard', 'skin_trueskateboard'], ['Egobworder', 'skin_egobworder']],
	slingshot: [['Default', 'default'], ['True Slingshot', 'skin_trueslingshot']],
	boombox: [['Default', 'default'], ['True Boombox', 'skin_trueboombox']],
	biograft: [['Default', 'default'], ['True Biograft', 'skin_truebiograft'], ['Beta Biograft', 'skin_betabiograft'], ['Cocoagraft', 'skin_cocoagraft']],
	hyperlaser: [['Default', 'default'], ['True Hyperlaser', 'skin_truehyperlaser'], ['Yulaser', 'skin_yulaser']],
	subspace: [['Default', 'default'], ['True Subspace', 'skin_truesubspace'], ['Jesterspace', 'skin_jesterspace'], ['Grieferspace', 'skin_grieferspace']],
	katana: [['Default', 'default'], ['True Katana', 'skin_truekatana'], ['Cybertana', 'skin_cybertana']],
	shuriken: [['Default', 'default'], ['True Shuriken', 'skin_trueshuriken'], ['Shurifin', 'skin_shurifin'], ['Shuri-Lóng', 'skin_shurilong']],
	vine_staff: [['Default', 'default'], ['True Vine Staff', 'skin_truevinestaff'], ['Valleystaff', 'skin_valleystaff']],
	ban_hammer: [['Default', 'default'], ['True Ban Hammer', 'skin_truebanhammer'], ['Sunken Ban Hammer', 'skin_sunkenbanhammer']],
	scythe: [['Default', 'default'], ['True Scythe', 'skin_truescythe'], ['Dutchman Scythe', 'skin_dutchmanscythe']],
	coil: [['Default', 'default'], ['True Coil', 'skin_truecoil']]
};

const HEALER_PHIGHTERS = new Set(['medkit', 'vine_staff', 'coil']);


const GENERAL_STATS = [
	['Brokercoins Donated', 'brokercoins_donated'], ['Playtime Hours', 'total_playtime_hours'],
	['Competitive Status', 'comp_status'], ['Maining Phighters', 'maining'],
	['Total Kills', 'total_kills'], ['Total Deaths', 'total_deaths'], ['Total Assists', 'total_assists'],
	['Total Wins', 'total_wins'], ['Win Rate', 'win_rate'], ['Total DMG', 'total_dmg'],
	['Total Heals', 'total_heals'], ['Highest Win Streak', 'highest_win_streak'],
	['Highest Daily Streak', 'highest_daily_streak'], ['Endorsements Received', 'endorsements_received'],
	['Endorsements Given', 'endorsements_given'], ['Best K/D/A', 'best_kda'],
	['Best DMG', 'best_dmg'], ['Best Heals', 'best_heals']
];
const PHIGHTER_STATS = [
	['Mastery Level', 'mastery_level'], ['Playtime Hours', 'playtime_hours'],
	['Number of games played', 'games_played'], ['Win Rate', 'win_rate'], ['Wins', 'wins'],
	['Kills', 'kills'], ['Deaths', 'deaths'], ['Assists', 'assists'], ['Damage', 'damage'],
	['Points', 'points'], ['Best K/D/A', 'best_kda'], ['Best DMG', 'best_dmg']
];

function makeMenu(customId, placeholder, options) {
	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(customId)
			.setPlaceholder(placeholder)
			.setMaxValues(1)
			.addOptions(options)
	);
}

function displayName(value) {
	return value.replace(/_stats$/, '').replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function waitForSelection(interaction, customId) {
	return interaction.channel.awaitMessageComponent({
		filter: component => component.user.id === interaction.user.id && component.customId === customId,
		time: 60000
	});
}

function makeOptions(entries) {
	return entries.map(([label, value]) => new StringSelectMenuOptionBuilder().setLabel(label).setValue(value));
}

async function saveLayoutValue(db, interaction, column, value) {
	const result = db.prepare(`UPDATE widget_layout SET ${column} = ? WHERE discord_id = ?`).run(value, interaction.user.id);
	if (result.changes === 0) {
		db.prepare(`INSERT INTO widget_layout (discord_id, ${column}) VALUES (?, ?)`).run(interaction.user.id, value);
	}
}

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('layout')
		.setDescription('Configure the stats shown in your widget layout'),

	async execute(interaction) {
		try {
			verboseLog('Layout configuration started.');
			const slotOptions = [
				new StringSelectMenuOptionBuilder().setLabel('Phighter header image').setValue('header').setDescription('Choose the image displayed at the top of your widget.'),
				...Array.from({ length: 6 }, (_, index) =>
					new StringSelectMenuOptionBuilder().setLabel(`Slot ${index + 1}`).setValue(String(index + 1))
				)
			];
			await interaction.reply({
				content: 'Which slot would you like to edit?',
				components: [makeMenu('layout_select_slot', 'Select a slot', slotOptions)],
				ephemeral: true
			});

			const slotSelection = await waitForSelection(interaction, 'layout_select_slot');
			verboseLog('Selected layout target:', slotSelection.values[0]);
			if (slotSelection.values[0] === 'header') {
				const headerOptions = [
					...PHIGHTERS.map(table => new StringSelectMenuOptionBuilder().setLabel(displayName(table)).setValue(table)),
					new StringSelectMenuOptionBuilder().setLabel('Custom image URL').setValue('custom').setDescription('Use an image from an HTTP or HTTPS URL.')
				];
				await slotSelection.update({
					content: 'Choose a Phighter for the header image, or provide a custom image URL.',
					components: [makeMenu('layout_select_header', 'Select a header image', headerOptions)]
				});
				const headerSelection = await waitForSelection(interaction, 'layout_select_header');
				let headerValue;
				if (headerSelection.values[0] === 'custom') {
					const modal = new ModalBuilder()
						.setCustomId('layout_custom_header_modal')
						.setTitle('Custom header image')
						.addComponents(new ActionRowBuilder().addComponents(
							new TextInputBuilder()
								.setCustomId('image_url')
								.setLabel('Image URL')
								.setStyle(TextInputStyle.Short)
								.setPlaceholder('https://example.com/custom-render.png')
								.setRequired(true)
						));
					await headerSelection.showModal(modal);
					const modalSubmit = await headerSelection.awaitModalSubmit({
						filter: submitted => submitted.user.id === interaction.user.id,
						time: 60000
					});
					headerValue = modalSubmit.fields.getTextInputValue('image_url').trim();
					if (!/^https?:\/\//i.test(headerValue)) {
						await modalSubmit.reply({ content: 'Please provide a valid HTTP or HTTPS image URL.', ephemeral: true });
						return;
					}
					const db = new Database(path.join(__dirname, '..', '..', 'user_database.db'));
					try {
						const userStatsExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_stats'").get();
						const columns = userStatsExists ? db.prepare('PRAGMA table_info(user_stats)').all().map(column => column.name) : [];
						if (!columns.includes('phighter_heroimg')) {
							await modalSubmit.reply({ content: 'Widget header storage is not available.', ephemeral: true });
							return;
						}
						const result = db.prepare('UPDATE user_stats SET phighter_heroimg = ? WHERE discord_id = ?')
							.run(headerValue, interaction.user.id);
						if (result.changes === 0) {
							db.prepare('INSERT INTO user_stats (discord_id, phighter_heroimg) VALUES (?, ?)')
								.run(interaction.user.id, headerValue);
						}
						await modalSubmit.reply({ content: 'Your custom header image has been saved.', ephemeral: true });
						verboseLog('Custom header image saved.');
					} finally {
						db.close();
					}
					return;
				}
				const selectedPhighter = headerSelection.values[0];
				const skinOptions = PHIGHTER_SKINS[selectedPhighter] || [['Default', 'default']];
				await headerSelection.update({
					content: `Choose a skin for **${displayName(selectedPhighter)}**.`,
					components: [makeMenu('layout_select_skin', 'Select a skin', makeOptions(skinOptions))]
				});
				const skinSelection = await waitForSelection(interaction, 'layout_select_skin');
				const phighterHeaderValue = `${selectedPhighter}_${skinSelection.values[0]}`;
				const db = new Database(path.join(__dirname, '..', '..', 'user_database.db'));
				try {
					const userStatsExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_stats'").get();
					const columns = userStatsExists ? db.prepare('PRAGMA table_info(user_stats)').all().map(column => column.name) : [];
					if (!columns.includes('phighter_heroimg')) {
						await skinSelection.update({ content: 'Widget header storage is not available.', components: [] });
						return;
					}
					const result = db.prepare('UPDATE user_stats SET phighter_heroimg = ? WHERE discord_id = ?')
						.run(phighterHeaderValue, interaction.user.id);
					if (result.changes === 0) {
						db.prepare('INSERT INTO user_stats (discord_id, phighter_heroimg) VALUES (?, ?)')
							.run(interaction.user.id, phighterHeaderValue);
					}
					await skinSelection.update({ content: `The header image is set to **${phighterHeaderValue}**.`, components: [] });
					verboseLog('Phighter header image saved.');
				} finally {
					db.close();
				}
				return;
			}
			const slot = Number(slotSelection.values[0]);
			const configurationOptions = [
				new StringSelectMenuOptionBuilder().setLabel('Configure stats').setValue('stats').setDescription('Choose the stat displayed in this slot.'),
				new StringSelectMenuOptionBuilder().setLabel('Configure stats icon').setValue('icon').setDescription('Choose or customize the icon for this slot.')
			];
			await slotSelection.update({
				content: `Would you like to configure the stats or stats icon for slot ${slot}?`,
				components: [makeMenu('layout_select_configuration', 'Choose what to configure', configurationOptions)]
			});
			const configurationSelection = await waitForSelection(interaction, 'layout_select_configuration');
			if (configurationSelection.values[0] === 'icon') {
				const iconOptions = [
					new StringSelectMenuOptionBuilder().setLabel('Default').setValue('default').setDescription('Use the icon associated with the selected stat.'),
					new StringSelectMenuOptionBuilder().setLabel('Custom').setValue('custom').setDescription('Use a pre-set icon available or a custom URL to an icon.'),
					new StringSelectMenuOptionBuilder().setLabel('Hidden').setValue('hidden').setDescription('Hide the icon for this slot.'),
				];
				await configurationSelection.update({
					content: `Choose the stats icon for slot ${slot}.`,
					components: [makeMenu('layout_select_icon', 'Select a stats icon', iconOptions)]
				});
				const iconSelection = await waitForSelection(interaction, 'layout_select_icon');
				let iconValue = iconSelection.values[0];
				let iconSaveInteraction = iconSelection;
				if (iconValue === 'custom') {
					const modal = new ModalBuilder()
						.setCustomId('layout_custom_icon_modal')
						.setTitle('Custom stats icon')
						.addComponents(new ActionRowBuilder().addComponents(
							new TextInputBuilder()
								.setCustomId('icon_value')
								.setLabel('Icon key or image URL')
								.setStyle(TextInputStyle.Short)
								.setPlaceholder('medkit.icon or https://example.com/icon.png')
								.setRequired(true)
						));
					await iconSelection.showModal(modal);
					iconSaveInteraction = await iconSelection.awaitModalSubmit({
						filter: submitted => submitted.user.id === interaction.user.id,
						time: 60000
					});
					iconValue = iconSaveInteraction.fields.getTextInputValue('icon_value').trim();
					if (!/^https?:\/\//i.test(iconValue) && !/^[a-z0-9_-]+\.[a-z0-9_-]+$/i.test(iconValue)) {
						await iconSaveInteraction.reply({ content: 'Enter an icon key (for example, `medkit.icon`) or a valid HTTP or HTTPS image URL.', ephemeral: true });
						return;
					}
				}
				const db = new Database(path.join(__dirname, '..', '..', 'user_database.db'));
				try {
					const layoutExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'widget_layout'").get();
					if (!layoutExists) {
						await iconSaveInteraction.reply({ content: 'Widget layout storage is not available.', ephemeral: true });
						return;
					}
					await saveLayoutValue(db, interaction, `stats_${slot}_icon`, iconValue);
					const response = { content: `Slot ${slot} stats icon set to **${iconValue}**.`, components: [] };
					if (iconSaveInteraction.isModalSubmit()) await iconSaveInteraction.reply({ ...response, ephemeral: true });
					else await iconSaveInteraction.update(response);
					verboseLog(`Slot ${slot} stats icon saved.`);
				} finally {
					db.close();
				}
				return;
			}
			const categories = [
				new StringSelectMenuOptionBuilder().setLabel('General').setValue('general').setDescription('Stats from your general profile'),
				new StringSelectMenuOptionBuilder().setLabel('Phighter-specific').setValue('phighter').setDescription('Stats for a specific phighter')
			];
			await configurationSelection.update({
				content: `Choose the category to feature in slot ${slot}:`,
				components: [makeMenu('layout_select_category', 'Select a category', categories)]
			});

			const categorySelection = await waitForSelection(interaction, 'layout_select_category');
			const dbPath = path.join(__dirname, '..', '..', 'user_database.db');
			const db = new Database(dbPath);
			try {
				let sourceTable = 'user_stats';
				let featurePrefix = '';
				let activeInteraction = categorySelection;

				if (categorySelection.values[0] === 'phighter') {
					const existingTables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name));
					const availablePhighters = PHIGHTERS.filter(phighter => existingTables.has(`${phighter}_stats`));
					if (availablePhighters.length === 0) {
						await categorySelection.update({ content: 'No phighter stat tables are available.', components: [] });
						return;
					}
					const phighterOptions = availablePhighters.map(phighter =>
						new StringSelectMenuOptionBuilder().setLabel(displayName(phighter)).setValue(phighter).setDescription(`Choose ${displayName(phighter)} stats to feature.`)
					);
					await categorySelection.update({
						content: 'Which phighter would you like to feature?',
						components: [makeMenu('layout_select_phighter', 'Select a phighter', phighterOptions)]
					});
					const phighterSelection = await waitForSelection(interaction, 'layout_select_phighter');
					sourceTable = `${phighterSelection.values[0]}_stats`;
					featurePrefix = `${phighterSelection.values[0]}.`;
					activeInteraction = phighterSelection;
				}

				const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(sourceTable);
				if (!tableExists) {
					await activeInteraction.update({ content: 'The selected stats table is not available.', components: [] });
					return;
				}
				const columns = db.prepare(`PRAGMA table_info("${sourceTable}")`).all()
					.map(column => column.name)
					.filter(column => column !== 'discord_id');
				if (columns.length === 0) {
					await activeInteraction.update({ content: 'No stats are available in this category.', components: [] });
					return;
				}

				const normalizedColumns = new Map(columns.map(column => [column.toLowerCase().replace(/[^a-z0-9]/g, ''), column]));
				const requestedStats = sourceTable === 'user_stats' ? GENERAL_STATS : [
					...PHIGHTER_STATS,
					...(HEALER_PHIGHTERS.has(sourceTable.replace(/_stats$/, '')) ? [['Heals', 'healing'], ['Best Heals', 'best_heals']] : [])
				];
				const statEntries = requestedStats.map(([label, key]) => {
					const actualColumn = normalizedColumns.get(key.toLowerCase().replace(/[^a-z0-9]/g, ''));
					return actualColumn ? [label, actualColumn] : null;
				}).filter(Boolean);
				const statOptions = makeOptions(statEntries).map(option =>
					option.setDescription(`Display ${option.toJSON().label} in this widget slot.`)
				);
				await activeInteraction.update({
					content: `Which ${sourceTable === 'user_stats' ? 'general stat' : `${displayName(sourceTable)} stat`} would you like to feature?`,
					components: [makeMenu('layout_select_stat', 'Select a stat', statOptions)]
				});
				const statSelection = await waitForSelection(interaction, 'layout_select_stat');
				const selectedColumn = statSelection.values[0];
				if (!columns.includes(selectedColumn)) {
					await statSelection.update({ content: 'That stat is not available.', components: [] });
					return;
				}

				const layoutExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'widget_layout'").get();
				if (!layoutExists) {
					await statSelection.update({ content: 'Widget layout storage is not available.', components: [] });
					return;
				}
				const value = `${featurePrefix}${selectedColumn}`;
				const result = db.prepare(`UPDATE widget_layout SET stats_${slot} = ? WHERE discord_id = ?`).run(value, interaction.user.id);
				if (result.changes === 0) {
					db.prepare(`INSERT INTO widget_layout (discord_id, stats_${slot}) VALUES (?, ?)`).run(interaction.user.id, value);
				}
				await statSelection.update({ content: `Slot ${slot} will feature **${value}**.`, components: [] });
				verboseLog(`Slot ${slot} stat saved.`);
			} finally {
				db.close();
			}
		} catch (error) {
			if (error.code === 'InteractionCollectorError') return;
			verboseLog('Layout configuration failed:', error);
			console.error('Widget Layout Error:', error);
			const response = { content: 'Unable to update your widget layout.', ephemeral: true };
			if (interaction.replied || interaction.deferred) await interaction.followUp(response).catch(() => {});
			else await interaction.reply(response).catch(() => {});
		}
	}
};

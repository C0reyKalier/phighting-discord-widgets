const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config({ path: 'assets.env' });

const data = new SlashCommandBuilder()
	.setName('legacy_stats_widget')
	.setDescription('Customize your widget for your profile')
	.addSubcommand((subcommand) => 
        subcommand
            .setName('edit')
            .setDescription('Customize your stats widget for your profile')
            .addStringOption(option => option.setName('honorary_title').setDescription('Insert your title').setRequired(true))
            .addIntegerOption(option => option.setName('level').setDescription('Insert your in-game level').setRequired(true))
            .addStringOption(option => option.setName('scrim_status').setDescription('Your scrimmer status').setRequired(true))
            .addStringOption(option =>
                option.setName('stats_1')
                .setDescription('Choose your first stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                    // Uncomment the following line if you want to allow users to input your custom stats
                    // { name: 'Custom Stat', value: 'Custom' }
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_1_data')
                .setDescription('Insert the data for your first stat')
                .setRequired(true)
            )

            .addStringOption(option => 
                option.setName('stats_2')
                .setDescription('Choose your second stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_2_data')
                .setDescription('Insert the data for your second stat')
                .setRequired(true)
            )

            .addStringOption(option => 
                option.setName('stats_3')
                .setDescription('Choose your third stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_3_data')
                .setDescription('Insert the data for your third stat')
                .setRequired(true)
            )

            .addStringOption(option => 
                option.setName('stats_4')
                .setDescription('Choose your fourth stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_4_data')
                .setDescription('Insert the data for your fourth stat')
                .setRequired(true)
            )

            .addStringOption(option => 
                option.setName('stats_5')
                .setDescription('Choose your fifth stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_5_data')
                .setDescription('Insert the data for your fifth stat')
                .setRequired(true)
            )

            .addStringOption(option => 
                option.setName('stats_6')
                .setDescription('Choose your sixth stat to display (Maining Phighters, Best KDA, Best Damage, etc.)')
                .addChoices(
                    { name: 'Maining Phighters', value: 'Maining' },
                    { name: 'Best K/D/A', value: 'Best K/D/A' },
                    { name: 'Best Damage', value: 'Best Damage' },
                    { name: 'Best Heals', value: 'Best Heals' },
                    { name: 'Hours Played', value: 'Hours Played' },
                    { name: 'Daily Streak', value: 'Daily Streak' },
                    { name: 'Brokercoins Donated', value: 'Brokercoins Donated' },
                    { name: 'Best Win Streak', value: 'Best Win Streak' },
                    { name: 'Total Kills', value: 'Total Kills'},
                    { name: 'Total Deaths', value: 'Total Deaths'},
                    { name: 'Total Assists', value: 'Total Assists'},
                    { name: 'Best Phestival Title', value: 'Best Phestival Title'}
                )
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName('stats_6_data')
                .setDescription('Insert the data for your sixth stat')
                .setRequired(true)
            )

            .addIntegerOption(option => 
                option.setName('phighter_header')
                .setDescription('Choose a header image for your favorite Phighter')
                .addChoices(
                    { name: 'Sword', value: 1 },
                    { name: 'Skateboard', value: 2 },
                    { name: 'Biograft', value: 3 },
                    { name: 'Katana', value: 4 },
                    { name: 'Ban Hammer', value: 5 },
                    { name: 'Rocket', value: 6 },
                    { name: 'Slingshot', value: 7 },
                    { name: 'Hyperlaser', value: 8 },
                    { name: 'Shuriken', value: 9 },
                    { name: 'Scythe', value: 10 },
                    { name: 'Medkit', value: 11 },
                    { name: 'Boombox', value: 12 },
                    { name: 'Subspace', value: 13 },
                    { name: 'Vine Staff', value: 14 },
                    { name: 'Coil', value: 15 }
                    // Uncomment the following line if you want to allow users to input your custom phighter header
                    // { name: 'Custom Phighter Header', value: 16 }
                )
                .setRequired(true)
            )
            .addBooleanOption(option => 
                option.setName('show_stats_icons')
                .setDescription('Include stats icons in your widget')
                .setRequired(true)
            )
    );
    
async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'edit') {
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

        } catch (error) {
            console.error('Roblox Sync Error:', error);
            return interaction.editReply('An error occurred while linking your Roblox account data. Please try again.');
        }

        const honorary_title = interaction.options.getString('honorary_title');
        const level = interaction.options.getInteger('level');
        const hours_played_data = interaction.options.getInteger('hours_played');
        const scrim_status = interaction.options.getString('scrim_status');
        const phighter_header = interaction.options.getInteger('phighter_header');

        const dynamicData = [];

        dynamicData.push({ type: 1, name: "full_name", value: fullNameValue });

        // Type 1 = String, Type 2 = Integer, Type 3 = Asset/Image URL Object
        if (honorary_title) dynamicData.push({ type: 1, name: "honorary_title", value: honorary_title });
        if (level !== null) dynamicData.push({ type: 1, name: "level", value: `Level ${level}` });
        if (hours_played_data !== null) dynamicData.push({ type: 1, name: "hours_played_data", value: `${hours_played_data} hours` });
        if (scrim_status) dynamicData.push({ type: 1, name: "scrim_status", value: scrim_status });
        for (let i = 1; i <= 6; i++) {
            const stat = interaction.options.getString(`stats_${i}`);
            const statData = interaction.options.getString(`stats_${i}_data`);
            if (stat !== null) dynamicData.push({ type: 1, name: `stats_${i}`, value: stat });
            if (statData !== null) {
                let formattedStatData = statData;
                if (stat === "Best Damage") {
                    formattedStatData += " DMG";
                } else if (stat === "Best Heals") {
                    formattedStatData += " Healed";
                } else if (stat === "Hours Played") {
                    formattedStatData += " hours";
                } else if (stat === "Daily Streak") {
                    formattedStatData += " days";
                } else if (stat === "Brokercoins Donated") {
                    formattedStatData += " Donated";
                } else if (stat === "Best Win Streak") {
                    formattedStatData += " Wins";
                }
                dynamicData.push({ type: 1, name: `stats_${i}_data`, value: formattedStatData });
            }
        }

        // Append the corresponding badge image URLs for each stat if they match
        if (interaction.options.getBoolean('show_stats_icons') === true) {
            const statImageMap = {
                "Hours Played": process.env.ASSETS_BADGE_SIDEKICK,
                "Daily Streak": process.env.ASSETS_BADGE_BULWARK,
                "Best K/D/A": process.env.ASSETS_BADGE_PERFECTION,
                "Best Damage": process.env.ASSETS_BADGE_BESERKER,
                "Best Heals": process.env.ASSETS_BADGE_GUARDIAN,
                "Best Win Streak": process.env.ASSETS_BADGE_UNSTOPPABLE,
                "Brokercoins Donated": process.env.ASSETS_BROKERCOIN,
            };

            for (let i = 1; i <= 6; i++) {
                const stat = dynamicData.find(item => item.name === `stats_${i}`);
                if (stat) {
                    const badgeUrl = statImageMap[stat.value];
                    if (badgeUrl) {
                        dynamicData.push({ 
                            type: 3, 
                            name: `stats_${i}_icon`, 
                            value: { url: badgeUrl } 
                        });
                    }
                }
            }
        }
        else {
            console.log('Stats icons are disabled; skipping badge image URLs.');
        }

        if (phighter_header !== null) {
            // Append the corresponding phighter image URL based on the selected phighter_header value
            const phighterMap = {
                1: 'SWORD', 2: 'SKATEBOARD', 3: 'BIOGRAFT', 4: 'KATANA', 5: 'BANHAMMER',
                6: 'ROCKET', 7: 'SLINGSHOT', 8: 'HYPERLASER', 9: 'SHURIKEN', 10: 'SCYTHE',
                11: 'MEDKIT', 12: 'BOOMBOX', 13: 'SUBSPACE', 14: 'VINESTAFF', 15: 'COIL',
                // Uncomment the following line if you want to allow users to input your custom phighter header
                // 16: 'CUSTOM'
            };

            const phighterName = phighterMap[phighter_header];
            const imgUrl = process.env[`ASSETS_${phighterName}`];

            /* NOTE: If your .env keys are named literally by index number 
               (e.g., ASSETS_1, ASSETS_2), comment out the block above and use this line instead:
               const imgUrl = process.env[`ASSETS_${phighter_header}`];
            */

            if (imgUrl) {
                dynamicData.push({ 
                    type: 3, 
                    name: "phighter_header", 
                    value: { url: imgUrl } 
                });
            } else {
                console.warn(`[Widget Link Warning]: process.env.ASSETS_${phighterName} is undefined.`);
            }
        }

        if (dynamicData.length === 0) {
            return interaction.editReply('You must provide at least one field to edit.');
        }

        const payload = {
            username: interaction.user.username,
            data: {
                dynamic: dynamicData
            }
        };

        const clientId = interaction.client.user.id;
        // In the initial guide, the session ID 0 was used, resulting in error 40106 from Discord. The session ID is now set to the Discord user ID, which should resolve the issue.
        const url = `https://discord.com/api/v9/applications/${clientId}/users/${discordId}/identities/${discordId}/profile`;
        // TODO: Add confirmation with interactation buttons before sending the PATCH request to Discord API
        const stats_1 = dynamicData.find(item => item.name === "stats_1")?.value || "Stats N/A";
        const stats_2 = dynamicData.find(item => item.name === "stats_2")?.value || "Stats N/A";
        const stats_3 = dynamicData.find(item => item.name === "stats_3")?.value || "Stats N/A";
        const stats_4 = dynamicData.find(item => item.name === "stats_4")?.value || "Stats N/A";
        const stats_5 = dynamicData.find(item => item.name === "stats_5")?.value || "Stats N/A";
        const stats_6 = dynamicData.find(item => item.name === "stats_6")?.value || "Stats N/A";
        const stats_1_data = dynamicData.find(item => item.name === "stats_1_data")?.value || "Stats Data N/A";
        const stats_2_data = dynamicData.find(item => item.name === "stats_2_data")?.value || "Stats Data N/A";
        const stats_3_data = dynamicData.find(item => item.name === "stats_3_data")?.value || "Stats Data N/A";
        const stats_4_data = dynamicData.find(item => item.name === "stats_4_data")?.value || "Stats Data N/A";
        const stats_5_data = dynamicData.find(item => item.name === "stats_5_data")?.value || "Stats Data N/A";
        const stats_6_data = dynamicData.find(item => item.name === "stats_6_data")?.value || "Stats Data N/A";
        const imgUrl = dynamicData.find(item => item.name === "phighter_header")?.value?.url || null;

        const previewEmbed = new EmbedBuilder()
          .setTitle("Widget Embed Preview")
          .setDescription("This is now your new widget embed.")
          .addFields(
            {
              name: `${fullNameValue}`,
              value: `Level ${level}\n${honorary_title}\n${scrim_status}`,
              inline: false
            },
            {
              name: `${stats_1}`,
              value: `${stats_1_data}`,
              inline: true
            },
            {
              name: `${stats_2}`,
              value: `${stats_2_data}`,
              inline: true
            },
            {
              name: `${stats_3}`,
              value: `${stats_3_data}`,
              inline: true
            },
            {
              name: `${stats_4}`,
              value: `${stats_4_data}`,
              inline: true
            },
            {
              name: `${stats_5}`,
              value: `${stats_5_data}`,
              inline: true
            },
            {
              name: `${stats_6}`,
              value: `${stats_6_data}`,
              inline: true
            },
          )
          .setThumbnail(`${imgUrl}`)
          .setColor("#00b0f4")
          .setFooter({
            text: "PHIGHTING! x Discord Widget Integration",
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [previewEmbed] });

        try {
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

            await interaction.editReply('Your widget profile has been successfully updated!');
        } catch (error) {
            console.error('Discord API Error:', error);
            await interaction.editReply(`Failed to sync with Discord API. Error: \`${error.message}\``);
        }
    }
}

module.exports = { data, execute };
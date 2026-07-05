const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const data = new SlashCommandBuilder()
	.setName('widget')
	.setDescription('Customize your widget for your profile')
	.addSubcommand((subcommand) => 
		subcommand
			.setName('setup')
			.setDescription('Perform first time setup for the widget')
	)
    .addSubcommand((subcommand) =>
		subcommand
			.setName('apply')
			.setDescription('Apply the widget to your profile')
	);

async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // -----------------------------------------------------------
    // SUBCOMMAND: SETUP
    // -----------------------------------------------------------
    if (subcommand === 'setup') {
        const targetUser = interaction.user;

        const oauthLink = `https://discord.com/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&response_type=token&redirect_uri=https%3A%2F%2Fdiscord.com%2F&scope=openid+sdk.social_layer`;

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Authorize Widget Application')
                .setStyle(ButtonStyle.Link)
                .setURL(oauthLink)
        );

        return interaction.reply({
            content: `ℹ️ **Note:** This command only serves as a first-time setup.\n\nPlease click the button below to authorize the widget application for **${targetUser.username}**.`,
            components: [actionRow],
            ephemeral: true
        });
    }

    // -----------------------------------------------------------
<<<<<<< HEAD
=======
    // SUBCOMMAND: EDIT
    // -----------------------------------------------------------
    if (subcommand === 'edit') {
        await interaction.deferReply({ ephemeral: true });

        const discordId = interaction.user.id;
		const guildId = process.env.GUILD_ID
        let fullNameValue = '';

        try {
            // Fetch Roblox ID from Bloxlink v4 API
            const bloxlinkRes = await fetch(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`, {
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
                    formattedStatData += " Heals";
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
        // Id 0 causing the 40106 error from discord seems to be no longer true
		// using it with ${discordId} causes the error APPLICATION_IDENTITY_PROVIDER_USER_ID_MISMATCH, changing it to 0 worked on my end.
        const url = `https://discord.com/api/v9/applications/${clientId}/users/${discordId}/identities/0/profile`;
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

    // -----------------------------------------------------------
>>>>>>> efdaa61ab2f4f334eda7d98440a1ef413eb79801
    // SUBCOMMAND: APPLY
    // -----------------------------------------------------------
    if (subcommand === 'apply') {
        await interaction.deferReply({ ephemeral: true});
        const applyEmbed = {
            color: 0x0099ff,
            title: 'How to Apply Your Widget',
            description: 'To apply your widget to your profile, follow these steps:',
            fields: [
                {
                    name: 'Step 1: Open DevTools',
                    value: 'Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac) to open the Developer Tools in your browser.'
                },
                {
                    name: 'Step 2: Apply the Widget',
                    value: `Copy the following code and paste it into the Console tab of the Developer Tools:\n\`\`\`javascript\nlet _mods=webpackChunkdiscord_app.push([[Symbol()],{},e=>e.c]);webpackChunkdiscord_app.pop();\nlet findByProps=(...e)=>{for(let t of Object.values(_mods))try{if(!t.exports||t.exports===window)continue;if(e.every(e=>t.exports?.[e]))return t.exports;for(let r in t.exports)if(e.every(e=>t.exports?.[r]?.[e])&&"IntlMessagesProxy"!==t.exports[r][Symbol.toStringTag])return t.exports[r]}catch{}};\nfindByProps("getFeaturedApplicationIds").getFeaturedApplicationIds().push("${process.env.APPLICATION_ID}");\n\`\`\``
                },
                {
                    name: 'Step 3: Add the widget to your profile',
                    value: 'After pasting the code, add the widget by navigating to "Edit Profile" and then click on "Add Widget"'
                },
                {
                    name: 'Applying directly to your profile (Vencord only)',
                    value: 'If you are using Vencord, you can apply the widget directly to your profile by copying the following code and pasting it into the Console tab of the Developer Tools (`Ctrl+Shift+I`):\n\`\`\`javascript\nasync function addWidget(appId) {\n    id = Vencord.Webpack.findByProps("getCurrentUser").getCurrentUser().id;\n    current_widgets = (await Vencord.Webpack.Common.RestAPI.get("/users/" + id + "/profile")).body.widgets\n    if (current_widgets.map(x=>x.data?.application_id).includes(appId)) {\n        return console.log("Already in your widgets — remove it via Discord client to re-add");\n    }\n    current_widgets.unshift({"data":{"type":"application","application_id":appId}})\n   await Vencord.Webpack.Common.RestAPI.put({url:"/users/@me/widgets",body:{widgets:current_widgets}})}\naddWidget("1520790049351008478")\n\`\`\`'
                }
            ]
        };

        await interaction.editReply({ embeds: [applyEmbed] });

    }
}

module.exports = { data, execute };

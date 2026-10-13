const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('apply')
		.setDescription('Apply the widget to your profile'),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

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
					value: `Copy the following code and paste it into the Console tab of the Developer Tools:\n\n\`\`\`javascript\nlet _mods=webpackChunkdiscord_app.push([[Symbol()],{},e=>e.c]);webpackChunkdiscord_app.pop();\nlet findByProps=(...e)=>{for(let t of Object.values(_mods))try{if(!t.exports||t.exports===window)continue;if(e.every(e=>t.exports?.[e]))return t.exports;for(let r in t.exports)if(e.every(e=>t.exports?.[r]?.[e])&&"IntlMessagesProxy"!==t.exports[r][Symbol.toStringTag])return t.exports[r]}catch{}};\nfindByProps("getFeaturedApplicationIds").getFeaturedApplicationIds().push("${process.env.APPLICATION_ID}");\n\`\`\``
				},
				{
					name: 'Step 3: Add the widget to your profile',
					value: 'After pasting the code, add the widget by navigating to "Edit Profile" and then click on "Add Widget"'
				},
				{
					name: 'Applying directly to your profile (Vencord only)',
					value: 'If you are using Vencord, you can apply the widget directly to your profile by copying the following code and pasting it into the Console tab of the Developer Tools (`Ctrl+Shift+I`):\n\n\`\`\`javascript\nasync function addWidget(appId) {\n    id = Vencord.Webpack.findByProps("getCurrentUser").getCurrentUser().id;\n    current_widgets = (await Vencord.Webpack.Common.RestAPI.get("/users/" + id + "/profile")).body.widgets\n    if (current_widgets.map(x=>x.data?.application_id).includes(appId)) {\n        return console.log("Already in your widgets — remove it via Discord client to re-add");\n    }\n    current_widgets.unshift({"data":{"type":"application","application_id":appId}})\n   await Vencord.Webpack.Common.RestAPI.put({url:"/users/@me/widgets",body:{widgets:current_widgets}})}\naddWidget("1520790049351008478")\n\`\`\`'
				}
			]
		};

		await interaction.editReply({ embeds: [applyEmbed] });
	},
};

# Getting started

> ⚠️ **NOTE!**: This guide is still in a heavy W.I.P. Some contents might change as the guide is being completed.

Welcome to the PHIGHTING! Discord Widgets setup guide! This guide will walk you through setting up custom profile widgets to show off your PHIGHTING! stats right on your Discord profile using Discord’s experimental Widgets v2 (Social SDK).

> ⚠️ **Important Note**: Widgets v2 is currently an experimental/alpha feature in Discord. It requires utilizing the Developer Portal console and direct API manipulation. Because it is experimental, Discord may change endpoints or restrictions at any time.

---

## Precautions

**Please read the following security notices carefully before setting up or sharing access to your application:**

1. This widget needs a browser or a modded Discord desktop client (e.g [Vencord](https://vencord.dev)) for you to be able to add it to your profile via DevTools. That means you will be asked to paste prepared code into the Developer Tools console.
    - Be careful: bad actors can use a fake or changed command to steal your Discord account. If you paste a dangerous script, someone could take over your account, read your messages, and act as you.
    - It is recommended to *only* use commands shown in this guide or from trusted sources. If someone sends you a “better” or “cool” script in a message or on an untrusted website, do not paste it in and run it.
2. This project also needs your Bot Token. Treat this token like your Discord password. If it is leaked or shared by mistake, someone could take control of your bot and change the widget or other settings.
3. If you share your widget with friends, you must move your widget application to a Developer Portal Team, and they must have a Developer or higher role in that team. People with that role can make big changes to the widget, including changing or deleting the layout. Only share access with people you trust completely.

---

## Requirements before starting

- [Node.js 18+](https://nodejs.org/)
- A Windows (or Linux) PC (Android support coming soon!)
- A Discord account with **Developer Mode** enabled
- A Discord server with Bloxlink configured, along with the API key set up
- A little bit of knowledge about tech (especially with working with command lines)
- **(Optional)** Docker if you are deploying to a server
- **(Optional)** MFA/2FA set up if you are planning to share your widget to your trusted friends. People who wants to get shared access also needs MFA/2FA set up, too.

## Contents of this guide

- **[Setting up the widget](widget-setup.md):** This is where you can learn how to set up your widget (whether through manually by hand or through a pre-set template using a browser extension.)
- **[Setting up the bot](bot-setup.md):** This is where you can learn how to set up the bot to make it easier for you to edit your stats via commands.
- **[Sharing your widget to your friends](sharing-the-widget.md):** This is where you can learn how to share your widget to your **(TRUSTED!)** friends.
- **[Frequently Asked Questions](../faq.md):** For common troubleshooting when setting up/using this repo.

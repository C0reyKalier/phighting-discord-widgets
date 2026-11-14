# PHIGHTING! x Discord (Unofficial) Widget Integration

A project implementing your (unofficial) PHIGHTING! stats to your Discord profile using Discord's Game Widget experiment.

![Widget preview](widget-preview.png)

---

> [!NOTE]
> Discord has [ended the Widgets experiment back in July 2026](https://web.archive.org/web/20260728010848/https://support-dev.discord.com/hc/en-us/articles/42261641635351-Game-Stats-Widget-Experiment). New Widgets cannot be made anymore, but existing Widgets that were created before it can still be modified and edited.
> Issues regarding widget creation will not be supported.

---

## Planned features & TODO:

- [x] More comprehensive and friendly guide to set up **[PRIORITY]**
- [x] Polished UX for the Discord Bot **[PRIORITY]**
- [ ] Standalone (Win32) program for Windows
- [ ] Add Android support via Termux using dialog and curl

## Requirements

- [Node.js 22+](https://nodejs.org/)
- A Windows (or Linux) PC (Android support coming soon!)
- A Discord account with **Developer Mode** enabled
- A Discord server with Bloxlink configured, along with the API key set up
- A little bit of knowledge about tech
- **(Optional)** Docker if you are deploying to a server
- **(Optional)** 2-Factor-Authentication enabled for your account (if you are planning to share it with your friends)

---

## User Guide / Getting Started

Head over to the [GitHub Wiki page](https://github.com/C0reyKalier/phighting-discord-widgets/wiki) to get started.

---

## Commands Preview

| Command | Description |
|---|---|
| `/widget setup` | Authorize the application on your discord account |
| `/widget apply` | Shows a guide to apply your widget to your profile (Requires a desktop web browser/Vencord with DevTools enabled) |
| `/widget layout` | Edit the layout of your widget to your choosing |
| `/widget sync` | Syncs your widget to your Discord profile |
| `/stats edit` | Edit your stats one-by-one using an interactive menu |
| `/stats batchedit [general/phighter]` | Edit your stats in batch using Discord slash commands |

---

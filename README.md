# PHIGHTING! x Discord (Unofficial) Widget Integration

A project implementing your (unofficial) PHIGHTING! stats to your Discord profile! Currently in heavy W.I.P

![Widget preview](widget-preview.png)

---

## Planned features & TODO:

- [ ] More comprehensive and friendly guide to set up **[PRIORITY]**
- [ ] Polished UX for the Discord Bot **[PRIORITY]**
- [ ] Standalone (Win32) program for Windows
- [ ] Add Android support via Termux using dialog and curl
- [ ] Support for the second type of the Widget (4 featured images) **[PRIORITY]**

## Requirements

- [Node.js 18+](https://nodejs.org/)
- A Windows (or Linux) PC (Android support coming soon!)
- A Discord account with **Developer Mode** enabled
- A Discord server with Bloxlink configured, along with the API key set up
- A little bit of knowledge about tech
- **(Optional)** Docker if you are deploying to a server

---

## Setup

### 1. Clone this repository

```bash
git clone https://github.com/C0reyKalier/phighting-discord-widgets.git
cd phighting-discord-widgets/bot
npm install
```

### (Recommended) Install the Discord Widgets Extension

1. Download or clone https://github.com/TheCreativeGod/Discord-Widgets-Extension
2. **Chrome / Edge / Brave**: `chrome://extensions` → Enable Developer Mode → Load unpacked → select the `chrome-extension/` folder
3. **Firefox**: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `firefox-extension/manifest.json`

### Import the widget layout and configure redirect

1. Go to https://discord.com/developers/applications and reload the page once after installing the extension
2. Click the **Widget Creator** button in the bottom-right corner
3. Paste the full contents of **`widget-template.json`** from this repo into the JSON box
4. Click **Import** — the extension creates the application with the template layout and stat icons pre-configured
5. Complete any captcha / 2FA if prompted

> **Note:** After importing, all data fields will appear **empty** — this is expected. The bot hasn't pushed any stats yet. Click the **pencil icon** on each data field to confirm the mapping is correct.
>
> ![Pencil icon](ClickToWrite.png)
>
> Each field should look like this:
>
> | Field | Type | Expected value |
> |---|---|---|
> | Name (@username) | Text (dynamic) | `full_name` |
> | Title | Text (dynamic) | `honorary_title` |
> | Level | Text (dynamic) | `level` |
> | Scrim Status | Text (dynamic) | `scrim_status` |
> | Stats Label 1 | Text (dynamic) | `stats_1` |
> | Stats 1 Icon | Image URL (dynamic) | `stats_1_icon` |
> | Stats Data 1 | Text (dynamic) | `stats_1_data` |
> | Stats Label 2 | Text (dynamic) | `stats_2` |
> | Stats 2 Icon | Image URL (dynamic) | `stats_2_icon` |
> | Stats Data 2 | Text (dynamic) | `stats_2_data` |
> | Stats Label 3 | Text (dynamic) | `stats_3` |
> | Stats 3 Icon | Image URL (dynamic) | `stats_3_icon` |
> | Stats Data 3 | Text (dynamic) | `stats_3_data` |
> | Stats Label 4 | Text (dynamic) | `stats_4` |
> | Stats 4 Icon | Image URL (dynamic) | `stats_4_icon` |
> | Stats Data 4 | Text (dynamic) | `stats_4_data` |
> | Stats Label 5 | Text (dynamic) | `stats_5` |
> | Stats 5 Icon | Image URL (dynamic) | `stats_5_icon` |
> | Stats Data 5 | Text (dynamic) | `stats_5_data` |
> | Stats Label 6 | Text (dynamic) | `stats_6` |
> | Stats 6 Icon | Image URL (dynamic) | `stats_6_icon` |
> | Stats Data 6 | Text (dynamic) | `stats_6_data` |
> | Phighter Header | Image URL (dynamic) | `phighter_header` |
>
> There are 2 fallback images: `zuka_fallback` and `sword` are uploaded automatically on import — `zuka_fallback` serves as a fallback image when there are no images available, while `sword` is for the preview for the widget when you add it from the "Add Widgets" menu.

Once done, head to the **Developer Portal** → OAuth2 page and add a redirect "https://discord.com". This will allow you to be able to authorize the app to your account.

After confirming the redirect URL has been set to "https://discord.com", get your bot token in the same **Developer Portal page**:

- **Application ID** → General Information page
- **Bot Token** → Bot page → Reset Token

### Configure `.env`

Rename `.env.example` to `.env` or you can create your own `.env` file:

```env
BOT_TOKEN=YOUR_BOT_TOKEN
APPLICATION_ID=YOUR_APPLICATION_ID
GUILD_ID=YOUR_DISCORD_SERVER_ID

BLOXLINK_API_KEY=YOUR_BLOXLINK_API_KEY
```

> **Server ID**: right-click your server icon → Copy Server ID
> **Bloxlink API key**: Add Bloxlink to your Discord server and go to [Bloxlink Developer API page](https://blox.link/dashboard/user/developer), add your server and copy the API key of your server.

### Deploy and start

There are two ways you can deploy the bot:

#### Via command line (local machines)

```bash
cd bot          # if you are not in the bot directory
npm run deploy   # register slash commands
npm start        # start the bot
```

#### Via Docker (if you are deploying it to a server)

```bash
cd bot                                                                                          # if you are not in the bot directory
docker build -t phighting-discord-widgets .                                                     # build from dockerfile
docker run -d --name phighting-discord-widgets --env-file .env phighting-discord-widgets
docker logs phighting-discord-widgets                                                           # enable logging on your console
```

#### (Optional) Stop and delete the Docker container (for debugging or updating purposes)

```bash
docker stop phighting-discord-widgets
docker rm phighting-discord-widgets
```

The bot logs `Bot ready! Logged in as BotName#XXXX` when ready.

---

## Commands Preview

| Command | Description |
|---|---|
| `/widget setup` | Authorize the application on your discord account |
| `/stats_widget edit` | Edit your stats |
| `/widget apply` | Shows a guide to apply your widget to your profile (Requires a web browser/Vencord with DevTools enabled) |

---

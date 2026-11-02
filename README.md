# LaplaceRPC

A small, configurable Discord Rich Presence app written in JavaScript. Run it in a terminal or silently in the Windows background, with optional automatic startup at sign-in.

## Features

- Custom details, state, image assets and up to two buttons
- Optional session timer and an `{duration}` placeholder based on your chosen date
- Reconnects every 15 seconds when Discord is unavailable
- Windows start, stop, status and startup controls
- Local logs and process-specific connection status

## Requirements

- Node.js 22 or later with npm
- Discord desktop app, signed in (browser-only Discord is insufficient)
- Your own Discord application from the [Developer Portal](https://discord.com/developers/applications)

No Discord password, bot token or client secret is needed. The application name displayed on your profile comes from your Discord application.

## Setup

1. Download or clone this repository and open a terminal in its folder.
2. Run `npm ci`.
3. Copy `config.example.json` to `config.json`.
4. Replace `YOUR_DISCORD_APPLICATION_ID` with the Application ID from your application's General Information page.
5. Customize the remaining fields, open Discord desktop, then run `npm start` or double-click `start.bat` on Windows.

Keep the project in a permanent folder if you enable startup.

## Configuration

| Field | Meaning |
| --- | --- |
| `clientId` | Your Discord Application ID, as a string |
| `details` | Activity details; `{duration}` becomes time since `activeSince` |
| `state` | Second line of activity text |
| `activeSince` | Past date in `YYYY-MM-DD` format |
| `showElapsedTime` | Show a timer starting when this process starts |
| `largeImageKey` | Asset key uploaded to your Discord application; empty disables the image |
| `largeImageText` | Image hover text |
| `buttons` | Zero to two objects with `label` and `url` (HTTP or HTTPS) |

Example button: `{"label": "Website", "url": "https://example.com"}`.

Restart the app after editing configuration. `config.json` is ignored by Git; publish only the example configuration.

## Windows controls

| File | Action |
| --- | --- |
| `start.bat` | Launch hidden; show current process and connection status |
| `stop.bat` | Stop this copy and verify it exited |
| `status.bat` | Check this copy without starting it |
| `startup.bat` | Enable hidden launch at Windows sign-in |
| `disable-startup.bat` | Remove the sign-in launcher |

The batch windows remain open so you can read their result; closing them does not stop the background process. Startup runs hidden. Re-run `startup.bat` after moving the folder. Startup installation uses one `LaplaceRPC.vbs` entry per Windows user.

On other operating systems use `npm start` and Ctrl+C to stop; Windows launchers are not portable.

## Troubleshooting

- **Process running vs. visible activity:** a running process is not confirmation that your profile displays the activity. The launcher reports Discord's acknowledgement separately.
- **Nothing visible:** check Activity Privacy in Discord and confirm the desktop account. Another game or Rich Presence integration may take priority; temporarily exit that game to isolate the cause. This app cannot force Discord's activity priority.
- **Waiting for Discord:** open the desktop app. LaplaceRPC retries automatically.
- **Invalid configuration:** run `npm start` to see the error.
- **Images missing:** upload the asset to the same application and check the exact key.
- **Diagnostics:** inspect `rpc.log`, `console.log`, `error.log` and `rpc-status.json`. These stay local and are ignored by Git. Status files may contain your Discord username; remove identifiers before sharing diagnostics.
- **Multiple copies:** stop older installations to avoid competing updates.

## Development

Run `npm run check` and `npm test`. Configuration tests run locally without connecting to Discord. Profile visibility still requires a manual Discord desktop check.

## Publishing

Upload this folder's source files to a new GitHub repository, or initialize Git here and push it to your repository. Do not upload `node_modules`, personal `config.json`, logs or status files. A `.gitignore` is included. The MIT license permits reuse, modification and redistribution.

This project is independent of Discord and is not affiliated with or endorsed by Discord.

## License

[MIT](LICENSE)

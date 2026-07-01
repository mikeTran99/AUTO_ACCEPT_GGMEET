# Mike-AutoMeet / Auto Accept GGMeet

Chrome/Edge Manifest V3 extension for hosts, co-hosts, lecturers, and meeting organizers who need to automatically handle Google Meet join requests.

## What it does

- `Allow`: automatically admits waiting participants.
- `Deny`: automatically rejects waiting participants.
- Supports Vietnamese and English Google Meet labels.
- Runs only on `https://meet.google.com/*`.
- Keeps settings in browser storage and does not send data to an external server.

## User guide

- Full Markdown guide: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- PDF guide: [output/pdf/Huong_dan_su_dung_Auto_Accept_GGMeet.pdf](output/pdf/Huong_dan_su_dung_Auto_Accept_GGMeet.pdf)

## Install from GitHub ZIP

1. Click **Code** > **Download ZIP** on GitHub.
2. Extract the ZIP to a stable folder.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted folder that contains `manifest.json`.
7. Open or refresh a Google Meet room.

No build step is required for normal use.

## Recommended settings

1. Enable **Auto handling**.
2. Choose **Allow** or **Deny**.
3. Keep **Safety mode** ON for normal meetings.
4. Keep **Fast response** ON for lower latency.
5. Enable **Allow batch actions** only when you intentionally want `Admit all` or `Deny all` behavior.

## Verify for developers

Use `npm.cmd` on PowerShell:

```powershell
npm.cmd run check
npm.cmd test
```

## Privacy

See [PRIVACY.md](PRIVACY.md). In short, the extension is scoped to Google Meet, stores only local/synced configuration, and does not collect camera, microphone, chat, email, or participant-list data.

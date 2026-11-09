# EMS COMMAND — updates (v3.4)

## What is implemented now
- Installed Electron launcher checks the configured public HTTPS feed automatically.
- Available updates download inside the launcher with real progress. Installation requires a user confirmation.
- All updates must be built from the source repository and distributed only as signed Windows releases.
- The animated ECG is now a genuinely seamless SVG animation (not a GIF or simulated screenshot).

## Before it can update real users
The source repository **Summuryy/EMS-COMMAND** is private. Its GitHub Actions test artifacts cannot be downloaded anonymously by installed clients.

1. Create a dedicated **public** releases repository, e.g. `Summuryy/EMS-COMMAND-RELEASES`. Its contents will be public binaries/metadata, not application source or user records.
2. In the private source repository, add Actions variables:
   - `EMS_RELEASE_REPO` = `Summuryy/EMS-COMMAND-RELEASES`
   - `EMS_UPDATE_FEED_URL` = `https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/`
3. Add Actions secrets:
   - `EMS_RELEASES_TOKEN` — fine-grained GitHub token scoped to the releases repo (Contents: read/write).
   - `CSC_LINK` and `CSC_KEY_PASSWORD` — valid Windows code-signing certificate and password.
4. Run **Publish signed EMS COMMAND update** with `v3.4.0` after CI passes. This builds and publishes `latest.yml`, the signed installer and its `.blockmap` files.
5. Install the signed v3.4 release once; later signed releases will be detected and downloaded in the launcher. The older v3.3 installation is missing a feed and cannot discover v3.4 itself.

Do NOT commit signing keys, tokens or passwords, and do NOT put GitHub access tokens in the installer.

**Current limitation:** A public releases repository and signing credentials have not been connected, so the test GitHub Actions installers are not automatically delivered. Workflows will not release anything without those prerequisites.

## Motion diagnostics
Open Profile → Animations and turn them ON. If Windows has reduced-motion accessibility preferences enabled, continuous ECG movement is intentionally disabled. The ECG should move in the sidebar and the launcher after installing v3.4.

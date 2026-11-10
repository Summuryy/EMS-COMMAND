# EMS COMMAND v3.6 — development / security and motion pass

This branch is a **work in progress**, not a verified Windows release.

## Implemented
- New composited CSS effects for pages, cards, ambient lights and update panel, with reduced-motion support.
- Update center actions separated into check / download / install.
- Update actions guarded by trusted Electron main-frame origin; unauthorized renderer IPC is rejected.
- No automatic download before user action.
- Existing EMS sections and server logic retained.
- CI Windows installer workflow additionally runs on pull requests.

## Important limitations
- This source repository currently contains a stylized SVG of a hospital, **not an authentic screenshot of GTA RP**. The new cinematic CSS does not change that source image. Replacing it with an authorized genuine game screenshot or a separate original scene is outstanding.
- `desktop/release-config.json` has an empty feed URL in development and unsigned test builds. Update checks are intentionally unavailable in those builds. Production updates require an authenticated/trusted public HTTPS release feed and a Windows signing certificate as required by the existing publish workflow.
- Private GitHub Releases cannot be downloaded anonymously. Do not ship `EMS_RELEASES_TOKEN` or another long-lived token to the desktop client.
- Download hash validation provided by electron-updater's metadata does **not**, by itself, authenticate an untrusted manifest. Release signing and trustworthy distribution are separate requirements.
- No claim of Windows runtime animation or updater installation verification until CI and a real Windows-installed run pass.

## Review checklist
1. Run `npm install`, `npm run check`, `npm test`.
2. Build with `npm run dist:win -- --publish never` on a Windows runner.
3. Install and verify that all sections open and real ECG motion is visible with animations enabled.
4. Validate no motion in reduced-motion mode and check GPU-disabled fallback.
5. Verify the check/download/install flows against a controlled signed staging release, then confirm rollback / data preservation.
6. Have a human review the art and game branding/licensing before release.

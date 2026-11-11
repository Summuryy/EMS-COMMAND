# EMS COMMAND — AI PROJECT HANDOFF (living source of truth)
Updated: 2026-11-11. Read this before making changes. This document describes the owner's intent, not a guarantee of current release status.

## Mission and owner preferences
Build a polished, responsive, cinematic Windows desktop companion for GTA 5 RP EMS / state hospital staff. The owner is currently the only tester. This is a private *product development / acceptance* phase; do not announce a public product launch without explicit approval. However, to test each iteration, the owner REQUIRES the latest changes to be delivered as an installable signed app update visible from their EXISTING launcher. A commit or PR alone is NOT delivery. Speak Russian, be direct, and show proof. Do not repeatedly ask the owner to test basic issues that Windows CI can test.

## Repositories and access
Private source: Summuryy/EMS-COMMAND (main branch).
Public binary distribution: Summuryy/EMS-COMMAND-RELEASES (signed app ZIP + signed JSON manifest + portable launcher).
GitHub Actions workflows: .github/workflows/publish-portable.yml, portable-launcher.yml, windows-installer.yml and checks workflow.
The user has previously connected GitHub to ChatGPT; a NEW assistant must inspect whether the GitHub connector is actually available/authorized in its current session. Do not claim connection until a successful repo read. Never request secrets in chat or paste secrets into prompts. Do not put proprietary source in public releases except the explicitly approved inspectable Electron client payload. Public release assets may be accessible to anyone with the link: private testing is not access-controlled.

## Versioning and update path
The user's long-lived portable launcher binary is v1.1.0 (launcher version). The last app version personally reported as installed by the owner was v3.7.1 (historical, not newly verified on-device). As of 2026-11-11 01:56 UTC, main package.json and latest published binary preview are v3.8.0. These are distinct versions; never infer the owner's locally installed version from GitHub releases.
App 3.7.1 added dark titlebar/scrollbars and signed in-app read-only update check. In-app button checks Ed25519-signed release manifest, but app INSTALLATION is still handled by launcher. Do not promise one-click in-app installation unless you actually implement and test a safe handoff.
Signed manifest URL: https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/ems-manifest.json
Release URL pattern: https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/tag/vX.Y.Z
Published ZIP pattern: EMS-COMMAND-App-X.Y.Z-win-x64.zip
Desktop code: desktop/main.cjs, desktop/updates.cjs, desktop/setup-preload.cjs
Launcher code: launcher/core.cjs, launcher/security.cjs, launcher/create-release.cjs
Release request trigger: .github/release-request.json; its version must match package.json. Main push changing this file triggers Windows production publishing. Secrets configured in Actions: EMS_MANIFEST_SIGNING_KEY_PEM_B64, EMS_LAUNCHER_PUBLIC_KEY_PEM_B64, EMS_RELEASES_TOKEN. Never read, print, or reveal them.
Production manifest is Ed25519 signed; ZIP SHA256 and file inventory validated by launcher. Never bypass signature checks, pinning, archive path validation, or file hashes. Existing launcher must continue working without downloading another launcher.
IMPORTANT: published GitHub release snapshot on 2026-11-11 is v3.8.0; always re-check current latest release, asset list, and production job before claiming availability. A release request alone is never proof of publication.

## Current app features / layout
Electron + Node.js 22+, HTML/CSS/vanilla JS modules, local server.
Source views: public/js/views/home.js, evidence.js, shift.js, career.js, academy.js, profile.js, pro.js, admin.js.
Main UI: public/js/app.js, public/index.html, public/styles/v3/*.css.
Functional areas: dashboard, screenshot/evidence import and organization, shift tracking, career/rank progression, charter, profile, administration, experimental auto-capture PRO. Do not imply game integration or automated capture works until tested.
Example owner report for promotion: character Кристиан Стельмащук, static ID 113104, rank 4, 40 first aid treatments, screenshots uploaded to fotora.ru; this is an example of the *data structure*, not a real QA fixture or permission to publish personal screenshots. Screenshots are evidence; classification must be grounded in real image content, not fabricated.
UI vision: dark, elegant, medical operations terminal; alive and cinematic, not a static template, not excessive neon. Real animation/VFX with coherent interactions, scene depth, parallax, ECG, transitions, loading, hover, responsive feedback; avoid fake telemetry, fabricated evidence or stats. Honor reduced-motion and in-app motion toggle; avoid performance regressions.
Motion source: public/js/motion.js, public/styles/v3/motion.css, public/styles/v3/cinematic36.css.
v3.7.2 code includes click ripples, pointer-reactive cards, staggered reveals, menu transitions, heartbeat status, login orbit, toast animation, and pause when window hidden. These effects were code-reviewed via CI but need real-world visual acceptance; don't claim a full 3D engine was delivered.

## Mandatory delivery process for EVERY iteration
1. Read this document and current repository main, version, release request, open PRs and relevant CI/release status.
2. Identify one clear feature batch and implement in source branch. Include tests and QA, and preserve user data. No fake claims.
3. Run npm run check, npm test, Windows installer smoke QA, portable launcher QA; investigate actual failure logs. Avoid GitHub Actions upload-artifact storage-quota failures; PR QA workflows now skip optional artifact uploads.
4. Merge reviewed PR after checks pass. Bump app version for each installable update (3.7.2 -> 3.7.3 etc); ensure no already-published tag collision.
5. Trigger signed production release via .github/release-request.json and verify GitHub Actions production job succeeded.
6. Verify actual public release has the signed manifest and matching app ZIP; ensure manifest version, signature and URL are correct and latest channel points to it. Only then say 'обновление доступно'. If release fails, diagnose/fix/retry, not just give a PR link.
7. Tell owner exactly which app version is installed/available, how to update using existing launcher, and what was tested. Never confuse launcher 1.1.0 with app 3.x.
8. If user wants direct in-app INSTALL button, implement an authenticated launcher handoff explicitly; current check-only UI is insufficient.
9. No official public product launch or advertising without owner approval. Note signed preview distribution is technically public, so warn owner about that tradeoff.

## Known failure modes and decisions
- v3.7.0 UI showed stale v3.6 title, bright Windows titlebar/scrollbar and disabled in-app update check. v3.7.1 targeted these.
- v3.7.2 PR #8: https://github.com/Summuryy/EMS-COMMAND/pull/8 merged after all 3 checks succeeded. Binary preview v3.7.2 is present in the release history; do not confuse historical notes with the current `latest` channel.
- CI test installer once reported failure ONLY in 'Upload installer for review' because Actions artifact storage quota was exceeded; build, metadata verification and Windows NSIS smoke install had passed. PR workflows adjusted to skip artifact uploads; do not mistake quota failure for a broken app.
- Never claim an update is ready when only code is committed.
- The owner explicitly wants the assistant to take initiative, code, test, merge and deliver signed installable previews, not merely plan them.

## New chat trigger
When the owner says 'Привет, работаем дальше', first fetch this file and AGENTS.md from private GitHub, confirm connector access, check current main package version, release request, latest release manifest and production workflow status, and summarize what is genuinely published vs pending. Then resume work on highest-priority unresolved issue without requiring the owner to re-explain the project. If connector unavailable, say so and request reconnection; do not pretend you accessed GitHub.

## Security and integrity
Never commit secrets, personal screenshots, real user credentials, local DBs, tokens, private keys or signing material. Keep user data outside versioned app payload; updates must not overwrite profiles/evidence. Do not invent test results or promise background monitoring without a scheduled task. Keep this file updated when architecture, versions, owner decisions or deployment workflows change.

## Verified delivery history — 2026-11-11 UTC
- **v3.7.3**: PR #9 squash-merged; production preview release exists with signed ZIP manifest.
- **v3.7.4**: PR #10 squash-merged to main at `858844f`; Evidence Registry live search, status summary and responsive mint UI. Production workflow `42934652780` completed successfully. Binary release `v3.7.4` verified in `EMS-COMMAND-RELEASES`; signed manifest and app ZIP present.
- **v3.7.5**: PR #11 squash-merged to main at `7e36bd7` after checks, Windows NSIS smoke install and Portable Launcher QA all reported success. Duty Operations and Career Progress UI updated using existing data/handlers; visual snapshot/actual on-device acceptance has **not** been performed. Production request commit `3955550` triggered workflow `42936418726`, which completed successfully; GitHub `releases/latest` now returns `v3.7.5` published 2026-11-11 01:14 UTC.
- v3.7.5 public binary artifacts: `EMS-COMMAND-App-3.7.5-win-x64.zip` (141358992 B, GitHub SHA-256 `c9d94d8edb92edf056ab1fd679c82068a270f884d941bb022ffa594094255189`), `ems-manifest.json` (73276 B, SHA-256 `162fa49ff9065eae98025f1063b715a6c9b7c8560d81ac463e8adddbcd24b918`), `EMS-COMMAND-Launcher-1.1.0-win-x64.exe` (414484747 B).
- **Verification limits**: GitHub Actions signing, archive-inventory and publish steps passed, but signature verification of independently downloaded 3.7.5 assets and an actual update on owner's Windows machine were not performed by this assistant. Before the next release, verify SHA-256/Ed25519 end-to-end with real downloaded files if environment access allows.
- **Official launch has not been authorized**; public preview binaries are nonetheless publicly accessible. Existing launcher 1.1.0 uses `releases/latest/download/ems-manifest.json` to discover approved app updates. Do not require a re-download of launcher to update the app.

## Verified EMS COMMAND 3.8.0 — Clinical Command visual foundation
- **Code:** PR #12 (https://github.com/Summuryy/EMS-COMMAND/pull/12) squash-merged to main at `26677fbfc06e6c6df6a43e77e5a03f0f54b7094c`. New app version is `3.8.0`.
- **UI:** A shared mint/slate styling layer at `public/styles/v3/clinical38.css` loads after legacy styles and gives navigation, topbar, dashboard, evidence and duty/career surfaces a consistent high-density visual language. The left rail now has real `data-nav` shortcuts. Windows topbar reserves 148px for native caption buttons and adapts at small widths. Home has a genuine API-driven dashboard briefing and compact KPI cards; duty and career cards have reduced whitespace.
- **Motion:** Short CSS-composited entry effects support in-app `data-motion=off` and OS `prefers-reduced-motion`. Existing motion/ECG features remain.
- **Functional safety:** Backend, authentication, OCR, accepted evidence logic, role and promotion rules, shift routes, data persistence, secure Electron settings, signing and launcher trust logic are unchanged.
- **QA:** PR run `42940608443` (`npm run check` / `npm test`) SUCCESS; Windows NSIS smoke run `42940608363` SUCCESS; Portable Launcher Windows QA run `42940608262` SUCCESS (ephemeral Ed25519 QA, exact ZIP inventory, launcher executable verification).
- **Release:** Commit `5f1b59bcd869364e3332888186006e231b0079b2` updated `.github/release-request.json` to `3.8.0`. Production run `42941598852` SUCCESS; GitHub `EMS-COMMAND-RELEASES/releases/latest` now points to `v3.8.0`, published 2026-11-11 01:56:38 UTC.
- **Assets:** `EMS-COMMAND-App-3.8.0-win-x64.zip` (141365379 bytes, SHA-256 `a902633a8fa713605285c31edd46a334cd60cb6c4aaccdd745e045f926ad814e`); `ems-manifest.json` (73466 bytes, SHA-256 `0b24d8163cb16906d3fd46e0bd7d3ed794f0cee500b61e129cac88ef0598221d`); `EMS-COMMAND-Launcher-1.1.0-win-x64.exe` (414501215 bytes).
- **Acceptance caveat:** Full pixel-accurate Windows display testing at 960/1280/1536px and high DPI and end-user installation have not been performed by this assistant. API/QA success is not screenshot acceptance. The third-party performance overlays visible in user screenshots cannot be fixed by window CSS.
- **Launch:** This is a publicly accessible binary-only *preview*, not an authorized official product launch. Existing launcher 1.1.0 fetches `releases/latest/download/ems-manifest.json` and will offer 3.8.0 without reinstalling the launcher.
- **Next focus:** User visual acceptance of 3.8.0, then component-level accessibility, window-width testing and further reduction of legacy CSS conflicts; preserve real functionality.

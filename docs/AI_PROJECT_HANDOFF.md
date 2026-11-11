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
The user's long-lived portable launcher binary is v1.1.0 (launcher version). The installed app was v3.7.1 according to owner; source package.json currently v3.7.2. These are distinct versions.
App 3.7.1 added dark titlebar/scrollbars and signed in-app read-only update check. In-app button checks Ed25519-signed release manifest, but app INSTALLATION is still handled by launcher. Do not promise one-click in-app installation unless you actually implement and test a safe handoff.
Signed manifest URL: https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/ems-manifest.json
Release URL pattern: https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/tag/vX.Y.Z
Published ZIP pattern: EMS-COMMAND-App-X.Y.Z-win-x64.zip
Desktop code: desktop/main.cjs, desktop/updates.cjs, desktop/setup-preload.cjs
Launcher code: launcher/core.cjs, launcher/security.cjs, launcher/create-release.cjs
Release request trigger: .github/release-request.json; its version must match package.json. Main push changing this file triggers Windows production publishing. Secrets configured in Actions: EMS_MANIFEST_SIGNING_KEY_PEM_B64, EMS_LAUNCHER_PUBLIC_KEY_PEM_B64, EMS_RELEASES_TOKEN. Never read, print, or reveal them.
Production manifest is Ed25519 signed; ZIP SHA256 and file inventory validated by launcher. Never bypass signature checks, pinning, archive path validation, or file hashes. Existing launcher must continue working without downloading another launcher.
IMPORTANT: as of writing, release request for 3.7.2 was committed, but its publication has NOT been independently verified in this document. Always inspect actual release and manifest; do not infer from a workflow request.

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
- v3.7.2 PR #8: https://github.com/Summuryy/EMS-COMMAND/pull/8 merged after all 3 checks succeeded. Production release requested through release-request.json; MUST verify its real result.
- CI test installer once reported failure ONLY in 'Upload installer for review' because Actions artifact storage quota was exceeded; build, metadata verification and Windows NSIS smoke install had passed. PR workflows adjusted to skip artifact uploads; do not mistake quota failure for a broken app.
- Never claim an update is ready when only code is committed.
- The owner explicitly wants the assistant to take initiative, code, test, merge and deliver signed installable previews, not merely plan them.

## New chat trigger
When the owner says 'Привет, работаем дальше', first fetch this file and AGENTS.md from private GitHub, confirm connector access, check current main package version, release request, latest release manifest and production workflow status, and summarize what is genuinely published vs pending. Then resume work on highest-priority unresolved issue without requiring the owner to re-explain the project. If connector unavailable, say so and request reconnection; do not pretend you accessed GitHub.

## Security and integrity
Never commit secrets, personal screenshots, real user credentials, local DBs, tokens, private keys or signing material. Keep user data outside versioned app payload; updates must not overwrite profiles/evidence. Do not invent test results or promise background monitoring without a scheduled task. Keep this file updated when architecture, versions, owner decisions or deployment workflows change.

## Pending 3.7.4 Evidence Registry iteration (branch design/evidence-workspace-374)
This UI-only follow-up adds local archive search by filename, reason, category, review status and patient ID; real status counts; clearer empty states; and a scoped responsive visual layer. It preserves evidence API, OCR, import, approval permissions, update signing, and data persistence. Version 3.7.4 is a proposed next installable app version, not a published release until Windows CI, merge, signed assets and launcher manifest verification complete. The public production 3.7.3 preview was requested earlier and must be verified independently.

## Pending 3.7.5 duty/career UI iteration (branch design/duty-career-workspace-375)
After 3.7.4 Evidence Registry integration, this distinct visual-only batch adds real-data shift readiness, completed shift-history count, quick evidence navigation, clearer checkpoint verification guidance, and career goal summaries that do not conflate accepted screenshots with administrative promotion or physical-location proof. Scope: public/js/views/{shift,career}.js, public/styles/v3/operations375.css, public/index.html, tests/ui.test.mjs and package.json. All controls use existing delegated handlers and API; signing, data persistence, role permissions, promotion rules, and shift server routes stay unchanged. 3.7.5 is an **unreleased version proposed by an open PR**, not yet available through the launcher. No official launch permission has been given.

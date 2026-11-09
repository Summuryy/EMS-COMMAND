# EMS COMMAND v3.6 — security and release review
Date: 2026-11-09. Scope: connected private repository `Summuryy/EMS-COMMAND`.

## Code reviewed
- `desktop/main.cjs`, `desktop/setup-preload.cjs`, `desktop/updates.cjs`.
- `server/index.mjs`, `server/api.mjs`, `server/security.mjs`, `server/vision.mjs`, `server/jobs.mjs`, `server/config.mjs`.
- `public/js/app.js`, `public/js/motion.js`, UI views and CSS.
- `package.json` and Windows packaging/publishing GitHub workflows.

## Improvements committed to this branch
1. Update IPC checks the Electron main-frame identity and the local application origin before returning state or triggering an updater action.
2. Admin bootstrap is permitted only from the actual setup page loaded in the active top-level Electron window; child-process stdout/stderr is bounded and bootstrap calls time out.
3. Local HTTP mode rejects foreign `Host` headers (reducing DNS rebinding exposure).
4. Static file serving resolves symlinks and rejects files outside the public asset root.
5. Manual updater sequence is **check → download → install**, with an explicit installation dialog. With a configured feed, startup checks never silently download.
6. Retains `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, denied permissions, a restrictive preload API, CSP and server-side role controls.
7. New independent cinematic SVG artwork replaces the previous block-building SVG in the main dashboard and sign-in screen.
8. Motion observer and animation-frame cleanup limits work across page changes. Reduced-motion and user motion toggle remain supported.

## Existing controls observed
- Stored passwords use scrypt; session cookies use HttpOnly and SameSite=Strict, and HTTPS mode uses Secure.
- CSRF token and Origin header checks protect changes through the HTTP API.
- Uploaded images have size/pixel limits and signature checks; stored filenames use generated IDs.
- Evidence retrieval checks ownership or employee review roles; admin writes require server-side roles.
- Local database is located in Electron user data, not inside the install directory.

## Outstanding risks and release blockers
- This is a **source review and CI audit**, not an independent penetration test.
- A configured public HTTPS feed is necessary; `desktop/release-config.json` remains unconfigured in test builds. A private repository cannot anonymously distribute installer updates without a separate public or authenticated release channel.
- SHA hashes in an untrusted `latest.yml` do not independently authenticate downloaded executables. The production release workflow currently requires a valid Windows code-signing certificate. Do not distribute unsigned installers as verified automatic updates.
- OCR recognition reliability and actual in-game accuracy are not proven by these CI checks.
- Local Windows UI animation, update install/rollback and actual screen rendering require an installed-run test.
- A visual screenshot generated as artwork is **not** a real screenshot of the GTA RP server. The added asset is original concept artwork.

## Acceptance
- `npm run check`, `npm test`, and `npm run dist:win -- --publish never` must pass on this branch.
- GitHub Actions should produce a non-expired installer artifact and hash-checked `latest.yml` as a **test-only** output.
- On Windows: open every page, verify the hero scene and animations, test motion-off, profile/shift persistence, local evidence import, administrative access control, and safe failed-update behavior before merging.

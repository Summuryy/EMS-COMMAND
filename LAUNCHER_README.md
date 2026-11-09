# EMS COMMAND Launcher — portable Windows distribution (v3.6)

## Architecture

The original Electron EMS COMMAND application (evidence, shift, rank, academy, profile, PRO, administration) is unchanged in its core business workflows. The new `launcher/` project is an **independent Windows executable** built via electron-builder's **portable** target. It is not an NSIS wizard installer.

On startup, the launcher automatically checks for a signed release. If a newer signed version is available, it downloads the app ZIP, validates its SHA-256, checks all extracted files against a signed inventory, installs to an immutable version directory, then switches an atomic `state.json` pointer. The launcher UI exposes **Check**, **Update**, **Repair**, **Launch**, and **Rollback**, with live download and verification progress.

### Local storage

- Launcher: one portable `EMS-COMMAND-Launcher-...exe` (can reside anywhere in the user's writable directory).
- App binaries: `%APPDATA%/EMS COMMAND Launcher/managed/versions/<version>/` (Electron's actual app userData path controls this location).
- Release record and current pointer: `managed/records/` and `managed/state.json`.
- User profiles, evidence, shifts, and database: original **EMS COMMAND** userData folder, **outside** installed version directories. Existing data must not be migrated or deleted during updates.
- A previous version remains installed for rollback. Repair downloads and verifies the same signed release again.

### Trust boundary

- `launcher/trust.json` pins the long-lived **Ed25519 public verification key**. The **private signing key is NEVER included in the app, launcher, or public release**.
- A manifest contains the app version, exact official GitHub release URL, ZIP SHA-256 and exact file inventory. The manifest is signed, and the launcher validates this signature before any installation.
- HTTPS-only GitHub release/CDN hosts, capped manifest/archive size, defensive ZIP path checks, no symlinks, complete SHA-256 check of extracted files. No arbitrary scripts are executed from a release.
- Release artifacts **must be published from a trusted CI process**, using protected GitHub production environment approval. Do not use a user-controlled fork/PR to sign production files.
- An unsigned Windows launcher may still trigger SmartScreen. **Ed25519 protects app update integrity; it does not provide a Windows Authenticode signature.**
- This version updates the **application**, not the launcher executable itself. To upgrade the launcher binary, publish a new portable launcher and explicitly replace the old one; add separately signed launcher self-updates in a future release.

## GitHub configuration before real-world use

1. Keep source repository `Summuryy/EMS-COMMAND` **private**.
2. Create a separate **public, binary-only** repository `Summuryy/EMS-COMMAND-RELEASES`. Do not push source code, user data or credentials there.
3. Generate one Ed25519 private/public key pair **locally**, store an offline backup, and never rotate it without a deliberate trusted launcher transition. Convert each PEM to base64 (including PEM headers and newlines).
4. In the private source repo, configure GitHub Actions **secret** `EMS_MANIFEST_SIGNING_KEY_PEM_B64` (private PEM base64), **variable** `EMS_LAUNCHER_PUBLIC_KEY_PEM_B64` (public PEM base64), and **secret** `EMS_RELEASES_TOKEN` (minimum privilege to create releases in the public binary repository).
5. Protect the `production` GitHub Actions environment with reviewer approval/branch restrictions. Use the workflow **Publish signed portable EMS COMMAND** with version equal to `package.json`. The workflow checks the public binary-only repo, builds the app ZIP, signs the inventory, pins the public key in the launcher, builds the launcher, and publishes all artifacts to GitHub Releases.
6. Download the released `EMS-COMMAND-Launcher-...exe` **once**; future versions of EMS COMMAND are downloaded from Releases by the launcher. No NSIS installation wizard is needed.

**Important:** The regular Pull Request QA workflow intentionally creates a **fresh ephemeral key** solely for validation; its builds are marked `QA-NOT-FOR-RELEASE` and **must not be distributed as a production updater**. The launcher included in such an artifact will not trust later production releases unless built with the permanent public key.

## Build/check

- Run `npm install` at project root and `npm --prefix launcher install` once to set up build dependencies.
- `npm run check && npm test`.
- `npm run dist:dir` creates the unpacked app (`dist/win-unpacked/`).
- On Windows, compress the **contents** of this directory into `dist/EMS-COMMAND-App-3.6.0-win-x64.zip`, preserving top-level `EMS COMMAND.exe`.
- `node launcher/create-release.cjs dist/win-unpacked dist/EMS-COMMAND-App-3.6.0-win-x64.zip` requires both signing key environment variables. Never commit the generated private key.
- `npm run dist:launcher -- --publish never` creates the portable launcher EXE.

## Acceptance criteria

- Windows CI checks Node source, unit tests, payload ZIP extraction, exact file hashes, portable launcher packaging, and PE executable header.
- A person must still run the resulting portable launcher **on Windows**, check first installation, interrupted download/retry, update while the app is open, corrupted file repair, rollback, and compatibility with existing user data.
- Until the public release repo, protected key and production pipeline have been configured and tested, do not describe live updates as operational.

## Limitations

- Full application versions are archived as ZIPs, so this iteration downloads a complete new version on update rather than binary deltas.
- Rolling back switches to an existing verified version of the executable; it does not downgrade or migrate a newer user database schema.
- If rollback is needed after a database schema migration, a separate tested backup/migration strategy is required.
- The source repository's previous Windows NSIS workflow is retained as a compatibility fallback, not the new primary distribution method.

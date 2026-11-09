# EMS COMMAND

Desktop application for GTA 5 RP hospital personnel (independent, unofficial project).

**Current status:** repository initialized for source migration. Application v3.0 sources have **not yet been imported**. The CI workflow is ready to run checks once `package.json` and project files are added. No automatic Windows updater or GitHub Release is active yet.

## Planned modules
- Electron desktop launcher with left navigation and medical RP design
- Shifts, career progress, charter, profile and protected admin area
- Unified screenshot import, OCR and evidence classification
- EMS Vision event capture (planned; opt-in and local processing)
- Future signed Windows installer and stable-release updates

## Safety
Keep `.env`, databases, user screenshots, logs, payment credentials and signing keys outside the repository. Files excluded by `.gitignore` should never be committed. Capture and subscription features are not yet production-ready.

## Next step
Import the reviewed EMS COMMAND v3.0 application source, ensure `npm run check` and `npm test` pass, then add Windows build and signed release automation. See [release and updater plan](docs/RELEASES.md).

# EMS COMMAND — release and update strategy

## Purpose
One installed Windows desktop application. Development happens in GitHub, but only explicitly published **stable releases** are delivered to users.

## Planned delivery
1. Develop and review changes through pull requests.
2. Run syntax and automated tests in CI.
3. Build a Windows installer on a Windows GitHub Actions runner.
4. Sign releases with an organization-controlled signing certificate (required before enabling unattended updates).
5. Publish artifacts to GitHub Releases tagged `vX.Y.Z`.
6. The installed Electron application checks the configured update feed, shows download progress, and installs only after user confirmation and after the active shift has ended.
7. Persist the database, uploaded evidence, credentials and settings in a user-data location outside the install directory; back up the database before migrations.

## Important
- Do not download and execute arbitrary files from branch commits.
- Do not expose repository/GitHub tokens in the Electron renderer.
- Do not store game screenshots, user databases, payment secrets or credentials in the repository.
- GitHub distribution and paid PRO entitlement verification are separate systems.
- No updater is implemented yet. The workflow currently checks source syntax and tests only after app sources are imported.
- A private repository is convenient for development, but public release distribution needs a deliberate access strategy. A private GitHub Release is **not** an anonymous download endpoint for all users.

# EMS COMMAND — 3.9.4 server profile contract (development foundation)

This is a code-only preparation branch, not an application update or a signed release.

## Objective
Make the underlying rules model usable across Russia Online, GTA5RP, Majestic and other communities without silently treating one server's hospital regulations as another's.

## Implemented
- `server/server-profiles.mjs`: explicit platform and server IDs, schema version, optional versioned promotion and evidence rules, verified/draft state, source URL and timestamp fields.
- `tests/server-profiles394.test.mjs`: rejects malformed identities, duplicate rules and accidental verified status without documentary metadata.
- Initial Russia Online / Kutuzovsky profile is intentionally a **draft** with no invented numbers or acceptance criteria.

## Not implemented
- No UI selecting servers, migrations, user/account scoping, admin rule editor, or integrations with game servers.
- No changes to live evidence decisions, rank calculation, launcher, signing, or database.
- Rules are not automatically trusted just because a URL is present. Verification must be a documented admin action and later added to authorization checks.

## Next steps and required evidence
1. Owner supplies official Russia Online server/EMS rank tables and faction handbook (with revision/version).
2. Add server-scoped storage and migrations for roles, progress goals, users and evidence. Existing profile `server_name` strings must **not** be used as globally unique identity.
3. Give staff an explicit platform/server selector; add a visible rules-version badge and unmistakable draft-status warning.
4. Only after reviewer/security tests pass, wire a profile to the career screen and screenshot classifier.
5. Prepare Majestic and GTA5RP profiles as separate drafts until their regulations are individually verified.

## Test gates
Run Node tests and CI on the branch. Never publish a signed `3.9.4` preview from this draft module alone.

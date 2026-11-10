# AI coding agent instructions — EMS COMMAND
This project is a Windows Electron application. Before making ANY change, read [docs/AI_PROJECT_HANDOFF.md](docs/AI_PROJECT_HANDOFF.md) in full. It contains owner preferences, product vision, security, release/update workflow, and the new-chat trigger.

Core rule: **code/PR != installed update**. The owner expects each tested iteration to be published as a signed version that their existing launcher can detect. Do not say an update is available until verifying the real production release, signed manifest and ZIP. Avoid announcing an official public product launch without explicit owner consent. Public preview distribution is still publicly accessible.

Do not change Ed25519 signing, pinned keys, file inventory verification, sandboxing or user data persistence without security tests. Do not print or commit tokens, credentials, signing keys, databases or screenshots.

Work in Russian when reporting to the owner. Run npm run check, npm test and Windows QA. Read failures and fix them. Maintain the handoff document after material changes.

# AI coding agent instructions — EMS COMMAND
This project is a Windows Electron application. Before making ANY change, read [docs/AI_PROJECT_HANDOFF.md](docs/AI_PROJECT_HANDOFF.md) in full. It contains owner preferences, product vision, security, release/update workflow, and the new-chat trigger.

Core rule: **code/PR != installed update**. The owner expects each tested iteration to be published as a signed version that their existing launcher can detect. Do not say an update is available until verifying the real production release, signed manifest and ZIP. Avoid announcing an official public product launch without explicit owner consent. Public preview distribution is still publicly accessible.

Do not change Ed25519 signing, pinned keys, file inventory verification, sandboxing or user data persistence without security tests. Do not print or commit tokens, credentials, signing keys, databases or screenshots.

Work in Russian when reporting to the owner. Run npm run check, npm test and Windows QA. Read failures and fix them. Maintain the handoff document after material changes.

## Project-scoped design and motion skills

Reusable, MIT-licensed agent skills are vendored in [`.agents/skills/`](.agents/skills/README.md), with pinned upstream commits and licenses. These are instructions for compatible coding agents, **not Electron runtime code and not automatically installed ChatGPT capabilities**.

For EMS COMMAND visual work, use `design-taste-frontend` and `redesign-existing-projects`; for motion use `emil-design-eng`, `animate`, `choreograph`, `review-animations`, `animation-performance`, `improve-animations` and `find-animation-opportunities` as applicable. Only load relevant skills for the current task. Root project security, data authenticity, accessibility, user motion preferences, and signed release requirements take precedence over generic examples in third-party skills. Do not automatically add GSAP/WebGL/dependencies or replace the existing stack.

Skill-only documentation changes do not change the installed app version or require a Windows binary release. Future application code changes still require tests, Windows QA and signed preview delivery.


For navigation, task flows, and first-time user onboarding, review `[.agents/roles/navigation-architect.md](.agents/roles/navigation-architect.md)`. This is a project-scoped reviewer role for compatible agents, **not a separate process already running**. Validate the UX with actual staff tasks and data, not visuals alone.

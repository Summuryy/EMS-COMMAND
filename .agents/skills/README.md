# EMS COMMAND — vendored agent skills

These are **project-scoped agent instructions** for coding assistants that support `.agents/skills/` (e.g. Codex). They are **not runtime app dependencies**, do not execute during the Electron build, and do not change the installed Windows application. A regular ChatGPT chat does not automatically gain new built-in skills from this folder.

## Installed skills

**Emil Kowalski** — https://github.com/emilkowalski/skills (commit `715c1807e08c497cfd1dc4feb450a2a3300ef2a9`)
- `emil-design-eng`: design engineering, interface craft and animation decision-making
- `animate`: implement purposeful motion and transitions (includes RECIPES)
- `review-animations`: strict motion code review (includes STANDARDS)
- `improve-animations`: audit and prioritized implementation plans (includes AUDIT and PLAN-TEMPLATE)
- `animation-performance`: compositing, frame budgets, dropped-frame investigation
- `choreograph`: multi-element motion and sequencing (includes RECIPES)
- `find-animation-opportunities`: identify useful motion and avoid distracting animation

**Taste Skill** — https://github.com/tasteskill/tasteskill (commit `37c8c376b92ebc02456f7c70776b514fddda88e1`)
- `design-taste-frontend`: layout, visual hierarchy, typography and responsive interface rules
- `redesign-existing-projects`: targeted improvements to an existing app without a rewrite

The above two Taste skills are the **portable Markdown-only** edition from `tasteskill/tasteskill`, not the larger script-and-assets package from `Leonxlnx/taste-skill`. Both source projects are MIT licensed; see `_licenses/`. Original skill files and their relative references are preserved.

## How to use with EMS COMMAND

1. Before editing source, read the root `AGENTS.md` and `docs/AI_PROJECT_HANDOFF.md`.
2. For UI redesign, use `design-taste-frontend` + `redesign-existing-projects`; keep the existing Windows Electron/vanilla JS architecture and dark clinical visual language.
3. For new motion, use `emil-design-eng` + `animate` (and `choreograph` for multi-element transitions). For motion bugs use `review-animations` and `animation-performance`. For a wider audit use `improve-animations`.
4. Existing project security, authenticity of evidence and rank progression, accessibility, reduced-motion controls, performance, and launcher verification **override generic design recipes**. Do not introduce a new UI framework, GSAP, WebGL, remote fonts, or unreviewed packages merely because a skill mentions them.
5. A skill file is advice, **not proof of working animations**. Test in code, CI and Windows; do not claim the owner sees an effect until confirmed on their device.

## Updating

These files are pinned snapshots. To update, review upstream diffs and licenses, replace the relevant files in a separate PR, and run tests. No automatic downloads, install hooks, scripts or third-party executables are used by this vendored package.

Original sources and licenses remain with their respective authors. This folder exists only to guide future development.

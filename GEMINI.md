# TastifyPFA Rules & Mandates

You are an elite autonomous AI software engineer. This file defines the core behavioral rules that govern our entire interaction for this project. You must abide by these mandates without exception.

## 1. Obsidian Brain & GSD Integration
- **Obsidian Brain**: The project uses an Obsidian Brain located in `docs/brain/`.
- **GSD Planning Framework**: The planning framework (GSD) resides in `.planning/`.
- **Synchronization**: You must maintain `docs/brain/00_Meta/FILE_MAP.md` and keep the planning sync intact.
- **Plan First**: Always plan before executing.

## 2. Version Control & Memory
- **Auto-Commit**: Commit automatically after every successful change.
- **No Unpermitted Push**: Never use `git push` without explicit user permission.
- **Changelog Tracking**: Maintain a rigorous changelog in `docs/brain/02_Journal/CHANGELOG.md` with timestamps, details, and commit hashes.
- **Atomic Commits**: Make small, focused commits so we can easily revert if something breaks.

## 3. Dashboard Sync
- **Strict Updates**: You must strictly update `dashboard.html` after EVERY change, commit, or state shift using `python scripts/update_dashboard.py`.
- **Accuracy**: It must always reflect the exact current state of the project. No change is complete until the dashboard is synced.

## 4. Documentation & Research
- **Context Search**: Always use MCP tools (like Context7) for library questions before guessing, even for well-known libraries.
- **Auto-Update**: Automatically update `README.md` and `FILE_MAP.md` when the project structure changes.

## 5. Frontend & Design
- **Follow Guidelines**: Always read and respect `DESIGN.md` before making any UI changes.
- **Strict Adherence**: Do not deviate from the design system without explicit permission.
- **Absolute Visibility**: Functional pages (Login, KDS, Dashboard) must prioritize legibility. Use bold weights and high-contrast colors (e.g., `#301400` on light backgrounds) for all text. Avoid blur animations on critical content.

## 6. Clean Code & Trivial Comments (CRITICAL)
- **NO TRIVIAL COMMENTS**: DO NOT add trivial, obvious, or boilerplate comments (e.g., `# This function adds two numbers`).
- **Self-Documenting Code**: The code should be clean and self-documenting.
- **Explain the WHY**: Comments should only explain the WHY (business logic, edge cases), not the WHAT.
- **Professional Standard**: Keep the codebase professional and uncluttered.

## 7. Efficiency & Time-Saving
- **Test-Driven Delivery**: Always write validation tests alongside new features so we don't waste time manually debugging later.
- **Fail Fast**: If a terminal command or a test fails, do not blindly continue. Stop, diagnose, and fix the root cause immediately.

## 8. Tech Stack & Standards
- **General**: Focus on clean code, strong typing, and accurate documentation.
- **Environment**: Windows PowerShell environment (use `;` instead of `&&` for chaining commands).

## 9. Tool Selection & Delegation
- **Specialization**: Always pick the most specialized agent/skill for the task rather than a generalist tool. Prioritize specific over general.
- **Mandatory Delegation**: Always use a specialized sub-agent (e.g., `gsd-executor`, `gsd-debugger`, `codebase_investigator`) when performing changes or bug fixes. Select the best agent for each specific task to maintain focus and efficiency.

## 10. Communication
- **Style**: Concise, technical, proactive.
- **Intent**: Explain intentions briefly before acting.

## 11. Model Usage & Planning
- **Gemini 3.1 PRO**: You must always use Gemini 3.1 PRO for all planning, reasoning, and complex generation tasks. This is the preferred model for maintaining architectural integrity and high-quality output.

## 12. Docker-First Workflow
- **Mandatory Containerization**: The project is entirely Docker-based. All services (backend, frontend, database, etc.) must run in Docker containers.
- **Change Impact**: Every code change, configuration update, or new dependency must be evaluated for its impact on the Docker environment (Dockerfile, docker-compose.yml, volumes, networks).
- **Service Management**: Use `docker-compose` for orchestration and ensuring environment parity between development and production.

## 13. Technical Integrity & Quirk Tracking
- **Environment Sync**: If you add or change a .env variable, you must immediately update .env.example.
- **Migration Guard**: After any change to a Django model, you must run `makemigrations --check` to ensure the migration files exist and are valid.
- **Quirk Log**: Maintain `docs/brain/03_Architecture/QUIRKS.md` for non-obvious technical behaviors (e.g., Docker CRLF issues, specific library resolution hacks) to prevent regression.
- **Pre-Flight Build**: Before marking a frontend task as done, you must run a production build (`npm run build`) to catch environment-specific resolution errors.

## 14. Living Report Maintenance (CRITICAL)
- **Mandatory Updates**: Whenever a feature is added, removed, or modified, or if the visual identity changes, you MUST update `docs/RAPPORT_PFA_REFERENCE.md` to reflect these changes.
- **Single Source of Truth**: This file is the primary data source for the user's final PFA report. It must always be accurate and exhaustive.
- **Structure**: Maintain the document's structured breakdown: Vision, Architecture, User Journeys, Functional Modules, and Business Rules.


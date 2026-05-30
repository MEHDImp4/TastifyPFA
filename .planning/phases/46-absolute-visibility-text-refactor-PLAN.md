# Phase: Absolute Visibility Refactor (Text Contrast)

## Goal
Improve text contrast and remove transparency from text colors in `app/frontend/backoffice-app/src/` to adhere to the "Zero Transparency" and "Absolute Visibility" mandates.

## Tasks
- [x] Replace `text-on-surface-variant/[1-5]0` with `text-on-surface-variant`
- [x] Replace `text-on-surface/[1-5]0` with `text-on-surface`
- [x] Replace `placeholder:text-on-surface-variant/[1-5]0` with `placeholder:text-on-surface-variant`
- [x] Replace any other `text-[color]/[1-5]0` with `text-[color]` (where opacity < 60%)
- [x] Run `npm run build` in `app/frontend/backoffice-app` to ensure no breakages.
- [x] Update dashboard and commit changes.

## Verification
- Visual inspection of changed files.
- Successful production build.

# code-style
- Use French for all UI strings, labels, badges, and status text throughout the project. Confidence: 0.70
- Prefer targeted edit_file over full write_file rewrites; use write_file only as a last resort for corrupted files. Confidence: 0.65

# workflow
- Run tsc -b typecheck after file modifications and before considering a phase complete. Confidence: 0.70
- Run frontend unit tests (vitest) after completing a batch of changes to verify no regressions. Confidence: 0.65

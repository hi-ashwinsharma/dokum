<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dokum Project Rules

## Tech Stack & Styling
- Next.js 16, Tailwind CSS v4, TypeScript, Firebase, PDF-lib.
- Main theme variables are defined in [globals.css](file:///Users/ashwinsharma/Hotcrunch/dokum/src/app/globals.css) (e.g. `--bg-main`, `--bg-surface`, `--text-primary`, `--border-subtle`). Use these via Tailwind theme values (e.g. `bg-bg-main`, `text-text-primary`, `border-border-subtle`).

## Coding Guidelines
- **Strict TypeScript**: Never use `any` or `unknown`. Write explicit, precise types.
- **Local-First & Offline**: Dokum is a local-first browser-based PDF workspace. All file processing happens client-side using `pdf-lib` and `pdfjs-dist`.
- **CSS / UI**: Ensure modern, premium, glassmorphism-based designs matching the existing color scheme. Maintain smooth, interactive transitions using Framer Motion.

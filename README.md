# Source Control Panel

A VS Code / Cursor extension that enhances the source control experience with line stats, parent folder grouping, Material icons, and AI-powered change summaries.

## Features

- **+/- line counts** — See additions and deletions next to each changed file (green for +, red for -)
- **Parent folder grouping** — Files are organized under collapsible folder sections (src, test, components, etc.)
- **Material icons** — Colorful file and folder icons for TypeScript, JavaScript, Python, and 50+ other file types
- **AI change summary** — One-click summary of your changes using Google Gemini Flash (1–6 bullet points with color-coded highlights)
- **Click to diff** — Click any file to open the built-in diff view

## Screenshots

The extension adds a dedicated **Source Control Panel** icon to the Activity Bar. Click it to see your changes with:

- Staged Changes
- Unstaged Changes  
- Untracked Files

Each file shows its parent folder, Material icon, and +/- line stats.

## Installation

### From VSIX (local install)

1. Download the latest `.vsix` from [Releases](https://github.com/YOUR_USERNAME/cursor-source-control/releases)
2. In Cursor/VS Code: **Extensions** → `...` menu → **Install from VSIX...**
3. Select the downloaded file and reload

### From source

```bash
git clone https://github.com/YOUR_USERNAME/cursor-source-control.git
cd cursor-source-control
npm install
npm run compile
```

Then install the built extension:

```bash
npx vsce package
# Install the generated .vsix via Extensions → Install from VSIX
```

Or run in development: press **F5** to launch the Extension Development Host.

## Configuration

### Gemini API key (for AI summaries)

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open **Settings** (`Cmd+,` / `Ctrl+,`)
3. Search for **Source Control Panel**
4. Paste your key into **Gemini Api Key**

The **Summarize Changes** button will then generate bullet-point summaries with color-coded highlights (green = added, red = removed, yellow = modified).

## Development

```bash
npm install
npm run compile   # Build
npm run watch     # Watch mode
```

### Project structure

```
├── src/
│   ├── extension.ts      # Entry point, commands, watchers
│   ├── webviewProvider.ts # Webview UI with summary + file list
│   ├── gitService.ts      # Git diff/status via CLI
│   ├── geminiService.ts   # Gemini Flash API for summaries
│   ├── iconMap.ts         # File extension → Material icon mapping
│   └── types.ts           # Shared types
├── resources/
│   ├── icon.svg           # Activity bar icon
│   └── icons/             # Material icons (53 files)
├── package.json
└── tsconfig.json
```

## Requirements

- VS Code or Cursor ^1.85.0
- Git (for change detection)
- Google Gemini API key (optional, for AI summaries)

## Pushing to GitHub

Before publishing:

1. Replace `YOUR_USERNAME` in `package.json` (repository, bugs, homepage URLs) with your GitHub username
2. Replace `YOUR_USERNAME` in this README's clone/install URLs
3. Create a new repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cursor-source-control.git
git push -u origin main
```

## License

MIT — see [LICENSE](LICENSE) for details.

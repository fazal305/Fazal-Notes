# Fazal Notes

A real note-taking app I built and use daily — not a demo. This repo documents its actual version history: a 1.0 release, real usage analytics, a real feedback/bug loop, and a 2.0 release built in response to that feedback.

## Live Links

- GitHub Repository: [fazal305/Fazal-Notes](https://github.com/fazal305/Fazal-Notes)
- Live Demo: [https://fazal305.github.io/Fazal-Notes/](https://fazal305.github.io/Fazal-Notes/)

## Overview

Fazal Notes is a local-first browser note-taking product with folders, tags, search, pinning, markdown preview, note linking, revision history, Trash recovery, feedback tracking, a public-style roadmap, changelog discipline, and real usage analytics.

It is built as a real product lifecycle project: Version 1.0 shipped the usable notes app, then Version 2.0 added iteration features based on the product feedback loop.

## Version History

### 1.0.0

Initial usable release:

- Create, edit, delete, pin, and search notes
- Organize notes with folders and tags
- Basic markdown preview
- Submit feedback and bug reports
- View analytics computed from real usage events
- View a real changelog timeline
- Customize theme and workspace settings
- Export/import workspace JSON
- Reset demo data or clear localStorage

### 2.0.0

Product iteration release:

- Added Roadmap board with Planned, In Progress, and Shipped columns
- Added note-to-note linking using `[[Note Title]]`
- Added per-note revision history with restore
- Added Trash with restore and permanent delete
- Added feedback status workflow: open → in progress → resolved
- Added promote-to-roadmap workflow
- Added deeper analytics: streaks, top tags, time-of-day heatmap, and word-count trends

## Pages

- Dashboard
- Notes
- Feedback & Bug Reports
- Roadmap
- Analytics
- Changelog
- Settings

## Features

### Version 1.0

- Notes CRUD
- Folders
- Tags
- Search and filters
- Pin/unpin notes
- Markdown preview
- Feedback submission
- Basic analytics
- Changelog
- Theme settings
- Export/import workspace JSON

### Version 2.0

- Linked notes
- Revision history
- Restore previous versions
- Soft-delete Trash
- Restore deleted notes
- Permanent delete
- Roadmap board
- Roadmap voting
- Roadmap status movement
- Feedback status workflow
- Promote feedback to roadmap
- Writing streaks
- Most-used tags
- Time-of-day activity
- Word-count trend

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Chart.js
- localStorage
- Blob API
- Clipboard API

## Learning Outcomes

- Building a real local-first browser product
- Designing a shared workspace data model
- Logging real usage events for analytics
- Creating a feedback-to-roadmap product loop
- Managing changelog and version history
- Implementing revision history and restore
- Creating a dynamic theme system with CSS variables
- Building a multi-page no-build-tool application

## Architecture Notes

Fazal Notes uses a multi-page architecture. Each page has its own HTML, CSS, and JavaScript file. Shared helpers, localStorage state, theme application, navigation, and transitions live in `js/shared.js`.

All product data is stored in one shared localStorage workspace:

- notes
- folders
- feedback items
- feature requests
- usage events
- changelog entries
- activity log
- settings
- theme tokens

Analytics are computed from real app data, especially `workspace.usageEvents`. This means the charts and stats update when the user actually creates notes, edits notes, submits feedback, upvotes roadmap items, exports data, or performs other meaningful actions.

## Folder Structure

```text
fazal-notes/
  index.html
  notes.html
  feedback.html
  roadmap.html
  analytics.html
  changelog.html
  settings.html

  styles.css

  css/
    dashboard.css
    notes.css
    feedback.css
    roadmap.css
    analytics.css
    changelog.css
    settings.css

  js/
    shared.js
    dashboard.js
    notes.js
    feedback.js
    roadmap.js
    analytics.js
    changelog.js
    settings.js

  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/Fazal-Notes.git
cd Fazal-Notes

Open:

index.html

No build tools are required.

How I Use It

I use Fazal Notes as a personal writing and product-thinking workspace. It helps me capture project notes, organize ideas, track bugs, collect feature requests, and review real usage patterns through analytics.

Future Improvements
Search result highlighting
Better markdown parser
Export individual notes
Import Markdown files
Daily note templates
Keyboard shortcuts
Optional cloud sync
Better mobile editor layout
License

MIT License

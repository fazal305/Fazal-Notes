# Fazal Notes

A real note-taking app I built and use daily — not a demo. This repo documents its actual version history: a 1.0 release, real usage analytics, a real feedback/bug loop, and a planned 2.0 release built in response to that feedback.

## Live Links

- GitHub Repository: [fazal305/fazal-notes](https://github.com/fazal305/fazal-notes)
- Live Demo: [https://fazal305.github.io/fazal-notes/](https://fazal305.github.io/fazal-notes/)

## Overview

Fazal Notes is a local-first browser notes app with folders, tags, pinning, search, markdown preview, feedback tracking, changelog discipline, and real usage analytics. It runs with HTML, CSS, JavaScript, Bootstrap, jQuery, Chart.js, and localStorage.

## Version History

### 1.0.0

Version 1.0.0 shipped the first complete usable release:

- Create, edit, delete, pin, and search notes
- Organize notes with folders and tags
- Basic markdown preview
- Submit feedback and bug reports
- View analytics computed from real usage events
- View a real changelog timeline
- Customize theme and workspace settings
- Export/import full workspace JSON
- Reset demo data or clear localStorage

## Pages

- Dashboard
- Notes
- Feedback
- Roadmap
- Analytics
- Changelog
- Settings

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

## Architecture Notes

Fazal Notes uses a multi-page architecture. Each page has its own HTML, CSS, and JavaScript file, while shared helpers live in `js/shared.js`.

All main app data is stored in one shared localStorage workspace. Notes, folders, feedback items, feature requests, changelog entries, usage events, and settings all read from the same workspace object.

Analytics are not fake numbers. They are computed from real `usageEvents` created when the user creates notes, edits notes, deletes notes, submits feedback, exports data, and performs other meaningful actions.

The theme system is dynamic. CSS custom properties are updated from the workspace theme settings, and users can customize colors, radius, fonts, sidebar mode, and transition speed.

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

Clone the repository:

git clone https://github.com/fazal305/fazal-notes.git
cd fazal-notes

Open:

index.html

No build tools are required.

How I Use It

I use Fazal Notes as a personal writing and product-thinking workspace. It helps me capture project ideas, organize notes by folders and tags, track issues, and review my own usage through analytics.

Version 2.0 Roadmap

Planned for the next release:

Note-to-note linking with [[Note Title]]
Per-note revision history and restore
Soft-delete Trash with recovery
Roadmap board with voting
Feedback status workflow
Deeper analytics with streaks, top tags, time-of-day activity, and word count trends
License

MIT License

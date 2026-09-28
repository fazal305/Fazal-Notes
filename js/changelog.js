"use strict";

function ensureV2ChangelogEntry() {
  const workspace = loadWorkspace();

  const alreadyExists = workspace.changelogEntries.some(
    (entry) => entry.version === "2.0.0",
  );

  if (alreadyExists) return;

  workspace.appVersion = "2.0.0";

  workspace.changelogEntries.unshift({
    id: generateId("changelog"),
    version: "2.0.0",
    title: "Product iteration release shipped",
    notes: [
      "Added roadmap board with planned, in-progress, and shipped columns",
      "Added note-to-note linking using [[Note Title]] syntax",
      "Added per-note revision history with restore",
      "Added Trash with restore and permanent delete",
      "Added feedback status workflow and roadmap promotion",
      "Added deeper analytics: streaks, top tags, heatmap, and word-count trends",
    ],
    releasedAt: new Date().toISOString(),
  });

  saveWorkspace(workspace);
  logUsageEvent("version_2_shipped", "2.0.0");
  addActivityLog(
    "Changelog",
    "Shipped Version 2.0.0",
    "V2 product iteration release completed.",
  );
}

function renderChangelogTimeline() {
  ensureV2ChangelogEntry();

  const workspace = loadWorkspace();

  const entries = workspace.changelogEntries
    .slice()
    .sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));

  if (!entries.length) {
    $("#changelogTimeline").html(renderEmptyState("No changelog entries yet."));
    return;
  }

  $("#changelogTimeline").html(
    entries
      .map(
        (entry) => `
      <article class="glass-card timeline-entry">
        <span class="badge-soft timeline-version">v${escapeHtml(entry.version)}</span>
        <h3 class="timeline-title">${escapeHtml(entry.title)}</h3>
        <p class="timeline-date">Released ${escapeHtml(formatTimestamp(entry.releasedAt))}</p>
        <ul class="timeline-notes">
          ${(entry.notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </article>
    `,
      )
      .join(""),
  );
}

function addChangelogEntry(version, title, notes) {
  const workspace = loadWorkspace();

  workspace.changelogEntries.unshift({
    id: generateId("changelog"),
    version,
    title,
    notes,
    releasedAt: new Date().toISOString(),
  });

  workspace.appVersion = version;

  saveWorkspace(workspace);
  logUsageEvent("changelog_entry_added", version);
  addActivityLog(
    "Changelog",
    "Added release entry",
    `Version ${version}: ${title}`,
  );

  renderChangelogTimeline();
  showStatus("Changelog entry added.", "success");
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("changelog"));

  renderChangelogTimeline();

  $("#changelogForm").on("submit", function (event) {
    event.preventDefault();

    const version = $("#versionInput").val().trim();
    const title = $("#titleInput").val().trim();
    const notes = $("#notesInput")
      .val()
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean);

    if (!version || !title || !notes.length) {
      showStatus("Please complete all changelog fields.", "danger");
      return;
    }

    addChangelogEntry(version, title, notes);

    this.reset();
  });
});

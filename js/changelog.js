"use strict";

function renderChangelogTimeline() {
    const workspace = loadWorkspace();

    const entries = workspace.changelogEntries
        .slice()
        .sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));

    if (!entries.length) {
        $("#changelogTimeline").html(renderEmptyState("No changelog entries yet."));
        return;
    }

    $("#changelogTimeline").html(
        entries.map((entry) => `
      <article class="glass-card timeline-entry">
        <span class="badge-soft timeline-version">v${escapeHtml(entry.version)}</span>
        <h3 class="timeline-title">${escapeHtml(entry.title)}</h3>
        <p class="timeline-date">Released ${escapeHtml(formatTimestamp(entry.releasedAt))}</p>
        <ul class="timeline-notes">
          ${(entry.notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </article>
    `).join("")
    );
}

function addChangelogEntry(version, title, notes) {
    const workspace = loadWorkspace();

    workspace.changelogEntries.unshift({
        id: generateId("changelog"),
        version,
        title,
        notes,
        releasedAt: new Date().toISOString()
    });

    workspace.appVersion = version;

    saveWorkspace(workspace);
    logUsageEvent("changelog_entry_added", version);
    addActivityLog("Changelog", "Added release entry", `Version ${version}: ${title}`);

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
        const notes = $("#notesInput").val()
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
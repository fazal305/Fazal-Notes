"use strict";

function renderDashboardStats() {
  const workspace = loadWorkspace();

  const openFeedbackCount = workspace.feedbackItems.filter(
    (item) => item.status !== "resolved",
  ).length;
  const activeRoadmapCount = workspace.featureRequests.filter(
    (item) => item.status !== "shipped",
  ).length;
  const streak = getWritingStreak(workspace.usageEvents);

  const stats = [
    {
      label: "Total Notes",
      value: workspace.notes.filter((note) => !note.deletedAt).length,
      meta: "Active notes in workspace",
    },
    {
      label: "Folders",
      value: workspace.folders.length,
      meta: "User-created organization spaces",
    },
    {
      label: "Open Feedback",
      value: openFeedbackCount,
      meta: "Bugs and ideas still active",
    },
    {
      label: "Write Streak",
      value: `${streak}d`,
      meta: "Based on real note events",
    },
  ];

  $("#statsGrid").html(
    stats
      .map(
        (stat) => `
          <article class="glass-card stat-card">
            <div class="stat-label">${escapeHtml(stat.label)}</div>
            <p class="stat-value">${escapeHtml(stat.value)}</p>
            <div class="stat-meta">${escapeHtml(stat.meta)}</div>
          </article>
        `,
      )
      .join(""),
  );

  $("#versionBadge").html(
    `Version ${escapeHtml(workspace.appVersion)} · ${activeRoadmapCount} active roadmap items`,
  );
}

function renderRecentNotes() {
  const workspace = loadWorkspace();

  const recentNotes = workspace.notes
    .filter((note) => !note.deletedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  if (!recentNotes.length) {
    $("#recentNotes").html(
      renderEmptyState(
        "No notes yet. Create your first note from the Notes page.",
      ),
    );
    return;
  }

  $("#recentNotes").html(
    recentNotes
      .map(
        (note) => `
          <a href="notes.html" class="recent-note d-block">
            <p class="recent-note-title">${note.pinned ? "★ " : ""}${escapeHtml(note.title)}</p>
            <p class="recent-note-meta">
              ${escapeHtml(getFolderName(note.folderId))} · Updated ${escapeHtml(formatTimestamp(note.updatedAt))}
            </p>
          </a>
        `,
      )
      .join(""),
  );
}

function renderQuickActions() {
  const actions = [
    {
      title: "New Note",
      description: "Capture an idea, task, or project thought.",
      icon: "✎",
      href: "notes.html",
    },
    {
      title: "Report a Bug",
      description: "Log a real issue from using the product.",
      icon: "!",
      href: "feedback.html",
    },
    {
      title: "Suggest a Feature",
      description: "Send an improvement idea into the feedback loop.",
      icon: "+",
      href: "feedback.html",
    },
    {
      title: "View Roadmap",
      description: "See what is planned, in progress, and shipped.",
      icon: "◆",
      href: "roadmap.html",
    },
  ];

  $("#quickActions").html(
    actions
      .map(
        (action) => `
          <a class="quick-action-card soft-card" href="${action.href}">
            <div class="quick-action-icon">${action.icon}</div>
            <h3 class="h6 mb-1">${escapeHtml(action.title)}</h3>
            <p class="mb-0 small text-muted-custom">${escapeHtml(action.description)}</p>
          </a>
        `,
      )
      .join(""),
  );
}

function renderActivityLog() {
  const workspace = loadWorkspace();
  const items = workspace.activityLog.slice(0, 8);

  if (!items.length) {
    $("#activityLog").html(renderEmptyState("No activity yet."));
    return;
  }

  $("#activityLog").html(
    items
      .map(
        (item) => `
          <div class="activity-item">
            <span class="activity-dot"></span>
            <div>
              <p class="activity-title">${escapeHtml(item.module)} · ${escapeHtml(item.action)}</p>
              <p class="activity-time">${escapeHtml(item.detail)} · ${escapeHtml(formatTimestamp(item.createdAt))}</p>
            </div>
          </div>
        `,
      )
      .join(""),
  );
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("dashboard"));

  renderDashboardStats();
  renderRecentNotes();
  renderQuickActions();
  renderActivityLog();
});

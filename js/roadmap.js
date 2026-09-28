"use strict";

const roadmapStatuses = [
  { id: "planned", label: "Planned" },
  { id: "in-progress", label: "In Progress" },
  { id: "shipped", label: "Shipped" },
];

function ensureRoadmapSeed() {
  const workspace = loadWorkspace();

  if (workspace.featureRequests.length) return;

  workspace.featureRequests = [
    {
      id: generateId("feature"),
      title: "Note-to-note linking",
      description: "Use [[Note Title]] syntax to connect related notes.",
      status: "shipped",
      votes: 8,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId("feature"),
      title: "Soft-delete Trash",
      description: "Recover deleted notes before permanently removing them.",
      status: "shipped",
      votes: 6,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId("feature"),
      title: "Daily writing templates",
      description:
        "Create reusable templates for planning, journaling, and project notes.",
      status: "planned",
      votes: 3,
      createdAt: new Date().toISOString(),
    },
  ];

  saveWorkspace(workspace);
}

function renderRoadmapBoard() {
  const workspace = loadWorkspace();

  $("#roadmapBoard").html(
    roadmapStatuses
      .map((status) => {
        const items = workspace.featureRequests
          .filter((item) => item.status === status.id)
          .sort((a, b) => b.votes - a.votes);

        return `
        <section class="glass-card roadmap-column">
          <div class="roadmap-column-header">
            <h2 class="h5 roadmap-column-title">${escapeHtml(status.label)}</h2>
            <span class="badge-soft status-${escapeHtml(status.id)}">${items.length}</span>
          </div>

          <div class="roadmap-items">
            ${
              items.length
                ? items.map(renderRoadmapItem).join("")
                : renderEmptyState(
                    `No ${status.label.toLowerCase()} items yet.`,
                  )
            }
          </div>
        </section>
      `;
      })
      .join(""),
  );
}

function renderRoadmapItem(item) {
  return `
    <article class="soft-card roadmap-item">
      <h3 class="roadmap-item-title">${escapeHtml(item.title)}</h3>
      <p class="roadmap-item-description">${escapeHtml(item.description)}</p>

      <div class="roadmap-meta">
        <span class="badge-soft status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        <span class="badge-soft">${Number(item.votes || 0)} votes</span>
        <span class="badge-soft">Created ${escapeHtml(formatTimestamp(item.createdAt))}</span>
      </div>

      <div class="roadmap-actions">
        <button class="btn-ghost vote-button" data-action="vote" data-id="${item.id}" type="button">Upvote</button>
        ${roadmapStatuses
          .map(
            (status) => `
          <button class="btn-ghost" data-action="move" data-id="${item.id}" data-status="${status.id}" type="button">
            ${escapeHtml(status.label)}
          </button>
        `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function submitFeatureRequest(title, description) {
  const workspace = loadWorkspace();

  const item = {
    id: generateId("feature"),
    title,
    description,
    status: "planned",
    votes: 0,
    createdAt: new Date().toISOString(),
  };

  workspace.featureRequests.unshift(item);

  saveWorkspace(workspace);
  logUsageEvent("feature_requested", item.id);
  addActivityLog("Roadmap", "Submitted feature request", item.title);

  renderRoadmapBoard();
  showStatus("Feature request submitted.", "success");
}

function upvoteFeatureRequest(id) {
  const workspace = loadWorkspace();
  const item = workspace.featureRequests.find((feature) => feature.id === id);

  if (!item) return;

  item.votes = Number(item.votes || 0) + 1;

  saveWorkspace(workspace);
  logUsageEvent("roadmap_upvoted", id);
  addActivityLog("Roadmap", "Upvoted feature", item.title);

  renderRoadmapBoard();
}

function moveFeatureRequest(id, newStatus) {
  const workspace = loadWorkspace();
  const item = workspace.featureRequests.find((feature) => feature.id === id);

  if (!item) return;

  item.status = newStatus;

  saveWorkspace(workspace);
  logUsageEvent("roadmap_moved", id);
  addActivityLog("Roadmap", "Moved feature", `${item.title} → ${newStatus}`);

  renderRoadmapBoard();

  if (newStatus === "shipped") {
    linkShippedItemToChangelog(id);
  }
}

function linkShippedItemToChangelog(id) {
  const workspace = loadWorkspace();
  const item = workspace.featureRequests.find((feature) => feature.id === id);

  if (!item) return;

  const shouldAdd = confirm(
    `Add "${item.title}" to the current changelog as a shipped item?`,
  );

  if (!shouldAdd) return;

  const currentVersion = workspace.appVersion || "2.0.0";
  let entry = workspace.changelogEntries.find(
    (log) => log.version === currentVersion,
  );

  if (!entry) {
    entry = {
      id: generateId("changelog"),
      version: currentVersion,
      title: `Version ${currentVersion} updates`,
      notes: [],
      releasedAt: new Date().toISOString(),
    };

    workspace.changelogEntries.unshift(entry);
  }

  entry.notes.push(`Shipped roadmap item: ${item.title}`);
  entry.releasedAt = new Date().toISOString();

  saveWorkspace(workspace);
  addActivityLog("Roadmap", "Linked shipped item to changelog", item.title);
  showStatus("Added to changelog.", "success");
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("roadmap"));

  ensureRoadmapSeed();
  renderRoadmapBoard();

  $("#featureForm").on("submit", function (event) {
    event.preventDefault();

    const title = $("#featureTitle").val().trim();
    const description = $("#featureDescription").val().trim();

    if (!title || !description) {
      showStatus("Please fill in the feature title and description.", "danger");
      return;
    }

    submitFeatureRequest(title, description);
    this.reset();
  });

  $(document).on("click", "[data-action='vote']", function () {
    upvoteFeatureRequest($(this).data("id"));
  });

  $(document).on("click", "[data-action='move']", function () {
    moveFeatureRequest($(this).data("id"), $(this).data("status"));
  });
});

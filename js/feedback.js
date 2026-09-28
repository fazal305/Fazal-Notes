"use strict";

const feedbackStatuses = ["open", "in-progress", "resolved"];

function submitFeedback(type, title, description) {
  const workspace = loadWorkspace();

  const item = {
    id: generateId("feedback"),
    type,
    title,
    description,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workspace.feedbackItems.unshift(item);

  saveWorkspace(workspace);
  logUsageEvent("feedback_submitted", item.id);
  addActivityLog("Feedback", "Submitted feedback", item.title);

  renderFeedbackList();
  showStatus("Feedback submitted.", "success");
}

function filterFeedback(type, status) {
  const workspace = loadWorkspace();

  return workspace.feedbackItems
    .filter((item) => {
      const matchesType = !type || item.type === type;
      const matchesStatus = !status || item.status === status;

      return matchesType && matchesStatus;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function renderFeedbackList() {
  const type = $("#typeFilter").val();
  const status = $("#statusFilter").val();
  const items = filterFeedback(type, status);

  if (!items.length) {
    $("#feedbackList").html(
      renderEmptyState("No feedback matches these filters."),
    );
    return;
  }

  $("#feedbackList").html(
    items
      .map(
        (item) => `
      <article class="soft-card feedback-item">
        <div class="feedback-item-header">
          <div>
            <h3 class="feedback-title">${escapeHtml(item.title)}</h3>
            <p class="feedback-description">${escapeHtml(item.description)}</p>
          </div>

          <span class="badge-soft status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>

        <div class="feedback-meta">
          <span class="badge-soft feedback-type">${escapeHtml(item.type)}</span>
          <span class="badge-soft">Created ${escapeHtml(formatTimestamp(item.createdAt))}</span>
          <span class="badge-soft">Updated ${escapeHtml(formatTimestamp(item.updatedAt))}</span>
        </div>

        <div class="feedback-actions">
          ${feedbackStatuses
            .map(
              (statusOption) => `
            <button
              class="btn-ghost"
              type="button"
              data-action="status"
              data-id="${item.id}"
              data-status="${statusOption}"
            >
              ${escapeHtml(statusOption)}
            </button>
          `,
            )
            .join("")}

          <button class="btn-fn" type="button" data-action="promote" data-id="${item.id}">
            Promote to Roadmap
          </button>
        </div>
      </article>
    `,
      )
      .join(""),
  );
}

function updateFeedbackStatus(id, status) {
  const workspace = loadWorkspace();
  const item = workspace.feedbackItems.find((feedback) => feedback.id === id);

  if (!item) return;

  item.status = status;
  item.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);
  logUsageEvent("feedback_status_changed", item.id);
  addActivityLog(
    "Feedback",
    "Updated feedback status",
    `${item.title} → ${status}`,
  );

  renderFeedbackList();
  showStatus("Feedback status updated.", "success");
}

function promoteToRoadmap(id) {
  const workspace = loadWorkspace();
  const item = workspace.feedbackItems.find((feedback) => feedback.id === id);

  if (!item) return;

  const alreadyPromoted = workspace.featureRequests.some((feature) => {
    return feature.title.toLowerCase() === item.title.toLowerCase();
  });

  if (alreadyPromoted) {
    showStatus("This item already exists on the roadmap.", "danger");
    return;
  }

  const feature = {
    id: generateId("feature"),
    title: item.title,
    description: item.description,
    status: "planned",
    votes: 0,
    createdAt: new Date().toISOString(),
    sourceFeedbackId: item.id,
  };

  workspace.featureRequests.unshift(feature);
  item.status = "in-progress";
  item.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);
  logUsageEvent("feedback_promoted_to_roadmap", item.id);
  addActivityLog("Feedback", "Promoted feedback to roadmap", item.title);

  renderFeedbackList();
  showStatus("Feedback promoted to Roadmap.", "success");
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("feedback"));

  renderFeedbackList();

  $("#feedbackForm").on("submit", function (event) {
    event.preventDefault();

    const type = $("#feedbackType").val();
    const title = $("#feedbackTitle").val().trim();
    const description = $("#feedbackDescription").val().trim();

    if (!title || !description) {
      showStatus("Please fill in the title and description.", "danger");
      return;
    }

    submitFeedback(type, title, description);
    this.reset();
  });

  $("#typeFilter, #statusFilter").on("change", renderFeedbackList);

  $(document).on("click", "[data-action='status']", function () {
    updateFeedbackStatus($(this).data("id"), $(this).data("status"));
  });

  $(document).on("click", "[data-action='promote']", function () {
    promoteToRoadmap($(this).data("id"));
  });
});

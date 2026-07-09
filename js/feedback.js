"use strict";

function submitFeedback(type, title, description) {
    const workspace = loadWorkspace();

    const item = {
        id: generateId("feedback"),
        type,
        title,
        description,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    workspace.feedbackItems.unshift(item);

    saveWorkspace(workspace);
    logUsageEvent("feedback_submitted", item.id);
    addActivityLog("Feedback", "Submitted feedback", item.title);

    renderFeedbackList();
    showStatus("Feedback submitted.", "success");
}

function renderFeedbackList() {
    const workspace = loadWorkspace();
    const items = workspace.feedbackItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!items.length) {
        $("#feedbackList").html(renderEmptyState("No feedback submitted yet."));
        return;
    }

    $("#feedbackList").html(
        items.map((item) => `
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
      </article>
    `).join("")
    );
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
});
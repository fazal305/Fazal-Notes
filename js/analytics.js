"use strict";

let usageChartInstance = null;
let activityChartInstance = null;

function dateKey(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
}

function getLastDays(count) {
    const days = [];

    for (let index = count - 1; index >= 0; index -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - index);
        days.push(date.toISOString().slice(0, 10));
    }

    return days;
}

function renderCoreStats() {
    const workspace = loadWorkspace();
    const activeNotes = workspace.notes.filter((note) => !note.deletedAt);
    const tags = getAllTags(activeNotes);

    const stats = [
        {
            label: "Active Notes",
            value: activeNotes.length,
            meta: "Notes currently saved"
        },
        {
            label: "Folders",
            value: workspace.folders.length,
            meta: "Organization spaces"
        },
        {
            label: "Tags",
            value: tags.length,
            meta: "Unique tags in use"
        },
        {
            label: "Usage Events",
            value: workspace.usageEvents.length,
            meta: "Real logged actions"
        }
    ];

    $("#coreStats").html(
        stats.map((stat) => `
      <article class="glass-card stat-card">
        <div class="stat-label">${escapeHtml(stat.label)}</div>
        <p class="stat-value">${escapeHtml(stat.value)}</p>
        <div class="stat-meta">${escapeHtml(stat.meta)}</div>
      </article>
    `).join("")
    );
}

function renderUsageChart() {
    const workspace = loadWorkspace();
    const days = getLastDays(14);

    const counts = days.map((day) => {
        return workspace.usageEvents.filter((event) => {
            return event.type === "note_created" && dateKey(event.createdAt) === day;
        }).length;
    });

    if (usageChartInstance) usageChartInstance.destroy();

    usageChartInstance = new Chart(document.getElementById("usageChart"), {
        type: "line",
        data: {
            labels: days,
            datasets: [
                {
                    label: "Notes Created",
                    data: counts,
                    tension: 0.35
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-text")
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-muted")
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-muted")
                    }
                }
            }
        }
    });
}

function renderActivityChart() {
    const workspace = loadWorkspace();
    const days = getLastDays(30);

    const createdCounts = days.map((day) => {
        return workspace.usageEvents.filter((event) => {
            return event.type === "note_created" && dateKey(event.createdAt) === day;
        }).length;
    });

    const editedCounts = days.map((day) => {
        return workspace.usageEvents.filter((event) => {
            return event.type === "note_edited" && dateKey(event.createdAt) === day;
        }).length;
    });

    if (activityChartInstance) activityChartInstance.destroy();

    activityChartInstance = new Chart(document.getElementById("activityChart"), {
        type: "bar",
        data: {
            labels: days,
            datasets: [
                {
                    label: "Created",
                    data: createdCounts
                },
                {
                    label: "Edited",
                    data: editedCounts
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-text")
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-muted"),
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue("--fn-muted")
                    }
                }
            }
        }
    });
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("analytics"));

    renderCoreStats();
    renderUsageChart();
    renderActivityChart();
});
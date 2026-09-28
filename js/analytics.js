"use strict";

let usageChartInstance = null;
let activityChartInstance = null;
let wordTrendChartInstance = null;

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

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function chartTextColor(tokenName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim();
}

function renderCoreStats() {
  const workspace = loadWorkspace();
  const activeNotes = workspace.notes.filter((note) => !note.deletedAt);
  const tags = getAllTags(activeNotes);
  const totalWords = activeNotes.reduce(
    (sum, note) => sum + countWords(note.content),
    0,
  );

  const stats = [
    {
      label: "Active Notes",
      value: activeNotes.length,
      meta: "Notes currently saved",
    },
    {
      label: "Folders",
      value: workspace.folders.length,
      meta: "Organization spaces",
    },
    {
      label: "Tags",
      value: tags.length,
      meta: "Unique tags in use",
    },
    {
      label: "Total Words",
      value: totalWords,
      meta: "Across active notes",
    },
  ];

  $("#coreStats").html(
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
          tension: 0.35,
        },
      ],
    },
    options: getChartOptions(),
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
          data: createdCounts,
        },
        {
          label: "Edited",
          data: editedCounts,
        },
      ],
    },
    options: getChartOptions(),
  });
}

function calculateStreaks(events) {
  const writingTypes = ["note_created", "note_edited"];
  const sortedDays = [
    ...new Set(
      events
        .filter((event) => writingTypes.includes(event.type))
        .map((event) => dateKey(event.createdAt)),
    ),
  ].sort();

  if (!sortedDays.length) {
    return {
      current: 0,
      longest: 0,
      totalWritingDays: 0,
    };
  }

  let longest = 1;
  let running = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = new Date(sortedDays[index - 1]);
    const current = new Date(sortedDays[index]);
    const diffDays = Math.round((current - previous) / 86400000);

    if (diffDays === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  return {
    current: getWritingStreak(events),
    longest,
    totalWritingDays: sortedDays.length,
  };
}

function renderStreaks() {
  const workspace = loadWorkspace();
  const streaks = calculateStreaks(workspace.usageEvents);

  const items = [
    ["Current streak", `${streaks.current} days`],
    ["Longest streak", `${streaks.longest} days`],
    ["Total writing days", `${streaks.totalWritingDays} days`],
  ];

  $("#streaks").html(
    items
      .map(
        ([label, value]) => `
      <div class="rank-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `,
      )
      .join(""),
  );
}

function renderTopTags() {
  const workspace = loadWorkspace();
  const activeNotes = workspace.notes.filter((note) => !note.deletedAt);
  const counts = {};

  activeNotes.forEach((note) => {
    (note.tags || []).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!tags.length) {
    $("#topTags").html(renderEmptyState("No tags in use yet."));
    return;
  }

  $("#topTags").html(
    tags
      .map(
        ([tag, count]) => `
      <div class="rank-item">
        <span>#${escapeHtml(tag)}</span>
        <strong>${count}</strong>
      </div>
    `,
      )
      .join(""),
  );
}

function renderTimeOfDayHeatmap() {
  const workspace = loadWorkspace();
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }));

  workspace.usageEvents.forEach((event) => {
    const hour = new Date(event.createdAt).getHours();
    buckets[hour].count += 1;
  });

  $("#timeHeatmap").html(
    buckets
      .map(
        (bucket) => `
      <div class="heatmap-cell">
        <span class="heatmap-hour">${String(bucket.hour).padStart(2, "0")}:00</span>
        <span class="heatmap-count">${bucket.count}</span>
      </div>
    `,
      )
      .join(""),
  );
}

function renderWordCountTrend() {
  const workspace = loadWorkspace();
  const days = getLastDays(14);

  const values = days.map((day) => {
    let total = 0;

    workspace.notes.forEach((note) => {
      if (!note.deletedAt && dateKey(note.updatedAt || note.createdAt) <= day) {
        total += countWords(note.content);
      }

      (note.revisions || []).forEach((revision) => {
        if (dateKey(revision.createdAt) === day) {
          total += countWords(revision.content);
        }
      });
    });

    return total;
  });

  if (wordTrendChartInstance) wordTrendChartInstance.destroy();

  wordTrendChartInstance = new Chart(
    document.getElementById("wordTrendChart"),
    {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "Words",
            data: values,
            tension: 0.35,
          },
        ],
      },
      options: getChartOptions(),
    },
  );
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor("--fn-text"),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: chartTextColor("--fn-muted"),
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: chartTextColor("--fn-muted"),
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
    },
  };
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("analytics"));

  renderCoreStats();
  renderUsageChart();
  renderActivityChart();
  renderStreaks();
  renderTopTags();
  renderTimeOfDayHeatmap();
  renderWordCountTrend();
});

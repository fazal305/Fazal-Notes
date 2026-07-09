"use strict";

const STORAGE_KEY = "fazalNotesWorkspace";

const defaultWorkspace = {
    appVersion: "1.0.0",
    settings: {
        compactSidebar: false,
        transitionSpeedMs: 320,
        displayName: "Fazal"
    },
    theme: {
        bg: "#040712",
        bgSoft: "#07111f",
        card: "rgba(10, 18, 36, 0.9)",
        text: "#f7fbff",
        muted: "#9aabc7",
        primary: "#22d3ee",
        secondary: "#a855f7",
        success: "#4ade80",
        warning: "#facc15",
        danger: "#fb7185",
        radius: 18,
        fontFamily: "Inter, sans-serif"
    },
    folders: [],
    notes: [],
    feedbackItems: [],
    featureRequests: [],
    usageEvents: [],
    changelogEntries: [],
    activityLog: []
};

function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTimestamp(dateString) {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function mergeWorkspace(savedWorkspace) {
    return {
        ...structuredClone(defaultWorkspace),
        ...savedWorkspace,
        settings: {
            ...defaultWorkspace.settings,
            ...(savedWorkspace.settings || {})
        },
        theme: {
            ...defaultWorkspace.theme,
            ...(savedWorkspace.theme || {})
        },
        folders: savedWorkspace.folders || [],
        notes: savedWorkspace.notes || [],
        feedbackItems: savedWorkspace.feedbackItems || [],
        featureRequests: savedWorkspace.featureRequests || [],
        usageEvents: savedWorkspace.usageEvents || [],
        changelogEntries: savedWorkspace.changelogEntries || [],
        activityLog: savedWorkspace.activityLog || []
    };
}

function loadWorkspace() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        const seeded = seedDemoData();
        saveWorkspace(seeded);
        return seeded;
    }

    try {
        return mergeWorkspace(JSON.parse(saved));
    } catch (error) {
        console.error("Workspace load failed:", error);
        const fallback = seedDemoData();
        saveWorkspace(fallback);
        return fallback;
    }
}

function saveWorkspace(workspace) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    applyThemeSettings(workspace);
}

function resetWorkspace() {
    localStorage.removeItem(STORAGE_KEY);
    const workspace = seedDemoData();
    saveWorkspace(workspace);
    return workspace;
}

function daysAgo(days, hour = 10) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
    return date.toISOString();
}

function seedDemoData() {
    const workspace = structuredClone(defaultWorkspace);

    const personalFolderId = generateId("folder");
    const learningFolderId = generateId("folder");
    const productFolderId = generateId("folder");

    workspace.folders = [
        {
            id: personalFolderId,
            name: "Personal",
            createdAt: daysAgo(13, 9)
        },
        {
            id: learningFolderId,
            name: "Learning",
            createdAt: daysAgo(12, 14)
        },
        {
            id: productFolderId,
            name: "Product Ideas",
            createdAt: daysAgo(10, 19)
        }
    ];

    const noteOneId = generateId("note");
    const noteTwoId = generateId("note");
    const noteThreeId = generateId("note");
    const noteFourId = generateId("note");

    workspace.notes = [
        {
            id: noteOneId,
            title: "Daily planning system",
            content: "# Daily planning system\n\nA simple workflow for starting each day:\n\n- Review yesterday\n- Pick 3 priority tasks\n- Write one improvement note\n\n**Goal:** keep notes practical, not perfect.",
            folderId: personalFolderId,
            tags: ["daily", "planning", "focus"],
            pinned: true,
            createdAt: daysAgo(12, 8),
            updatedAt: daysAgo(1, 9)
        },
        {
            id: noteTwoId,
            title: "JavaScript revision notes",
            content: "# JavaScript revision notes\n\nFocus areas:\n\n- localStorage persistence\n- array methods\n- DOM rendering\n- event delegation\n\nUseful link: https://developer.mozilla.org/",
            folderId: learningFolderId,
            tags: ["javascript", "learning"],
            pinned: false,
            createdAt: daysAgo(9, 16),
            updatedAt: daysAgo(4, 15)
        },
        {
            id: noteThreeId,
            title: "Fazal Notes roadmap thoughts",
            content: "# Fazal Notes roadmap thoughts\n\nVersion 1 should feel complete and useful.\n\nVersion 2 should prove iteration:\n\n- linked notes\n- revision history\n- trash recovery\n- public roadmap",
            folderId: productFolderId,
            tags: ["product", "roadmap", "notes"],
            pinned: true,
            createdAt: daysAgo(7, 20),
            updatedAt: daysAgo(2, 21)
        },
        {
            id: noteFourId,
            title: "LinkedIn project post draft",
            content: "# LinkedIn project post draft\n\nToday I worked on a note-taking app that treats product lifecycle seriously: changelog, feedback, analytics, and versioned releases.",
            folderId: productFolderId,
            tags: ["linkedin", "portfolio"],
            pinned: false,
            createdAt: daysAgo(4, 11),
            updatedAt: daysAgo(3, 12)
        }
    ];

    workspace.feedbackItems = [
        {
            id: generateId("feedback"),
            type: "bug",
            title: "Search should include tags",
            description: "When I search for a tag name, matching notes should appear even if the tag is not in the note title.",
            status: "open",
            createdAt: daysAgo(6, 18),
            updatedAt: daysAgo(6, 18)
        },
        {
            id: generateId("feedback"),
            type: "idea",
            title: "Add note history",
            description: "It would be useful to restore an older version of a note after editing.",
            status: "open",
            createdAt: daysAgo(5, 13),
            updatedAt: daysAgo(5, 13)
        }
    ];

    workspace.changelogEntries = [
        {
            id: generateId("changelog"),
            version: "1.0.0",
            title: "Initial release shipped",
            notes: [
                "Create, edit, delete, pin, search, and organize notes",
                "Folders and freeform tags",
                "Feedback and bug-reporting page",
                "Usage analytics computed from real usage events",
                "Settings, dynamic theme controls, and workspace export/import"
            ],
            releasedAt: new Date().toISOString()
        }
    ];

    const eventPlan = [
        ["note_created", noteOneId, 12, 8],
        ["note_edited", noteOneId, 11, 10],
        ["note_created", noteTwoId, 9, 16],
        ["note_created", noteThreeId, 7, 20],
        ["feedback_submitted", workspace.feedbackItems[0].id, 6, 18],
        ["feedback_submitted", workspace.feedbackItems[1].id, 5, 13],
        ["note_created", noteFourId, 4, 11],
        ["note_edited", noteTwoId, 4, 15],
        ["note_edited", noteFourId, 3, 12],
        ["note_edited", noteThreeId, 2, 21],
        ["note_edited", noteOneId, 1, 9]
    ];

    workspace.usageEvents = eventPlan.map(([type, refId, day, hour]) => ({
        id: generateId("event"),
        type,
        refId,
        createdAt: daysAgo(day, hour)
    }));

    workspace.activityLog = [
        {
            id: generateId("activity"),
            module: "System",
            action: "Workspace seeded",
            detail: "Demo data was created so analytics can compute from real local usage events.",
            createdAt: daysAgo(12, 8)
        }
    ];

    return workspace;
}

function logUsageEvent(type, refId) {
    const workspace = loadWorkspace();

    workspace.usageEvents.push({
        id: generateId("event"),
        type,
        refId: refId || "",
        createdAt: new Date().toISOString()
    });

    saveWorkspace(workspace);
}

function addActivityLog(module, action, detail) {
    const workspace = loadWorkspace();

    workspace.activityLog.unshift({
        id: generateId("activity"),
        module,
        action,
        detail,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 80);

    saveWorkspace(workspace);
}

function applyThemeSettings(workspaceArg) {
    const workspace = workspaceArg || loadWorkspace();
    const theme = workspace.theme || defaultWorkspace.theme;
    const root = document.documentElement;

    root.style.setProperty("--fn-bg", theme.bg);
    root.style.setProperty("--fn-bg-soft", theme.bgSoft);
    root.style.setProperty("--fn-card", theme.card);
    root.style.setProperty("--fn-text", theme.text);
    root.style.setProperty("--fn-muted", theme.muted);
    root.style.setProperty("--fn-primary", theme.primary);
    root.style.setProperty("--fn-secondary", theme.secondary);
    root.style.setProperty("--fn-success", theme.success);
    root.style.setProperty("--fn-warning", theme.warning);
    root.style.setProperty("--fn-danger", theme.danger);
    root.style.setProperty("--fn-radius", `${theme.radius}px`);
    root.style.setProperty("--fn-font-family", theme.fontFamily);
    root.style.setProperty("--fn-border", "rgba(255, 255, 255, 0.12)");
    root.style.setProperty("--fn-shadow", "0 24px 70px rgba(0, 0, 0, 0.35)");
    root.style.setProperty("--fn-card-muted", "rgba(255, 255, 255, 0.045)");
    root.style.setProperty("--fn-primary-soft", "rgba(34, 211, 238, 0.14)");
    root.style.setProperty("--transition-speed", `${workspace.settings.transitionSpeedMs}ms`);
}

function renderSidebar(activePage) {
    const workspace = loadWorkspace();

    const navItems = [
        { page: "dashboard", label: "Dashboard", icon: "⌂", href: "index.html" },
        { page: "notes", label: "Notes", icon: "✎", href: "notes.html" },
        { page: "feedback", label: "Feedback", icon: "!", href: "feedback.html" },
        { page: "roadmap", label: "Roadmap", icon: "◆", href: "roadmap.html" },
        { page: "analytics", label: "Analytics", icon: "◷", href: "analytics.html" },
        { page: "changelog", label: "Changelog", icon: "☰", href: "changelog.html" },
        { page: "settings", label: "Settings", icon: "⚙", href: "settings.html" }
    ];

    const compactClass = workspace.settings.compactSidebar ? " compact" : "";

    return `
    <aside class="app-sidebar${compactClass}">
      <div class="brand-card">
        <div class="brand-mark">FN</div>
        <div class="brand-copy">
          <p class="brand-title">Fazal Notes</p>
          <p class="brand-subtitle">Local product workspace</p>
        </div>
      </div>

      <nav class="app-nav" aria-label="Primary navigation">
        ${navItems
            .map(
                (item) => `
              <a class="app-nav-link ${item.page === activePage ? "active" : ""}" href="${item.href}" data-page="${item.page}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
              </a>
            `
            )
            .join("")}
      </nav>
    </aside>
  `;
}

function setActiveNav() {
    const currentFile = window.location.pathname.split("/").pop() || "index.html";

    $(".app-nav-link").each(function () {
        const href = $(this).attr("href");
        $(this).toggleClass("active", href === currentFile);
    });
}

function showStatus(message, type = "info") {
    $(".fn-toast").remove();

    const statusClass = type === "danger" ? "status-danger" : type === "success" ? "status-resolved" : "badge-soft";

    const toast = $(`
    <div class="fn-toast ${statusClass}">
      ${escapeHtml(message)}
    </div>
  `);

    $("body").append(toast);

    setTimeout(() => {
        toast.fadeOut(220, function () {
            $(this).remove();
        });
    }, 2600);
}

function renderEmptyState(message) {
    return `
    <div class="empty-state">
      <p class="mb-0">${escapeHtml(message)}</p>
    </div>
  `;
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

function copyText(text, message = "Copied to clipboard.") {
    navigator.clipboard
        .writeText(text)
        .then(() => showStatus(message, "success"))
        .catch(() => showStatus("Clipboard copy failed.", "danger"));
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
}

function ensureTransitionOverlay() {
    if ($("#transitionOverlay").length) return;

    $("body").append(`
    <div id="transitionOverlay" class="transition-overlay">
      <div class="transition-loader" aria-label="Loading"></div>
    </div>
  `);
}

function initPageTransitions() {
    applyThemeSettings();
    ensureTransitionOverlay();

    const workspace = loadWorkspace();

    setTimeout(() => {
        hideTransitionOverlay();
    }, 80);

    $(document).on("click", "a[href]", function (event) {
        const url = $(this).attr("href");

        if (!url) return;
        if (url.startsWith("#")) return;
        if (url.startsWith("http")) return;
        if ($(this).attr("target") === "_blank") return;
        if (url.startsWith("mailto:")) return;

        event.preventDefault();
        navigateWithTransition(url, workspace.settings.transitionSpeedMs);
    });
}

function showTransitionOverlay(withLoader = false) {
    ensureTransitionOverlay();

    const overlay = $("#transitionOverlay");

    overlay.removeClass("is-hidden");
    overlay.toggleClass("show-loader", Boolean(withLoader));
}

function hideTransitionOverlay() {
    ensureTransitionOverlay();

    $("#transitionOverlay")
        .addClass("is-hidden")
        .removeClass("show-loader");
}

function navigateWithTransition(url) {
    const workspace = loadWorkspace();
    const speed = Number(workspace.settings.transitionSpeedMs) || 320;

    showTransitionOverlay(false);

    const loaderTimer = setTimeout(() => {
        showTransitionOverlay(true);
    }, 180);

    setTimeout(() => {
        clearTimeout(loaderTimer);
        window.location.href = url;
    }, Math.max(speed, 180));
}

function getFolderName(folderId) {
    const workspace = loadWorkspace();
    const folder = workspace.folders.find((item) => item.id === folderId);
    return folder ? folder.name : "No folder";
}

function getAllTags(notes) {
    return [...new Set((notes || []).flatMap((note) => note.tags || []))].sort();
}

function getWritingStreak(events) {
    const writingTypes = ["note_created", "note_edited"];
    const dates = [
        ...new Set(
            (events || [])
                .filter((event) => writingTypes.includes(event.type))
                .map((event) => new Date(event.createdAt).toDateString())
        )
    ].map((date) => new Date(date));

    if (!dates.length) return 0;

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const dateSet = new Set(dates.map((date) => date.toDateString()));

    while (dateSet.has(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

$(document).ready(function () {
    applyThemeSettings();
    initPageTransitions();
    setActiveNav();
});
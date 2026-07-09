"use strict";

const themeTokens = [
    "bg",
    "bgSoft",
    "text",
    "muted",
    "primary",
    "secondary",
    "success",
    "warning",
    "danger"
];

const themePresets = [
    {
        id: "night",
        name: "Night Cyan",
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
        }
    },
    {
        id: "forest",
        name: "Forest Gold",
        theme: {
            bg: "#07120b",
            bgSoft: "#102016",
            card: "rgba(16, 32, 22, 0.92)",
            text: "#f5fff7",
            muted: "#9fbea7",
            primary: "#c9a84c",
            secondary: "#4ade80",
            success: "#5ee08b",
            warning: "#facc15",
            danger: "#fb7185",
            radius: 18,
            fontFamily: "Inter, sans-serif"
        }
    },
    {
        id: "paper",
        name: "Warm Paper",
        theme: {
            bg: "#f4efe6",
            bgSoft: "#fff8ed",
            card: "rgba(255, 248, 237, 0.92)",
            text: "#1d1812",
            muted: "#726457",
            primary: "#b7791f",
            secondary: "#7c3aed",
            success: "#15803d",
            warning: "#a16207",
            danger: "#be123c",
            radius: 16,
            fontFamily: "Georgia, serif"
        }
    },
    {
        id: "mono",
        name: "Mono Slate",
        theme: {
            bg: "#0f172a",
            bgSoft: "#111827",
            card: "rgba(17, 24, 39, 0.92)",
            text: "#f8fafc",
            muted: "#94a3b8",
            primary: "#e2e8f0",
            secondary: "#64748b",
            success: "#22c55e",
            warning: "#eab308",
            danger: "#ef4444",
            radius: 10,
            fontFamily: "Arial, sans-serif"
        }
    }
];

function normalizeCardColor(theme) {
    return theme.card || "rgba(10, 18, 36, 0.9)";
}

function renderThemeCustomizer() {
    const workspace = loadWorkspace();

    $("#themeCustomizer").html(`
    <div class="token-grid mb-3">
      ${themeTokens.map((token) => `
        <div class="color-token">
          <label for="token-${token}">${escapeHtml(token)}</label>
          <input id="token-${token}" type="color" value="${escapeHtml(workspace.theme[token])}" data-token="${escapeHtml(token)}">
        </div>
      `).join("")}
    </div>

    <div class="setting-row">
      <label for="radiusInput">Radius</label>
      <input id="radiusInput" class="form-range" type="range" min="6" max="34" value="${escapeHtml(workspace.theme.radius)}">
      <span id="radiusLabel" class="badge-soft">${escapeHtml(workspace.theme.radius)}px</span>
    </div>

    <div class="setting-row">
      <label for="fontFamilyInput">Font Family</label>
      <select id="fontFamilyInput" class="form-select">
        <option value="Inter, sans-serif">Inter / Sans Serif</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Courier New', monospace">Courier New</option>
      </select>
    </div>
  `);

    $("#fontFamilyInput").val(workspace.theme.fontFamily);
}

function renderThemePresets() {
    $("#themePresets").html(
        themePresets.map((preset) => `
      <button class="preset-card" type="button" data-preset-id="${escapeHtml(preset.id)}">
        <strong>${escapeHtml(preset.name)}</strong>
        <div class="preset-swatches">
          <span class="preset-swatch" style="background:${escapeHtml(preset.theme.bg)}"></span>
          <span class="preset-swatch" style="background:${escapeHtml(preset.theme.primary)}"></span>
          <span class="preset-swatch" style="background:${escapeHtml(preset.theme.secondary)}"></span>
          <span class="preset-swatch" style="background:${escapeHtml(preset.theme.success)}"></span>
        </div>
      </button>
    `).join("")
    );
}

function renderPersonalSettings() {
    const workspace = loadWorkspace();

    $("#displayNameInput").val(workspace.settings.displayName);
    $("#transitionSpeedInput").val(workspace.settings.transitionSpeedMs);
    $("#transitionSpeedLabel").text(`${workspace.settings.transitionSpeedMs}ms`);
    $("#compactSidebarInput").prop("checked", workspace.settings.compactSidebar);
}

function updateThemeToken(name, value) {
    const workspace = loadWorkspace();

    workspace.theme[name] = value;
    workspace.theme.card = normalizeCardColor(workspace.theme);

    saveWorkspace(workspace);
    applyThemeSettings(workspace);
}

function applyThemePreset(presetId) {
    const preset = themePresets.find((item) => item.id === presetId);

    if (!preset) return;

    const workspace = loadWorkspace();

    workspace.theme = structuredClone(preset.theme);

    saveWorkspace(workspace);
    applyThemeSettings(workspace);

    renderThemeCustomizer();
    renderPersonalSettings();
    $("#sidebarMount").html(renderSidebar("settings"));

    addActivityLog("Settings", "Applied theme preset", preset.name);
    showStatus(`${preset.name} theme applied.`, "success");
}

function resetThemeToDefault() {
    const workspace = loadWorkspace();

    workspace.theme = structuredClone(defaultWorkspace.theme);

    saveWorkspace(workspace);
    applyThemeSettings(workspace);

    renderThemeCustomizer();
    renderPersonalSettings();

    addActivityLog("Settings", "Reset theme", "Theme restored to default.");
    showStatus("Theme reset.", "success");
}

function saveDisplayName() {
    const workspace = loadWorkspace();

    workspace.settings.displayName = $("#displayNameInput").val().trim() || "Fazal";
    workspace.settings.transitionSpeedMs = Number($("#transitionSpeedInput").val()) || 320;
    workspace.settings.compactSidebar = $("#compactSidebarInput").is(":checked");

    saveWorkspace(workspace);

    $("#sidebarMount").html(renderSidebar("settings"));
    addActivityLog("Settings", "Updated personal settings", workspace.settings.displayName);
    showStatus("Settings saved.", "success");
}

function setTransitionSpeed(ms) {
    const workspace = loadWorkspace();

    workspace.settings.transitionSpeedMs = Number(ms) || 320;

    saveWorkspace(workspace);
    applyThemeSettings(workspace);

    $("#transitionSpeedLabel").text(`${workspace.settings.transitionSpeedMs}ms`);
}

function toggleCompactSidebar() {
    const workspace = loadWorkspace();

    workspace.settings.compactSidebar = $("#compactSidebarInput").is(":checked");

    saveWorkspace(workspace);
    $("#sidebarMount").html(renderSidebar("settings"));
}

function exportWorkspace() {
    const workspace = loadWorkspace();

    downloadJson("fazal-notes-workspace.json", workspace);
    logUsageEvent("workspace_exported", "settings");
    addActivityLog("Settings", "Exported workspace", "Full local workspace exported as JSON.");
}

function importWorkspace(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const importedWorkspace = JSON.parse(reader.result);
            const mergedWorkspace = {
                ...mergeWorkspace(importedWorkspace),
                importedAt: new Date().toISOString()
            };

            saveWorkspace(mergedWorkspace);
            addActivityLog("Settings", "Imported workspace", file.name);

            renderThemeCustomizer();
            renderPersonalSettings();
            $("#sidebarMount").html(renderSidebar("settings"));

            showStatus("Workspace imported.", "success");
        } catch (error) {
            console.error(error);
            showStatus("Invalid JSON file.", "danger");
        }
    };

    reader.readAsText(file);
}

function resetDemoWorkspace() {
    if (!confirm("Reset demo data? This replaces the current local workspace.")) return;

    resetWorkspace();

    renderThemeCustomizer();
    renderPersonalSettings();
    $("#sidebarMount").html(renderSidebar("settings"));

    showStatus("Demo workspace reset.", "success");
}

function clearWorkspace() {
    if (!confirm("Clear all Fazal Notes localStorage data?")) return;

    localStorage.removeItem(STORAGE_KEY);
    showStatus("Workspace cleared. Reloading...", "success");

    setTimeout(() => {
        window.location.reload();
    }, 700);
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("settings"));

    renderThemeCustomizer();
    renderThemePresets();
    renderPersonalSettings();

    $(document).on("input", "input[type='color'][data-token]", function () {
        updateThemeToken($(this).data("token"), $(this).val());
    });

    $(document).on("input", "#radiusInput", function () {
        const value = Number($(this).val());
        $("#radiusLabel").text(`${value}px`);
        updateThemeToken("radius", value);
    });

    $(document).on("change", "#fontFamilyInput", function () {
        updateThemeToken("fontFamily", $(this).val());
    });

    $(document).on("click", ".preset-card", function () {
        applyThemePreset($(this).data("preset-id"));
    });

    $("#transitionSpeedInput").on("input", function () {
        setTransitionSpeed($(this).val());
    });

    $("#compactSidebarInput").on("change", toggleCompactSidebar);
    $("#savePersonalBtn").on("click", saveDisplayName);
    $("#resetThemeBtn").on("click", resetThemeToDefault);
    $("#exportWorkspaceBtn").on("click", exportWorkspace);
    $("#importWorkspaceInput").on("change", importWorkspace);
    $("#resetDemoBtn").on("click", resetDemoWorkspace);
    $("#clearWorkspaceBtn").on("click", clearWorkspace);
});
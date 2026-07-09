"use strict";

let selectedNoteId = null;

function getActiveNotes() {
    return loadWorkspace().notes.filter((note) => !note.deletedAt);
}

function renderFilters() {
    const workspace = loadWorkspace();
    const tags = getAllTags(getActiveNotes());

    $("#folderFilter").html(`
    <option value="">All folders</option>
    ${workspace.folders.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`).join("")}
  `);

    $("#tagFilter").html(`
    <option value="">All tags</option>
    ${tags.map((tag) => `<option value="${escapeHtml(tag)}">#${escapeHtml(tag)}</option>`).join("")}
  `);
}

function filterNotes(query, folderId, tag) {
    const search = String(query || "").toLowerCase();

    return getActiveNotes()
        .filter((note) => {
            const searchable = [
                note.title,
                note.content,
                ...(note.tags || [])
            ].join(" ").toLowerCase();

            const matchesSearch = !search || searchable.includes(search);
            const matchesFolder = !folderId || note.folderId === folderId;
            const matchesTag = !tag || (note.tags || []).includes(tag);

            return matchesSearch && matchesFolder && matchesTag;
        })
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
}

function renderNoteList() {
    const query = $("#searchInput").val();
    const folderId = $("#folderFilter").val();
    const tag = $("#tagFilter").val();

    const notes = filterNotes(query, folderId, tag);

    if (!notes.length) {
        $("#noteList").html(renderEmptyState("No matching notes found."));
        return;
    }

    $("#noteList").html(
        notes.map((note) => `
      <button class="note-list-item ${note.id === selectedNoteId ? "active" : ""}" data-note-id="${note.id}" type="button">
        <p class="note-list-title">
          <span>${note.pinned ? "★ " : ""}${escapeHtml(note.title)}</span>
        </p>
        <p class="note-list-preview">${escapeHtml(note.content.slice(0, 110))}</p>
        <div class="note-tags">
          ${(note.tags || []).map((tagName) => `<span class="badge-soft">#${escapeHtml(tagName)}</span>`).join("")}
        </div>
      </button>
    `).join("")
    );
}

function renderEditor(noteId) {
    const workspace = loadWorkspace();
    const note = workspace.notes.find((item) => item.id === noteId && !item.deletedAt);

    if (!note) {
        $("#editorMount").html(renderEmptyState("Select a note or create a new one."));
        return;
    }

    const folders = workspace.folders;

    $("#editorMount").html(`
    <div class="editor-topbar">
      <div>
        <h2 class="h5 mb-1">Writing Surface</h2>
        <p class="mb-0 small" style="color: var(--fn-muted);">Updated ${escapeHtml(formatTimestamp(note.updatedAt))}</p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button id="pinNoteBtn" class="btn-ghost pin-button ${note.pinned ? "is-pinned" : ""}" type="button">
          ${note.pinned ? "Unpin" : "Pin"}
        </button>
        <button id="saveNoteBtn" class="btn-fn" type="button">Save</button>
        <button id="deleteNoteBtn" class="btn-ghost" type="button">Delete</button>
      </div>
    </div>

    <div class="note-meta-strip">
      <span class="badge-soft">Created ${escapeHtml(formatTimestamp(note.createdAt))}</span>
      <span class="badge-soft">${escapeHtml(getFolderName(note.folderId))}</span>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-6">
        <label class="form-label">Title</label>
        <input id="noteTitle" class="form-control" value="${escapeHtml(note.title)}">
      </div>

      <div class="col-lg-3">
        <label class="form-label">Folder</label>
        <select id="noteFolder" class="form-select">
          ${folders.map((folder) => `
            <option value="${folder.id}" ${folder.id === note.folderId ? "selected" : ""}>
              ${escapeHtml(folder.name)}
            </option>
          `).join("")}
        </select>
      </div>

      <div class="col-lg-3">
        <label class="form-label">Tags</label>
        <input id="noteTags" class="form-control" value="${escapeHtml((note.tags || []).join(", "))}" placeholder="tag, another-tag">
      </div>
    </div>

    <div class="editor-grid">
      <div>
        <label class="form-label">Markdown-ish content</label>
        <textarea id="noteContent" class="form-control editor-surface">${escapeHtml(note.content)}</textarea>
      </div>

      <div>
        <label class="form-label">Preview</label>
        <article id="notePreview" class="preview-surface"></article>
      </div>
    </div>
  `);

    $("#notePreview").html(renderMarkdown(note.content));
}

function createNote() {
    const workspace = loadWorkspace();

    let folderId = workspace.folders[0]?.id;

    if (!folderId) {
        folderId = generateId("folder");
        workspace.folders.push({
            id: folderId,
            name: "General",
            createdAt: new Date().toISOString()
        });
    }

    const note = {
        id: generateId("note"),
        title: "Untitled Note",
        content: "# Untitled Note\n\nStart writing here...",
        folderId,
        tags: [],
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    workspace.notes.unshift(note);
    saveWorkspace(workspace);

    logUsageEvent("note_created", note.id);
    addActivityLog("Notes", "Created note", note.title);

    selectedNoteId = note.id;

    renderFilters();
    renderNoteList();
    renderEditor(selectedNoteId);
    showStatus("New note created.", "success");
}

function editNote(id) {
    const workspace = loadWorkspace();
    const note = workspace.notes.find((item) => item.id === id);

    if (!note) return;

    note.title = $("#noteTitle").val().trim() || "Untitled Note";
    note.content = $("#noteContent").val();
    note.folderId = $("#noteFolder").val();
    note.tags = $("#noteTags").val()
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
    note.updatedAt = new Date().toISOString();

    saveWorkspace(workspace);

    logUsageEvent("note_edited", note.id);
    addActivityLog("Notes", "Edited note", note.title);

    renderFilters();
    renderNoteList();
    renderEditor(note.id);
    showStatus("Note saved.", "success");
}

function deleteNote(id) {
    const workspace = loadWorkspace();
    const note = workspace.notes.find((item) => item.id === id);

    if (!note) return;
    if (!confirm(`Delete "${note.title}"? Version 1 deletes permanently. Trash arrives in Version 2.`)) return;

    workspace.notes = workspace.notes.filter((item) => item.id !== id);
    saveWorkspace(workspace);

    logUsageEvent("note_deleted", id);
    addActivityLog("Notes", "Deleted note", note.title);

    selectedNoteId = workspace.notes[0]?.id || null;

    renderFilters();
    renderNoteList();
    renderEditor(selectedNoteId);
    showStatus("Note deleted.", "success");
}

function togglePin(id) {
    const workspace = loadWorkspace();
    const note = workspace.notes.find((item) => item.id === id);

    if (!note) return;

    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();

    saveWorkspace(workspace);

    logUsageEvent(note.pinned ? "note_pinned" : "note_unpinned", note.id);
    addActivityLog("Notes", note.pinned ? "Pinned note" : "Unpinned note", note.title);

    renderNoteList();
    renderEditor(note.id);
}

function addFolder() {
    const name = prompt("Folder name:");

    if (!name || !name.trim()) return;

    const workspace = loadWorkspace();

    workspace.folders.push({
        id: generateId("folder"),
        name: name.trim(),
        createdAt: new Date().toISOString()
    });

    saveWorkspace(workspace);
    addActivityLog("Notes", "Created folder", name.trim());

    renderFilters();
    showStatus("Folder added.", "success");
}

function renderMarkdown(content) {
    let html = escapeHtml(content);

    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
    html = html.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/gim, `<a href="$2" target="_blank">$1</a>`);
    html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>");
    html = html.replace(/\n/g, "<br>");

    return html;
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("notes"));

    const notes = getActiveNotes();
    selectedNoteId = notes[0]?.id || null;

    renderFilters();
    renderNoteList();
    renderEditor(selectedNoteId);

    $("#newNoteBtn").on("click", createNote);
    $("#addFolderBtn").on("click", addFolder);

    $("#searchInput, #folderFilter, #tagFilter").on("input change", renderNoteList);

    $(document).on("click", ".note-list-item", function () {
        selectedNoteId = $(this).data("note-id");
        renderNoteList();
        renderEditor(selectedNoteId);
    });

    $(document).on("input", "#noteContent", function () {
        $("#notePreview").html(renderMarkdown($(this).val()));
    });

    $(document).on("click", "#saveNoteBtn", function () {
        editNote(selectedNoteId);
    });

    $(document).on("click", "#deleteNoteBtn", function () {
        deleteNote(selectedNoteId);
    });

    $(document).on("click", "#pinNoteBtn", function () {
        togglePin(selectedNoteId);
    });
});
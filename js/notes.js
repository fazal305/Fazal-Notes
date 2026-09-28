"use strict";

let selectedNoteId = null;
let currentMode = "active";

function getActiveNotes() {
  return loadWorkspace().notes.filter((note) => !note.deletedAt);
}

function getTrashNotes() {
  return loadWorkspace().notes.filter((note) => note.deletedAt);
}

function getVisibleNotes() {
  return currentMode === "trash" ? getTrashNotes() : getActiveNotes();
}

function ensureNoteV2Fields(note) {
  if (!note.revisions) note.revisions = [];
  return note;
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

  return getVisibleNotes()
    .filter((note) => {
      const searchable = [note.title, note.content, ...(note.tags || [])]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search || searchable.includes(search);
      const matchesFolder =
        currentMode === "trash" || !folderId || note.folderId === folderId;
      const matchesTag =
        currentMode === "trash" || !tag || (note.tags || []).includes(tag);

      return matchesSearch && matchesFolder && matchesTag;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (
        new Date(b.updatedAt || b.deletedAt) -
        new Date(a.updatedAt || a.deletedAt)
      );
    });
}

function renderModeControls() {
  if ($("#notesModeControls").length) return;

  $(".notes-toolbar").prepend(`
    <div id="notesModeControls" class="d-flex gap-2">
      <button id="activeModeBtn" class="btn-ghost flex-fill" type="button">Active Notes</button>
      <button id="trashModeBtn" class="btn-ghost flex-fill" type="button">Trash</button>
    </div>
  `);
}

function renderNoteList() {
  renderModeControls();

  $("#activeModeBtn").toggleClass("is-pinned", currentMode === "active");
  $("#trashModeBtn").toggleClass("is-pinned", currentMode === "trash");

  const query = $("#searchInput").val();
  const folderId = $("#folderFilter").val();
  const tag = $("#tagFilter").val();

  const notes = filterNotes(query, folderId, tag);

  if (!notes.length) {
    $("#noteList").html(
      renderEmptyState(
        currentMode === "trash"
          ? "Trash is empty."
          : "No matching notes found.",
      ),
    );
    return;
  }

  $("#noteList").html(
    notes
      .map(
        (note) => `
      <button class="note-list-item ${note.id === selectedNoteId ? "active" : ""}" data-note-id="${note.id}" type="button">
        <p class="note-list-title">
          <span>${note.pinned && !note.deletedAt ? "★ " : ""}${escapeHtml(note.title)}</span>
        </p>
        <p class="note-list-preview">${escapeHtml(note.content.slice(0, 110))}</p>
        <div class="note-tags">
          ${note.deletedAt ? `<span class="badge-soft status-danger">Deleted ${escapeHtml(formatTimestamp(note.deletedAt))}</span>` : ""}
          ${(note.tags || []).map((tagName) => `<span class="badge-soft">#${escapeHtml(tagName)}</span>`).join("")}
        </div>
      </button>
    `,
      )
      .join(""),
  );
}

function renderEditor(noteId) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === noteId);

  if (!note) {
    $("#editorMount").html(
      renderEmptyState("Select a note or create a new one."),
    );
    return;
  }

  ensureNoteV2Fields(note);

  if (note.deletedAt) {
    renderTrash(note);
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
        <button id="historyBtn" class="btn-ghost" type="button">History (${note.revisions.length})</button>
        <button id="saveNoteBtn" class="btn-fn" type="button">Save</button>
        <button id="deleteNoteBtn" class="btn-ghost" type="button">Move to Trash</button>
      </div>
    </div>

    <div class="note-meta-strip">
      <span class="badge-soft">Created ${escapeHtml(formatTimestamp(note.createdAt))}</span>
      <span class="badge-soft">${escapeHtml(getFolderName(note.folderId))}</span>
      <span class="badge-soft">V2 links: [[Note Title]]</span>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-6">
        <label class="form-label">Title</label>
        <input id="noteTitle" class="form-control" value="${escapeHtml(note.title)}">
      </div>

      <div class="col-lg-3">
        <label class="form-label">Folder</label>
        <select id="noteFolder" class="form-select">
          ${folders
            .map(
              (folder) => `
            <option value="${folder.id}" ${folder.id === note.folderId ? "selected" : ""}>
              ${escapeHtml(folder.name)}
            </option>
          `,
            )
            .join("")}
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

    <div id="historyPanel" class="glass-card section-card mt-3" style="display:none;"></div>
  `);

  $("#notePreview").html(renderMarkdown(resolveNoteLinks(note.content)));
}

function createNote(titleFromLink) {
  const workspace = loadWorkspace();

  let folderId = workspace.folders[0]?.id;

  if (!folderId) {
    folderId = generateId("folder");
    workspace.folders.push({
      id: folderId,
      name: "General",
      createdAt: new Date().toISOString(),
    });
  }

  const note = {
    id: generateId("note"),
    title: titleFromLink || "Untitled Note",
    content: titleFromLink
      ? `# ${titleFromLink}\n\nCreated from a missing note link.`
      : "# Untitled Note\n\nStart writing here...",
    folderId,
    tags: [],
    pinned: false,
    revisions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workspace.notes.unshift(note);
  saveWorkspace(workspace);

  logUsageEvent("note_created", note.id);
  addActivityLog("Notes", "Created note", note.title);

  selectedNoteId = note.id;
  currentMode = "active";

  renderFilters();
  renderNoteList();
  renderEditor(selectedNoteId);
  showStatus("New note created.", "success");
}

function saveRevision(noteId) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === noteId);

  if (!note) return;

  ensureNoteV2Fields(note);

  note.revisions.unshift({
    id: generateId("revision"),
    title: note.title,
    content: note.content,
    folderId: note.folderId,
    tags: [...(note.tags || [])],
    pinned: note.pinned,
    createdAt: new Date().toISOString(),
  });

  note.revisions = note.revisions.slice(0, 30);

  saveWorkspace(workspace);
}

function editNote(id) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find(
    (item) => item.id === id && !item.deletedAt,
  );

  if (!note) return;

  saveRevision(id);

  note.title = $("#noteTitle").val().trim() || "Untitled Note";
  note.content = $("#noteContent").val();
  note.folderId = $("#noteFolder").val();
  note.tags = $("#noteTags")
    .val()
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  note.updatedAt = new Date().toISOString();

  ensureNoteV2Fields(note);

  saveWorkspace(workspace);

  logUsageEvent("note_edited", note.id);
  addActivityLog("Notes", "Edited note", note.title);

  renderFilters();
  renderNoteList();
  renderEditor(note.id);
  showStatus("Note saved with revision history.", "success");
}

function deleteNote(id) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find(
    (item) => item.id === id && !item.deletedAt,
  );

  if (!note) return;
  if (!confirm(`Move "${note.title}" to Trash?`)) return;

  note.deletedAt = new Date().toISOString();
  note.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);

  logUsageEvent("note_trashed", id);
  addActivityLog("Notes", "Moved note to Trash", note.title);

  selectedNoteId = getActiveNotes()[0]?.id || null;

  renderFilters();
  renderNoteList();
  renderEditor(selectedNoteId);
  showStatus("Note moved to Trash.", "success");
}

function renderTrash(note) {
  $("#editorMount").html(`
    <div class="editor-topbar">
      <div>
        <h2 class="h5 mb-1">${escapeHtml(note.title)}</h2>
        <p class="mb-0 small" style="color: var(--fn-muted);">Deleted ${escapeHtml(formatTimestamp(note.deletedAt))}</p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button id="restoreTrashBtn" class="btn-fn" type="button">Restore</button>
        <button id="permanentDeleteBtn" class="btn-ghost" type="button">Permanently Delete</button>
      </div>
    </div>

    <div class="preview-surface mt-3">
      ${renderMarkdown(resolveNoteLinks(note.content))}
    </div>
  `);
}

function restoreFromTrash(id) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === id);

  if (!note) return;

  note.deletedAt = "";
  note.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);

  logUsageEvent("note_restored", id);
  addActivityLog("Notes", "Restored note", note.title);

  currentMode = "active";
  selectedNoteId = id;

  renderFilters();
  renderNoteList();
  renderEditor(id);
  showStatus("Note restored.", "success");
}

function permanentlyDelete(id) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === id);

  if (!note) return;
  if (!confirm(`Permanently delete "${note.title}"? This cannot be undone.`))
    return;

  workspace.notes = workspace.notes.filter((item) => item.id !== id);
  saveWorkspace(workspace);

  logUsageEvent("note_permanently_deleted", id);
  addActivityLog("Notes", "Permanently deleted note", note.title);

  selectedNoteId = getTrashNotes()[0]?.id || null;

  renderFilters();
  renderNoteList();
  renderEditor(selectedNoteId);
  showStatus("Note permanently deleted.", "success");
}

function togglePin(id) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find(
    (item) => item.id === id && !item.deletedAt,
  );

  if (!note) return;

  note.pinned = !note.pinned;
  note.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);

  logUsageEvent(note.pinned ? "note_pinned" : "note_unpinned", note.id);
  addActivityLog(
    "Notes",
    note.pinned ? "Pinned note" : "Unpinned note",
    note.title,
  );

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
    createdAt: new Date().toISOString(),
  });

  saveWorkspace(workspace);
  addActivityLog("Notes", "Created folder", name.trim());

  renderFilters();
  showStatus("Folder added.", "success");
}

function resolveNoteLinks(content) {
  const workspace = loadWorkspace();

  return String(content || "").replace(/\[\[(.*?)\]\]/g, (match, title) => {
    const cleanTitle = title.trim();
    const existingNote = workspace.notes.find((note) => {
      return (
        !note.deletedAt && note.title.toLowerCase() === cleanTitle.toLowerCase()
      );
    });

    if (existingNote) {
      return `[${cleanTitle}](note:${existingNote.id})`;
    }

    return `[Create "${cleanTitle}"](create-note:${encodeURIComponent(cleanTitle)})`;
  });
}

function renderMarkdown(content) {
  let html = escapeHtml(content);

  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
  html = html.replace(
    /\[(.*?)\]\(note:(.*?)\)/gim,
    `<a href="#" class="note-link" data-note-id="$2">$1</a>`,
  );
  html = html.replace(
    /\[(.*?)\]\(create-note:(.*?)\)/gim,
    `<a href="#" class="create-note-link" data-note-title="$2">$1</a>`,
  );
  html = html.replace(
    /\[(.*?)\]\((https?:\/\/.*?)\)/gim,
    `<a href="$2" target="_blank">$1</a>`,
  );
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>");
  html = html.replace(/\n/g, "<br>");

  return html;
}

function renderHistoryPanel() {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === selectedNoteId);

  if (!note) return;

  ensureNoteV2Fields(note);

  if (!note.revisions.length) {
    $("#historyPanel")
      .show()
      .html(
        renderEmptyState(
          "No revisions yet. Save this note once to create a restore point.",
        ),
      );
    return;
  }

  $("#historyPanel").show().html(`
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h3 class="h5 mb-1">Revision History</h3>
        <p class="mb-0 small" style="color: var(--fn-muted);">Restore any previous saved version.</p>
      </div>
      <button id="closeHistoryBtn" class="btn-ghost" type="button">Close</button>
    </div>

    <div class="d-grid gap-2">
      ${note.revisions
        .map(
          (revision) => `
        <article class="soft-card section-card">
          <div class="d-flex justify-content-between gap-3 flex-wrap">
            <div>
              <h4 class="h6 mb-1">${escapeHtml(revision.title)}</h4>
              <p class="mb-0 small" style="color: var(--fn-muted);">
                Saved ${escapeHtml(formatTimestamp(revision.createdAt))}
              </p>
            </div>
            <button class="btn-fn restore-revision-btn" data-revision-id="${revision.id}" type="button">Restore</button>
          </div>
          <p class="mt-2 mb-0 small" style="color: var(--fn-muted);">
            ${escapeHtml(revision.content.slice(0, 170))}
          </p>
        </article>
      `,
        )
        .join("")}
    </div>
  `);
}

function restoreRevision(noteId, revisionId) {
  const workspace = loadWorkspace();
  const note = workspace.notes.find((item) => item.id === noteId);

  if (!note) return;

  const revision = (note.revisions || []).find(
    (item) => item.id === revisionId,
  );

  if (!revision) return;

  saveRevision(noteId);

  note.title = revision.title;
  note.content = revision.content;
  note.folderId = revision.folderId;
  note.tags = [...(revision.tags || [])];
  note.pinned = revision.pinned;
  note.updatedAt = new Date().toISOString();

  saveWorkspace(workspace);

  logUsageEvent("revision_restored", note.id);
  addActivityLog("Notes", "Restored revision", note.title);

  renderFilters();
  renderNoteList();
  renderEditor(note.id);
  showStatus("Revision restored.", "success");
}

$(document).ready(function () {
  $("#sidebarMount").html(renderSidebar("notes"));

  const notes = getActiveNotes();
  selectedNoteId = notes[0]?.id || null;

  renderFilters();
  renderNoteList();
  renderEditor(selectedNoteId);

  $("#newNoteBtn").on("click", function () {
    createNote();
  });

  $("#addFolderBtn").on("click", addFolder);
  $("#searchInput, #folderFilter, #tagFilter").on(
    "input change",
    renderNoteList,
  );

  $(document).on("click", "#activeModeBtn", function () {
    currentMode = "active";
    selectedNoteId = getActiveNotes()[0]?.id || null;
    renderNoteList();
    renderEditor(selectedNoteId);
  });

  $(document).on("click", "#trashModeBtn", function () {
    currentMode = "trash";
    selectedNoteId = getTrashNotes()[0]?.id || null;
    renderNoteList();
    renderEditor(selectedNoteId);
  });

  $(document).on("click", ".note-list-item", function () {
    selectedNoteId = $(this).data("note-id");
    renderNoteList();
    renderEditor(selectedNoteId);
  });

  $(document).on("input", "#noteContent", function () {
    $("#notePreview").html(renderMarkdown(resolveNoteLinks($(this).val())));
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

  $(document).on("click", "#historyBtn", renderHistoryPanel);

  $(document).on("click", "#closeHistoryBtn", function () {
    $("#historyPanel").hide();
  });

  $(document).on("click", ".restore-revision-btn", function () {
    restoreRevision(selectedNoteId, $(this).data("revision-id"));
  });

  $(document).on("click", "#restoreTrashBtn", function () {
    restoreFromTrash(selectedNoteId);
  });

  $(document).on("click", "#permanentDeleteBtn", function () {
    permanentlyDelete(selectedNoteId);
  });

  $(document).on("click", ".note-link", function (event) {
    event.preventDefault();
    selectedNoteId = $(this).data("note-id");
    currentMode = "active";
    renderNoteList();
    renderEditor(selectedNoteId);
  });

  $(document).on("click", ".create-note-link", function (event) {
    event.preventDefault();
    const title = decodeURIComponent($(this).data("note-title"));
    createNote(title);
  });
});

const STORAGE_KEY = "weatherstar-layout-v1";

let editMode = false;
let selectedEl = null;
let isDragging = false;
let dragStart = null;

function loadLayout() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLayout(layout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout, null, 2));
}

function getTargets() {
  return Array.from(document.querySelectorAll("[data-edit-id]"));
}

function getEditId(el) {
  return el?.dataset?.editId;
}

function numberFromPx(value) {
  const n = parseFloat(String(value || "").replace("px", ""));
  return Number.isFinite(n) ? n : 0;
}

function readElementLayout(el) {
  const style = getComputedStyle(el);

  return {
    left: numberFromPx(el.style.left || style.left),
    top: numberFromPx(el.style.top || style.top),
    width: Math.round(el.offsetWidth || numberFromPx(style.width)),
    height: Math.round(el.offsetHeight || numberFromPx(style.height)),
    fontSize: numberFromPx(el.style.fontSize || style.fontSize),
    rotation: 0
  };
}

function applyElementLayout(el, item) {
  if (!el || !item) return;

  if (Number.isFinite(item.left)) el.style.left = `${item.left}px`;
  if (Number.isFinite(item.top)) el.style.top = `${item.top}px`;
  if (Number.isFinite(item.width) && item.width > 0) el.style.width = `${item.width}px`;
  if (Number.isFinite(item.height) && item.height > 0) el.style.height = `${item.height}px`;
  if (Number.isFinite(item.fontSize) && item.fontSize > 0) el.style.fontSize = `${item.fontSize}px`;
}

export function applySavedLayout() {
  const layout = loadLayout();

  getTargets().forEach(el => {
    const id = getEditId(el);
    if (layout[id]) applyElementLayout(el, layout[id]);
  });
}

function populateEditorList() {
  const select = document.querySelector("#editor-select");
  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `<option value="">Pick element</option>`;

  getTargets().forEach(el => {
    const id = getEditId(el);
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    select.appendChild(option);
  });

  if (currentValue) select.value = currentValue;
}

function updateInputsFromSelected() {
  if (!selectedEl) return;

  const item = readElementLayout(selectedEl);

  document.querySelector("#ed-x").value = Math.round(item.left);
  document.querySelector("#ed-y").value = Math.round(item.top);
  document.querySelector("#ed-w").value = Math.round(item.width);
  document.querySelector("#ed-h").value = Math.round(item.height);
  document.querySelector("#ed-fs").value = Math.round(item.fontSize);

  const name = document.querySelector("#editor-name");
  if (name) name.textContent = getEditId(selectedEl);
}

function selectElement(el) {
  if (!el) return;

  if (selectedEl) selectedEl.classList.remove("editor-selected");

  selectedEl = el;
  selectedEl.classList.add("editor-selected");

  const select = document.querySelector("#editor-select");
  if (select) select.value = getEditId(el);

  updateInputsFromSelected();
}

function saveCurrentElement() {
  if (!selectedEl) return;

  const id = getEditId(selectedEl);
  const layout = loadLayout();

  layout[id] = readElementLayout(selectedEl);

  saveLayout(layout);
}

function setSelectedProp(prop, value) {
  if (!selectedEl) return;

  const n = Number(value);
  if (!Number.isFinite(n)) return;

  if (prop === "left") selectedEl.style.left = `${n}px`;
  if (prop === "top") selectedEl.style.top = `${n}px`;
  if (prop === "width") selectedEl.style.width = `${n}px`;
  if (prop === "height") selectedEl.style.height = `${n}px`;
  if (prop === "fontSize") selectedEl.style.fontSize = `${n}px`;

  saveCurrentElement();
}

function startDrag(event) {
  if (!editMode) return;

  const target = event.target.closest("[data-edit-id]");
  if (!target) return;

  event.preventDefault();

  selectElement(target);

  const current = readElementLayout(target);

  isDragging = true;
  dragStart = {
    mouseX: event.clientX,
    mouseY: event.clientY,
    left: current.left,
    top: current.top
  };
}

function moveDrag(event) {
  if (!isDragging || !selectedEl || !dragStart) return;

  const dx = event.clientX - dragStart.mouseX;
  const dy = event.clientY - dragStart.mouseY;

  selectedEl.style.left = `${Math.round(dragStart.left + dx)}px`;
  selectedEl.style.top = `${Math.round(dragStart.top + dy)}px`;

  updateInputsFromSelected();
}

function endDrag() {
  if (!isDragging) return;

  isDragging = false;
  dragStart = null;

  saveCurrentElement();
}

function resetSelected() {
  if (!selectedEl) return;

  const id = getEditId(selectedEl);
  const layout = loadLayout();

  delete layout[id];
  saveLayout(layout);

  location.reload();
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function exportLayout() {
  const layout = loadLayout();
  const text = JSON.stringify(layout, null, 2);

  navigator.clipboard.writeText(text).then(() => {
    alert("Layout copied to clipboard.");
  });
}

export function refreshEditorTargets() {
  applySavedLayout();
  populateEditorList();
}

export function initEditor() {
  const toggle = document.querySelector("#edit-toggle");
  const panel = document.querySelector("#editor-panel");
  const select = document.querySelector("#editor-select");

  toggle.addEventListener("click", () => {
    editMode = !editMode;

    document.body.classList.toggle("editor-on", editMode);
    panel.style.display = editMode ? "flex" : "none";
    toggle.textContent = editMode ? "Editing On" : "Edit Layout";

    refreshEditorTargets();
  });

  select.addEventListener("change", () => {
    const el = document.querySelector(`[data-edit-id="${select.value}"]`);
    if (el) selectElement(el);
  });

  document.querySelector("#ed-x").addEventListener("input", e => setSelectedProp("left", e.target.value));
  document.querySelector("#ed-y").addEventListener("input", e => setSelectedProp("top", e.target.value));
  document.querySelector("#ed-w").addEventListener("input", e => setSelectedProp("width", e.target.value));
  document.querySelector("#ed-h").addEventListener("input", e => setSelectedProp("height", e.target.value));
  document.querySelector("#ed-fs").addEventListener("input", e => setSelectedProp("fontSize", e.target.value));

  document.querySelector("#editor-save").addEventListener("click", () => {
    saveCurrentElement();
    alert("Saved.");
  });

  document.querySelector("#editor-reset").addEventListener("click", resetSelected);
  document.querySelector("#editor-reset-all").addEventListener("click", resetAll);
  document.querySelector("#editor-export").addEventListener("click", exportLayout);

  document.addEventListener("pointerdown", startDrag);
  document.addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);

  refreshEditorTargets();
}
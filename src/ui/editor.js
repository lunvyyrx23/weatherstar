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

function setImportantPx(el, prop, value) {
  el.style.setProperty(prop, `${Math.round(value)}px`, "important");
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

  if (Number.isFinite(item.left)) setImportantPx(el, "left", item.left);
  if (Number.isFinite(item.top)) setImportantPx(el, "top", item.top);
  if (Number.isFinite(item.width) && item.width > 0) setImportantPx(el, "width", item.width);
  if (Number.isFinite(item.height) && item.height > 0) setImportantPx(el, "height", item.height);

  if (Number.isFinite(item.fontSize) && item.fontSize > 0) {
    setImportantPx(el, "font-size", item.fontSize);
  }
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

  if (prop === "left") setImportantPx(selectedEl, "left", n);
  if (prop === "top") setImportantPx(selectedEl, "top", n);
  if (prop === "width") setImportantPx(selectedEl, "width", n);
  if (prop === "height") setImportantPx(selectedEl, "height", n);
  if (prop === "fontSize") setImportantPx(selectedEl, "font-size", n);

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

  setImportantPx(selectedEl, "left", dragStart.left + dx);
  setImportantPx(selectedEl, "top", dragStart.top + dy);

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


function getParentBox() {
  if (!selectedEl || !selectedEl.parentElement) return null;

  const parent = selectedEl.parentElement;
  const box = parent.getBoundingClientRect();

  return {
    width: Math.round(box.width || parent.offsetWidth),
    height: Math.round(box.height || parent.offsetHeight)
  };
}

function getNaturalSize(el) {
  return {
    width: el.naturalWidth || el.videoWidth || el.offsetWidth || 1,
    height: el.naturalHeight || el.videoHeight || el.offsetHeight || 1
  };
}

function removeSelectedTransform() {
  if (!selectedEl) return;
  selectedEl.style.setProperty("transform", "none", "important");
}

function fitSelectedToScreen() {
  if (!selectedEl) {
    alert("Pick an element first.");
    return;
  }

  const box = getParentBox();
  if (!box) return;

  removeSelectedTransform();

  setImportantPx(selectedEl, "left", 0);
  setImportantPx(selectedEl, "top", 0);
  setImportantPx(selectedEl, "width", box.width);
  setImportantPx(selectedEl, "height", box.height);

  saveCurrentElement();
  updateInputsFromSelected();
}

function fitSelectedCover() {
  if (!selectedEl) {
    alert("Pick an element first.");
    return;
  }

  const box = getParentBox();
  if (!box) return;

  const natural = getNaturalSize(selectedEl);
  const scale = Math.max(box.width / natural.width, box.height / natural.height);

  const width = Math.round(natural.width * scale);
  const height = Math.round(natural.height * scale);
  const left = Math.round((box.width - width) / 2);
  const top = Math.round((box.height - height) / 2);

  removeSelectedTransform();

  setImportantPx(selectedEl, "left", left);
  setImportantPx(selectedEl, "top", top);
  setImportantPx(selectedEl, "width", width);
  setImportantPx(selectedEl, "height", height);

  saveCurrentElement();
  updateInputsFromSelected();
}

function fitSelectedInside() {
  if (!selectedEl) {
    alert("Pick an element first.");
    return;
  }

  const box = getParentBox();
  if (!box) return;

  const natural = getNaturalSize(selectedEl);
  const scale = Math.min(box.width / natural.width, box.height / natural.height);

  const width = Math.round(natural.width * scale);
  const height = Math.round(natural.height * scale);
  const left = Math.round((box.width - width) / 2);
  const top = Math.round((box.height - height) / 2);

  removeSelectedTransform();

  setImportantPx(selectedEl, "left", left);
  setImportantPx(selectedEl, "top", top);
  setImportantPx(selectedEl, "width", width);
  setImportantPx(selectedEl, "height", height);

  saveCurrentElement();
  updateInputsFromSelected();
}

function centerSelected() {
  if (!selectedEl) {
    alert("Pick an element first.");
    return;
  }

  const box = getParentBox();
  if (!box) return;

  const current = readElementLayout(selectedEl);

  removeSelectedTransform();

  setImportantPx(selectedEl, "left", Math.round((box.width - current.width) / 2));
  setImportantPx(selectedEl, "top", Math.round((box.height - current.height) / 2));

  saveCurrentElement();
  updateInputsFromSelected();
}

export function refreshEditorTargets() {
  applySavedLayout();
  populateEditorList();
}

export function initEditor() {
  const toggle = document.querySelector("#edit-toggle");
  const panel = document.querySelector("#editor-panel");
  const select = document.querySelector("#editor-select");

  if (!toggle || !panel || !select) return;

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
  const fitScreenBtn = document.querySelector("#editor-fit-screen");
  const fitCoverBtn = document.querySelector("#editor-fit-cover");
  const fitInsideBtn = document.querySelector("#editor-fit-inside");
  const centerBtn = document.querySelector("#editor-center");

  if (fitScreenBtn) fitScreenBtn.addEventListener("click", fitSelectedToScreen);
  if (fitCoverBtn) fitCoverBtn.addEventListener("click", fitSelectedCover);
  if (fitInsideBtn) fitInsideBtn.addEventListener("click", fitSelectedInside);
  if (centerBtn) centerBtn.addEventListener("click", centerSelected);

  document.querySelector("#editor-export").addEventListener("click", exportLayout);

  document.addEventListener("pointerdown", startDrag);
  document.addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);

  refreshEditorTargets();
}


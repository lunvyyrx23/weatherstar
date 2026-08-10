export function initScrollboxTools(onTargetsChanged = () => {}) {
  function makeHourlyScrollbox() {
    const table = document.querySelector("#hourly-table, .hourly-table");

    if (!table) return;

    if (table.closest("#hourly-scrollbox")) return;

    table.removeAttribute("data-edit-id");

    const wrapper = document.createElement("div");
    wrapper.id = "hourly-scrollbox";
    wrapper.dataset.editId = "hourly-scrollbox";

    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);

    onTargetsChanged();
  }

  makeHourlyScrollbox();

  const observer = new MutationObserver(() => {
    makeHourlyScrollbox();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

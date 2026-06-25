export function renderCurrentPage() {
  const page = document.querySelector("#page-current");

  page.innerHTML = `
    <div id="cc-temp">84°</div>
    <div id="cc-cond">Sunny</div>
    <div id="cc-wind">Wind: SW 5 mph</div>
  `;
}
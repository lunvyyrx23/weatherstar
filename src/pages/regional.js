function getMainWeatherSearchValue() {
  const input =
    document.getElementById("city-input") ||
    document.getElementById("cityInput") ||
    document.getElementById("locationInput") ||
    document.getElementById("placeInput") ||
    document.getElementById("searchInput") ||
    document.querySelector("input[type='search']") ||
    document.querySelector("input");

  const value = input && input.value ? input.value.trim() : "";
  return value || "Augusta, GA";
}
function getRegionalContainer(target) {
  if (target && target.nodeType === 1) return target;

  return (
    document.getElementById("page-regional") ||
    document.querySelector("[data-page='regional']") ||
    document.querySelector(".page-regional") ||
    document.querySelector(".regional-page")
  );
}

function mountRegionalTestScreen(target) {
  const page = getRegionalContainer(target);

  if (!page) {
    console.warn("Regional page container not found. Test screen was not mounted.");
    return;
  }

  const regionalLocation = getMainWeatherSearchValue();

  page.innerHTML = `
    <iframe
      id="regional-test-screen"
      src="/regional-screen.html?location=${encodeURIComponent(getMainWeatherSearchValue())}"
      title="Regional Observations"
      scrolling="no"
      style="
        position:absolute;
        left:0;
        top:0;
        width:1091px;
        height:820px;
        border:0;
        margin:0;
        padding:0;
        display:block;
        overflow:hidden;
        background:#001244;
      "
    ></iframe>
  `;

  const iframe = page.querySelector("#regional-test-screen");
  if (iframe) {
    iframe.addEventListener("load", () => {
      iframe.contentWindow?.postMessage({
        type: "weatherstar:setRegionalLocation",
        location: regionalLocation
      }, "*");
    });
  }

  Object.assign(page.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "1091px",
    height: "820px",
    overflow: "hidden",
    background: "#001244"
  });
}

export function renderRegionalPage(target) {
  mountRegionalTestScreen(target);
}

export function renderRegional(target) {
  mountRegionalTestScreen(target);
}

export function initRegional(target) {
  mountRegionalTestScreen(target);
}

export function showRegional(target) {
  mountRegionalTestScreen(target);
}

export default renderRegionalPage;
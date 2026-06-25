import { renderRegionalPage } from "./pages/regional.js";
import "./style.css";

document.querySelector("#app").innerHTML = `
  <div id="topbar">
    <div id="logo"><span>Weather</span>STAR 4000+</div>
    <input id="city-input" value="Charlotte, NC" />
    <button id="update-btn">Update</button>
    <button id="current-btn">Current</button>
    <button id="regional-btn">Regional</button>
  </div>

  <main id="screen">
    <div id="page-header">CURRENT<br>CONDITIONS</div>

    <section id="page-current" class="page active">
      <div id="cc-temp">84°</div>
      <div id="cc-cond">Sunny</div>
      <div id="cc-wind">Wind: SW 5 mph</div>
    </section>

    <section id="page-regional" class="page">
      <div id="regional-basemap"></div>
      <div id="regional-dots"></div>
      <div id="regional-frame"></div>
    </section>

    <div id="bottom-banner">WeatherSTAR 4000+</div>
  </main>
`;

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  if (pageName === "current") {
    document.querySelector("#page-current").classList.add("active");
    document.querySelector("#page-header").innerHTML = "CURRENT<br>CONDITIONS";
  }

  if (pageName === "regional") {
    document.querySelector("#page-regional").classList.add("active");
    document.querySelector("#page-header").innerHTML = "REGIONAL<br>OBSERVATIONS";
    renderRegionalPage();
  }
}

document.querySelector("#current-btn").addEventListener("click", () => {
  showPage("current");
});

document.querySelector("#regional-btn").addEventListener("click", () => {
  showPage("regional");
});
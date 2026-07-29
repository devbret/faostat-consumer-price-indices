import { loadCpi, buildIndex, KEY_SEP } from "./loadCpi.js";
import { createHeatmap } from "./heatmap.js";
import { createPlayback } from "./playback.js";

const $ = (id) => document.getElementById(id);

const els = {
  areaSelect: $("area-select"),
  itemSelect: $("item-select"),
  elementField: $("element-field"),
  elementSelect: $("element-select"),
  prevBtn: $("prev-btn"),
  playBtn: $("play-btn"),
  playIcon: $("play-icon"),
  pauseIcon: $("pause-icon"),
  stopBtn: $("stop-btn"),
  nextBtn: $("next-btn"),
  speedSelect: $("speed-select"),
  position: $("position"),
  loading: $("loading"),
  loadingText: $("loading-text"),
  loadingBar: $("loading-bar"),
  error: $("error"),
  viz: $("viz"),
  vizTitle: $("viz-title"),
};

const state = { area: "", item: "", element: "" };
let index = null;
let heatmap = null;
let playback = null;

function itemKey() {
  return state.item + KEY_SEP + state.element;
}

function playlist() {
  return index.availability.get(itemKey()) || [];
}

function fillSelect(selectEl, values) {
  selectEl.replaceChildren();
  for (const v of values) {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    selectEl.appendChild(option);
  }
}

function update() {
  const rows =
    index.byKey.get(
      state.area + KEY_SEP + state.item + KEY_SEP + state.element,
    ) || [];

  els.vizTitle.textContent = state.area;

  for (const option of els.itemSelect.options) {
    const areas = index.availability.get(
      option.value + KEY_SEP + state.element,
    );
    option.disabled = !areas || !areas.includes(state.area);
  }

  const list = playlist();
  const i = list.indexOf(state.area);
  els.position.textContent =
    i === -1 ? `- / ${list.length}` : `${i + 1} / ${list.length}`;

  heatmap.update({
    rows,
    area: state.area,
    item: state.item,
    unit: index.itemUnit.get(itemKey()) || "",
    globalExtent: index.itemExtent.get(itemKey()),
  });
}

function setArea(area) {
  state.area = area;
  els.areaSelect.value = area;
  update();
}

async function init() {
  const rows = await loadCpi("/cpi_long.csv", (received, total) => {
    const mb = (n) => (n / 1048576).toFixed(1);
    if (total > 0) {
      els.loadingBar.value = received / total;
      els.loadingText.textContent = `Loading CPI data... ${mb(received)} of ${mb(total)} MB`;
    } else {
      els.loadingBar.removeAttribute("value");
      els.loadingText.textContent = `Loading CPI data... ${mb(received)} MB`;
    }
  });

  els.loadingText.textContent = "Preparing data...";
  await new Promise((resolve) => requestAnimationFrame(resolve));

  index = buildIndex(rows);
  if (!index.areas.length) {
    throw new Error("No usable rows found in cpi_long.csv");
  }

  state.area = index.areas[0];
  state.item = index.items[0];
  state.element = index.elements[0];

  fillSelect(els.areaSelect, index.areas);
  fillSelect(els.itemSelect, index.items);
  fillSelect(els.elementSelect, index.elements);
  els.areaSelect.value = state.area;
  els.itemSelect.value = state.item;
  els.elementSelect.value = state.element;
  els.elementField.hidden = index.elements.length < 2;

  heatmap = createHeatmap(
    {
      chart: $("chart"),
      scroll: $("chart-scroll"),
      tooltip: $("tooltip"),
      empty: $("empty-state"),
      announcer: $("announcer"),
    },
    { yearMin: index.yearMin, yearMax: index.yearMax },
  );

  playback = createPlayback({
    getPlaylist: playlist,
    getCurrent: () => state.area,
    apply: setArea,
    onStateChange: (playing) => {
      els.playIcon.hidden = playing;
      els.pauseIcon.hidden = !playing;
      els.playBtn.setAttribute(
        "aria-label",
        playing ? "Pause playback" : "Play through countries",
      );
    },
  });
  playback.setDelay(Number(els.speedSelect.value));

  els.areaSelect.addEventListener("change", () => {
    state.area = els.areaSelect.value;
    update();
  });
  els.itemSelect.addEventListener("change", () => {
    state.item = els.itemSelect.value;
    update();
  });
  els.elementSelect.addEventListener("change", () => {
    state.element = els.elementSelect.value;
    update();
  });

  els.playBtn.addEventListener("click", () => playback.toggle());
  els.stopBtn.addEventListener("click", () => playback.stop());
  els.nextBtn.addEventListener("click", () => playback.next());
  els.prevBtn.addEventListener("click", () => playback.prev());
  els.speedSelect.addEventListener("change", () => {
    playback.setDelay(Number(els.speedSelect.value));
  });

  els.loading.hidden = true;
  els.viz.hidden = false;
  update();
}

init().catch((err) => {});

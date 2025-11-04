import "./style.css";
import {
  createHistoryCoordinator,
  type HistoryEntry,
  type HistoryEvent,
} from "@path-controller/core";

type AppState = unknown;

const coordinator = createHistoryCoordinator<AppState>();

const urlInput = document.querySelector<HTMLInputElement>("#url");
const titleInput = document.querySelector<HTMLInputElement>("#title");
const stateInput = document.querySelector<HTMLTextAreaElement>("#state");
const pushButton = document.querySelector<HTMLButtonElement>("#push");
const replaceButton = document.querySelector<HTMLButtonElement>("#replace");
const backButton = document.querySelector<HTMLButtonElement>("#back");
const forwardButton = document.querySelector<HTMLButtonElement>("#forward");
const eventList = document.querySelector<HTMLUListElement>("#events");

if (!urlInput || !titleInput || !stateInput || !eventList) {
  throw new Error("DOMの初期化に失敗しました");
}

urlInput.value = window.location.pathname + window.location.search + window.location.hash;
titleInput.value = document.title;

if (window.history.state) {
  try {
    stateInput.value = JSON.stringify(window.history.state, null, 2);
  } catch (error) {
    console.warn("初期stateの整形に失敗しました", error);
  }
}

const MAX_EVENTS = 15;

const enqueueEvent = (event: HistoryEvent<AppState>) => {
  const item = document.createElement("li");
  item.className = "event-item";

  const header = document.createElement("div");
  header.className = "event-header";

  const direction = document.createElement("span");
  direction.className = "event-direction";
  direction.textContent = event.direction;

  const url = document.createElement("span");
  url.className = "event-url";
  url.textContent = event.entry.url;

  header.append(direction, url);

  const meta = document.createElement("div");
  meta.className = "event-meta";

  const title = document.createElement("div");
  title.textContent = `title: ${event.entry.title ?? "(なし)"}`;

  const stateLine = document.createElement("div");
  stateLine.textContent = "state: ";
  const code = document.createElement("code");
  code.textContent = formatState(event.entry.state);
  stateLine.append(code);

  const native = document.createElement("div");
  native.textContent = event.nativeEvent
    ? "origin: browser"
    : "origin: coordinator";

  meta.append(title, stateLine, native);

  item.append(header, meta);

  eventList.prepend(item);
  trimEventList();
};

const trimEventList = () => {
  const items = Array.from(eventList.querySelectorAll("li"));
  items.slice(MAX_EVENTS).forEach((node) => node.remove());
};

const parseState = (value: string): AppState => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn("stateのJSONパースに失敗しました。文字列として扱います", error);
    return trimmed;
  }
};

const buildEntry = (): HistoryEntry<AppState> => {
  const urlValue = urlInput.value.trim() || window.location.pathname;
  const titleValue = titleInput.value.trim() || undefined;
  const stateValue = parseState(stateInput.value);

  return {
    url: urlValue,
    title: titleValue,
    state: stateValue,
  };
};

coordinator.subscribe((event) => {
  enqueueEvent(event);
  if (event.entry.title) {
    document.title = event.entry.title;
  }
});

const setupTrigger = (
  button: HTMLButtonElement | null,
  action: (entry: HistoryEntry<AppState>) => void
) => {
  if (!button) return;
  button.addEventListener("click", () => action(buildEntry()));
};

setupTrigger(pushButton, (entry) => coordinator.push(entry));
setupTrigger(replaceButton, (entry) => coordinator.replace(entry));

backButton?.addEventListener("click", () => coordinator.go(-1));
forwardButton?.addEventListener("click", () => coordinator.go(1));

enqueueEvent({
  direction: "replace",
  entry: {
    url: window.location.href,
    title: document.title,
    state: window.history.state as AppState,
  },
});

function formatState(value: AppState) {
  if (value === undefined || value === null) return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      console.warn("stateのシリアライズに失敗しました", error);
    }
  }
  return String(value);
}

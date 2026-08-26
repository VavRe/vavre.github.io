const DATA_FILES = {
  paper: "data/paper_numbers.json",
  extraction: "data/model_extraction.json",
  sentiment: "data/sentiment_timeseries.json",
  trends: "data/sentiment_trends.json",
  releases: "data/release_sentiment_deltas.json",
  concepts: "data/concept_prevalence.json",
  releaseConcepts: "data/concept_release_deltas.json",
  discussion: "data/discussion_prevalence.json",
  subreddits: "data/subreddit_stats.json",
  conceptBank: "data/concept_bank.json",
  conceptSentiment: "data/concept_sentiment.json",
  manifest: "data/manifest.json",
};

const SENTIMENTS = {
  positive: { label: "Positive", color: "#13865b" },
  neutral: { label: "Neutral", color: "#7d8f88" },
  negative: { label: "Negative", color: "#c94835" },
};

// Provider colors match the matplotlib figures used in the paper, so the
// website and the PDF read as one artifact.
const PROVIDER_COLORS = {
  openai: "#10a37f",
  anthropic: "#d97706",
  google: "#4285f4",
  xai: "#1a1a1a",
  meta: "#0082fb",
  deepseek: "#6366f1",
  mistral: "#a85528",
  alibaba: "#b84d6a",
  "moonshot-ai": "#64748b",
};

// Generic accent for non-provider single-series marks (page's forest green).
const ACCENT = "#2f6e5c";
const INK = "#22312c";
const HEADING_INK = "#2f403b";
const MUTED_INK = "#5b6d66";

const SERIES_COLORS = ["#2f6e5c", "#d97706", "#6366f1", "#c94835", "#0f766e", "#8c6f2b", "#4285f4", "#b84d6a", "#4a6b31", "#64748b", "#a85528", "#b45309"];
const CONCEPT_SHADES = ["#1f3a33", "#2b5148", "#37685e", "#437f73", "#529487", "#6ba996", "#8cbfa9", "#abd2bd", "#c7e2d3", "#dcefe4"];
const PAPER_FOCUS_RELEASES = new Set(["OpenAI|GPT-4o", "OpenAI|GPT-5", "OpenAI|GPT-5.1", "Anthropic|Claude 4", "DeepSeek|DS R1", "xAI|Grok 3"]);
const STORY_DEFAULT_RELEASE = {
  OpenAI: "GPT-5",
  Anthropic: "Claude 4",
  DeepSeek: "DS R1",
  xAI: "Grok 3",
};

const state = {
  data: {},
  selectedReleaseProvider: "OpenAI",
  selectedReleaseModel: "GPT-5",
  sentimentProvider: "openai",
  sentimentToggles: { positive: true, neutral: true, negative: true },
  scatterProvider: "all",
  scatterSource: "all",
  scatterHideFirst: false,
  mentionLevel: "provider",
  mentionStartMonth: "",
  mentionEndMonth: "",
  entityMultiLevel: "provider",
  conceptGranularity: "month",
  conceptSearch: "",
  conceptMarkerProvider: "openai",
  releaseConceptProvider: "OpenAI",
  releaseConceptModel: "",
  subredditName: "",
  subredditLevel: "provider",
  conceptBankSearch: "",
  conceptBankDimension: "overall",
  conceptBankValue: "overall",
  conceptBankSentiment: "all",
  conceptBankSort: "prevalence_desc",
  conceptSentimentFilter: "all",
  conceptAgreementFilter: "all",
  rankingProvider: "all",
  rankingRelease: "all",
  rankingDirection: "all",
  rankingSearch: "",
};

const $ = (id) => document.getElementById(id);

function svgEl(name, attrs = {}, text = "") {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (text !== "") el.textContent = text;
  return el;
}

/* ── shared floating tooltip (replaces slow native <title> OS tooltips) ─── */
const appTip = document.createElement("div");
appTip.className = "story-tooltip";
document.addEventListener("DOMContentLoaded", () => document.body.appendChild(appTip));
if (document.body) document.body.appendChild(appTip);

function showAppTip(html_, x, y) {
  appTip.innerHTML = html_;
  appTip.classList.add("visible");
  const pad = 14;
  const w = appTip.offsetWidth;
  const h = appTip.offsetHeight;
  let left = x + pad;
  let top = y - h - pad;
  if (left + w > window.innerWidth - 8) left = x - w - pad;
  if (top < 8) top = y + pad;
  appTip.style.left = `${left}px`;
  appTip.style.top = `${top}px`;
}

function hideAppTip() {
  appTip.classList.remove("visible");
}

function wireTooltip(node, htmlFn) {
  node.addEventListener("mousemove", (ev) => showAppTip(htmlFn(), ev.clientX, ev.clientY));
  node.addEventListener("mouseleave", hideAppTip);
}

/* ── greedy label declutter: place text candidates, skip on collision ────
   candidates: [{x, y, text, color, fontSize, fontWeight, priority, anchor}]
   anchor: "right" (default, label to the right of the point) or "top"
   (label centered above the point, used for vertical marker bands). */
function placeDeclutteredLabels(svg, candidates) {
  const placed = [];
  const sorted = [...candidates].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  sorted.forEach((c) => {
    const fs = c.fontSize || 10.5;
    const w = c.text.length * fs * 0.58 + 4;
    const h = fs * 1.25;
    const rightOffsets = [
      [8, -6],
      [8, h + 4],
      [8, -h - 8],
      [-w - 8, -6],
      [-w - 8, h + 4],
    ];
    const topOffsets = [
      [-w / 2, 0],
      [-w / 2, h + 2],
      [-w / 2, 2 * (h + 2)],
      [-w / 2, 3 * (h + 2)],
    ];
    const offsets = c.anchor === "top" ? topOffsets : rightOffsets;
    for (const [dx, dy] of offsets) {
      const x0 = c.x + dx;
      const y0 = c.y + dy - h * 0.78;
      const x1 = x0 + w;
      const y1 = y0 + h;
      const overlaps = placed.some((p) => !(x1 < p.x0 || x0 > p.x1 || y1 < p.y0 || y0 > p.y1));
      if (!overlaps) {
        placed.push({ x0, y0, x1, y1 });
        svg.appendChild(
          svgEl(
            "text",
            { x: x0, y: y0 + h * 0.78, fill: c.color || HEADING_INK, "font-size": fs, "font-weight": c.fontWeight || 700 },
            c.text,
          ),
        );
        return;
      }
    }
    // no free slot: skip the text label; the point/line itself remains visible.
  });
}

function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (values[i] ?? ""), "");
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtInt(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(Math.round(n));
}

function fmtPct(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return `${Number(value).toFixed(digits)}%`;
}

function fmtDelta(value) {
  const n = Number(value || 0);
  return `${n > 0 ? "+" : ""}${n.toFixed(1)} pp`;
}

function providerKey(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function providerLabel(keyOrLabel) {
  const key = providerKey(keyOrLabel);
  const labels = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    xai: "xAI",
    meta: "Meta",
    deepseek: "DeepSeek",
    mistral: "Mistral",
    alibaba: "Alibaba",
    "moonshot-ai": "Moonshot AI",
    "deepseek-r1": "DeepSeek R1",
  };
  return labels[key] || String(keyOrLabel || "").replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function providerColor(keyOrLabel) {
  return PROVIDER_COLORS[providerKey(keyOrLabel)] || "#526071";
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00Z`).getTime();
}

function parseMonth(monthString) {
  return new Date(`${monthString}-01T00:00:00Z`).getTime();
}

function parsePeriod(period, granularity = "month") {
  if (!period) return NaN;
  if (granularity === "quarter") {
    const match = String(period).match(/^(\d{4})Q([1-4])$/);
    if (match) return Date.UTC(Number(match[1]), (Number(match[2]) - 1) * 3, 1);
  }
  if (/^\d{4}-\d{2}$/.test(String(period))) return parseMonth(period);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(period))) return parseDate(period);
  return new Date(`${period}T00:00:00Z`).getTime();
}

function periodLabel(period) {
  return String(period || "");
}

function scale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

function makeLinePath(points) {
  let path = "";
  let open = false;
  for (const point of points) {
    if (!point || point.some((v) => v === null || Number.isNaN(v))) {
      open = false;
      continue;
    }
    path += `${open ? "L" : "M"}${point[0].toFixed(2)},${point[1].toFixed(2)}`;
    open = true;
  }
  return path;
}

function makeAreaPath(upper, lower) {
  if (!upper.length || !lower.length) return "";
  const top = upper.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L");
  const bottom = lower
    .slice()
    .reverse()
    .map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join("L");
  return `M${top}L${bottom}Z`;
}

function createSvg(container, width = 920, height = 380) {
  container.innerHTML = "";
  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": "Interactive aggregate data chart",
  });
  container.appendChild(svg);
  return svg;
}

function addYAxis(svg, y, x1, x2, ticks, labelFormatter = (d) => d) {
  const g = svgEl("g", { class: "axis" });
  ticks.forEach((tick) => {
    const yy = y(tick);
    g.appendChild(svgEl("line", { x1, y1: yy, x2, y2: yy, class: "grid-line" }));
    g.appendChild(svgEl("text", { x: x1 - 10, y: yy + 4, "text-anchor": "end" }, labelFormatter(tick)));
  });
  svg.appendChild(g);
}

function addTimeXTicks(svg, x, domain, y, count = 6) {
  const g = svgEl("g", { class: "axis" });
  for (let i = 0; i <= count; i += 1) {
    const t = domain[0] + ((domain[1] - domain[0]) * i) / count;
    const d = new Date(t);
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    g.appendChild(svgEl("line", { x1: x(t), y1: y, x2: x(t), y2: y + 5 }));
    g.appendChild(svgEl("text", { x: x(t), y: y + 21, "text-anchor": "middle" }, label));
  }
  svg.appendChild(g);
}

function addNumericXTicks(svg, x, ticks, y, labelFormatter = (d) => d) {
  const g = svgEl("g", { class: "axis" });
  ticks.forEach((tick) => {
    g.appendChild(svgEl("line", { x1: x(tick), y1: y, x2: x(tick), y2: y + 5 }));
    g.appendChild(svgEl("text", { x: x(tick), y: y + 21, "text-anchor": "middle" }, labelFormatter(tick)));
  });
  svg.appendChild(g);
}

function domainWithPadding(values, minPad = 2) {
  const nums = values.map(Number).filter((v) => !Number.isNaN(v));
  let min = Math.min(...nums, 0);
  let max = Math.max(...nums, 0);
  const pad = Math.max((max - min) * 0.12, minPad);
  return [min - pad, max + pad];
}

function rowColor(row, fallbackIndex = 0) {
  if (state.mentionLevel === "provider") return providerColor(row.value || row.provider || row.provider_key || row.label);
  return SERIES_COLORS[fallbackIndex % SERIES_COLORS.length];
}

function selectedReleaseKey() {
  return `${state.selectedReleaseProvider}|${state.selectedReleaseModel}`;
}

function isPaperFocus(provider, model) {
  return PAPER_FOCUS_RELEASES.has(`${provider}|${model}`);
}

function monthInRange(month) {
  if (state.mentionStartMonth && month < state.mentionStartMonth) return false;
  if (state.mentionEndMonth && month > state.mentionEndMonth) return false;
  return true;
}

function normalizeSentiment(value) {
  const text = String(value || "Mixed");
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function renderValueBars(containerId, rows, options = {}) {
  const max = options.max ?? Math.max(...rows.map((r) => Number(options.value(r) || 0)), 1);
  if (!rows.length) {
    $(containerId).innerHTML = `<p class="profile-note">No aggregate rows for this selection.</p>`;
    return;
  }
  $(containerId).innerHTML = html`
    <div class="list-bars">
      ${rows
        .map((row, i) => {
          const value = Number(options.value(row) || 0);
          const width = Math.max(1, (value / (max || 1)) * 100);
          const color = options.color ? options.color(row, i) : "#2f6e5c";
          return html`
            <div class="list-row" title="${esc(options.title ? options.title(row) : `${options.label(row)}: ${value}`)}">
              <div class="list-label">
                ${esc(options.label(row))}
                ${options.meta ? `<span class="list-meta">${esc(options.meta(row))}</span>` : ""}
              </div>
              <div class="bar-track"><div class="value-bar" style="width:${width}%;background:${color}"></div></div>
              <div class="list-value">${options.format ? options.format(value, row) : fmtInt(value)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function aggregateMonthlyRows(level) {
  const grouped = new Map();
  const rows = state.data.discussion.monthly_rows.filter((r) => r.level === level && monthInRange(r.month));
  rows.forEach((row) => {
    const key = row.value;
    if (!grouped.has(key)) grouped.set(key, { level, value: row.value, label: row.label, mention_count: 0, post_count: 0, months: 0 });
    const item = grouped.get(key);
    item.mention_count += Number(row.mention_count || 0);
    item.post_count += Number(row.post_count || 0);
    item.months += 1;
  });
  const totalMentions = [...grouped.values()].reduce((sum, row) => sum + row.mention_count, 0) || 1;
  const totalPosts = [...new Set(rows.map((r) => `${r.month}|${r.month_total_posts}`))].reduce((sum, pair) => sum + Number(pair.split("|")[1] || 0), 0) || 1;
  return [...grouped.values()]
    .map((row) => ({
      ...row,
      mention_share_pct: (row.mention_count / totalMentions) * 100,
      post_share_pct: (row.post_count / totalPosts) * 100,
    }))
    .sort((a, b) => b.mention_count - a.mention_count);
}

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, path]) => [key, await fetch(path).then((r) => r.json())]));
  state.data = Object.fromEntries(entries);
}

function renderHero() {
  const paper = state.data.paper;
  $("paper-title").textContent = paper.title;
  $("paper-subtitle").textContent = paper.subtitle;
  $("paper-abstract").textContent = paper.abstract;

  const cardTargets = ["#subreddits", "#model-extraction", "#model-extraction", "#concepts", "#concepts", "#sentiment"];
  $("metric-cards").innerHTML = paper.headline_metrics
    .map(
      (metric, i) => html`
        <a class="metric-card" href="${cardTargets[i] || "#summary"}">
          <div class="metric-value">${esc(metric.display)}</div>
          <div class="metric-label">${esc(metric.label)}</div>
          <div class="metric-note">${esc(metric.note)}</div>
        </a>
      `,
    )
    .join("");

  $("story-cards").innerHTML = paper.release_stories
    .map((story) => {
      const model = STORY_DEFAULT_RELEASE[story.provider] || story.models[0];
      const active = story.provider === state.selectedReleaseProvider && model === state.selectedReleaseModel;
      return html`
        <button class="story-card ${active ? "active" : ""}" type="button" data-provider="${esc(story.provider)}" data-model="${esc(model)}">
          <h3>${esc(story.title)}</h3>
          <p>${esc(story.summary)}</p>
          <div class="models">${esc(story.provider)}: ${esc(story.models.join(", "))}</div>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".story-card[data-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedReleaseProvider = button.getAttribute("data-provider");
      state.selectedReleaseModel = button.getAttribute("data-model");
      $("summary-release-select").value = selectedReleaseKey();
      renderHero();
      renderSummaryWorkbench();
      document.querySelector(".summary-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function fillSelect(id, options, value) {
  const el = $(id);
  el.innerHTML = options.map((option) => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("");
  if (value !== undefined) el.value = value;
}

function initControls() {
  initSummaryControls();
  initMentionControls();
  initEntityMultiControls();
  initSentimentControls();
  initSubredditControls();
  initConceptControls();
  initReleaseRankingControls();
  initReleaseConceptControls();
}

function initEntityMultiControls() {
  const levels = Object.keys(state.data.discussion.entity_multi_monthly || {});
  if (!levels.length) return;
  fillSelect("entity-multi-level", levels.map((level) => ({ value: level, label: level })), state.entityMultiLevel);
  $("entity-multi-level").addEventListener("change", () => {
    state.entityMultiLevel = $("entity-multi-level").value;
    renderEntityMultiMonthly();
  });
}

function initSummaryControls() {
  const releaseOptions = releaseConceptOptions();
  const defaultOption = releaseOptions.find((r) => r.value === selectedReleaseKey()) || releaseOptions[0];
  if (defaultOption) {
    const [provider, model] = defaultOption.value.split("|");
    state.selectedReleaseProvider = provider;
    state.selectedReleaseModel = model;
  }
  fillSelect("summary-release-select", releaseOptions, selectedReleaseKey());
  $("summary-release-select").addEventListener("change", (event) => {
    const [provider, model] = event.target.value.split("|");
    state.selectedReleaseProvider = provider;
    state.selectedReleaseModel = model;
    renderHero();
    renderSummaryWorkbench();
  });
}

function initMentionControls() {
  const levels = state.data.discussion.levels || ["provider", "family", "generation", "tier"];
  fillSelect("mention-level", levels.map((level) => ({ value: level, label: level })), state.mentionLevel);
  const months = [...new Set(state.data.discussion.monthly_rows.map((r) => r.month))].sort();
  state.mentionStartMonth = months[0] || "";
  state.mentionEndMonth = months[months.length - 1] || "";
  fillSelect("mention-start-month", months.map((month) => ({ value: month, label: month })), state.mentionStartMonth);
  fillSelect("mention-end-month", months.map((month) => ({ value: month, label: month })), state.mentionEndMonth);
  ["mention-level", "mention-start-month", "mention-end-month"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.mentionLevel = $("mention-level").value;
      state.mentionStartMonth = $("mention-start-month").value;
      state.mentionEndMonth = $("mention-end-month").value;
      if (state.mentionStartMonth > state.mentionEndMonth) {
        const tmp = state.mentionStartMonth;
        state.mentionStartMonth = state.mentionEndMonth;
        state.mentionEndMonth = tmp;
        $("mention-start-month").value = state.mentionStartMonth;
        $("mention-end-month").value = state.mentionEndMonth;
      }
      renderMentionSection();
    });
  });
}

function initSentimentControls() {
  const providers = [...new Map(state.data.sentiment.rows.map((r) => [r.provider, r.provider_label])).entries()];
  state.sentimentProvider = providers.some(([key]) => key === "openai") ? "openai" : providers[0]?.[0] || "openai";
  fillSelect("sentiment-provider", providers.map(([value, label]) => ({ value, label })), state.sentimentProvider);
  $("sentiment-provider").addEventListener("change", (event) => {
    state.sentimentProvider = event.target.value;
    renderSentimentSection();
  });
  Object.keys(SENTIMENTS).forEach((sentiment) => {
    $(`toggle-${sentiment}`).addEventListener("change", (event) => {
      state.sentimentToggles[sentiment] = event.target.checked;
      renderSentimentChart();
    });
  });

  const scatterProviders = [...new Map(state.data.releases.rows.map((r) => [r.provider_key, r.provider])).entries()];
  fillSelect("scatter-provider", [{ value: "all", label: "All providers" }, ...scatterProviders.map(([value, label]) => ({ value, label }))], state.scatterProvider);
  const sources = [...new Set(state.data.releases.rows.map((r) => r.source_status))].sort();
  fillSelect("scatter-source", [{ value: "all", label: "All source types" }, ...sources.map((source) => ({ value: source, label: source }))], state.scatterSource);
  ["scatter-provider", "scatter-source", "scatter-hide-first"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.scatterProvider = $("scatter-provider").value;
      state.scatterSource = $("scatter-source").value;
      state.scatterHideFirst = $("scatter-hide-first").checked;
      renderReleaseScatter();
    });
  });
}

function initSubredditControls() {
  const rows = state.data.subreddits.coverage_rows || [];
  state.subredditName = rows[0]?.subreddit || "";
  fillSelect("subreddit-select", rows.map((row) => ({ value: row.subreddit, label: row.subreddit })), state.subredditName);
  fillSelect("subreddit-level", ["provider", "family", "generation", "tier"].map((level) => ({ value: level, label: level })), state.subredditLevel);
  ["subreddit-select", "subreddit-level"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.subredditName = $("subreddit-select").value;
      state.subredditLevel = $("subreddit-level").value;
      renderSubredditLevelBars();
    });
  });
}

function initConceptControls() {
  state.conceptGranularity = state.data.concepts.granularities?.includes("month") ? "month" : state.data.concepts.granularities?.[0] || "month";
  fillSelect("concept-granularity", (state.data.concepts.granularities || ["month"]).map((g) => ({ value: g, label: g })), state.conceptGranularity);
  $("concept-granularity").addEventListener("change", (event) => {
    state.conceptGranularity = event.target.value;
    renderConceptArea();
  });
  $("concept-search").addEventListener("input", (event) => {
    state.conceptSearch = event.target.value.trim().toLowerCase();
    renderConceptArea();
  });
  const markerProviders = [...new Map(state.data.releases.rows.map((r) => [r.provider_key, r.provider])).entries()];
  fillSelect("concept-marker-provider", [{ value: "all", label: "All releases" }, ...markerProviders.map(([value, label]) => ({ value, label }))], state.conceptMarkerProvider);
  $("concept-marker-provider").addEventListener("change", (event) => {
    state.conceptMarkerProvider = event.target.value;
    renderConceptArea();
  });

  fillSelect("concept-bank-dimension", [
    { value: "overall", label: "Overall" },
    { value: "subreddit", label: "Subreddit" },
    { value: "subreddit_group", label: "Subreddit group" },
    { value: "provider", label: "Provider" },
    { value: "generation", label: "Generation" },
  ], state.conceptBankDimension);
  fillSelect("concept-bank-sentiment", [
    { value: "all", label: "All sentiments" },
    { value: "Mixed", label: "Mixed" },
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
  ], state.conceptBankSentiment);
  fillSelect("concept-bank-sort", [
    { value: "prevalence_desc", label: "Prevalence desc" },
    { value: "posts_desc", label: "Concept posts desc" },
    { value: "alias_desc", label: "Alias count desc" },
    { value: "name_asc", label: "Name A-Z" },
  ], state.conceptBankSort);
  updateConceptBankValues();
  ["concept-bank-dimension", "concept-bank-value", "concept-bank-sentiment", "concept-bank-sort"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.conceptBankDimension = $("concept-bank-dimension").value;
      state.conceptBankSentiment = $("concept-bank-sentiment").value;
      state.conceptBankSort = $("concept-bank-sort").value;
      if (id === "concept-bank-dimension") updateConceptBankValues();
      state.conceptBankValue = $("concept-bank-value").value;
      renderConceptBank();
    });
  });
  $("concept-bank-search").addEventListener("input", (event) => {
    state.conceptBankSearch = event.target.value.trim().toLowerCase();
    renderConceptBank();
  });

  fillSelect("concept-sentiment-filter", [
    { value: "all", label: "All sentiments" },
    { value: "Mixed", label: "Mixed" },
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
  ], state.conceptSentimentFilter);
  fillSelect("concept-agreement-filter", [
    { value: "all", label: "All agreement" },
    { value: "full_agree", label: "Full agreement" },
    { value: "2v1", label: "Two vs one" },
  ], state.conceptAgreementFilter);
  ["concept-sentiment-filter", "concept-agreement-filter"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.conceptSentimentFilter = $("concept-sentiment-filter").value;
      state.conceptAgreementFilter = $("concept-agreement-filter").value;
      renderConceptSentimentSection();
    });
  });
}

function initReleaseRankingControls() {
  const providers = [...new Set(state.data.releaseConcepts.rows.map((r) => r.provider))].sort();
  fillSelect("ranking-provider", [{ value: "all", label: "All providers" }, ...providers.map((p) => ({ value: p, label: p }))], state.rankingProvider);
  fillSelect("ranking-direction", [
    { value: "all", label: "All directions" },
    { value: "rising", label: "Rising only" },
    { value: "falling", label: "Declining only" },
  ], state.rankingDirection);
  updateRankingReleaseOptions();
  ["ranking-provider", "ranking-release", "ranking-direction"].forEach((id) => {
    $(id).addEventListener("change", () => {
      state.rankingProvider = $("ranking-provider").value;
      state.rankingDirection = $("ranking-direction").value;
      if (id === "ranking-provider") updateRankingReleaseOptions();
      state.rankingRelease = $("ranking-release").value;
      renderReleaseRanking();
    });
  });
  $("ranking-search").addEventListener("input", (event) => {
    state.rankingSearch = event.target.value.trim().toLowerCase();
    renderReleaseRanking();
  });
}

function initReleaseConceptControls() {
  const providers = [...new Set(state.data.releaseConcepts.rows.map((r) => r.provider))].sort();
  state.releaseConceptProvider = providers.includes("OpenAI") ? "OpenAI" : providers[0] || "";
  fillSelect("concept-provider", providers.map((p) => ({ value: p, label: p })), state.releaseConceptProvider);
  $("concept-provider").addEventListener("change", (event) => {
    state.releaseConceptProvider = event.target.value;
    updateReleaseSelect();
    renderReleaseConcepts();
  });
  updateReleaseSelect();
  $("concept-release").addEventListener("change", (event) => {
    state.releaseConceptModel = event.target.value;
    renderReleaseConcepts();
  });
}

function releaseConceptOptions() {
  const seen = new Set();
  return state.data.releaseConcepts.rows
    .map((row) => ({ provider: row.provider, model: row.model, date: row.release_date, value: `${row.provider}|${row.model}` }))
    .filter((row) => {
      if (seen.has(row.value)) return false;
      seen.add(row.value);
      return true;
    })
    .sort((a, b) => (isPaperFocus(b.provider, b.model) - isPaperFocus(a.provider, a.model)) || parseDate(a.date) - parseDate(b.date))
    .map((row) => ({
      value: row.value,
      label: `${row.provider} ${row.model} (${row.date})${isPaperFocus(row.provider, row.model) ? " - paper focus" : ""}`,
    }));
}

function updateConceptBankValues() {
  state.conceptBankDimension = $("concept-bank-dimension").value || state.conceptBankDimension;
  const values = state.data.concepts.scope_prevalence_rows
    .filter((row) => row.dimension === state.conceptBankDimension)
    .reduce((map, row) => map.set(row.value, row.label), new Map());
  const options = [...values.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => (a.value === "overall" ? -1 : b.value === "overall" ? 1 : a.label.localeCompare(b.label)));
  state.conceptBankValue = options.some((option) => option.value === state.conceptBankValue) ? state.conceptBankValue : options[0]?.value || "overall";
  fillSelect("concept-bank-value", options, state.conceptBankValue);
}

function updateRankingReleaseOptions() {
  const rows = state.data.releaseConcepts.rows.filter((row) => state.rankingProvider === "all" || row.provider === state.rankingProvider);
  const seen = new Set();
  const options = rows
    .map((row) => ({ value: `${row.provider}|${row.model}`, label: `${row.provider} ${row.model}` }))
    .filter((row) => {
      if (seen.has(row.value)) return false;
      seen.add(row.value);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const current = options.some((option) => option.value === state.rankingRelease) ? state.rankingRelease : "all";
  fillSelect("ranking-release", [{ value: "all", label: "All releases" }, ...options], current);
  state.rankingRelease = current;
}

function renderAll() {
  renderHero();
  renderSummaryWorkbench();
  renderMentionSection();
  renderSingleMultiSection();
  renderSentimentSection();
  renderSubredditSection();
  renderConceptSection();
  renderConceptSentimentSection();
  renderReleaseRanking();
  renderReleaseConcepts();
  renderMethods();
}

function renderSummaryWorkbench() {
  const provider = providerKey(state.selectedReleaseProvider);
  renderSentimentChartInto("summary-sentiment-chart", provider, { width: 900, height: 300, compact: true, title: `${state.selectedReleaseProvider} sentiment around selected release` });
  const important = state.data.releases.rows.filter((row) => isPaperFocus(row.provider, row.model) || Math.abs(Number(row.favorability_delta_pp || 0)) > 8);
  renderReleaseScatterInto("summary-scatter", important, {
    width: 900,
    height: 300,
    alwaysLabel: true,
    maxRadius: 13,
    highlightProvider: state.selectedReleaseProvider,
    highlightModel: state.selectedReleaseModel,
  });
  renderSummaryReleaseDeltas();
}

function renderSummaryReleaseDeltas() {
  const rows = state.data.releaseConcepts.rows.filter((r) => r.provider === state.selectedReleaseProvider && r.model === state.selectedReleaseModel);
  const rising = rows.filter((r) => r.direction === "rising").sort((a, b) => Number(b.delta_pp) - Number(a.delta_pp)).slice(0, 5);
  const falling = rows.filter((r) => r.direction === "falling").sort((a, b) => Number(a.delta_pp) - Number(b.delta_pp)).slice(0, 5);
  const maxAbs = Math.max(...[...rising, ...falling].map((r) => Math.abs(Number(r.delta_pp || 0))), 1);
  $("summary-release-deltas").innerHTML = html`
    <div class="profile-note" style="margin-top:0;margin-bottom:10px">
      <strong>${esc(state.selectedReleaseProvider)} ${esc(state.selectedReleaseModel)}</strong>
      ${isPaperFocus(state.selectedReleaseProvider, state.selectedReleaseModel) ? '<span class="paper-focus">paper focus</span>' : "completeness release"}
    </div>
    <div class="delta-stack">
      <p class="delta-group-title">Top rising</p>${renderDeltaRows(rising, maxAbs, { micro: true })}
      <p class="delta-group-title" style="margin-top:8px">Top declining</p>${renderDeltaRows(falling, maxAbs, { micro: true })}
    </div>
  `;
}

function renderMentionSection() {
  renderMentionBars();
  renderMonthlyMentionChart();
  renderOverallLevelBars();
  renderLevelHeatmaps();
  renderCoDiscussionPairs();
  renderMentionEntropyChart();
  renderValidationTable();
}

function renderMentionBars() {
  const rows = aggregateMonthlyRows(state.mentionLevel).slice(0, 10);
  const container = $("mention-bars");
  const height = 335;
  const svg = createSvg(container, 760, height);
  const margin = { top: 12, right: 38, bottom: 48, left: 128 };
  const plotW = 760 - margin.left - margin.right;
  const rowH = Math.min(27, (height - margin.top - margin.bottom) / Math.max(rows.length, 1));
  const max = Math.max(...rows.map((r) => r.mention_count), 1);
  // Position scale on sqrt(count) so a single dominant entity (e.g. OpenAI)
  // doesn't squash the rest of the leaderboard to invisible slivers. The
  // nonlinearity is disclosed via the tick marks below, and exact counts
  // are always printed at the end of each bar, so nothing is hidden.
  const xs = scale([0, Math.sqrt(max)], [0, plotW]);
  const x = (v) => xs(Math.sqrt(Math.max(0, v)));
  const rowsBottom = margin.top + rows.length * rowH;
  rows.forEach((row, i) => {
    const y = margin.top + i * rowH;
    svg.appendChild(svgEl("text", { x: margin.left - 10, y: y + 16, "text-anchor": "end", fill: "#2f403b", "font-size": 11 }, row.label));
    const rect = svgEl("rect", { x: margin.left, y, width: x(row.mention_count), height: Math.max(14, rowH - 8), rx: 4, fill: rowColor(row, i) });
    rect.appendChild(svgEl("title", {}, `${row.label}\nMentions: ${fmtInt(row.mention_count)}\nPosts: ${fmtInt(row.post_count)}\nMention share: ${fmtPct(row.mention_share_pct)}`));
    svg.appendChild(rect);
    svg.appendChild(svgEl("text", { x: margin.left + x(row.mention_count) + 7, y: y + 14, fill: "#5b6d66", "font-size": 11 }, fmtInt(row.mention_count)));
  });
  const ticks = [0, max / 16, max / 4, max / 2, max].map((v) => Math.round(v));
  addNumericXTicks(svg, (v) => margin.left + x(v), ticks, rowsBottom + 4, fmtInt);
  svg.appendChild(
    svgEl(
      "text",
      { x: margin.left, y: height - 6, fill: "#5b6d66", "font-size": 11 },
      `${state.mentionLevel} mentions, ${state.mentionStartMonth} to ${state.mentionEndMonth} — bar length ∝ √count`,
    ),
  );
}

function renderMonthlyMentionChart() {
  const rows = state.data.discussion.monthly_rows.filter((r) => r.level === state.mentionLevel && monthInRange(r.month));
  const totals = new Map();
  rows.forEach((r) => totals.set(r.value, (totals.get(r.value) || 0) + Number(r.mention_count || 0)));
  const topValues = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value]) => value);
  const months = [...new Set(rows.map((r) => r.month))].sort();
  const topRows = rows.filter((r) => topValues.includes(r.value));
  const container = $("monthly-mention-chart");
  const svg = createSvg(container, 960, 350);
  if (!months.length || !topRows.length) return;
  const margin = { top: 24, right: 28, bottom: 52, left: 58 };
  const plotW = 960 - margin.left - margin.right;
  const plotH = 350 - margin.top - margin.bottom;
  const xDomain = [parseMonth(months[0]), parseMonth(months[months.length - 1])];
  const x = scale(xDomain, [margin.left, margin.left + plotW]);
  const yMax = Math.max(...topRows.map((r) => Number(r.mention_count || 0)), 1);
  const y = scale([0, yMax * 1.12], [margin.top + plotH, margin.top]);
  const lookup = new Map(topRows.map((r) => [`${r.value}|${r.month}`, r]));

  addYAxis(svg, y, margin.left, margin.left + plotW, [0, Math.round(yMax / 2), Math.round(yMax)], fmtInt);
  addTimeXTicks(svg, x, xDomain, margin.top + plotH, Math.min(6, Math.max(2, months.length - 1)));
  topValues.forEach((value, i) => {
    const label = topRows.find((r) => r.value === value)?.label || value;
    const points = months.map((month) => {
      const row = lookup.get(`${value}|${month}`);
      return [x(parseMonth(month)), y(Number(row?.mention_count || 0))];
    });
    const color = state.mentionLevel === "provider" ? providerColor(value) : SERIES_COLORS[i % SERIES_COLORS.length];
    const path = svgEl("path", { d: makeLinePath(points), fill: "none", stroke: color, "stroke-width": 2.2, "stroke-linecap": "round" });
    path.appendChild(svgEl("title", {}, `${label}: monthly mentions`));
    svg.appendChild(path);
    points.forEach((point, j) => {
      const row = lookup.get(`${value}|${months[j]}`);
      if (!row || j % Math.ceil(months.length / 12) !== 0) return;
      const dot = svgEl("circle", { cx: point[0], cy: point[1], r: 2.3, fill: color, opacity: 0.85 });
      dot.appendChild(svgEl("title", {}, `${label}\n${months[j]}\nMentions: ${fmtInt(row.mention_count)}\nPosts: ${fmtInt(row.post_count)}\nPost share: ${fmtPct(row.post_share_pct)}`));
      svg.appendChild(dot);
    });
  });
  svg.appendChild(svgEl("text", { x: margin.left, y: 17, fill: "#22312c", "font-size": 14, "font-weight": 800 }, `${state.mentionLevel} mentions by month`));
  $("mention-legend").innerHTML = topValues
    .map((value, i) => {
      const row = topRows.find((r) => r.value === value);
      const color = state.mentionLevel === "provider" ? providerColor(value) : SERIES_COLORS[i % SERIES_COLORS.length];
      return `<span class="line-legend-item"><span class="line-swatch" style="background:${color}"></span>${esc(row?.label || value)} <span class="tooltip-note">${fmtInt(totals.get(value))}</span></span>`;
    })
    .join("");
}

function renderOverallLevelBars() {
  const rows = aggregateMonthlyRows(state.mentionLevel).slice(0, 12);
  renderValueBars("overall-level-bars", rows, {
    value: (r) => r.mention_count,
    label: (r) => r.label,
    meta: (r) => `${fmtPct(r.post_share_pct)} of posts, ${fmtInt(r.post_count)} posts`,
    color: (r, i) => rowColor(r, i),
  });
}

const MIN_HEATMAP_ITEM_POSTS = 40;

function renderHeatmap(containerId, cells, valueField, options = {}) {
  const rows = options.rows || [...new Set(cells.map((d) => d.source))];
  const cols = options.cols || [...new Set(cells.map((d) => d.target))];
  const labelLookup = new Map();
  const totalLookup = options.totals || new Map();
  cells.forEach((cell) => {
    labelLookup.set(cell.source, cell.source_label || cell.source);
    labelLookup.set(cell.target, cell.target_label || cell.target);
  });
  const lookup = new Map(cells.map((d) => [`${d.source}|${d.target}`, d]));
  const max = options.max ?? Math.max(...cells.filter((d) => d.source !== d.target).map((d) => Number(d[valueField] || 0)), 1);
  const color = (value, diagonal) => {
    if (diagonal) return "var(--blue-soft)";
    const t = Math.min(1, value / (max || 1));
    const alpha = 0.12 + t * 0.74;
    return `rgba(${options.rgb || "47, 110, 92"}, ${alpha.toFixed(3)})`;
  };
  $(containerId).innerHTML = html`
    <div class="heatmap-grid" style="--heatmap-cols:${cols.length}">
      <div></div>
      ${cols.map((p) => `<div class="heatmap-label">${esc(labelLookup.get(p) || p)}</div>`).join("")}
      ${rows
        .map((source) => html`
          <div class="heatmap-label">${esc(labelLookup.get(source) || source)}</div>
          ${cols
            .map((target) => {
              const cell = lookup.get(`${source}|${target}`) || {};
              const value = Number(cell[valueField] || 0);
              const shown = options.percent ? fmtPct(value, 0) : value.toFixed(3);
              const sourceTotal = totalLookup.get(source) || 0;
              const sparse = source !== target && sourceTotal > 0 && sourceTotal < MIN_HEATMAP_ITEM_POSTS;
              const label = sparse ? "n/a" : shown;
              const tip = sparse
                ? `${esc(labelLookup.get(source) || source)}: only ${fmtInt(sourceTotal)} posts — too few for a reliable estimate`
                : `${esc(labelLookup.get(source) || source)} -> ${esc(labelLookup.get(target) || target)}: ${shown}; co-posts ${fmtInt(cell.co_post_count)}`;
              const style = sparse ? "" : ` style="background:${color(value, source === target)}"`;
              return `<div class="heatmap-cell${sparse ? " is-sparse" : ""}"${style} title="${tip}">${label}</div>`;
            })
            .join("")}
        `)
        .join("")}
    </div>
  `;
}

// Sums a level's monthly-sliced item/pair counts over whichever months pass
// monthInRange(), for a chosen ordered subset of item values. Positions in
// the returned arrays match the index of `itemValues`, not the original
// (fixed, full-range) item ordering in the matrix.
function coAggregate(level, itemValues) {
  const matrix = state.data.discussion.co_matrices[level];
  const allValues = matrix.items.map((it) => it.value);
  const origIdxOf = new Map(allValues.map((v, i) => [v, i]));
  const chosenOrigIdx = itemValues.map((v) => origIdxOf.get(v));
  const posOfOrigIdx = new Map(chosenOrigIdx.map((origIdx, pos) => [origIdx, pos]));
  const wanted = new Set(chosenOrigIdx);

  const counts = new Array(itemValues.length).fill(0);
  const pairSum = new Map(); // "posA|posB" (posA < posB) -> co-post count

  matrix.months.forEach((month, mi) => {
    if (!monthInRange(month)) return;
    const monthCounts = matrix.item_counts[mi] || [];
    chosenOrigIdx.forEach((origIdx, pos) => {
      counts[pos] += monthCounts[origIdx] || 0;
    });
    (matrix.pairs[mi] || []).forEach(([a, b, n]) => {
      if (!wanted.has(a) || !wanted.has(b)) return;
      const pa = posOfOrigIdx.get(a);
      const pb = posOfOrigIdx.get(b);
      const key = pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`;
      pairSum.set(key, (pairSum.get(key) || 0) + n);
    });
  });
  return { counts, pairSum };
}

function coPair(agg, i, j) {
  if (i === j) return agg.counts[i];
  const key = i < j ? `${i}|${j}` : `${j}|${i}`;
  return agg.pairSum.get(key) || 0;
}

function renderLevelHeatmaps() {
  const matrix = state.data.discussion.co_matrices[state.mentionLevel];
  if (!matrix) return;
  if (!matrix.months) {
    renderLevelHeatmapsLegacy(matrix);
    return;
  }
  const allItems = matrix.items || [];
  // Drop near-empty entities (e.g. a handful of stray mentions) from the
  // AXIS so a single- or double-digit full-range sample doesn't get its own
  // row/column. Axis membership is decided from the fixed full-range count
  // so the axis never jumps as the month-range filter changes.
  const substantial = allItems.filter((item) => Number(item.post_count || 0) >= MIN_HEATMAP_ITEM_POSTS);
  const chosen = (substantial.length >= 4 ? substantial : allItems).slice(0, 20);
  const values = chosen.map((it) => it.value);
  const labelOf = new Map(chosen.map((it) => [it.value, it.label]));

  const agg = coAggregate(state.mentionLevel, values);
  const totals = new Map(values.map((v, i) => [v, agg.counts[i]]));

  const conditional = [];
  const jaccard = [];
  values.forEach((source, i) => {
    values.forEach((target, j) => {
      const pair = coPair(agg, i, j);
      const cA = agg.counts[i];
      const cB = agg.counts[j];
      const denomJ = cA + cB - pair;
      conditional.push({
        source,
        source_label: labelOf.get(source),
        target,
        target_label: labelOf.get(target),
        conditional_pct: cA ? (100 * pair) / cA : 0,
        co_post_count: pair,
      });
      jaccard.push({
        source,
        source_label: labelOf.get(source),
        target,
        target_label: labelOf.get(target),
        jaccard: denomJ ? pair / denomJ : 0,
        co_post_count: pair,
      });
    });
  });

  renderHeatmap("provider-conditional-matrix", conditional, "conditional_pct", { rows: values, cols: values, percent: true, rgb: "47, 110, 92", totals });
  renderHeatmap("comention-heatmap", jaccard, "jaccard", { rows: values, cols: values, rgb: "191, 138, 36", totals });
}

// Legacy path for a JS/JSON version-skew window (e.g. mid-deploy): degrades
// to the old pre-baked, full-range-only cells instead of throwing.
function renderLevelHeatmapsLegacy(matrix) {
  const allItems = matrix.items || [];
  const totals = new Map(allItems.map((item) => [item.value, Number(item.post_count || 0)]));
  const substantial = allItems.filter((item) => Number(item.post_count || 0) >= MIN_HEATMAP_ITEM_POSTS);
  const items = (substantial.length >= 4 ? substantial : allItems).slice(0, 20).map((item) => item.value);
  const keep = new Set(items);
  const conditional = (matrix.conditional_cells || []).filter((cell) => keep.has(cell.source) && keep.has(cell.target));
  const jaccard = (matrix.jaccard_cells || []).filter((cell) => keep.has(cell.source) && keep.has(cell.target));
  renderHeatmap("provider-conditional-matrix", conditional, "conditional_pct", { rows: items, cols: items, percent: true, rgb: "47, 110, 92", totals });
  renderHeatmap("comention-heatmap", jaccard, "jaccard", { rows: items, cols: items, rgb: "191, 138, 36", totals });
}

function renderCoDiscussionPairs() {
  const matrix = state.data.discussion.co_matrices[state.mentionLevel];
  if (!matrix) return;
  let rows;
  if (!matrix.months) {
    rows = (matrix.pair_rows || []).slice(0, 12);
  } else {
    const allItems = matrix.items || [];
    const agg = coAggregate(state.mentionLevel, allItems.map((it) => it.value));
    const pairs = [];
    allItems.forEach((a, i) => {
      allItems.forEach((b, j) => {
        if (j <= i) return;
        const count = coPair(agg, i, j);
        if (count > 0) pairs.push({ item_a_label: a.label, item_b_label: b.label, co_post_count: count });
      });
    });
    pairs.sort((x, y) => y.co_post_count - x.co_post_count);
    rows = pairs.slice(0, 12);
  }
  const max = Math.max(...rows.map((r) => Number(r.co_post_count || 0)), 1);
  $("co-discussion-list").innerHTML = html`
    <div class="pair-list">
      ${rows
        .map((row) => html`
          <div class="list-row">
            <div class="pair-label">${esc(row.item_a_label)}<span class="pair-meta">with ${esc(row.item_b_label)}</span></div>
            <div class="bar-track"><div class="value-bar" style="width:${Math.max(2, (Number(row.co_post_count || 0) / max) * 100)}%;background:#2f6e5c"></div></div>
            <div class="list-value">${fmtInt(row.co_post_count)}</div>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function renderMentionEntropyChart() {
  const rows = state.data.discussion.diversity_rows || [];
  const svg = createSvg($("mention-entropy-chart"), 900, 300);
  if (!rows.length) return;
  const margin = { top: 24, right: 28, bottom: 50, left: 58 };
  const plotW = 900 - margin.left - margin.right;
  const plotH = 300 - margin.top - margin.bottom;
  const x = scale([0, Math.max(...rows.map((r) => Number(r.provider_entropy_normalized || 0)), 1) * 1.04], [margin.left, margin.left + plotW]);
  const y = scale([0, Math.max(...rows.map((r) => Number(r.provider_js_specialization || 0)), 1) * 1.12], [margin.top + plotH, margin.top]);
  const size = scale([0, Math.max(...rows.map((r) => Number(r.family_entropy_normalized || 0)), 1)], [5, 16]);
  addYAxis(svg, y, margin.left, margin.left + plotW, [0, 0.1, 0.2, 0.3, 0.4].filter((v) => v <= Math.max(...rows.map((r) => Number(r.provider_js_specialization || 0))) * 1.12), (d) => d.toFixed(1));
  addNumericXTicks(svg, x, [0, 0.25, 0.5, 0.75, 1], margin.top + plotH, (d) => d.toFixed(2));
  const labelCandidates = [];
  rows.forEach((row) => {
    const cx = x(Number(row.provider_entropy_normalized || 0));
    const cy = y(Number(row.provider_js_specialization || 0));
    const r = size(Number(row.family_entropy_normalized || 0));
    const circle = svgEl("circle", { cx, cy, r, fill: ACCENT, opacity: 0.72, stroke: "#fff", "stroke-width": 1.4 });
    circle.style.cursor = "pointer";
    wireTooltip(
      circle,
      () =>
        `<div class="tip-title">r/${esc(row.subreddit)}</div>
         <div>Provider entropy ${Number(row.provider_entropy_normalized || 0).toFixed(3)} · Specialization ${Number(row.provider_js_specialization || 0).toFixed(3)}</div>
         <div class="tip-sub">Family entropy ${Number(row.family_entropy_normalized || 0).toFixed(3)}</div>`,
    );
    svg.appendChild(circle);
    if (Number(row.provider_js_specialization || 0) > 0.16 || Number(row.provider_entropy_normalized || 0) > 0.72) {
      labelCandidates.push({ x: cx, y: cy, text: row.subreddit, color: HEADING_INK, fontWeight: 740, priority: r });
    }
  });
  placeDeclutteredLabels(svg, labelCandidates);
  svg.appendChild(svgEl("text", { x: margin.left + plotW / 2, y: 290, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Provider entropy, normalized"));
  svg.appendChild(svgEl("text", { x: 15, y: margin.top + plotH / 2, transform: `rotate(-90 15 ${margin.top + plotH / 2})`, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Subreddit specialization"));
}

function renderValidationTable() {
  const rows = state.data.extraction.validation_by_taxonomy_level || [];
  $("validation-table").innerHTML = html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Level</th><th>Accuracy</th><th>Weighted F1</th><th>Support</th></tr></thead>
        <tbody>
          ${rows
            .map((row) => html`<tr><td>${esc(row.level)}</td><td>${Number(row.accuracy).toFixed(3)}</td><td>${Number(row.weighted_f1).toFixed(3)}</td><td>${fmtInt(row.support)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEntityMultiMonthly() {
  const payload = (state.data.discussion.entity_multi_monthly || {})[state.entityMultiLevel];
  const legend = $("entity-multi-legend");
  const svg = createSvg($("entity-multi-monthly"), 940, 300);
  if (!payload || !payload.series.length) {
    legend.innerHTML = "";
    return;
  }
  const { months, series } = payload;
  const margin = { top: 20, right: 20, bottom: 50, left: 58 };
  const plotW = 940 - margin.left - margin.right;
  const plotH = 300 - margin.top - margin.bottom;
  const xDomain = [parseMonth(months[0]), parseMonth(months[months.length - 1])];
  const x = scale(xDomain, [margin.left, margin.left + plotW]);
  const y = scale([0, 100], [margin.top + plotH, margin.top]);
  addYAxis(svg, y, margin.left, margin.left + plotW, [0, 25, 50, 75, 100], (d) => `${d}%`);
  addTimeXTicks(svg, x, xDomain, margin.top + plotH, Math.min(6, Math.max(2, months.length - 1)));

  // Ordered by total volume already (server-side); the provider level can
  // exceed the categorical-color budget (~8), so emphasize the top 6 in
  // brand color and mute the long tail rather than generate more hues.
  const emphasizedCount = state.entityMultiLevel === "provider" ? 6 : series.length;
  const colorFor = (entity, i) => {
    if (state.entityMultiLevel === "provider") {
      return i < emphasizedCount ? providerColor(entity.value) : "#8cada1";
    }
    return SERIES_COLORS[i % SERIES_COLORS.length];
  };

  series.forEach((entity, i) => {
    const muted = state.entityMultiLevel === "provider" && i >= emphasizedCount;
    const color = colorFor(entity, i);
    const points = months.map((month, mi) => {
      const posts = entity.posts[mi] || 0;
      if (posts < 20) return null;
      return [x(parseMonth(month)), y((100 * (entity.multi[mi] || 0)) / posts)];
    });
    const path = svgEl("path", {
      d: makeLinePath(points),
      fill: "none",
      stroke: color,
      "stroke-width": muted ? 1.2 : 2.2,
      "stroke-linecap": "round",
      opacity: muted ? 0.45 : 0.95,
    });
    path.style.cursor = "pointer";
    wireTooltip(path, () => `<div class="tip-title">${esc(entity.label)}</div><div class="tip-sub">Multi-mention rate over time</div>`);
    svg.appendChild(path);
  });

  legend.innerHTML = series
    .map((entity, i) => {
      const totalPosts = entity.posts.reduce((a, b) => a + b, 0);
      const totalMulti = entity.multi.reduce((a, b) => a + b, 0);
      const pct = totalPosts ? (100 * totalMulti) / totalPosts : 0;
      return `<span class="line-legend-item"><span class="line-swatch" style="background:${colorFor(entity, i)}"></span>${esc(entity.label)} <span class="tooltip-note">${pct.toFixed(0)}%</span></span>`;
    })
    .join("");
}

function renderSingleMultiSection() {
  const summary = state.data.discussion.single_multi_summary || {};
  $("single-multi-summary").innerHTML = html`
    <div class="mini-tile"><div class="mini-value">${fmtInt(summary.posts_with_model_mentions)}</div><div class="mini-label">Posts with model mentions</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtInt(summary.single_model_posts)}</div><div class="mini-label">Single-model posts</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtPct(summary.multi_model_rate_pct)}</div><div class="mini-label">Multi-model posts</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtInt(summary.multi_provider_posts)}</div><div class="mini-label">Multi-provider posts</div></div>
  `;
  renderSingleMultiMonthly();
  renderEntityMultiMonthly();
  renderSingleMultiGroups();
}

function renderSingleMultiMonthly() {
  const rows = (state.data.discussion.single_multi_monthly || []).slice().sort((a, b) => a.month.localeCompare(b.month));
  const svg = createSvg($("single-multi-monthly"), 940, 300);
  if (!rows.length) return;
  const margin = { top: 24, right: 120, bottom: 50, left: 58 };
  const plotW = 940 - margin.left - margin.right;
  const plotH = 300 - margin.top - margin.bottom;
  const xDomain = [parseMonth(rows[0].month), parseMonth(rows[rows.length - 1].month)];
  const x = scale(xDomain, [margin.left, margin.left + plotW]);
  const series = [
    { key: "multi_model_posts_pct", label: "Multi-model", color: "#2f6e5c" },
    { key: "multi_provider_posts_pct", label: "Multi-provider", color: "#13865b" },
    { key: "multi_family_posts_pct", label: "Multi-family", color: "#d97706" },
  ];
  const yMax = Math.max(...rows.flatMap((row) => series.map((s) => Number(row[s.key] || 0))), 1);
  const y = scale([0, yMax * 1.12], [margin.top + plotH, margin.top]);
  addYAxis(svg, y, margin.left, margin.left + plotW, [0, Math.round(yMax / 2), Math.round(yMax)], (d) => `${d}%`);
  addTimeXTicks(svg, x, xDomain, margin.top + plotH, 6);
  const endLabels = [];
  series.forEach((spec) => {
    const points = rows.map((row) => [x(parseMonth(row.month)), y(Number(row[spec.key] || 0))]);
    svg.appendChild(svgEl("path", { d: makeLinePath(points), fill: "none", stroke: spec.color, "stroke-width": 2.4, "stroke-linecap": "round" }));
    const last = points[points.length - 1];
    endLabels.push({ x: last[0], y: last[1], text: spec.label, color: spec.color, fontWeight: 760, priority: 0 });
  });
  placeDeclutteredLabels(svg, endLabels);
}

function renderSingleMultiGroups() {
  const rows = (state.data.discussion.single_multi_groups || []).slice().sort((a, b) => Number(b.multi_model_posts_pct) - Number(a.multi_model_posts_pct));
  const max = Math.max(...rows.map((r) => Number(r.multi_model_posts_pct || 0)), 1);
  $("single-multi-groups").innerHTML = html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Subreddit group</th><th>Posts</th><th>Multi-model</th><th>Multi-provider</th><th>Multi-family</th></tr></thead>
        <tbody>
          ${rows
            .map((row) => html`
              <tr>
                <td>${esc(row.subreddit_group_label || row.subreddit_group)}</td>
                <td>${fmtInt(row.posts)}</td>
                <td><div class="bar-track"><div class="value-bar" style="width:${(Number(row.multi_model_posts_pct || 0) / max) * 100}%;background:#2f6e5c"></div></div>${fmtPct(row.multi_model_posts_pct)}</td>
                <td>${fmtPct(row.multi_provider_posts_pct)}</td>
                <td>${fmtPct(row.multi_family_posts_pct)}</td>
              </tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSentimentSection() {
  renderSentimentChart();
  renderTrendTable();
  renderReleaseScatter();
}

function renderSentimentChart() {
  renderSentimentChartInto("sentiment-chart", state.sentimentProvider, { width: 960, height: 430 });
}

function renderSentimentChartInto(containerId, provider, options = {}) {
  const rows = state.data.sentiment.rows
    .filter((r) => r.provider === provider)
    .sort((a, b) => parseDate(a.week) - parseDate(b.week));
  const svg = createSvg($(containerId), options.width || 960, options.height || 430);
  if (!rows.length) {
    svg.appendChild(svgEl("text", { x: 30, y: 40, fill: "#5b6d66" }, "No sentiment rows for this provider."));
    return;
  }
  const width = options.width || 960;
  const height = options.height || 430;
  const margin = { top: 24, right: options.compact ? 32 : 72, bottom: 52, left: 58 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const xDomain = [parseDate(rows[0].week), parseDate(rows[rows.length - 1].week)];
  const x = scale(xDomain, [margin.left, margin.left + plotW]);
  const y = scale([0, 100], [margin.top + plotH, margin.top]);
  const yBase = margin.top + plotH;
  const maxVolume = Math.max(...rows.map((r) => Number(r.n_posts || 0)), 1);

  const volumePoints = rows.map((r) => [x(parseDate(r.week)), yBase - (Number(r.n_posts || 0) / maxVolume) * plotH * 0.28]);
  const volumePath = `M${x(parseDate(rows[0].week)).toFixed(2)},${yBase}L${volumePoints.map((point) => `${point[0].toFixed(2)},${point[1].toFixed(2)}`).join("L")}L${x(parseDate(rows[rows.length - 1].week)).toFixed(2)},${yBase}Z`;
  svg.appendChild(svgEl("path", { d: volumePath, fill: "rgba(107, 128, 120, 0.18)" }));
  svg.appendChild(svgEl("path", { d: makeLinePath(volumePoints), fill: "none", stroke: "#6b8078", "stroke-width": 1.2, "stroke-dasharray": "3 4" }));

  addYAxis(svg, y, margin.left, margin.left + plotW, [0, 25, 50, 75, 100], (d) => `${d}%`);
  addTimeXTicks(svg, x, xDomain, yBase, options.compact ? 4 : 6);

  const sentMarkerLabels = [];
  state.data.releases.rows
    .filter((r) => r.provider_key === provider)
    .forEach((release) => {
      const t = parseDate(release.release_date);
      if (t < xDomain[0] || t > xDomain[1]) return;
      const xx = x(t);
      const selected = release.provider === state.selectedReleaseProvider && release.model === state.selectedReleaseModel;
      const line = svgEl("line", { x1: xx, y1: margin.top, x2: xx, y2: yBase, stroke: selected ? "#c94835" : "#2f403b", "stroke-width": selected ? 2 : 0.9, "stroke-dasharray": selected ? "" : "3 4", opacity: selected ? 0.92 : 0.52 });
      svg.appendChild(line);
      const hit = svgEl("rect", { x: xx - 4, y: margin.top, width: 8, height: plotH, fill: "transparent" });
      hit.style.cursor = "pointer";
      wireTooltip(hit, () => `<div class="tip-title">${esc(release.provider)} ${esc(release.model)}</div><div class="tip-sub">${esc(release.release_date)}</div>`);
      svg.appendChild(hit);
      if (!options.compact || selected || isPaperFocus(release.provider, release.model)) {
        sentMarkerLabels.push({
          x: xx,
          y: margin.top,
          text: release.model,
          color: selected ? "#c94835" : "#2f403b",
          fontSize: 10,
          anchor: "top",
          priority: selected ? 1000 : 0,
        });
      }
    });
  placeDeclutteredLabels(svg, sentMarkerLabels);

  Object.entries(SENTIMENTS).forEach(([sentiment, spec]) => {
    if (!state.sentimentToggles[sentiment]) return;
    const points = rows.map((r) => {
      const value = r[`${sentiment}_rate_plot`];
      return value === null ? null : [x(parseDate(r.week)), y(Number(value))];
    });
    svg.appendChild(svgEl("path", { d: makeLinePath(points), fill: "none", stroke: spec.color, "stroke-width": options.compact ? 2.2 : 2.7, "stroke-linecap": "round" }));
    rows.forEach((row, i) => {
      const value = row[`${sentiment}_rate_plot`];
      if (value === null || i % Math.ceil(rows.length / (options.compact ? 10 : 16)) !== 0) return;
      const dot = svgEl("circle", { cx: x(parseDate(row.week)), cy: y(Number(value)), r: options.compact ? 2 : 2.5, fill: spec.color, opacity: 0.8 });
      dot.style.cursor = "pointer";
      wireTooltip(
        dot,
        () =>
          `<div class="tip-title">${esc(row.provider_label)} · ${esc(row.week)}</div>
           <div>${esc(spec.label)} ${fmtPct(row[`${sentiment}_rate`])}</div>
           <div class="tip-sub">${fmtInt(row[`${sentiment}_count`])} / ${fmtInt(row.n_posts)} posts</div>`,
      );
      svg.appendChild(dot);
    });
  });

  if (options.title !== "") {
    const providerName = rows[0]?.provider_label || provider;
    svg.appendChild(
      svgEl(
        "text",
        { x: margin.left, y: 17, fill: MUTED_INK, "font-size": options.compact ? 11.5 : 12.5, "font-weight": 700 },
        options.title || `${providerName} · weekly sentiment shares`,
      ),
    );
  }
}

function renderTrendTable() {
  const rows = state.data.trends.rows.filter((r) => r.provider === state.sentimentProvider);
  $("trend-table").innerHTML = html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sentiment</th><th>Slope</th><th>Total change</th><th>Trend</th></tr></thead>
        <tbody>
          ${rows.map((r) => html`<tr><td>${esc(r.sentiment)}</td><td>${fmtDelta(r.slope_pp_per_week)} / week</td><td>${fmtDelta(r.total_change_pp)}</td><td>${esc(r.trend_hamed_rao)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function filteredReleaseRows() {
  return state.data.releases.rows.filter((row) => {
    if (state.scatterProvider !== "all" && row.provider_key !== state.scatterProvider) return false;
    if (state.scatterSource !== "all" && row.source_status !== state.scatterSource) return false;
    if (state.scatterHideFirst && row.is_first_release_visible) return false;
    return true;
  });
}

function renderReleaseScatter() {
  renderReleaseScatterInto("release-scatter", filteredReleaseRows(), { width: 900, height: 360 });
}

function renderReleaseScatterInto(containerId, rows, options = {}) {
  const width = options.width || 900;
  const height = options.height || 360;
  const svg = createSvg($(containerId), width, height);
  if (!rows.length) {
    svg.appendChild(svgEl("text", { x: width / 2, y: height / 2, "text-anchor": "middle", fill: "#5b6d66" }, "No releases match the current filters"));
    return;
  }
  const margin = { top: 26, right: 34, bottom: 58, left: 62 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const xDomain = domainWithPadding(rows.map((r) => Number(r.positive_delta_pp || 0)));
  const yDomain = domainWithPadding(rows.map((r) => Number(r.negative_delta_pp || 0)));
  const x = scale(xDomain, [margin.left, margin.left + plotW]);
  const y = scale(yDomain, [margin.top + plotH, margin.top]);
  const size = scale([0, Math.max(...rows.map((r) => Number(r.window_total_posts || 0)), 1)], [5, options.maxRadius || 15]);
  const xTicks = [Math.floor(xDomain[0] / 5) * 5, 0, Math.ceil(xDomain[1] / 5) * 5];
  const yTicks = [Math.floor(yDomain[0] / 5) * 5, 0, Math.ceil(yDomain[1] / 5) * 5];

  addYAxis(svg, y, margin.left, margin.left + plotW, yTicks, (d) => `${d}`);
  svg.appendChild(svgEl("line", { x1: x(0), y1: margin.top, x2: x(0), y2: margin.top + plotH, class: "zero-line" }));
  svg.appendChild(svgEl("line", { x1: margin.left, y1: y(0), x2: margin.left + plotW, y2: y(0), class: "zero-line" }));
  addNumericXTicks(svg, x, xTicks, margin.top + plotH, (d) => `${d}`);

  const labelCandidates = [];
  rows.forEach((row) => {
    const cx = x(Number(row.positive_delta_pp || 0));
    const cy = y(Number(row.negative_delta_pp || 0));
    const highlighted = row.provider === options.highlightProvider && row.model === options.highlightModel;
    const r = highlighted ? size(Number(row.window_total_posts || 0)) + 3 : size(Number(row.window_total_posts || 0));
    const circle = svgEl("circle", {
      cx,
      cy,
      r,
      fill: providerColor(row.provider_key),
      opacity: highlighted ? 0.95 : 0.78,
      stroke: highlighted ? "#c94835" : "#fff",
      "stroke-width": highlighted ? 3 : 1.5,
    });
    circle.style.cursor = "pointer";
    wireTooltip(
      circle,
      () =>
        `<div class="tip-title">${esc(row.provider)} ${esc(row.model)}</div>
         <div>Released ${esc(row.release_date)}</div>
         <div>Δ positive ${fmtDelta(row.positive_delta_pp)} · Δ negative ${fmtDelta(row.negative_delta_pp)}</div>
         <div class="tip-sub">${fmtInt(row.window_total_posts)} window posts · favorability Δ ${fmtDelta(row.favorability_delta_pp)}</div>`,
    );
    svg.appendChild(circle);
    const shouldLabel = highlighted || options.alwaysLabel || Math.abs(row.positive_delta_pp) > 5 || Math.abs(row.negative_delta_pp) > 7 || isPaperFocus(row.provider, row.model);
    if (shouldLabel) {
      labelCandidates.push({
        x: cx,
        y: cy,
        text: row.model,
        color: highlighted ? "#c94835" : HEADING_INK,
        priority: (highlighted ? 1000 : 0) + r,
      });
    }
  });
  placeDeclutteredLabels(svg, labelCandidates);

  svg.appendChild(svgEl("text", { x: margin.left + plotW / 2, y: height - 10, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Positive sentiment change after release, pp"));
  svg.appendChild(svgEl("text", { x: 14, y: margin.top + plotH / 2, transform: `rotate(-90 14 ${margin.top + plotH / 2})`, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Negative sentiment change after release, pp"));
}

function renderSubredditSection() {
  renderSubredditCoverage();
  renderSubredditLevelBars();
  renderSubredditDiversityTable();
}

function renderSubredditCoverage() {
  const rows = state.data.subreddits.coverage_rows || [];
  const svg = createSvg($("subreddit-coverage"), 900, 360);
  if (!rows.length) return;
  const margin = { top: 28, right: 30, bottom: 58, left: 64 };
  const plotW = 900 - margin.left - margin.right;
  const plotH = 360 - margin.top - margin.bottom;
  const x = scale([0, Math.max(...rows.map((r) => Number(r.coverage_rate_pct || 0)), 1) * 1.08], [margin.left, margin.left + plotW]);
  const y = scale([0, Math.max(...rows.map((r) => Number(r.multi_model_rate_pct || 0)), 1) * 1.18], [margin.top + plotH, margin.top]);
  const size = scale([0, Math.max(...rows.map((r) => Number(r.total_posts || 0)), 1)], [5, 20]);
  addYAxis(svg, y, margin.left, margin.left + plotW, [0, 10, 20, 30], (d) => `${d}%`);
  addNumericXTicks(svg, x, [0, 25, 50, 75, 100], margin.top + plotH, (d) => `${d}%`);
  const labelCandidates = [];
  rows.forEach((row) => {
    const cx = x(Number(row.coverage_rate_pct || 0));
    const cy = y(Number(row.multi_model_rate_pct || 0));
    const r = size(Number(row.total_posts || 0));
    const circle = svgEl("circle", { cx, cy, r, fill: ACCENT, opacity: 0.72, stroke: "#fff", "stroke-width": 1.4 });
    circle.style.cursor = "pointer";
    wireTooltip(
      circle,
      () =>
        `<div class="tip-title">r/${esc(row.subreddit)}</div>
         <div>Coverage ${fmtPct(row.coverage_rate_pct)} · Multi-model ${fmtPct(row.multi_model_rate_pct)}</div>
         <div class="tip-sub">${fmtInt(row.total_posts)} posts</div>`,
    );
    svg.appendChild(circle);
    if (Number(row.total_posts || 0) > 9000 || Number(row.coverage_rate_pct || 0) > 70) {
      labelCandidates.push({ x: cx, y: cy, text: row.subreddit, color: HEADING_INK, fontWeight: 740, priority: r });
    }
  });
  placeDeclutteredLabels(svg, labelCandidates);
  svg.appendChild(svgEl("text", { x: margin.left + plotW / 2, y: 350, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Posts with model terms, %"));
  svg.appendChild(svgEl("text", { x: 16, y: margin.top + plotH / 2, transform: `rotate(-90 16 ${margin.top + plotH / 2})`, "text-anchor": "middle", fill: MUTED_INK, "font-size": 11 }, "Multi-model posts, %"));
}

function renderSubredditLevelBars() {
  const rows = state.data.subreddits.top_terms_by_subreddit
    .filter((r) => r.subreddit === state.subredditName && r.level === state.subredditLevel)
    .sort((a, b) => Number(a.rank_within_subreddit) - Number(b.rank_within_subreddit));
  renderValueBars("subreddit-level-bars", rows, {
    value: (r) => r.post_share_pct,
    label: (r) => r.label,
    meta: (r) => `${fmtInt(r.post_count)} posts`,
    format: (v) => fmtPct(v),
    max: Math.max(...rows.map((r) => Number(r.post_share_pct || 0)), 1),
    color: (r, i) => (state.subredditLevel === "provider" ? providerColor(r.value) : SERIES_COLORS[i % SERIES_COLORS.length]),
  });
}

function renderSubredditDiversityTable() {
  const rows = (state.data.subreddits.diversity_rows || [])
    .slice()
    .sort((a, b) => Number(b.provider_js_specialization || 0) - Number(a.provider_js_specialization || 0))
    .slice(0, 14);
  $("subreddit-diversity-table").innerHTML = html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Subreddit</th><th>Provider entropy</th><th>Provider HHI</th><th>Specialization</th><th>Family entropy</th></tr></thead>
        <tbody>
          ${rows
            .map((row) => html`<tr><td>${esc(row.subreddit)}</td><td>${Number(row.provider_entropy_normalized || 0).toFixed(3)}</td><td>${Number(row.provider_hhi || 0).toFixed(3)}</td><td>${Number(row.provider_js_specialization || 0).toFixed(3)}</td><td>${Number(row.family_entropy_normalized || 0).toFixed(3)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderConceptSection() {
  renderConceptArea();
  renderConceptMetaMatrix();
  renderConceptBank();
}

function renderConceptArea() {
  const payload = state.data.concepts;
  const concepts = payload.top_concepts.map((d) => d.concept);
  const rows = payload.rows.filter((r) => r.granularity === state.conceptGranularity);
  const periods = [...new Set(rows.map((r) => r.period))].sort((a, b) => parsePeriod(a, state.conceptGranularity) - parsePeriod(b, state.conceptGranularity));
  const byPeriod = new Map();
  rows.forEach((row) => {
    if (!byPeriod.has(row.period)) byPeriod.set(row.period, new Map());
    byPeriod.get(row.period).set(row.concept, row);
  });

  const svg = createSvg($("concept-area"), 960, 430);
  if (!periods.length) return;
  const margin = { top: 24, right: 84, bottom: 54, left: 60 };
  const plotW = 960 - margin.left - margin.right;
  const plotH = 430 - margin.top - margin.bottom;
  const xDomain = [parsePeriod(periods[0], state.conceptGranularity), parsePeriod(periods[periods.length - 1], state.conceptGranularity)];
  const x = scale(xDomain, [margin.left, margin.left + plotW]);

  const stacks = periods.map((period) => {
    let total = 0;
    const periodMap = byPeriod.get(period) || new Map();
    const values = concepts.map((concept) => {
      const row = periodMap.get(concept);
      const value = row ? Number(row.prevalence_pct || 0) : 0;
      total += value;
      return value;
    });
    const firstRow = periodMap.values().next().value;
    return { period, values, total, n_posts: firstRow?.n_posts || 0, coverage: firstRow?.top10_coverage_pct || 0 };
  });
  const yMax = Math.max(10, Math.max(...stacks.map((d) => d.total)) * 1.14);
  const y = scale([0, yMax], [margin.top + plotH, margin.top]);
  const maxVol = Math.max(...stacks.map((d) => Number(d.n_posts || 0)), 1);

  addYAxis(svg, y, margin.left, margin.left + plotW, [0, Math.round(yMax / 2), Math.round(yMax)], (d) => `${d}%`);
  addTimeXTicks(svg, x, xDomain, margin.top + plotH, 6);

  const cumulative = periods.map(() => 0);
  concepts.forEach((concept, conceptIndex) => {
    const upper = periods.map((period, i) => {
      const value = stacks[i].values[conceptIndex];
      cumulative[i] += value;
      return [x(parsePeriod(period, state.conceptGranularity)), y(cumulative[i])];
    });
    const bottom = periods.map((period, i) => {
      const value = cumulative[i] - stacks[i].values[conceptIndex];
      return [x(parsePeriod(period, state.conceptGranularity)), y(value)];
    });
    const matched = !state.conceptSearch || concept.toLowerCase().includes(state.conceptSearch);
    const path = svgEl("path", { d: makeAreaPath(upper, bottom), fill: CONCEPT_SHADES[conceptIndex % CONCEPT_SHADES.length], opacity: matched ? 0.9 : 0.13, stroke: "rgba(255,255,255,0.72)", "stroke-width": 0.7 });
    path.appendChild(svgEl("title", {}, `${concept}\nTop-10 rank ${conceptIndex + 1}`));
    svg.appendChild(path);
  });

  const releases = state.data.releases.rows.filter((r) => state.conceptMarkerProvider === "all" || r.provider_key === state.conceptMarkerProvider);
  const markerLabels = [];
  releases.forEach((release) => {
    const t = parseDate(release.release_date);
    if (t < xDomain[0] || t > xDomain[1]) return;
    const xx = x(t);
    const selected = release.provider === state.selectedReleaseProvider && release.model === state.selectedReleaseModel;
    const line = svgEl("line", { x1: xx, y1: margin.top, x2: xx, y2: margin.top + plotH, stroke: selected ? "#c94835" : providerColor(release.provider_key), "stroke-width": selected ? 1.8 : 0.8, "stroke-dasharray": "4 5", opacity: selected ? 0.9 : state.conceptMarkerProvider === "all" ? 0.3 : 0.58 });
    svg.appendChild(line);
    const hit = svgEl("rect", { x: xx - 4, y: margin.top, width: 8, height: plotH, fill: "transparent" });
    hit.style.cursor = "pointer";
    wireTooltip(hit, () => `<div class="tip-title">${esc(release.provider)} ${esc(release.model)}</div><div class="tip-sub">${esc(release.release_date)}</div>`);
    svg.appendChild(hit);
    if (state.conceptMarkerProvider !== "all" || selected || isPaperFocus(release.provider, release.model)) {
      markerLabels.push({
        x: xx,
        y: margin.top,
        text: release.model,
        color: selected ? "#c94835" : providerColor(release.provider_key),
        fontSize: 10,
        anchor: "top",
        priority: selected ? 1000 : 0,
      });
    }
  });
  placeDeclutteredLabels(svg, markerLabels);

  const coveragePoints = stacks.map((d) => [x(parsePeriod(d.period, state.conceptGranularity)), y(d.coverage)]);
  svg.appendChild(svgEl("path", { d: makeLinePath(coveragePoints), fill: "none", stroke: "#22312c", "stroke-width": 2, "stroke-dasharray": "6 5" }));
  const volumePoints = stacks.map((d) => [x(parsePeriod(d.period, state.conceptGranularity)), margin.top + plotH - (Number(d.n_posts || 0) / maxVol) * plotH * 0.2]);
  svg.appendChild(svgEl("path", { d: makeLinePath(volumePoints), fill: "none", stroke: "#6b8078", "stroke-width": 1.2, "stroke-dasharray": "3 4" }));

  $("concept-legend").innerHTML = payload.top_concepts
    .map((concept, i) => `<span class="rank-item"><span class="rank-number" style="border-color:${CONCEPT_SHADES[i % CONCEPT_SHADES.length]}">${concept.rank}</span><span>${esc(concept.concept)}</span><span>${Number(concept.weighted_score || 0).toFixed(2)}</span></span>`)
    .join("");
}

function renderConceptMetaMatrix() {
  const payload = state.data.conceptSentiment;
  const sentLookup = new Map();
  (payload.meta_sentiment_cells || []).forEach((row) => {
    if (!sentLookup.has(row.meta_concepts)) sentLookup.set(row.meta_concepts, {});
    sentLookup.get(row.meta_concepts)[row.majority] = row.concepts;
  });
  $("concept-meta-matrix").innerHTML = html`
    <div class="meta-cell-grid">
      ${state.data.conceptBank.meta_counts
        .slice(0, 12)
        .map((row) => {
          const sentiments = sentLookup.get(row.meta_concepts) || {};
          return html`
            <div class="meta-cell">
              <div>
                <strong>${esc(row.meta_concepts)}</strong>
                <span class="concept-meta">Mixed ${fmtInt(sentiments.Mixed || 0)} · Negative ${fmtInt(sentiments.Negative || 0)} · Positive ${fmtInt(sentiments.Positive || 0)}</span>
              </div>
              <strong>${fmtInt(row.concepts)}</strong>
            </div>`;
        })
        .join("")}
    </div>
  `;
}

function renderConceptBank() {
  const q = state.conceptBankSearch;
  const prevalenceRows = state.data.concepts.scope_prevalence_rows.filter((row) => row.dimension === state.conceptBankDimension && row.value === state.conceptBankValue);
  const prevalenceByConcept = new Map(prevalenceRows.map((row) => [row.concept, row]));
  const sentimentByConcept = new Map(state.data.conceptSentiment.rows.map((row) => [row.concept, row]));
  let rows = state.data.conceptBank.rows
    .map((row) => ({ ...row, prevalence: prevalenceByConcept.get(row.canonical_name), annotation: sentimentByConcept.get(row.canonical_name) }))
    .filter((row) => {
      if (state.conceptBankSentiment !== "all" && normalizeSentiment(row.annotation?.majority || row.sentiment_majority) !== state.conceptBankSentiment) return false;
      if (!q) return true;
      const haystack = [row.canonical_name, row.meta_concepts, row.mid_level_concept, row.definition_prompt].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  rows = sortConceptBankRows(rows).slice(0, 160);
  $("concept-bank-table").innerHTML = html`
    <div class="concept-bank-list">
      ${rows
        .map((row) => html`
          <div class="concept-bank-row">
            <div>
              <strong>${esc(row.canonical_name)}</strong>
              <p>${esc(row.meta_concepts)} / ${esc(row.mid_level_concept)}</p>
            </div>
            <div>
              <p>${esc(row.definition_prompt || "")}</p>
            </div>
            <div><strong>${fmtPct(row.prevalence?.prevalence_pct || 0, 3)}</strong><p>${fmtInt(row.prevalence?.n_concept_posts || 0)} / ${fmtInt(row.prevalence?.n_total_posts || 0)}</p></div>
            <div><span class="data-chip">${esc(normalizeSentiment(row.annotation?.majority || row.sentiment_majority))}</span><p>${esc(row.annotation?.agreement || row.sentiment_agreement || "")}</p></div>
          </div>`)
        .join("")}
    </div>
  `;
}

function sortConceptBankRows(rows) {
  const comparators = {
    prevalence_desc: (a, b) => Number(b.prevalence?.prevalence_pct || 0) - Number(a.prevalence?.prevalence_pct || 0),
    posts_desc: (a, b) => Number(b.prevalence?.n_concept_posts || 0) - Number(a.prevalence?.n_concept_posts || 0),
    alias_desc: (a, b) => Number(b.alias_count || 0) - Number(a.alias_count || 0),
    name_asc: (a, b) => a.canonical_name.localeCompare(b.canonical_name),
  };
  return rows.slice().sort(comparators[state.conceptBankSort] || comparators.prevalence_desc);
}

function renderConceptSentimentSection() {
  const payload = state.data.conceptSentiment;
  const summary = payload.summary || {};
  const fullAgreeCount = summary.full_agree_concepts ?? summary.full_agree_count;
  const fullAgreeRate = summary.full_agree_rate_pct ?? summary.full_agree_pct;
  const twoVsOneCount = summary.two_vs_one_concepts ?? summary.two_vs_one_count;
  $("concept-sentiment-summary").innerHTML = html`
    <div class="mini-tile"><div class="mini-value">${fmtInt(summary.concepts)}</div><div class="mini-label">Annotated concepts</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtInt(fullAgreeCount)}</div><div class="mini-label">Full agreement concepts</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtPct(fullAgreeRate)}</div><div class="mini-label">Full agreement rate</div></div>
    <div class="mini-tile"><div class="mini-value">${fmtInt(twoVsOneCount)}</div><div class="mini-label">Two-vs-one concepts</div></div>
  `;
  renderValueBars("concept-sentiment-bars", payload.majority_counts || [], {
    value: (r) => r.concepts,
    label: (r) => r.sentiment,
    meta: (r) => `${fmtPct((Number(r.concepts || 0) / Number(summary.concepts || 1)) * 100)} of concepts`,
    color: (r) => SENTIMENTS[String(r.sentiment).toLowerCase()]?.color || "#627386",
  });
  renderValueBars("concept-agreement-bars", payload.agreement_counts || [], {
    value: (r) => r.concepts,
    label: (r) => (r.agreement === "full_agree" ? "Full agreement" : "Two vs one"),
    meta: (r) => `${fmtPct((Number(r.concepts || 0) / Number(summary.concepts || 1)) * 100)} of concepts`,
    color: (r) => (r.agreement === "full_agree" ? "#13865b" : "#d97706"),
  });
  renderConceptSentimentTable();
}

function renderConceptSentimentTable() {
  const qSent = state.conceptSentimentFilter;
  const qAgree = state.conceptAgreementFilter;
  const rows = state.data.conceptSentiment.rows
    .filter((row) => qSent === "all" || normalizeSentiment(row.majority) === qSent)
    .filter((row) => qAgree === "all" || row.agreement === qAgree)
    .sort((a, b) => a.concept.localeCompare(b.concept));
  $("concept-sentiment-table").innerHTML = html`
    <div class="annotation-list">
      ${rows
        .map((row) => html`
          <div class="annotation-row">
            <div><strong>${esc(row.concept)}</strong><p>${esc(row.meta_concepts)} / ${esc(row.mid_level_concept)}</p></div>
            <div><p>${esc(row.prompt)}</p></div>
          </div>`)
        .join("")}
    </div>
  `;
}

function renderReleaseRanking() {
  let rows = state.data.releaseConcepts.rows.filter((row) => {
    if (state.rankingProvider !== "all" && row.provider !== state.rankingProvider) return false;
    if (state.rankingRelease !== "all" && `${row.provider}|${row.model}` !== state.rankingRelease) return false;
    if (state.rankingDirection !== "all" && row.direction !== state.rankingDirection) return false;
    if (state.rankingSearch) {
      const haystack = [row.concept, row.provider, row.model, row.prompt].join(" ").toLowerCase();
      if (!haystack.includes(state.rankingSearch)) return false;
    }
    return true;
  });
  rows = rows.sort((a, b) => Math.abs(Number(b.delta_pp || 0)) - Math.abs(Number(a.delta_pp || 0))).slice(0, 80);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(Number(r.delta_pp || 0))), 1);
  $("release-ranking-list").innerHTML = renderDeltaRows(rows, maxAbs, { showRelease: true });
}

function renderDeltaRows(rows, maxAbs, options = {}) {
  if (!rows.length) return `<p class="profile-note">No concept deltas match this selection.</p>`;
  const rowClass = options.micro ? "micro-delta" : options.compact ? "compact-delta" : "";
  return html`
    <div class="delta-list ${options.micro ? "micro" : ""}">
      ${rows
        .map((row) => {
          const width = Math.max(3, (Math.abs(Number(row.delta_pp || 0)) / (maxAbs || 1)) * 50);
          const releaseMeta = options.showRelease ? `${row.provider} ${row.model} / ` : "";
          return html`
            <div class="delta-row ${rowClass}" title="${esc(`${row.provider} ${row.model}: ${row.concept}, ${fmtDelta(row.delta_pp)}; pre ${fmtPct(row.pre_cov_pct)} post ${fmtPct(row.post_cov_pct)}; support ${fmtInt(row.n_posts_in_window_for_concept)}`)}">
              <div class="concept-name">
                ${esc(row.concept)}
                <span class="concept-meta">${esc(releaseMeta)}${fmtPct(row.pre_cov_pct)} to ${fmtPct(row.post_cov_pct)} / ${fmtInt(row.n_posts_in_window_for_concept)} concept posts${isPaperFocus(row.provider, row.model) ? " / paper focus" : ""}</span>
              </div>
              <div class="bar-track"><div class="delta-bar ${esc(row.direction)}" style="width:${width}%"></div></div>
              <div class="delta-value">${fmtDelta(row.delta_pp)}</div>
            </div>`;
        })
        .join("")}
    </div>
  `;
}

function updateReleaseSelect() {
  const rows = state.data.releaseConcepts.rows
    .filter((r) => r.provider === state.releaseConceptProvider)
    .sort((a, b) => parseDate(a.release_date) - parseDate(b.release_date));
  const seen = new Set();
  const models = rows
    .map((r) => r.model)
    .filter((model) => {
      if (seen.has(model)) return false;
      seen.add(model);
      return true;
    });
  state.releaseConceptModel = models.includes(state.releaseConceptModel) ? state.releaseConceptModel : models[0] || "";
  fillSelect("concept-release", models.map((m) => ({ value: m, label: `${m}${isPaperFocus(state.releaseConceptProvider, m) ? " - paper focus" : ""}` })), state.releaseConceptModel);
}

function renderReleaseConcepts() {
  const rows = state.data.releaseConcepts.rows.filter((r) => r.provider === state.releaseConceptProvider && r.model === state.releaseConceptModel);
  if (!rows.length) return;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(Number(r.delta_pp))), 1);
  const ordered = rows.slice().sort((a, b) => (a.direction === b.direction ? Math.abs(Number(b.delta_pp)) - Math.abs(Number(a.delta_pp)) : a.direction.localeCompare(b.direction)));
  $("concept-delta-bars").innerHTML = renderDeltaRows(ordered, maxAbs);

  const first = rows[0];
  const rising = rows.filter((r) => r.direction === "rising");
  const falling = rows.filter((r) => r.direction === "falling");
  const story = state.data.paper.release_stories.find((s) => s.provider === first.provider && s.models.some((m) => m === first.model));
  $("release-profile").innerHTML = html`
    <div class="profile-stat"><span>Release date</span><strong>${esc(first.release_date)}</strong></div>
    <div class="profile-stat"><span>Window</span><strong>${esc(first.window_days)} days</strong></div>
    <div class="profile-stat"><span>Pre-window posts</span><strong>${fmtInt(first.n_pre_posts)}</strong></div>
    <div class="profile-stat"><span>Post-window posts</span><strong>${fmtInt(first.n_post_posts)}</strong></div>
    <div class="profile-stat"><span>Rising / falling concepts</span><strong>${rising.length} / ${falling.length}</strong></div>
    <div class="profile-stat"><span>Release set</span><strong>${isPaperFocus(first.provider, first.model) ? "Paper focus" : "Completeness"}</strong></div>
    ${story ? `<p class="profile-note"><strong>${esc(story.title)}.</strong> ${esc(story.summary)}</p>` : '<p class="profile-note">Included for completeness; not part of the main paper narrative set.</p>'}
  `;
}

function renderMethods() {
  const manifest = state.data.manifest;
  const filterRows = Array.isArray(manifest.filters)
    ? manifest.filters.map((row) => ({ name: row.name, value: row.value }))
    : Object.entries(manifest.filters || {}).map(([name, value]) => ({ name, value }));
  $("filter-list").innerHTML = html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>Filter</th><th>Value</th></tr></thead>
        <tbody>
          ${filterRows.map((row) => `<tr><td>${esc(row.name)}</td><td>${esc(row.value)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  $("manifest-summary").innerHTML = html`
    <div class="profile-stat"><span>Generated</span><strong>${esc(manifest.generated_at_utc)}</strong></div>
    <div class="profile-stat"><span>Bundle path</span><strong>p/upai</strong></div>
    <div class="profile-stat"><span>Privacy</span><strong>Aggregate only</strong></div>
    <p class="profile-note">${esc(manifest.privacy_note || (Array.isArray(manifest.privacy_policy) ? manifest.privacy_policy.join(" ") : manifest.privacy_policy) || "Raw text, post IDs, and local paths are not included in the public data bundle.")}</p>
  `;
}

let dashboardBooted = false;
function bootDashboard() {
  if (dashboardBooted) return;
  dashboardBooted = true;
  const status = document.getElementById("appendix-status");
  if (status) status.textContent = "Loading appendix data…";
  loadData()
    .then(() => {
      initControls();
      renderAll();
      if (status) status.remove();
    })
    .catch((error) => {
      if (status) status.textContent = `Appendix failed to load: ${error.message}`;
      console.error(error);
    });
}

const appendixAnchor = document.getElementById("appendix");
const APPENDIX_HASHES = new Set([
  "appendix", "summary", "model-extraction", "single-multi", "sentiment",
  "subreddits", "concepts", "concept-bank", "concept-sentiment",
  "release-ranking", "release-concepts", "methods",
]);

if (appendixAnchor && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        io.disconnect();
        bootDashboard();
      }
    },
    { rootMargin: "800px 0px" },
  );
  io.observe(appendixAnchor);
  if (APPENDIX_HASHES.has(location.hash.replace("#", ""))) bootDashboard();
  window.addEventListener("hashchange", () => {
    if (APPENDIX_HASHES.has(location.hash.replace("#", ""))) bootDashboard();
  });
} else {
  bootDashboard();
}

/* Guided scrollytelling story for the paper companion page.
   Self-contained: fetches only the small data files it needs and renders
   six interactive chapters with a sticky stage per chapter. */
(() => {
  "use strict";

  const FILES = {
    paper: "data/paper_numbers.json",
    sent: "data/sentiment_timeseries.json",
    releases: "data/release_sentiment_deltas.json",
    concepts: "data/concept_release_deltas.json",
  };

  const POS_C = "#13865b";
  const NEG_C = "#c94835";
  const VOL_C = "#8cada1";
  const RISE_C = "#2f6e5c";
  const FALL_C = "#d97706";

  const CHAPTERS = [
    {
      id: "chapter-gpt-4o",
      model: "GPT-4o",
      provider: "openai",
      kicker: "Chapter 1 · OpenAI · May 2024",
      title: "GPT-4o — The Promised Future",
      highlight: ["Expectation Gap", "Access & Availability", "Pricing & Limits"],
      steps: [
        {
          h: "Fourteen months of waiting",
          p: "After GPT-4, OpenAI went more than a year without a flagship release. When the “omni” demo landed — real-time voice, vision, interruption-based conversation — discussion volume surged. The timeline shows the release against the provider's full history.",
        },
        {
          h: "A reception that refused to pick a side",
          p: "GPT-4o is the one focal release with no significant directional sentiment shift. Excitement about more natural interaction and frustration about inaccessible features cancelled out: the sentiment distribution before and after the release is statistically indistinguishable.",
          stat: "Sentiment shift: not significant (p = .15)",
        },
        {
          h: "“Why can't I use what was shown?”",
          p: "The concepts tell the real story. Expectation Gap jumps by +19.4 pp — the largest concept surge among the releases we analyze. Access & Availability and Pricing & Limits rise with it: users were not judging model quality; they were trying to find the capabilities from the demo.",
          stat: "Expectation Gap +19.4 pp",
        },
      ],
    },
    {
      id: "chapter-gpt-5",
      model: "GPT-5",
      provider: "openai",
      kicker: "Chapter 2 · OpenAI · August 2025",
      title: "GPT-5 — The Backlash",
      highlight: [
        "Feature Removal Frustration",
        "Performance Decline Perception",
        "Version Downgrade Expectation",
        "Inconsistent Behavior Frustration",
      ],
      steps: [
        {
          h: "A flagship that replaced, not added",
          p: "GPT-5 arrived as a forced migration: GPT-4o and other models users relied on were initially removed. Discussion volume was already enormous — this is the largest release window in the corpus.",
        },
        {
          h: "The sharpest negative turn for OpenAI",
          p: "Negative share rose by +10.3 pp while positive fell — the strongest adverse shift among OpenAI's post-ChatGPT releases, and highly significant. This was not diffuse grumbling; it was a directed revolt.",
          stat: "Negative +10.3 pp (p < .001)",
        },
        {
          h: "Losing a workflow — and a companion",
          p: "Every top rising concept is a complaint with a target: Feature Removal Frustration (the loss of GPT-4o), Performance Decline Perception, Version Downgrade Expectation, Inconsistent Behavior Frustration. Users described broken coding and writing workflows, and some described losing an interaction partner they were attached to.",
          stat: "All top-5 rising concepts significant at FDR < 0.05",
        },
      ],
    },
    {
      id: "chapter-gpt-5-1",
      model: "GPT-5.1",
      provider: "openai",
      kicker: "Chapter 3 · OpenAI · late 2025",
      title: "GPT-5.1 — Partial Recovery",
      highlight: [
        "Feature Removal Frustration",
        "Trust & Reliability",
        "Perceived Limitations & Censorship",
        "Emotional Anthropomorphic Engagement",
      ],
      steps: [
        {
          h: "The de-escalation release",
          p: "GPT-5.1 followed quickly, restoring options and softening the migration. The question was whether a point release could undo a platform-level revolt.",
        },
        {
          h: "Recovery, but not enthusiasm",
          p: "Positive share rose and negative fell — both significant. But the magnitudes are modest: this is a return toward baseline, not a celebration. Recovery releases de-escalate; they rarely delight.",
          stat: "Positive +3.1 pp, negative −4.3 pp (p < .001)",
        },
        {
          h: "The backlash themes recede",
          p: "The mirror image of GPT-5: the concepts that defined the revolt — Feature Removal Frustration, Trust & Reliability complaints, Perceived Limitations & Censorship, Emotional Anthropomorphic Engagement — are exactly the ones falling. Discussion shifts from platform revolt back to narrower product complaints.",
          stat: "Feature Removal Frustration −9.2 pp",
        },
      ],
    },
    {
      id: "chapter-claude-4",
      model: "Claude 4",
      provider: "anthropic",
      kicker: "Chapter 4 · Anthropic · May 2025",
      title: "Claude 4 — Product–Model Fit",
      highlight: ["Integration & Automation", "Coding Productivity", "Productivity & Coding Use", "Pricing & Limits"],
      steps: [
        {
          h: "A model that shipped with a workflow",
          p: "Claude 4 coincided with the general availability of Claude Code. The release was not just a capability bump — it came bundled with a concrete use case: coding, automation, and agentic development.",
        },
        {
          h: "The most favorable shift in the data",
          p: "Positive share up, negative share sharply down — the most favorable significant sentiment shift among all releases we test. Volume tripled at the same time, so this is not a small-sample artifact.",
          stat: "Positive +5.3 pp, negative −10.5 pp (p < .001)",
        },
        {
          h: "Coding concepts emerge from zero",
          p: "Integration & Automation and Coding Productivity barely existed in the pre-window and dominate the post-window, while the generic Productivity Assistant concept falls — general talk re-channeled into specific workflows. One honest caveat: Pricing & Limits still rises. Even the best-received release carried subscription grievances.",
          stat: "Integration & Automation +6.2 pp, emerging from ~0",
        },
      ],
    },
    {
      id: "chapter-ds-r1",
      model: "DS R1",
      provider: "deepseek",
      kicker: "Chapter 5 · DeepSeek · January 2025",
      title: "DeepSeek R1 — The Demand Shock",
      highlight: ["Feature Expectation Gap", "Model Comparison & Evaluation", "Self‑Hosting & Privacy"],
      steps: [
        {
          h: "A 19-fold explosion",
          p: "R1's release did not shift an existing conversation — it created one. Single-mention posts grew from 119 in the pre-window to 2,253 after: a community materializing in weeks around an open-weights reasoning model.",
          stat: "119 → 2,253 posts (~19×)",
        },
        {
          h: "Negative sentiment — for an admired model",
          p: "Negative share rose by +16.0 pp, the largest adverse shift among the focal releases. But read the posts and the mechanism differs from GPT-5: this is demand overwhelming capacity. Errors, downtime and failed access dominated — from users who wanted to use R1 and couldn't.",
          stat: "Negative +16.0 pp (p < .001)",
        },
        {
          h: "Admiration, benchmarking, self-hosting",
          p: "Alongside access frustration, Model Comparison & Evaluation rises with the most positive tone of any rising concept — users running their own benchmarks and admiring the price-performance profile. Self-Hosting & Privacy rises too: a values-driven open-source community, not a feature-hungry one.",
          stat: "Self-Hosting & Privacy — a values signal",
        },
      ],
    },
    {
      id: "chapter-grok-3",
      model: "Grok 3",
      provider: "xai",
      kicker: "Chapter 6 · xAI · February 2025",
      title: "Grok 3 — Politicized Anthropomorphism",
      highlight: [
        "Feature Expectation Gap",
        "Reliability Skepticism",
        "Reliability Availability Frustration",
        "Personalization and Anthropomorphism",
      ],
      steps: [
        {
          h: "“Maximally truth-seeking”",
          p: "Grok 3 launched with an ideological promise attached to a product. Discussion volume grew more than five-fold as an audience beyond the core community arrived to test the claim.",
          stat: "331 → 1,839 posts",
        },
        {
          h: "A divided reception",
          p: "Negative share rose significantly; the positive rise is marginal at best. Grok 3 is the closest thing in the data to a genuinely split verdict — enthusiasm and skepticism growing at the same time.",
          stat: "Negative +8.0 pp (p < .01); positive +4.2 pp (p = .06)",
        },
        {
          h: "The model becomes a persona",
          p: "Reliability complaints rise as elsewhere — but the distinctive signal is Personalization & Anthropomorphism: users describing Grok through human-like agency, emotion, and persona. And unusually, a person recurs across the concepts: Musk appears as the source of the truth-seeking expectation, the object of system-prompt debates, and a political figure. The release is evaluated as a product and as a political artifact simultaneously.",
          stat: "Personalization & Anthropomorphism +4.3 pp",
        },
      ],
    },
  ];

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtInt = (n) => Number(n).toLocaleString("en-US");
  const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
  const fmtPP = (v) => `${v > 0 ? "+" : ""}${Number(v).toFixed(1)} pp`;
  const parseDate = (s) => new Date(`${s}T00:00:00Z`);

  function el(tag, cls, htmlContent) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (htmlContent !== undefined) node.innerHTML = htmlContent;
    return node;
  }

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  /* Tooltip singleton */
  const tip = el("div", "story-tooltip");
  document.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add("visible");
    const pad = 14;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let left = x + pad;
    let top = y - h - pad;
    if (left + w > window.innerWidth - 8) left = x - w - pad;
    if (top < 8) top = y + pad;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }
  function hideTip() {
    tip.classList.remove("visible");
  }

  /* ── charts ──────────────────────────────────────────────────────────── */
  function linePath(points) {
    // points: [{x, y} | null] — nulls break the path
    let d = "";
    let pen = false;
    points.forEach((p) => {
      if (!p) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      pen = true;
    });
    return d;
  }

  function buildSentimentChart(container, weeks, releases, chapter, opts) {
    // weeks: provider rows sorted by week; releases: provider release rows
    const W = opts.width || 760;
    const H = opts.height || 320;
    const m = { top: 18, right: 14, bottom: 30, left: 40 };
    const plotW = W - m.left - m.right;
    const plotH = H - m.top - m.bottom;

    const t0 = opts.t0 ?? parseDate(weeks[0].week).getTime();
    const t1 = opts.t1 ?? parseDate(weeks[weeks.length - 1].week).getTime();
    const visible = weeks.filter((r) => {
      const t = parseDate(r.week).getTime();
      return t >= t0 && t <= t1;
    });
    if (!visible.length) return;

    const x = (t) => m.left + ((t - t0) / (t1 - t0 || 1)) * plotW;
    const yRate = (v) => m.top + (1 - v / 100) * plotH;
    const maxVol = Math.max(...visible.map((r) => r.n_posts), 1);
    const volH = plotH * 0.3;
    const yVol = (v) => m.top + plotH - (v / maxVol) * volH;

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });

    // window shading (zoom view)
    if (opts.shadeWindow) {
      const rel = opts.releaseTime;
      const winMs = opts.windowDays * 86400000;
      const pre = svgEl("rect", {
        x: x(Math.max(rel - winMs, t0)),
        y: m.top,
        width: x(rel) - x(Math.max(rel - winMs, t0)),
        height: plotH,
        fill: "#f1f6f3",
      });
      const post = svgEl("rect", {
        x: x(rel),
        y: m.top,
        width: x(Math.min(rel + winMs, t1)) - x(rel),
        height: plotH,
        fill: "#e7f3ec",
      });
      svg.appendChild(pre);
      svg.appendChild(post);
      const preLbl = svgEl("text", { x: x(rel) - 6, y: m.top + 14, "text-anchor": "end", fill: "#7d8f88", "font-size": "11" });
      preLbl.textContent = "pre-window";
      const postLbl = svgEl("text", { x: x(rel) + 6, y: m.top + 14, fill: "#5b6d66", "font-size": "11" });
      postLbl.textContent = "post-window";
      svg.appendChild(preLbl);
      svg.appendChild(postLbl);
    }

    // gridlines
    [0, 25, 50, 75, 100].forEach((v) => {
      svg.appendChild(svgEl("line", { x1: m.left, x2: m.left + plotW, y1: yRate(v), y2: yRate(v), stroke: "#e4ece7", "stroke-width": 1 }));
      const lbl = svgEl("text", { x: m.left - 6, y: yRate(v) + 4, "text-anchor": "end", fill: "#7d8f88", "font-size": "11" });
      lbl.textContent = `${v}%`;
      svg.appendChild(lbl);
    });

    // volume area
    let volPts = `M${x(parseDate(visible[0].week).getTime()).toFixed(1)},${(m.top + plotH).toFixed(1)}`;
    visible.forEach((r) => {
      volPts += `L${x(parseDate(r.week).getTime()).toFixed(1)},${yVol(r.n_posts).toFixed(1)}`;
    });
    volPts += `L${x(parseDate(visible[visible.length - 1].week).getTime()).toFixed(1)},${(m.top + plotH).toFixed(1)}Z`;
    svg.appendChild(svgEl("path", { d: volPts, fill: VOL_C, opacity: 0.22 }));

    // sentiment lines (min-posts gated)
    const mk = (key) => visible.map((r) => (r.meets_min_posts ? { x: x(parseDate(r.week).getTime()), y: yRate(r[key]) } : null));
    svg.appendChild(svgEl("path", { d: linePath(mk("positive_rate")), fill: "none", stroke: POS_C, "stroke-width": 2 }));
    svg.appendChild(svgEl("path", { d: linePath(mk("negative_rate")), fill: "none", stroke: NEG_C, "stroke-width": 2 }));

    // release markers
    (releases || []).forEach((rel) => {
      const t = parseDate(rel.release_date).getTime();
      if (t < t0 || t > t1) return;
      const isFocus = rel.model === chapter.model;
      svg.appendChild(
        svgEl("line", {
          x1: x(t),
          x2: x(t),
          y1: m.top,
          y2: m.top + plotH,
          stroke: isFocus ? "#2f403b" : "#8cada1",
          "stroke-width": isFocus ? 2 : 1,
          "stroke-dasharray": isFocus ? "" : "3 5",
          opacity: isFocus ? 0.9 : 0.55,
        }),
      );
      if ((isFocus && !opts.shadeWindow) || opts.labelAll) {
        const lbl = svgEl("text", {
          x: x(t) + 4,
          y: m.top + (isFocus ? 12 : 24),
          fill: isFocus ? "#2f403b" : "#7d8f88",
          "font-size": isFocus ? "12" : "10",
          "font-weight": isFocus ? "800" : "600",
        });
        lbl.textContent = rel.model;
        svg.appendChild(lbl);
      }
    });

    // x-axis labels (5 ticks)
    for (let i = 0; i <= 4; i++) {
      const t = t0 + ((t1 - t0) * i) / 4;
      const d = new Date(t);
      const lbl = svgEl("text", { x: x(t), y: H - 8, "text-anchor": "middle", fill: "#7d8f88", "font-size": "11" });
      lbl.textContent = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      svg.appendChild(lbl);
    }

    // legend
    const legend = [
      ["Positive %", POS_C],
      ["Negative %", NEG_C],
      ["Weekly posts", VOL_C],
    ];
    legend.forEach(([name, color], i) => {
      const lx = m.left + 8 + i * 108;
      svg.appendChild(svgEl("rect", { x: lx, y: 4, width: 10, height: 10, rx: 2, fill: color, opacity: name === "Weekly posts" ? 0.4 : 1 }));
      const lbl = svgEl("text", { x: lx + 14, y: 13, fill: "#5b6d66", "font-size": "11" });
      lbl.textContent = name;
      svg.appendChild(lbl);
    });

    // hover overlay
    const overlay = svgEl("rect", { x: m.left, y: m.top, width: plotW, height: plotH, fill: "transparent" });
    overlay.style.cursor = "crosshair";
    const cursor = svgEl("line", { y1: m.top, y2: m.top + plotH, stroke: "#2f403b", "stroke-width": 1, opacity: 0 });
    svg.appendChild(cursor);
    overlay.addEventListener("mousemove", (ev) => {
      const rect = svg.getBoundingClientRect();
      const px = ((ev.clientX - rect.left) / rect.width) * W;
      const t = t0 + ((px - m.left) / plotW) * (t1 - t0);
      let best = null;
      let bestDist = Infinity;
      visible.forEach((r) => {
        const dt = Math.abs(parseDate(r.week).getTime() - t);
        if (dt < bestDist) {
          bestDist = dt;
          best = r;
        }
      });
      if (!best) return;
      const bx = x(parseDate(best.week).getTime());
      cursor.setAttribute("x1", bx);
      cursor.setAttribute("x2", bx);
      cursor.setAttribute("opacity", 0.35);
      const rates = best.meets_min_posts
        ? `Positive ${best.positive_rate.toFixed(1)}% · Negative ${best.negative_rate.toFixed(1)}%`
        : "Below 10-post threshold — rates hidden";
      showTip(
        `<div class="tip-title">Week of ${esc(best.week)}</div><div>${rates}</div><div class="tip-sub">${fmtInt(best.n_posts)} posts</div>`,
        ev.clientX,
        ev.clientY,
      );
    });
    overlay.addEventListener("mouseleave", () => {
      cursor.setAttribute("opacity", 0);
      hideTip();
    });
    svg.appendChild(overlay);

    container.appendChild(svg);
  }

  function buildDeltaChips(container, rel) {
    const chips = el("div", "delta-readout");
    chips.innerHTML = `
      <div class="delta-chip ${rel.positive_delta_pp >= 0 ? "pos" : "neg"}">
        <div class="chip-label">Δ Positive</div>
        <div class="chip-value">${fmtPP(rel.positive_delta_pp)}</div>
        <div class="chip-sub">${rel.positive_pre_pct.toFixed(1)}% → ${rel.positive_post_pct.toFixed(1)}%</div>
      </div>
      <div class="delta-chip ${rel.negative_delta_pp <= 0 ? "pos" : "neg"}">
        <div class="chip-label">Δ Negative</div>
        <div class="chip-value">${fmtPP(rel.negative_delta_pp)}</div>
        <div class="chip-sub">${rel.negative_pre_pct.toFixed(1)}% → ${rel.negative_post_pct.toFixed(1)}%</div>
      </div>
      <div class="delta-chip vol">
        <div class="chip-label">Posts pre → post</div>
        <div class="chip-value">${fmtK(rel.n_pre)} → ${fmtK(rel.n_post)}</div>
        <div class="chip-sub">±${rel.window_days}-day window</div>
      </div>`;
    container.appendChild(chips);
  }

  function buildConceptView(container, rows, chapter) {
    const rising = rows.filter((r) => r.direction === "rising").sort((a, b) => b.delta_pp - a.delta_pp).slice(0, 5);
    const falling = rows.filter((r) => r.direction === "falling").sort((a, b) => a.delta_pp - b.delta_pp).slice(0, 5);
    const all = [...rising, ...falling];
    if (!all.length) {
      container.appendChild(el("p", "", "No concept delta data for this release."));
      return;
    }
    const maxAbs = Math.max(...all.map((r) => Math.abs(r.delta_pp)), 1);

    const pin = el("div", "concept-prompt-pin", "Click a concept to see its scoring question.");
    const list = el("div", "");

    const norm = (s) => s.replace(/[‑–]/g, "-").toLowerCase();
    const highlightSet = new Set((chapter.highlight || []).map(norm));

    all.forEach((r) => {
      const row = el("div", "story-concept-row");
      if (highlightSet.has(norm(r.concept))) row.classList.add("highlighted");
      const half = 50;
      const pct = (Math.abs(r.delta_pp) / maxAbs) * half;
      const rising_ = r.delta_pp > 0;
      const barStyle = rising_
        ? `left:50%;width:${pct}%;background:${RISE_C};`
        : `left:${half - pct}%;width:${pct}%;background:${FALL_C};`;
      const tag = r.is_emerging ? " ✦" : r.is_going_away ? " ✧" : "";
      row.innerHTML = `
        <span class="story-concept-name">${esc(r.concept)}${tag}</span>
        <span class="story-concept-track"><span class="zero-line"></span><span class="story-concept-bar" style="${barStyle}"></span></span>
        <span class="story-concept-value ${rising_ ? "rising" : "falling"}">${fmtPP(r.delta_pp)}</span>`;
      row.addEventListener("mousemove", (ev) => {
        const emerging = r.is_emerging ? " · emerging (≈0 before release)" : r.is_going_away ? " · going away" : "";
        showTip(
          `<div class="tip-title">${esc(r.concept)}</div>
           <div>${r.pre_cov_pct.toFixed(1)}% → ${r.post_cov_pct.toFixed(1)}% of posts (${fmtPP(r.delta_pp)})${emerging}</div>
           <div class="tip-sub">${fmtInt(r.n_concept_post)} posts mention it after release</div>`,
          ev.clientX,
          ev.clientY,
        );
      });
      row.addEventListener("mouseleave", hideTip);
      row.addEventListener("click", () => {
        pin.innerHTML = `<strong>${esc(r.concept)}</strong> — scoring question: “${esc(r.prompt)}”`;
      });
      list.appendChild(row);
    });

    const note = el(
      "p",
      "",
      `<span style="color:${RISE_C};font-weight:700">■ rising</span> &nbsp; <span style="color:${FALL_C};font-weight:700">■ falling</span> &nbsp; <span style="color:#7d8f88">✦ emerging from ≈0 · highlighted = discussed in the story</span>`,
    );
    note.style.cssText = "font-size:12px;margin:4px 0 8px;";
    container.appendChild(note);
    container.appendChild(list);
    container.appendChild(pin);
  }

  /* ── chapter assembly ────────────────────────────────────────────────── */
  function buildChapter(chapter, data) {
    const weeks = data.sent.rows
      .filter((r) => r.provider === chapter.provider)
      .sort((a, b) => (a.week < b.week ? -1 : 1));
    const providerReleases = data.releases.rows.filter((r) => r.provider_key === chapter.provider);
    const rel = data.releases.rows.find((r) => r.model === chapter.model);
    const conceptRows = data.concepts.rows.filter((r) => r.model === chapter.model);
    if (!rel || !weeks.length) return null;

    const relTime = parseDate(rel.release_date).getTime();
    const winMs = rel.window_days * 86400000;

    const section = el("section", "story-chapter");
    section.id = chapter.id;

    /* steps column */
    const stepsCol = el("div", "chapter-steps");
    chapter.steps.forEach((step, i) => {
      const stepEl = el("article", "story-step");
      stepEl.dataset.view = String(i);
      stepEl.innerHTML = `
        ${i === 0 ? `<p class="chapter-kicker">${esc(chapter.kicker)}</p>` : ""}
        <h3>${i === 0 ? esc(chapter.title) : esc(step.h)}</h3>
        ${i === 0 ? `<h4 style="margin:2px 0 8px;color:#5b6d66;font-size:15px;">${esc(step.h)}</h4>` : ""}
        <p>${step.p}</p>
        ${step.stat ? `<span class="step-stat">${esc(step.stat)}</span>` : ""}`;
      stepsCol.appendChild(stepEl);
    });

    /* sticky stage */
    const sticky = el("div", "chapter-sticky");
    const card = el("div", "chapter-viz-card");
    const head = el("div", "chapter-viz-head");
    head.innerHTML = `<h4>${esc(chapter.model)} · released ${esc(rel.release_date)}</h4><span class="viz-note" data-role="stage-note"></span>`;
    card.appendChild(head);
    const stage = el("div", "chapter-stage");

    const viewNotes = ["Full provider timeline", `±${rel.window_days}-day release window`, "Top rising and falling concepts"];

    /* view 0: full timeline */
    const v0 = el("div", "stage-view visible");
    buildSentimentChart(v0, weeks, providerReleases, chapter, { width: 760, height: 320 });
    stage.appendChild(v0);

    /* view 1: zoomed window + chips */
    const v1 = el("div", "stage-view");
    buildSentimentChart(v1, weeks, providerReleases, chapter, {
      width: 760,
      height: 270,
      t0: relTime - winMs * 1.6,
      t1: relTime + winMs * 1.6,
      shadeWindow: true,
      releaseTime: relTime,
      windowDays: rel.window_days,
    });
    buildDeltaChips(v1, rel);
    stage.appendChild(v1);

    /* view 2: concepts */
    const v2 = el("div", "stage-view");
    buildConceptView(v2, conceptRows, chapter);
    stage.appendChild(v2);

    card.appendChild(stage);
    sticky.appendChild(card);

    section.appendChild(stepsCol);
    section.appendChild(sticky);

    /* step activation */
    const views = [v0, v1, v2];
    const noteEl = head.querySelector('[data-role="stage-note"]');
    noteEl.textContent = viewNotes[0];
    const steps = [...stepsCol.children];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.dataset.view);
          steps.forEach((s, i) => s.classList.toggle("active", i === idx));
          views.forEach((v, i) => v.classList.toggle("visible", i === idx));
          noteEl.textContent = viewNotes[idx] || "";
        });
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    steps.forEach((s) => io.observe(s));
    if (steps[0]) steps[0].classList.add("active");

    return section;
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  async function boot() {
    const mount = document.getElementById("story-chapters");
    if (!mount) return;
    try {
      const [paper, sent, releases, concepts] = await Promise.all(
        [FILES.paper, FILES.sent, FILES.releases, FILES.concepts].map((p) => fetch(p).then((r) => r.json())),
      );
      const data = { paper, sent, releases, concepts };

      const metricsHost = document.getElementById("story-intro-metrics");
      if (metricsHost && paper.headline_metrics) {
        const wanted = ["Reddit posts", "Model-mentioned posts", "Canonical concepts"];
        const parts = paper.headline_metrics
          .filter((mtr) => wanted.includes(mtr.label))
          .map((mtr) => `<strong>${esc(mtr.display)}</strong> ${esc(mtr.label.toLowerCase())}`);
        parts.push("<strong>35</strong> release windows");
        metricsHost.innerHTML = parts.join(" · ");
      }

      CHAPTERS.forEach((chapter) => {
        const node = buildChapter(chapter, data);
        if (node) mount.appendChild(node);
      });
    } catch (error) {
      mount.innerHTML = `<p style="text-align:center;color:#c94835;">Story failed to load: ${esc(error.message)}</p>`;
      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

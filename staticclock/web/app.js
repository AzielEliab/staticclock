(function () {
  var geo = document.getElementById("geo");
  var anchor = document.getElementById("anchor");
  var go = document.getElementById("go");
  var fields = {
    geo: document.getElementById("out-geo"),
    time: document.getElementById("out-time"),
    date: document.getElementById("out-date"),
    lang: document.getElementById("out-lang"),
    dialect: document.getElementById("out-dialect")
  };
  var lastExport = null;

  function fill(el, value) {
    el.textContent = value || "—";
    if (value) el.classList.remove("empty");
    else el.classList.add("empty");
  }

  function showError(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = text;
  }

  function clearAdvisory() {
    fill(fields.geo, "");
    fill(fields.time, "");
    fill(fields.date, "");
    fill(fields.lang, "");
    fill(fields.dialect, "");
  }

  function statusText(clicks, verify) {
    var n = clicks.length;
    if (!n) return "No actions yet";
    var word = n === 1 ? "action" : "actions";
    if (verify && verify.ok === true) return n + " " + word + ". Chain checks out.";
    if (verify && verify.ok === false) return n + " " + word + ". This timeline does not check out.";
    return n + " " + word + ".";
  }

  function renderTimeline(payload) {
    var clicks = (payload && payload.clicks) || [];
    var verify = (payload && payload.verify) || {};
    var count = document.getElementById("click-count");
    var note = document.getElementById("verify-note");
    var empty = document.getElementById("empty-note");
    var list = document.getElementById("ticks");
    var word = clicks.length === 1 ? "action" : "actions";
    count.textContent = clicks.length + " " + word;
    note.textContent = statusText(clicks, verify);
    empty.hidden = clicks.length > 0;
    var slate = (payload && payload.timeslate) || null;
    var slateEl = document.getElementById("timeslate-note");
    if (slateEl) {
      slateEl.textContent = slate && slate.cross_hash
        ? "Timeslate " + slate.cross_hash
        : "Timeslate appears after the first action.";
    }
    list.textContent = "";
    clicks.forEach(function (tick) {
      var li = document.createElement("li");
      var act = document.createElement("span");
      act.className = "act";
      act.textContent = (tick.click || "") + "  " + (tick.action || "");
      var meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = (tick.source || "local") + " · " + (tick.second || "");
      var code = document.createElement("code");
      code.textContent = tick.hash || "";
      li.appendChild(act);
      li.appendChild(meta);
      li.appendChild(code);
      list.appendChild(li);
    });
    lastExport = {
      product: "staticclock",
      author: "Aziel Eliab",
      clicks: clicks,
      verify: verify,
      timeslate: slate
    };
  }

  function refreshTimeline() {
    return fetch("/api/timeline").then(function (r) { return r.json(); }).then(renderTimeline);
  }

  function readBody(response) {
    return response.json().then(function (body) {
      return { ok: response.ok, body: body };
    });
  }

  fetch("/api/anchors").then(function (r) { return r.json(); }).then(function (names) {
    names.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      anchor.appendChild(opt);
    });
  }).catch(function () {
    showError("advise-error", "Could not load countries. The timeline can still record an action.");
  });

  fetch("/api/zones").then(function (r) { return r.json(); }).then(function (rows) {
    var list = document.getElementById("zones-list");
    list.textContent = "";
    rows.forEach(function (row) {
      var li = document.createElement("li");
      var name = document.createElement("strong");
      name.textContent = row.region || "";
      var zone = document.createElement("span");
      zone.textContent = row.iana || "";
      var when = document.createElement("span");
      when.textContent = (row.local_date || "") + " " + (row.local_time || "") + "  UTC" + (row.utc_offset || "");
      li.appendChild(name);
      li.appendChild(zone);
      li.appendChild(when);
      list.appendChild(li);
    });
  }).catch(function () {});

  refreshTimeline().catch(function () {
    showError("form-error", "Could not reach StaticClock on this computer. Try: staticclock ui");
  });

  document.getElementById("help-btn").addEventListener("click", function () {
    var about = document.getElementById("about");
    about.open = true;
    about.scrollIntoView({ block: "nearest" });
    var summary = about.querySelector("summary");
    if (summary) summary.focus();
  });

  document.getElementById("click-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var action = (document.getElementById("action").value || "").trim();
    if (!action) {
      showError("form-error", 'Type an action first. Example: opened the ledger');
      document.getElementById("action").focus();
      return;
    }
    var btn = document.getElementById("go-click");
    btn.disabled = true;
    showError("form-error", "");
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, source: "local" })
    }).then(readBody).then(function (res) {
      if (!res.ok || res.body.error) {
        showError("form-error", (res.body && res.body.error) || "Could not record that action. Try a short action, then Record action.");
        return;
      }
      document.getElementById("action").value = "";
      renderTimeline(res.body);
    }).catch(function () {
      showError("form-error", "Could not reach StaticClock on this computer. Try: staticclock ui");
    }).finally(function () { btn.disabled = false; });
  });

  document.getElementById("hook-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var action = (document.getElementById("hook-action").value || "").trim();
    var session = (document.getElementById("hook-session").value || "").trim();
    if (!action) {
      showError("hook-error", 'Type an action first. Example: invite accepted');
      document.getElementById("hook-action").focus();
      return;
    }
    var btn = document.getElementById("go-hook");
    btn.disabled = true;
    showError("hook-error", "");
    fetch("/api/hook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, session: session })
    }).then(readBody).then(function (res) {
      if (!res.ok || res.body.error) {
        showError("hook-error", (res.body && res.body.error) || "Could not record that AZ-OS action.");
        return;
      }
      document.getElementById("hook-action").value = "";
      renderTimeline(res.body);
    }).catch(function () {
      showError("hook-error", "Could not reach StaticClock on this computer. Try: staticclock ui");
    }).finally(function () { btn.disabled = false; });
  });

  document.getElementById("verify-btn").addEventListener("click", function () {
    var btn = document.getElementById("verify-btn");
    btn.disabled = true;
    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }).then(function () {
      return refreshTimeline();
    }).catch(function () {
      showError("form-error", "Could not check the chain. Try: staticclock doctor");
    }).finally(function () { btn.disabled = false; });
  });

  document.getElementById("advise-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = (geo.value || "").trim();
    var picked = (anchor.value || "").trim();
    var query = text || picked;
    if (!query) {
      showError("advise-error", "Enter a place first. Example: Indiana");
      geo.focus();
      return;
    }
    go.disabled = true;
    showError("advise-error", "");
    fetch("/api/advise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geo: query })
    }).then(readBody).then(function (res) {
      var adv = res.body || {};
      if (!res.ok || adv.error) {
        showError("advise-error", adv.error || "Could not prepare that advisory.");
        clearAdvisory();
        return;
      }
      fill(fields.geo, adv.geo_location_chosen);
      fill(fields.time, adv.optimal_time);
      fill(fields.date, adv.optimal_date);
      fill(fields.lang, adv.primary_language);
      fill(fields.dialect, adv.dialect_section);
      return refreshTimeline();
    }).catch(function () {
      clearAdvisory();
      showError("advise-error", "Could not reach StaticClock on this computer. Try: staticclock ui");
    }).finally(function () {
      go.disabled = false;
    });
  });

  function downloadJson(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.getElementById("import-json").addEventListener("change", function (ev) {
    var input = ev.target;
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(String(reader.result || "{}"));
        var g = obj.geo || obj.geo_location_chosen || "";
        if (g && g !== "—") document.getElementById("geo").value = g;
        if (obj.geo_location_chosen) fill(fields.geo, obj.geo_location_chosen);
        if (obj.optimal_time) fill(fields.time, obj.optimal_time);
        if (obj.optimal_date) fill(fields.date, obj.optimal_date);
        if (obj.primary_language) fill(fields.lang, obj.primary_language);
        if (obj.dialect_section) fill(fields.dialect, obj.dialect_section);
        if (obj.action) document.getElementById("action").value = obj.action;
        if (Array.isArray(obj.clicks)) renderTimeline(obj);
        lastExport = obj;
        var note = document.getElementById("file-note");
        note.textContent = "Loaded " + file.name + " on this page. Record action still writes the timeline.";
      } catch (e) {
        showError("form-error", "That file is not JSON. Choose a .json file and try Import JSON again.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("export-json").addEventListener("click", function () {
    var payload = lastExport || {
      product: "staticclock",
      author: "Aziel Eliab",
      geo: (document.getElementById("geo").value || ""),
      geo_location_chosen: document.getElementById("out-geo").textContent,
      optimal_time: document.getElementById("out-time").textContent,
      optimal_date: document.getElementById("out-date").textContent,
      primary_language: document.getElementById("out-lang").textContent,
      dialect_section: document.getElementById("out-dialect").textContent
    };
    downloadJson("staticclock-timeline.json", payload);
  });
})();

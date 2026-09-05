(function () {
  var STORAGE = "staticclock.clicks";
  var clicks = [];
  var lastTimeslate = null;
  var lastExport = null;

  var fields = {
    geo: document.getElementById("out-geo"),
    time: document.getElementById("out-time"),
    date: document.getElementById("out-date"),
    lang: document.getElementById("out-lang"),
    dialect: document.getElementById("out-dialect")
  };

  function loadClicks() {
    try {
      var raw = sessionStorage.getItem(STORAGE);
      var parsed = raw ? JSON.parse(raw) : [];
      clicks = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      clicks = [];
    }
  }

  function saveClicks() {
    try { sessionStorage.setItem(STORAGE, JSON.stringify(clicks)); } catch (e) { /* private mode */ }
  }

  function fill(el, value) {
    if (!el) return;
    el.textContent = value || "—";
    if (value) el.classList.remove("empty");
    else el.classList.add("empty");
  }

  function showLast(op, body) {
    var note = document.getElementById("last-op");
    var pre = document.getElementById("last-json");
    if (note) note.textContent = op;
    if (pre) {
      pre.hidden = false;
      pre.textContent = JSON.stringify(body, null, 2);
    }
  }

  function showError(op, err) {
    showLast(op + " failed", { error: String(err && err.message ? err.message : err) });
  }

  function api(path, body) {
    var opts = {
      headers: { Accept: "application/json" }
    };
    if (body !== undefined) {
      opts.method = "POST";
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(path, opts).then(function (r) {
      return r.json().then(function (json) {
        if (!r.ok) {
          var msg = (json && (json.error || json.message)) || ("HTTP " + r.status);
          throw new Error(msg);
        }
        return json;
      });
    });
  }

  function renderTimeline(payload) {
    if (payload && Array.isArray(payload.clicks)) clicks = payload.clicks;
    var verify = (payload && payload.verify) || {};
    var count = document.getElementById("click-count");
    var note = document.getElementById("verify-note");
    var list = document.getElementById("ticks");
    var slate = (payload && payload.timeslate) || lastTimeslate;
    if (payload && payload.timeslate) lastTimeslate = payload.timeslate;
    if (count) count.innerHTML = String(clicks.length) + "<span>clicks</span>";
    var slateEl = document.getElementById("timeslate-note");
    if (!clicks.length) {
      if (note) note.textContent = "empty gear";
      if (slateEl) slateEl.textContent = "timeslate: —";
    } else if (verify.ok === false) {
      if (note) note.textContent = "broken gear";
    } else if (verify.ok) {
      if (note) note.textContent = "verified · last " + String(verify.last_hash || "").slice(0, 12);
    } else if (note) {
      note.textContent = clicks.length + " click" + (clicks.length === 1 ? "" : "s") + " in this browser";
    }
    if (slateEl && slate && slate.cross_hash) {
      slateEl.textContent = "timeslate " + String(slate.cross_hash).slice(0, 16) + " · TemporalLock lattice";
    }
    if (list) {
      list.textContent = "";
      clicks.forEach(function (tick) {
        var li = document.createElement("li");
        var tooth = document.createElement("span");
        tooth.className = "tooth";
        tooth.textContent = String(tick.click || "");
        var second = document.createElement("span");
        second.className = "second";
        second.textContent = tick.second || "";
        var src = document.createElement("span");
        src.className = "src";
        src.textContent = tick.source || "";
        var act = document.createElement("span");
        act.className = "act";
        act.textContent = tick.action || "";
        var hash = document.createElement("code");
        hash.textContent = String(tick.hash || "").slice(0, 16);
        li.appendChild(tooth);
        li.appendChild(second);
        li.appendChild(src);
        li.appendChild(act);
        li.appendChild(hash);
        list.appendChild(li);
      });
    }
    lastExport = {
      product: "staticclock",
      author: "Aziel Eliab",
      clicks: clicks,
      verify: verify,
      timeslate: lastTimeslate
    };
    saveClicks();
  }

  function setBusy(btn, busy) {
    if (btn) btn.disabled = !!busy;
  }

  function copyInstall() {
    var cmd = "curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash";
    var btn = document.getElementById("install-btn");
    var pre = document.getElementById("install-cmd");
    if (!btn) return;
    function done(ok) {
      btn.textContent = ok
        ? "Copied! Paste in Terminal, then run staticclock ui"
        : "Select the command, copy it, then run staticclock ui";
      btn.classList.add("copied");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd).then(function () { done(true); }).catch(function () { done(false); });
    } else {
      done(false);
      if (pre && window.getSelection) {
        var r = document.createRange();
        r.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }

  function refreshHealth() {
    var pill = document.getElementById("health-pill");
    return api("/v1/health").then(function (body) {
      if (pill) {
        pill.textContent = body.ok ? "API live · " + (body.version || "0.2.0") : "API not ok";
        pill.classList.toggle("ok", !!body.ok);
        pill.classList.toggle("bad", !body.ok);
      }
      return body;
    }).catch(function (err) {
      if (pill) {
        pill.textContent = "API unreachable";
        pill.classList.add("bad");
      }
      throw err;
    });
  }

  function loadAnchors() {
    var select = document.getElementById("anchor");
    if (!select) return;
    api("/v1/anchors").then(function (body) {
      var names = (body && body.anchors) || [];
      names.forEach(function (row) {
        var name = typeof row === "string" ? row : row.name;
        if (!name) return;
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    }).catch(function () { /* dropdown stays empty; free-text geo still works */ });
  }

  document.getElementById("install-btn").addEventListener("click", copyInstall);

  document.getElementById("click-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var action = (document.getElementById("action").value || "").trim();
    if (!action) {
      showLast("Click needs an action", { error: "action is required" });
      return;
    }
    var btn = document.getElementById("go-click");
    setBusy(btn, true);
    api("/v1/click", { action: action, source: "local", clicks: clicks })
      .then(function (body) {
        document.getElementById("action").value = "";
        renderTimeline(body);
        showLast("POST /v1/click", body);
      })
      .catch(function (err) { showError("POST /v1/click", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("hook-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var action = (document.getElementById("hook-action").value || "").trim();
    var session = (document.getElementById("hook-session").value || "").trim();
    if (!action) {
      showLast("AZ-OS hook needs an action", { error: "action is required" });
      return;
    }
    var btn = document.getElementById("go-hook");
    setBusy(btn, true);
    api("/v1/hook", { action: action, session: session, clicks: clicks })
      .then(function (body) {
        document.getElementById("hook-action").value = "";
        renderTimeline(body);
        showLast("POST /v1/hook", body);
      })
      .catch(function (err) { showError("POST /v1/hook", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("verify-btn").addEventListener("click", function () {
    var btn = document.getElementById("verify-btn");
    setBusy(btn, true);
    api("/v1/verify", { clicks: clicks })
      .then(function (body) {
        renderTimeline({ clicks: clicks, verify: body, timeslate: lastTimeslate });
        showLast("POST /v1/verify", body);
      })
      .catch(function (err) { showError("POST /v1/verify", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("timeslate-btn").addEventListener("click", function () {
    var btn = document.getElementById("timeslate-btn");
    setBusy(btn, true);
    api("/v1/timeslate", { clicks: clicks })
      .then(function (body) {
        if (body && body.cross_hash) lastTimeslate = body;
        renderTimeline({ clicks: clicks, timeslate: lastTimeslate });
        showLast("POST /v1/timeslate", body);
      })
      .catch(function (err) { showError("POST /v1/timeslate", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("example-btn").addEventListener("click", function () {
    var btn = document.getElementById("example-btn");
    setBusy(btn, true);
    api("/v1/example")
      .then(function (body) {
        renderTimeline(body);
        showLast("GET /v1/example — sample genesis loaded in this browser only", body);
      })
      .catch(function (err) { showError("GET /v1/example", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("health-btn").addEventListener("click", function () {
    var btn = document.getElementById("health-btn");
    setBusy(btn, true);
    refreshHealth()
      .then(function (body) { showLast("GET /v1/health", body); })
      .catch(function (err) { showError("GET /v1/health", err); })
      .finally(function () { setBusy(btn, false); });
  });

  document.getElementById("advise-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = (document.getElementById("geo").value || "").trim();
    var picked = (document.getElementById("anchor").value || "").trim();
    var query = text || picked;
    if (!query) {
      showLast("Advise needs a geo or anchor", { error: "geo is required" });
      return;
    }
    var btn = document.getElementById("go");
    setBusy(btn, true);
    api("/v1/advisory", { geo: query })
      .then(function (adv) {
        fill(fields.geo, adv.geo_location_chosen);
        fill(fields.time, adv.optimal_time);
        fill(fields.date, adv.optimal_date);
        fill(fields.lang, adv.primary_language);
        fill(fields.dialect, adv.dialect_section);
        showLast("POST /v1/advisory — companion only; hosted does not click the gear", adv);
      })
      .catch(function (err) {
        fill(fields.geo, "");
        fill(fields.time, "");
        fill(fields.date, "");
        fill(fields.lang, "");
        fill(fields.dialect, "");
        showError("POST /v1/advisory", err);
      })
      .finally(function () { setBusy(btn, false); });
  });

  function downloadJson(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.getElementById("import-json").addEventListener("change", function () {
    var el = document.getElementById("import-json");
    var f = el.files && el.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(String(reader.result || "{}"));
        if (obj.geo || obj.geo_location_chosen) {
          document.getElementById("geo").value = obj.geo || obj.geo_location_chosen || "";
        }
        if (obj.geo_location_chosen) fill(fields.geo, obj.geo_location_chosen);
        if (obj.optimal_time) fill(fields.time, obj.optimal_time);
        if (obj.optimal_date) fill(fields.date, obj.optimal_date);
        if (obj.primary_language) fill(fields.lang, obj.primary_language);
        if (obj.dialect_section) fill(fields.dialect, obj.dialect_section);
        if (obj.action) document.getElementById("action").value = obj.action;
        if (Array.isArray(obj.clicks)) {
          lastTimeslate = obj.timeslate || null;
          renderTimeline(obj);
        }
        lastExport = obj;
        showLast("Imported JSON in this browser", obj);
      } catch (e) {
        showError("Import JSON", e);
      }
    };
    reader.readAsText(f);
  });

  document.getElementById("export-json").addEventListener("click", function () {
    var payload = lastExport || {
      product: "staticclock",
      author: "Aziel Eliab",
      clicks: clicks,
      geo: (document.getElementById("geo").value || ""),
      geo_location_chosen: document.getElementById("out-geo").textContent,
      optimal_time: document.getElementById("out-time").textContent,
      optimal_date: document.getElementById("out-date").textContent,
      primary_language: document.getElementById("out-lang").textContent,
      dialect_section: document.getElementById("out-dialect").textContent
    };
    downloadJson("staticclock-timeline.json", payload);
    showLast("Exported staticclock-timeline.json", payload);
  });

  loadClicks();
  renderTimeline({ clicks: clicks });
  loadAnchors();
  refreshHealth().catch(function () { /* pill already marked */ });
})();

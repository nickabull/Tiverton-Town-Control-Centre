(() => {
  const zone = "Europe/London";
  const collector = "https://tivvy-live-collector.nickabull.workers.dev";
  const registry = "https://nickabull.github.io/Tiverton-Town-Get-Player-Info/match-centre-fixtures-2026-27.json";
  const dateFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
  });
  const offsetFormat = new Intl.DateTimeFormat("en-GB", {timeZone: zone, timeZoneName: "longOffset"});
  const saved = "tivvy-live-fixture-registry-v1";
  const historical = {
    "2026-11-11": ["Paulton Rovers", "Tiverton Town", "19:30"],
    "2026-11-14": ["Tiverton Town", "Bishops Cleeve", "15:00"],
    "2026-11-21": ["Melksham Town", "Tiverton Town", "15:00"],
    "2026-11-23": ["Swindon Supermarine", "Tiverton Town", "19:45"]
  };

  function londonDate(now = new Date()) {
    const parts = Object.fromEntries(dateFormat.formatToParts(now).map(({type, value}) => [type, value]));
    return parts.year + "-" + parts.month + "-" + parts.day;
  }

  function kickoffTime(date, kickoff) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(kickoff)) return NaN;
    const local = date + "T" + kickoff + ":00";
    const offset = offsetFormat.formatToParts(new Date(local + "Z")).find(part => part.type === "timeZoneName").value;
    return Date.parse(local + (offset.slice(3) || "Z"));
  }

  function matchDateLabel(date) {
    return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
      timeZone: zone, weekday: "long", day: "numeric", month: "long"
    });
  }

  function configFromFixture(row) {
    const home = row.homeAway === "H";
    return {
      id: row.id, date: row.date, home: home ? "Tiverton Town" : row.opposition,
      away: home ? row.opposition : "Tiverton Town", kickoff: row.kickOff || "",
      competition: row.competition === "SLD1S" ? "Southern League D1 South" : (row.competition || "")
    };
  }

  function chooseMatch(rows, requested, today) {
    if (requested) {
      const row = rows.find(f => f.date === requested && !/postponed|cancelled|rearranged/i.test(f.result || ""));
      if (row) return configFromFixture(row);
      const prior = historical[requested];
      return prior ? {date: requested, home: prior[0], away: prior[1], kickoff: prior[2],
        competition: "Southern League D1 South"} : {date: requested};
    }
    const row = rows.filter(f => f.date >= today && f.competition !== "PSF" &&
        !/postponed|cancelled|abandoned|rearranged/i.test(f.result || "") &&
        (f.date === today || !String(f.result || "").trim()))
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.kickOff).localeCompare(String(b.kickOff)))[0];
    return row ? configFromFixture(row) : {date: today};
  }

  async function live(date) {
    const response = await fetch(collector + "/live?date=" + encodeURIComponent(date), {
      cache: "no-store", signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw Error("Collector HTTP " + response.status);
    const value = await response.json();
    if (value.matchday?.date !== date || value.matchday?.status !== "ok") throw Error("No official matchday data");
    return value;
  }

  function teamKey(name) {
    return String(name || "").toLowerCase().replace(/\b(fc|afc)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function sameFixture(config, match) {
    return Boolean(match && (!config.home || (teamKey(match.home) === teamKey(config.home) &&
      teamKey(match.away) === teamKey(config.away))));
  }

  async function loadRegistry() {
    try {
      const res = await fetch(registry, {cache: "no-store", signal: AbortSignal.timeout(6500)});
      if (!res.ok) throw Error("Fixture registry HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data.fixtures) || !data.fixtures.length) throw Error("Fixture registry unavailable");
      try { localStorage.setItem(saved, JSON.stringify(data.fixtures)); } catch (_) {}
      return data.fixtures;
    } catch (_) {
      try {
        const rows = JSON.parse(localStorage.getItem(saved));
        return Array.isArray(rows) ? rows : [];
      } catch (_) { return []; }
    }
  }

  async function start() {
    const requested = new URLSearchParams(location.search).get("date");
    const pinned = requested && /^20\d{2}-\d{2}-\d{2}$/.test(requested) &&
      Number.isFinite(Date.parse(requested)) && new Date(requested).toISOString().startsWith(requested) ? requested : null;
    const config = chooseMatch(await loadRegistry(), pinned, londonDate());
    if (!config.home) {
      try {
        const match = (await live(config.date)).matchday.featured;
        if (match) Object.assign(config, {home: match.home, away: match.away, kickoff: match.kickoff});
      } catch (_) {}
    }
    if (!pinned) {
      setInterval(async () => {
        const next = chooseMatch(await loadRegistry(), null, londonDate());
        if (next.home && (next.id !== config.id || next.date !== config.date || next.kickoff !== config.kickoff))
          location.reload();
      }, 60000);
    }
    return config;
  }

  async function midweek(excludeDate) {
    const now = new Date(londonDate() + "T12:00:00Z");
    const dates = Array.from({length: 7}, (_, i) => new Date(now.getTime() + i * 86400000))
      .filter(day => day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
      .map(day => day.toISOString().slice(0, 10)).filter(date => date !== excludeDate);
    const boards = await Promise.allSettled(dates.map(live));
    return {
      complete: boards.every(board => board.status === "fulfilled"),
      fixtures: boards.flatMap(board => board.status === "fulfilled" ?
        [board.value.matchday.featured, ...board.value.matchday.matches].filter(Boolean)
          .map(match => ({date: board.value.matchday.date, match})) : [])
    };
  }

  function refreshPeriod(config, status) {
    const kickoff = kickoffTime(config.date, config.kickoff);
    const sinceKickoff = Date.now() - kickoff;
    if (/full\s*time|postponed|cancelled|abandoned/i.test(status || "")) return 60000;
    return sinceKickoff >= -1800000 && sinceKickoff <= 12600000 ? 20000 : 60000;
  }

  window.TivvyMatchday = {collector, start, matchDateLabel, kickoffTime, live, sameFixture, midweek, refreshPeriod};
})();

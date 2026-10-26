const FEED_BASE = 'https://nickabull.github.io/Tiverton-Town-Get-Player-Info/';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function latestResults(league, cup, today) {
  // Both detail feeds store scores Tiverton-first, including away games.
  // Reuse these verified scores rather than the older mixed-orientation CMS list.
  const matches = [...(league.fixtures || []).map(f => ({...f, competition:'SLD1S'})), ...(cup.fixtures || [])];
  const unique = new Map();
  for (const match of matches) {
    const score = String(match.result || '').trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (!score || !/^\d{4}-\d{2}-\d{2}$/.test(match.date || '') || match.date > today || !['H','A'].includes(match.venue) || !match.opponent) continue;
    const gf = Number(score[1]), ga = Number(score[2]);
    unique.set([match.date, match.opponent.toLowerCase(), match.venue, match.competition].join('|'), {...match, gf, ga, outcome:gf > ga ? 'W' : gf < ga ? 'L' : 'D'});
  }
  return [...unique.values()].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
}

export function resultHTML(match) {
  const away = match.venue === 'A';
  const ours = `<span class="tivvy-goals">${match.gf}</span>`;
  const score = away ? `${match.ga}–${ours}` : `${ours}–${match.ga}`;
  const date = new Date(`${match.date}T12:00:00Z`).toLocaleDateString('en-GB', {day:'numeric',month:'short',timeZone:'Europe/London'});
  const competition = match.competition === 'SLD1S' ? 'League' : /st.?luke/i.test(match.competition) ? "St Luke’s Cup" : match.competition;
  const outcome = {W:'Win', D:'Draw', L:'Loss'}[match.outcome];
  const label = `${date}, ${match.opponent}, ${away ? 'away' : 'home'}: ${outcome}. Tiverton ${match.gf}, ${match.opponent} ${match.ga}. ${competition}`;
  return `<li class="dashboard-result" aria-label="${escapeHTML(label)}"><span class="dashboard-result-badge ${match.outcome === 'L' ? 'loss' : match.outcome === 'D' ? 'draw' : 'win'}" aria-hidden="true">${match.outcome}</span><time class="dashboard-result-date" datetime="${match.date}">${escapeHTML(date)}</time><span class="dashboard-result-opponent">${escapeHTML(match.opponent)}</span><div class="dashboard-result-bottom"><span class="dashboard-result-meta">${away ? 'Away' : 'Home'}<br>${escapeHTML(competition)}</span><span class="dashboard-result-score" aria-hidden="true">${score}</span></div></li>`;
}

async function loadGlance() {
  const target = document.getElementById('dashboard-glance-results');
  if (!target) return;
  try {
    const get = async name => {
      const response = await fetch(FEED_BASE + name, {cache:'no-store'});
      if (!response.ok) throw new Error('Results feed unavailable');
      const data = await response.json();
      if (!Array.isArray(data.fixtures)) throw new Error('Invalid results feed');
      return data;
    };
    const [league, cup] = await Promise.all([get('data.json'), get('cup-match-details-2026-27.json')]);
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const matches = latestResults(league, cup, today);
    target.innerHTML = matches.length ? `<ol class="dashboard-results">${matches.map(resultHTML).join('')}</ol>` : '<p class="muted">No confirmed results available yet.</p>';
  } catch {
    target.innerHTML = '<p class="dashboard-glance-error">Latest results couldn’t load. Reload the dashboard or open the Match Centre.</p>';
  }
}

if (typeof document !== 'undefined') loadGlance();

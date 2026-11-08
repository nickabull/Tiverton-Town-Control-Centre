# Tivvy Design System — source of truth (v1.0)
**Established:** 8 November 2026  
**Status:** Approved design intent; shared stylesheet is opt-in, not yet rolled out across every existing page.  
**Visual references:** Live Men's Match Centre (user-supplied screenshot, 8 November); existing `nickabull/Tiverton-Town-Get-Player-Info/tivvy-hub-preview.html`; Tivvy Live branching timeline.

## Non-negotiable design rules
1. **One recognisable Tivvy identity everywhere.** Gold/black, consistent condensed **Antonio** headings, and readable Arial/Helvetica body text. Do not substitute approximated logos or generated crests. Use known approved assets.
2. **Match events use the EXACT SAME symbols and semantic colours across every tool.** A goal, booking or substitution must mean the same thing in Match Centre, Live, programme pages, player cards and future ideas.
3. **No unapproved visual redesigns.** Reuse the same classes/components. New concepts may add functionality, but do not silently alter event semantics, typography, artwork or colours.
4. **Source identity is different from event identity.** Facebook/X/Southern League badges identify the source; goal/card/sub symbols identify the football incident, including when they appear inside sourced commentary.
5. **Responsive and accessible.** Desktop/mobile layout checks, strong contrast, keyboard focus, no clipping and no mid-word breaks.
6. **Data accuracy first.** Original social posts remain archived, display-only mechanical punctuation may be tidied, no football facts inferred. Preserve reported-minute differences.

## Canonical palette (matching deployed Match Centre where verified)
| Token | Hex | Purpose |
|---|---|---|
| `--tivvy-gold` | `#ffd800` | Club yellow (current Match Centre source) |
| `--tivvy-ink` | `#252323` | Dark Match Centre panel |
| `--tivvy-black` | `#111111` | Black actions / dark surfaces |
| `--tivvy-red` | `#ef3340` | Tivvy emphasis / close controls |
| `--tivvy-on` | `#65e6a2` | Player on, ▲ |
| `--tivvy-off` | `#ff666b` | Player off, ▼ |
| `--tivvy-blue` | `#65baff` | Goal minute / football event |
| `--tivvy-pen` | `#d71f88` | Penalty |
| `--tivvy-yellow-card` | `#ffae42` | Yellow-card emphasis |
| `--tivvy-card-red` | `#e33a7b` | Red-card emphasis |
| `--tivvy-white` | `#ffffff` | Text, alternating table rows |

**Important discovery:** the existing Match Centre source currently uses an **Anton** web-font link and `Impact`/Arial Narrow CSS fallbacks, while the user's approved design intent is **Antonio**. We should standardise toward Antonio deliberately and *visually compare* before modifying the deployed Match Centre. The stylesheet uses Antonio for **new** components now.

## Canonical football event vocabulary
| Event | Render | Behaviour |
|---|---|---|
| Goal | ⚽ blue minute | Accurate scorer and minute; Tivvy goal emphasis as appropriate |
| Penalty | ⚽ PEN pink | Clearly distinguish from normal goal |
| Yellow card | 🟨 (orange/yellow) | Standard yellow-card symbol and minute |
| Red card | 🟥 (pink/red) | Standard red-card symbol and minute |
| Sub on | ▲ green | Player name, minute |
| Sub off | ▼ red | Player name, minute |
| Goalkeeper | 🧤 GK, gold | Especially Louis Smith; not a purple or invented icon |
| Captain | (C), gold | Label directly beside captain |
| Unused substitute | 'unused', muted grey | Never imply the player came on |
| Result | W green, D orange, L red | Fixed meaning |
| Verified match event | official/source badge | Badge never substitutes for match-icon colour |

The glyph above is the approved semantic vocabulary, not permission to draw variant icons. If emoji rendering differs across browser/OS, align their dimensions and colour treatment and use approved asset variants where necessary.

## Matchday-live specifics
- Live = newest first; historical replay may toggle oldest first.
- Yellow trunk/branches link posts about the same incident; small marker/dot colours follow the *football event*.
- Source badges: Southern League (only from actual API response), Football Web Pages, Tiverton Town FC · X and **Tiverton Town FC Fans · Facebook** (credit Darren where appropriate).
- Cross-source contradictory minutes are visible, not silently merged or corrected.
- Never publish an apparent 'live' event from archival-only fixtures.

## Integration standard
Import `tivvy-design-system.css` and wrap the app in `class="tivvy-ui"`. Reuse classes such as:
`tivvy-heading`, `tivvy-goal`, `tivvy-penalty`, `tivvy-card-yellow`, `tivvy-card-red`, `tivvy-on`, `tivvy-off`, `tivvy-gk`, `tivvy-captain`, `tivvy-branch`.

**Rollout:** First use in demos/new components; test visually on desktop/mobile; then migrate existing live pages one at a time with screenshot comparison and GitHub rollback SHA. Do not force global CSS into live apps without approval.

## Pixel Police release gate
- [ ] Exact club crest and opposition crest, no generated substitute
- [ ] Antonio headings and button typography checked
- [ ] Club yellow, dark panels and score alignment match reference
- [ ] All event icons, substitution arrows, GK gloves, (C), penalty and card colours match
- [ ] Branch lines and event-end markers carry the right semantic colour
- [ ] Mobile clipping, wrapping, links, tap targets and keyboard accessibility checked
- [ ] Data source shown; dates/minutes and uncertainty handled honestly
- [ ] Changelog updated; code deployed vs visually tested clearly distinguished

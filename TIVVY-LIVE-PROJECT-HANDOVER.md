# Tivvy Live handover

**Start here when resuming in a new chat.** This is the current status and restart point. The [detailed project history](live/PROJECT-HANDOVER.md) and the [original snapshot](https://github.com/nickabull/Tiverton-Town-Control-Centre/blob/a24b41065d21f11ab86b637013db23b8400bf6b7/TIVVY-LIVE-PROJECT-HANDOVER.md) preserve earlier decisions and evidence. The root `PROJECT-HANDOVER.md` covers the separate programme designer.

**Checkpoint · 25 November 2026, UK**

## Confirmed in production

- **Next fixture:** Hartpury FC v Tiverton Town, Saturday 28 November, 15:00. Cloudflare returned the official league fixture, ID `6a5a1cc3ce9ef452b61f4533`. [Southern League](https://slc-www.southern-football-league.co.uk/match/6a5a1cc3ce9ef452b61f4533)
- Both date-free GitHub Pages displays now select Hartpury from the published Match Centre fixture list. The standard display showed ten other D1 South fixtures for Saturday and the current midweek Willand Rovers–Portland United match. D1 Central also showed its midweek entry. A pinned Swindon link still showed the 1–0 result and the attributed X and Facebook commentary. The TV document matched its 1,280 × 720 viewport with no page overflow. The LG television remains untested. [TV ticker](https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-tv.html) · [As It Happens](https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-saturday-test.html)
- Cloudflare serves `2026.11.25-alarm20`. The release smoke test passed. A local regression test covered the first alarm on a fresh fixture, a concurrent browser read and the 20-second reschedule. Hartpury's actual in-play cadence and unattended start still need matchday observation. [Release run](https://github.com/nickabull/Tiverton-Town-Control-Centre/actions/runs/45723756423) · [Worker health](https://tivvy-live-collector.nickabull.workers.dev/health)
- The public Wix Match Centre showed Hartpury next and Swindon 1–0 Tiverton as the latest result, with the Swindon team sheet and official match notes. The actual iframe uses `Tiverton-Town-Get-Player-Info/tivvy-hub-preview.html#fixtures`. The Hartpury guide was verified on that direct URL after commit `9b973ea`, while Wix still served an earlier iframe copy and displayed the placeholder at last check. The separate Wix live-alerts test page requires its password. [Wix Match Centre](https://www.tivertontownfc.uk/match-centre)

## Resume from here

1. Recheck the public Wix iframe and the Hartpury guide. Only report the guide fixed once the Wix page itself renders it.
2. Repair the scheduled Southern League tab snapshot, which still returned HTTP 400 on 25 November. The published pages already read the working Worker directly.
3. Verify Football Web Pages credentials and real match coverage. The Worker reports `not-configured`. The public FWP site confirmed Hartpury's fixture but listed neither line-up before kickoff. ESPN coverage has yet to be established. The Swindon log contains historical official X posts, including full time. It also records the league correcting Rugman's goal from 60′ to 59′. Keep the audit trail and avoid a duplicated displayed goal.
4. Preserve dated archives and check automatic publication to the Match Centre at the next full time. Confirm Hartpury starting XIs, score, incident timing, X updates and 20-second collection in the actual match. Exercise the next rollover after Hartpury. Cup coverage, postponed fixtures and season rollover need separate verification.

## Restart rule

Read this file, confirm the requested scope, then resume at the first open item. After a proven change, record the commit, test and remaining limitation here before moving on. Keep dated replay URLs and existing archives. Use the detailed history only when an open item needs it. Never publish keys or report a feed as working from source code alone.

# Tiverton Town Control Centre

Central data and programme-production hub for Tiverton Town.

## Source strategy

Current-season football data should prefer the Pitching In Southern League site, with Tivvy Archive kept primarily for history and fallback data.

Initial priority:
1. Pitching In Southern League — fixtures, results, tables, squad/player data and match detail.
2. Tiverton Town official site — reports, previews and club news.
3. Other official club / Southern League news — league round-up material.
4. Tivvy Archive — historical data and fallback.

## First technical probe

`scripts/probe_pitching_in.py` checks both the normal and `slc-www` Southern League hosts and records whether useful current data is present in the returned HTML. This lets us determine which pages can be collected directly and which need browser-style rendering or another data feed.

Run it with the **Probe Pitching In sources** GitHub Action.

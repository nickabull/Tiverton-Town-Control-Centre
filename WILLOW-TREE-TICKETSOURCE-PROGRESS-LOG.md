# Willow Tree TicketSource progress log

[Project brief and restart prompt](WILLOW-TREE-TICKETSOURCE-HANDOVER.md) · [Bull’s Project Hub](https://nickabull.github.io/Tiverton-Town-Control-Centre/project-hub.html)

## 26 November 2026

| Status | Work | Outcome |
| --- | --- | --- |
| Verified | Public booking routes | Willow Tree has a Shows page and a TicketSource shop listing six performances of *The Great British Bake Off Musical* at The New Hall, Tiverton. |
| Verified | Documented integration options | TicketSource provides an official WordPress embed and a documented API for events, performance dates, booking links, and booking records. |
| Recorded | Project setup | Created the project brief, restart prompt and this log. |
| Pending | First API check | Confirm organiser access, set the key server-side, retrieve the six performances and compare aggregate counts against a TicketSource report. |
| Live and verified | WordPress booking block | Nick published the booking section on the [public Shows page](https://willowtreedanceandtheatrearts.com/shows/). The live page serves all six direct TicketSource links, matching the previously verified performance dates and times. |
| Live and verified | Show artwork | The uploaded poster is displayed alongside the booking links in Nick’s screenshot. The public page references the uploaded PNG, which returned a valid image over HTTPS on retry. [Published layout source](WILLOW-TREE-BAKE-OFF-WORDPRESS-WITH-ARTWORK.html). |
| Ready to test | Bake Off to Frozen campaign attribution | [Read-only API probe](willowtree-ticketsource-probe.py) passed mock tests for per-performance booking record counts and exact campaign-label matches. TicketSource documents referral labels in its Sales Report. Whether those labels appear in the API field `user_booked_by` needs a tagged real booking and organiser API access. For Frozen, compare social reach and link clicks with attributed bookings, and use the Sales Report for attribution if the API does not return the labels. |
| Prototype built | Bake Off campaign preview for Frozen | [Open the campaign prototype](https://nickabull.github.io/Tiverton-Town-Control-Centre/willow-tree-bake-off-campaign-pilot.html). It combines a dated public TicketSource snapshot and the six booking links with an opt-in view of fictional reach, clicks and attributed bookings. The campaign data remains unconnected pending organiser and social reporting access. |
| Pending | Dashboard and reporting | The private dashboard and optional summaries are awaiting implementation. |

Reference links are in the [project brief](WILLOW-TREE-TICKETSOURCE-HANDOVER.md).

## 28 November 2026

- Organiser key available. The [local Box Office tool](willowtree-box-office.py) prompts privately for it and writes an aggregate-only report on the operator’s computer. Sample checks covered de-duplication, the last-24-hours calculation and the exclusion of personal fields. The first authenticated run and Sales Report reconciliation are pending.
- [Box Office design preview](https://nickabull.github.io/Tiverton-Town-Control-Centre/willow-tree-box-office-preview.html) uses fictional metrics. A hosted version would use a separate Cloudflare Worker protected by email sign-in, with the key held as a Worker secret. The WordPress page could link to it.

- [Cloudflare Worker source](willowtree-box-office-worker.mjs) is ready for browser-based setup, with an Access identity requirement and a server-side TicketSource secret. Mock checks covered unauthenticated denial, no-store headers, successful aggregate retrieval and omission of identifiers. Cloudflare deployment and the first authenticated TicketSource call are pending.

- Live Cloudflare deployment verified on 28 November. The Worker uses a two-person Cloudflare Access policy and a deployed secret. The first authenticated snapshot displayed all six Bake Off performances after deploying key whitespace handling and safe API diagnostics. The cause of the initial generic error was not isolated. Campaign attribution still needs a known tagged booking and reconciliation. Lucy's sign-in has not yet been tested.

## How to keep this log current

Append an entry under the date after each work session. Record the work completed, verification and evidence, links or commits, open decisions or blockers, and the next action. Use aggregate or sanitised examples in this public log.

# Willow Tree TicketSource integration

**Status:** Discovery · **Started:** 26 November 2026

Help Willow Tree Dance & Theatre Arts CIC make it easier for families to book shows and give the box office a clear view of bookings by performance. The pilot is *The Great British Bake Off Musical* at The New Hall, Tiverton, with six performances from 9 to 13 December 2026.

## First milestone

1. Confirm organiser API access and store the key in the server-side environment. Record setup and results without recording the key or customer details.
2. Read the pilot event and its performance dates, booking links and bookings through the supported API. Match all six performances against the public TicketSource shop.
3. Reconcile aggregate ticket counts for each performance with the organiser’s report at the same point in time. Confirm how refunds, cancellations and complimentary tickets affect the totals.
4. Prototype a private, read-only dashboard with ticket counts per performance, a clear refresh timestamp and a comparison view. Add sales trends once the data and count rules are verified.

## WordPress Shows page

Use the existing Shows page and keep checkout with TicketSource. A shop link or official embed can publish the current listings. A custom performance picker can distinguish matinees and evenings and take visitors straight to the chosen performance. Exact availability labels depend on verifying what TicketSource exposes for seats held back and tickets actually available to buy.

## Later options

Explore a daily sales summary and comparisons across productions after validating the dashboard. The canonical progress log records confirmed work and open decisions.

## Restart prompt

> Resume the Willow Tree Dance & Theatre Arts TicketSource integration. First read the current handover (https://github.com/nickabull/Tiverton-Town-Control-Centre/blob/main/WILLOW-TREE-TICKETSOURCE-HANDOVER.md) and progress log (https://github.com/nickabull/Tiverton-Town-Control-Centre/blob/main/WILLOW-TREE-TICKETSOURCE-PROGRESS-LOG.md), then check what Nick has already tried and continue from the first open milestone. Use The Great British Bake Off Musical at The New Hall, Tiverton, as the pilot. Start with read-only API discovery and a private dashboard comparing the six performances. Reconcile ticket counts with TicketSource’s reports and verify how cancellations, refunds and complimentary tickets affect the figures. Show freshness and aggregate totals. Keep the API key server-side and use sanitised examples. For WordPress, use the existing Shows page and TicketSource checkout. Start with a Book tickets link or the official embed, and explore a branded performance picker if useful. Verify available-to-sell inventory before showing exact public availability. After each work session, append a dated entry with verified results, changes, links, blockers and the next action.

## Reference links

- [Progress log](WILLOW-TREE-TICKETSOURCE-PROGRESS-LOG.md)
- [Willow Tree Shows page](https://willowtreedanceandtheatrearts.com/shows/)
- [Willow Tree TicketSource shop](https://www.ticketsource.com/willow-tree-dance-theatre-arts)
- [TicketSource API guide](https://www.ticketsource.io/getting-started)
- [TicketSource API reference](https://reference.ticketsource.io/)
- [TicketSource WordPress plugin guide](https://help.ticketsource.com/en/article/wordpress-plugin-ldz68r/)

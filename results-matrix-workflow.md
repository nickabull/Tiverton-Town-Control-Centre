# Approved incremental results matrix

Nick approved the native editable matrix in CHATGPT LEAGUE TEMPLATE on 18 October 2026 and requested that future runs update that table rather than replace it.

`data/results-matrix-binding.json` records the stable page/table/subtitle IDs, approved 22-team order and the 125-result baseline. Page 14 is informational; target the stable page ID. The editable table is 23 by 23 cells, with home teams across the top and away teams down the left, matching the Match Centre. Scores are always home-first. The saved binding was verified on 26 October 2026 with all 140 results, and resolves to current page 12 by its stable page ID.

## Connected execution

1. Refresh the verified results feed. Start a Canva editing transaction for the bound design and read the current page and all table cells.
2. Use `results-matrix-update.js` to compare the feed with the current Canva cells. The dashboard request is only a preview against the saved baseline; always recompute using live Canva before writing.
3. Add new results into blank cells using their TABLE richtext element IDs and `replace_text`. Never insert, delete, resize or recreate the table. Never change the title, background, diagonal, bands, grid, key or footer. Never delete a result because a later feed omits it.
4. Preserve manual edits. Flag existing score disagreements for review. Stop on missing previously published results, duplicate fixtures or changed team headings.
5. For each new Tiverton result, preserve Antonio Bold and black text, then colour only Tiverton's goal numeral red (#d71920). The connected editing tool's `format_text` targets the entire cell, so character-only colouring may require the browser editor. In that case double-click the score to open its text editor, select the numeral via Home/Shift+ArrowRight, and apply the existing red swatch. Do not press Enter as an editing test: it can replace the selected score with a newline.
6. Verify every result against the feed, table IDs and geometry against the pre-run snapshot, and check the Tiverton numeral colours. Retain unresolved manual corrections with a warning.
7. Update only the mapped subtitle to `SOUTHERN LEAGUE DIVISION ONE SOUTH RESULTS (UP TO DD/MM/YY)`, using the successful run date in Europe/London, not the last match date. Preview, save and verify.
8. Only after a verified save, advance the binding baseline / run receipt. Prepared requests must never be reported as published.

For an issue copy, bind its new design/page/table/subtitle IDs first. Archived issues are never targets. Nick has authorised development updates to the league template, including the dynamic subtitle; other page shell elements remain protected.

## Current connection boundary

The GitHub Pages dashboard cannot invoke the ChatGPT Canva connector. `Prepare Canva update` fetches the feed and creates a validated request; the connected save currently requires a ChatGPT-assisted run. A standalone Go-to-Canva button is **not implemented**. Do not label request preparation or opening Canva as publication. The initial native-table insertion required browser editing; future cell updates are supported by the Canva connector once the table exists.

## Checks

Run `node --test tests/results-matrix-update.test.cjs`. To plan from a fresh Canva transaction snapshot, run `node scripts/plan_results_matrix_update.cjs feed.json canva-snapshot.json`.

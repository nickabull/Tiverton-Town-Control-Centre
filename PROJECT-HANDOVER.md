# Tivvy Programme Designer — project handover

Last updated: 16 November 2026 (UK)
Repository: `nickabull/Tiverton-Town-Control-Centre`

## READ THIS FIRST — working target and guardrails

**ACTIVE EXPERIMENT:** `tivvy-latest-news-layer-test.html`.
**Current labelled test version:** **V2.7.2**.
**Open:** https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-latest-news-layer-test.html?v=2.7.2

**DO NOT MODIFY `programme-designer-v2.html`**, `programme-studio.html`, the master production templates, or other programme files unless explicitly requested. The Latest News experiment is deliberately isolated. Despite the page's "V2" branding, it is NOT the same file as `programme-designer-v2.html`. When changing chats, inspect the actual file and recent commits before touching code; never infer the target from a generic phrase like "the designer".

## Goal

Develop a visual WYSIWYG layer designer for Tiverton Town programme artwork, testing it against the **Latest News** layout first, before any decision to integrate into wider programme production. Preserve the existing artwork, typography and safe master workflow.

## Latest work (16 November 2026)

- **V2.7.2:** Fixed inconsistent rich-text size interpretation in the Latest News test. Layer font sizes render at 0.84 of design-point values, and selection formatting now follows the same factor rather than creating oversized words. Added two clear toolbar presets (**14pt BODY** and **18pt HEADING**) and a contrasting **CUSTOM · MODIFIED** indication for other sizes. Commit `1a5c29d99e0ff60cfbb25a6fef965ce7ab0b3ec5`. Browser testing is still needed; pre-existing saved oversized spans are not silently rewritten. A user can select their wording and apply the standard size explicitly. Next request: test inserting three article images using existing image buttons, without changing the page template.


- The user requested three independent blue resize handles for selected text boxes:
  - **Bottom centre:** vertical (height only).
  - **Right centre:** horizontal (width only).
  - **Bottom right:** both height and width together (existing behaviour).
- Implemented in the **test page** as labelled **V2.7.1**, GitHub commit `5027f05624cea1a91fa898351328c56a94b3b082`. Zoom and layer scale are accounted for in pointer resizing. **Needs live browser verification**; a commit is not proof the behaviour is correct.
- An earlier chat-continuity error caused these controls to be applied to `programme-designer-v2.html` instead. That mistake was **reverted**; V2's blob was restored to its original hash `31a793a02fa824c4ca4fe8c9766f04d404e32946` in commit `09a22397564214cdaf63d61b22e404473874253e`. Do not repeat this.

## Features and feedback carried over from “Update league matrix”

- The test-page editor uses the actual exported Latest News artwork and layered objects.
- Layer selection, lock/hide, ordering, movement, size and scale controls.
- Inline precision numeric boxes should visually match the corresponding slider widths; user specifically called out values such as "9" and "200".
- Separate editing toolbar above the artwork supports selectively applying bold, underline, strikethrough and alignment *within* text, instead of applying formatting to the whole text box.
- User confirmed they could bold a single word (e.g. “Evander”) and centre only part of the text; preserve this.
- The bold/underline/other active controls should visually turn Tivvy yellow when appropriate to selected text.
- Left, centre, right and justify buttons should have intelligible icons and truthful behaviour; user found left/right icons confusing.
- Layer renaming and duplication were requested. The current test file includes RENAME LAYER and DUPLICATE LAYER controls; duplication names the new layer `Copy of [original name]`. Retest after changes.
- Layer width/height must change box geometry, not unexpectedly alter font sizes or adjacent layers.
- The editor uses browser `localStorage` key `tivvy-v2-actual-artwork-test`; retaining saved user test-state matters. Avoid changes that delete local state without explicit permission.
- The user's wider programme aesthetic uses Antonio, Tivvy gold/black and carefully maintained layouts. Do not redesign the template during functional testing.

## Next steps

1. Ask user to test V2.7.2's three resize handles on the blue selected text box; check that each moves only the intended dimension, and that handles work at varying zoom.
2. If issues appear, change **only** `tivvy-latest-news-layer-test.html`, then supply a new cache-busted version URL.
3. Continue refining text-format active state, alignment controls and matching slider/numeric boxes as feedback requires.
4. Update this handover after every significant edit, including exact filenames, versions, commits, pass/fail findings, and outstanding issues.

## New-chat startup procedure

1. Read this file first.
2. Fetch the GitHub version of `tivvy-latest-news-layer-test.html` and inspect recent commits; treat those as authoritative, not a remembered "V2" version.
3. Confirm the exact target file and version *internally* before making edits.
4. Preserve the isolated experiment and protected templates.
5. Make the requested change, verify what can be verified, identify untested parts honestly, update this document, and provide the precise test URL.

## Notes

This is a working handover, not a claim that every feature has passed browser QA. The earlier chat “Update league matrix” contains additional screenshots and incremental feedback that may need consulting for design detail.

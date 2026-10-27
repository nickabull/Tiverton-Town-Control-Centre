# Pitch inspection notices

Open Match Status in the Programme Centre. Sign in with the existing authorised account, select the fixture, choose no notice / pending / passed / failed, review the website preview, then confirm publication. Pending requires the inspection date and UK local time. No notice removes a notice on publication. Nothing changes on the public site while editing.

The public Match Centre, home summary and match popup read the same service every 30 seconds and when the tab becomes visible. Notices are bound to the fixture ID, date, opponent, home/away, competition and kick-off. A rescheduled fixture must have its notice republished. A played match suppresses the old notice. Pending and failed notices keep their fixture on the next-match card until 24 hours after its scheduled kick-off, rather than immediately switching to another game. The notice remains attached to that match in the popup. Pending never becomes passed automatically.

Shared service: https://tivvy-match-status.lucy-bull-5102.chatgpt.site/api/status
Sites project: appgprj_6ae12de0dcc88191ad31d31ea90a6f8f
Source is in the Sites source repository recorded in that project's hosting manifest. Cloudflare D1 stores fixture notices with optimistic revisions. GET exposes only football notices. Writes require a fresh Firebase ID token verified against the existing authorised Programme Centre UID, plus fixture validation against the public fixture feed. A stale publish cannot overwrite a more recent publish. No Firebase password or service secret is stored in the browser or GitHub.

`match-status-shared.js` is identical in the Programme Centre and player-info repositories. When changing it, update both copies and run `node tests/match-status.test.cjs` in player-info. The player-info Pages workflow explicitly copies this script to its deployment.

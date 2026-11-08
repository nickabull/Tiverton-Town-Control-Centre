# Tivvy Data Centre: versioning and change-log policy
Established 8 November 2026.

## Release records
Every meaningful code or editorial-workflow change should include:
- Application/page and source repository/path
- Date in Europe/London, version when known
- What changed, in plain English
- GitHub commit SHA (when available)
- State: Draft / Deployed / Awaiting user test / Tested / Approved / Superseded / Known limitations
- Explicit known issues, and whether desktop/mobile or data integrity has been tested

**Never conflate a GitHub commit with visual QA or editorial approval.** Do not invent old version numbers.
Each application may have its own version series. Changing the change-log register does not increment all application versions.

## Version rule
- Major: substantial workflow or compatibility changes (v2.0)
- Minor: new user-facing functionality (v1.2 → v1.3)
- Patch: corrections only (v1.2 → v1.2.1), if patch numbering is introduced
- Prototype filenames (e.g. v5) retain their established series.

## Update checklist
1. Change source in the correct repo and commit.
2. Record the commit, date, app, version, user-visible change, and honest testing state in `version-history.html`.
3. If relevant, update the version label in the application itself.
4. Verify expected behaviour on desktop and mobile, then update status after user confirmation.
5. Keep an approved rollback SHA and separate production from prototypes.

This register is curated and currently includes verified recent commits and identifiable application baselines; it is not a historical audit of every prior change.

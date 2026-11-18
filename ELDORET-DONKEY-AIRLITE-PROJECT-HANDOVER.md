# PROJECT-HANDOVER.md — Eldoret / Donkey replacement / Bull's Hits / Airlite

**Handover date:** 17 November 2026  
**Status:** Active design and experimental integration; hardware replacement not yet purchased; Airlite end-to-end test outstanding.  
**Target:** Get Airlite out and establish Mac audio playback/control via Donkey during the week ending Friday 20 November 2026.

> This handover records agreed principles, observed working functions, experiments, and proposals separately. Do not assume planned or prototyped functions are deployed or verified.

## 1. Project vision

Build one coherent, attractive **Eldoret** household control ecosystem, with **Bull's Hits** personal home-studio playout integrated where useful. It should ultimately control lights, TVs, Sky, blinds, network and connected appliances, and offer a tactile radio studio using the Airlite mixer, multiple audio sources, carts, playlists, segue editing and recording.

Priorities: reliability and fast startup; practical physical controls; exceptional 16:9 touchscreen UI with **no scrolling**; expandable integrations; audio must not depend on a flaky remote-control server or public internet connection. This is primarily for home/studio enjoyment, not a near-term broadcast-station deployment.

## 2. Existing installation and known environment

| Component | Known detail | Status / caveat |
|---|---|---|
| Current controller | Chromebook **Donkey**, ChromeOS Linux environment | Hosts Eldoret; not ideal as permanent always-on server |
| Donkey LAN | **10.0.0.27** on **10.0.0.x** home network | Previously reachable from Mac |
| Eldoret API / service | **10.0.0.27:8765**; localhost **127.0.0.1:8765** | Previously responded; live state must be tested |
| Remote access | Tailscale; previously `https://penguin.tail22d29e.ts.net/` via Tailscale Serve | ChromeOS Linux port forwarding sometimes stops after reboot; do not presume currently reachable |
| Router | **DrayTek Vigor 2865** | New host should have DHCP reservation / stable address |
| Hue bridges | **10.0.0.2** and **10.0.0.4** | Existing home automation targets |
| UniFi controller | **https://10.0.0.29:8443** | Previously read via view-only connector; Mac-dependent connection may sleep |
| UniFi | Office and Kitchen APs; about 43 devices previously reported | Exact live count may change |
| Other devices | Sky Q distributed over HDMI/Cat6 to ~5 TVs, LG TVs, Velux blind, Epson printers, PS5 | Individual device integration states vary |
| Kitchen LG | HDMI 1 and volume 16 previously discussed | Do not issue commands without checking active settings |
| Velux blind | 64% previously used as control/test setting | Not a current live reading |
| Dishwasher | Bosch SMV2HTX02G connected to Home Connect on 17 Nov 2026; Siemens dishwasher already in app | **App pairing complete**, dashboard/API integration still future work |

**Security:** Do not include Tailscale auth keys, passwords, API tokens or private credentials in source control or handover. Preserve access through environment secrets/secure local configuration. Minimise exposure of internal network services.

## 3. User experience / safety rules

- Target a **fixed 16:9 landscape display**, with core functions fitting **without scrolling**.
- Attractive themed backgrounds; large touch targets; intuitive tabs, including **Lights**.
- For potentially disruptive actions (e.g., changing Sky channels, switching lights), **first tap selects**, outline turns **red**, a persistent top-right **CONFIRM** button executes, selection automatically cancels after approximately **10 seconds**.
- Feedback must distinguish command requested, confirmed executed, unavailable, and last-known state.
- Do not silently issue unintended commands when a screen refreshes or reconnects.
- Where a connector becomes unreachable, show a **last successful reading with 'Last seen' time** rather than implying old UniFi stats are live. Refresh when back online; clear stale cache only when appropriate (e.g. connector restart, as previously proposed).

## 4. Important architecture decision — separate *audio engine* from *controller*

The latest concrete functional agreement was:

**Mac = audio/playout engine** (music library, playlist scheduler, actual playback, carts, segue editor, logs, and recording as capability is built). **Donkey/replacement = controller/hardware interface**, exposing the UI and/or bridging Airlite inputs to commands. If Donkey/replacement fails or disconnects, **Mac playback must continue**.

The previous broader proposals also considered (a) Raspberry Pi 5 hosting Eldoret/Bull's Hits and (b) a powerful one-box Windows x86 mini-PC running everything, including Airlite USB/audio/recording. These are **alternatives**, not final decisions; reconcile against the Mac-as-audio-engine principle before buying. In particular, avoid moving playback onto the control host by accident.

**Cloud-first + local-edge concept:** cloud may eventually hold catalogue, schedules and logs; local studio engine must be able to play through internet outages. Remote control, cloud synchronisation, multiroom clients and resilient offline behaviour remain plans unless individually verified.

## 5. Airlite / Bull's Hits workstream

- Physical mixer: **Airlite Mk2**.
- Intent: physical fader-start control, transport, multiple audio channels (fader A/B/C/J discussed), carts and recording. The Airlite offers multiple USB stereo audio paths, but **verify exact mapping and macOS driver / compatibility for this specific unit** before committing to hardware.
- Existing prototype: **Airlite → Donkey → Mac bridge** was reportedly committed.
- Previously proposed pairing flow:
  1. On Donkey, choose **CREATE PAIRING**.
  2. On Mac, open the supplied link and choose **ENABLE MAC RECEIVER**.
  3. Toggle **Airlite Channel 1 OFF → ON**.
  4. Verify the Mac gets the event and starts playback.
- **Critical status: end-to-end test NOT yet confirmed.** Do not write that physical fader-start works until proven.
- Mac was able to connect to `10.0.0.27:8765` previously, but verify service and bridge after reboots.
- **Immediate win:** hear an audio track (the a-ha test was mentioned) from the Mac through an appropriate output while exercising a physical Airlite fader and Donkey/bridge controls. Use legitimately owned/streamed music; no requirement to distribute files.
- **Acceptance tests:** fader OFF→ON starts correct deck; ON→OFF behavior defined; deck/USB channel maps correctly; no wrong deck triggers; playback remains uninterrupted when Donkey or Wi-Fi drops; connection resumes cleanly; at least two parallel sources and one recording channel tested later.

## 6. Donkey replacement — NOT purchased or decided

### Option A: Pi 5 + separate touchscreen (earlier inexpensive concept)

- Raspberry Pi 5 **8GB**, active cooling, official **27W supply**, ideally SSD rather than SD for persistent services.
- Gigabit Ethernet, fixed IP/DHCP reservation, auto-start Eldoret + Tailscale + supported connectors.
- Use the Pi as always-on home controller and/or touchscreen appliance, **not as the Mac audio engine** unless architecture is intentionally changed.
- ROADOM **10.1-inch 1024×600 HDMI+USB-touch** Pi-mountable display discussed.
- Main caveat: compact display resolution/quality, future expansion, and ensuring automation doesn't get too reliant on browser/kiosk limitations.

### Option B: x86 mini PC (previously recommended for long-term always-on control)

- Wired Ethernet; SSD; automatic startup/recovery; Tailscale; enough CPU/RAM for integrations and browser/dashboard.
- Example previously explored: **Beelink SER8**, AMD Ryzen 7 8745HS, **32GB RAM, 1TB SSD**, Windows 11 Pro, USB4, HDMI/DisplayPort, 2.5GbE.
- This is an example, **not an approved purchase or current price quote**. It may be excessive/expensive when the Mac retains all audio work.
- A cheaper suitably specified x86 mini PC could make more sense for **control-only**. Exact OS, USB/driver needs, memory and budget remain undecided.

### Option C: single high-performance PC controlling AND playing audio

- Explored as a possible integration of Eldoret + Bull's Hits + Airlite + recording, but **conflicts with the latest Mac-keeps-playing-if-Donkey-fails architecture**.
- Only revisit if deliberate and after verifying Airlite USB/HID support, four-channel output, simultaneous record, and OS compatibility.

### Display and power

- Desired screen in previous discussions: a **good-sized detachable/battery-powered touchscreen with dock**, USB-C and/or HDMI/DisplayPort support, network access, and ability to drive/use several displays. User explicitly wished **not** to impulse-buy a basic touch display before defining the processing architecture.
- A cheaper browser-only touchscreen client is viable if the central host performs actual services.
- Small **UPS** recommended to protect network, controller and possibly studio gear; **CyberPower CP1500EPFCLCD-UK 900W** was a proposed example, not selected.
- Decide what must survive power loss and how safe shutdown/restart will work.

## 7. Proposed target topology

```text
Home network (DrayTek 2865, 10.0.0.x)
   |
   +-- Always-on Eldoret control host [NEW; Pi 5 or x86 mini PC, undecided]
   |      |-- local integrations / dashboard / API / audit & config
   |      |-- Tailscale secure remote access
   |      +-- Airlite physical control event relay if appropriate
   |
   +-- Mac [Bull's Hits audio engine]
   |      |-- library, decks, carts, playlists, segue, logs, recording
   |      +-- keeps playing if control host is unavailable
   |
   +-- Touchscreen(s) [browser/kiosk clients or docked display]
   +-- Philips Hue bridges (.2, .4)
   +-- UniFi controller (.29:8443) and APs
   +-- Sky Q / LG TVs / Velux / printers / other devices
   +-- Bosch + Siemens dishwashers [Home Connect app now; API TBD]
```

**Note:** the exact physical Airlite-to-Mac USB audio wiring, HID/event capture and whether the mixer connects directly to the Mac or controller are not yet documented/verified. This is a key engineering decision.

## 8. Migration plan (side-by-side; no big-bang cutover)

1. **Inventory first:** capture existing repo(s), service entrypoints, configurations, Tailscale Serve settings, current integrations, permissions and credentials securely. Document working test commands and baseline screenshots.
2. **Test Mac/Airlite now:** bring the mixer out and prove the existing bridge, audio output and survival of control-server interruptions before spending money.
3. **Settle architecture:** control-only host vs combined host; precise Airlite USB/HID topology; macOS driver compatibility; persistent data locations; supported display resolution; max spend.
4. **Choose hardware:** compare Pi 5 package total cost (case/cooling/SSD/PSU/display), modest x86 mini PC, and higher-end PC only if justified. Check current UK availability/prices before buying.
5. **Build new host alongside Donkey:** assign new fixed LAN address; Ethernet; Tailscale; service auto-start; secure configs; backups and recovery test.
6. **Port one subsystem at a time:** dashboard/API then Hue/lights, Sky/TV, blinds, UniFi, new Home Connect integration, and Airlite relay. Test every control and confirmation rule.
7. **Touchscreen validation:** 16:9 no scrolling, 10-second cancel, confirm action, touch precision, dark/bright theme, kiosk recovery and touch responsiveness.
8. **Fault injection:** unplug Wi-Fi/controller, internet down, Mac asleep, power cycle, service crash; validate no mistaken states and audio continuity.
9. **Switch production:** only after parity tests; keep Donkey as fallback until stable and back up known-working configuration.

## 9. Questions to resolve before any purchase

1. Exactly what model/spec and OS is the **Mac** running? Can it run audio software continuously and reliably?
2. Where is the **Airlite physically connected**, and what exact USB audio + HID driver/controller paths work on macOS?
3. Is the replacement required to **run audio**, or only Eldoret/control? Latest decision says **control only**; retain unless explicitly changed.
4. What screen size, brightness, detachable operation/battery runtime, docking ports and resolution are genuinely required?
5. How many separate screens, rooms or local audio zones need simultaneous operation?
6. What is the acceptable **hardware budget** (controller, screen, UPS, SSD, peripherals)?
7. Do we want a Linux-first server with browser clients or Windows for a hardware-specific integration? Test compatibility.
8. What features must work **offline** and after power loss?
9. Can Home Connect be integrated through an approved supported API or local method, and which remote actions are permissible? App pairing does **not** equal dashboard control.

## 10. Next session checklist — week ending 20 Nov 2026

- [ ] Locate/power the Airlite Mk2; note visible connectors and cabling.
- [ ] Start Mac and Donkey, check `10.0.0.27:8765` from Mac.
- [ ] Locate current Airlite bridge repository/commit and exact instructions; don't recreate blindly.
- [ ] Try **CREATE PAIRING** on Donkey and **ENABLE MAC RECEIVER** on Mac.
- [ ] Toggle Airlite Channel 1 OFF→ON; inspect event/log and Mac action.
- [ ] Play a test track using an authorised local/music-library source; verify signal path to mixer/headphones/speakers.
- [ ] Disable Donkey temporarily; prove playback continues on Mac.
- [ ] Capture evidence, observed failures and fixes in this handover.
- [ ] Decide next hardware discovery session, **without purchasing impulsively**.

## 11. Development and documentation discipline

- Use a single maintained `PROJECT-HANDOVER.md` (this file) and a dated changelog, recording changes after each session.
- Clearly mark **LIVE/VERIFIED**, **BUILT BUT UNTESTED**, **DESIGN/PROPOSAL**, and **BLOCKED**.
- Capture repo URLs, actual file names, commands, screenshots and deployed versions when located; avoid guessing.
- Keep backups and a rollback path before changing network infrastructure.
- Never assert that background monitoring, automatic playback or services are running unless they have actually been configured and tested.

## 12. Copy-and-paste prompt for a new chat

> **Resume the Eldoret / Donkey replacement / Bull's Hits / Airlite project using the attached `ELDORET-DONKEY-AIRLITE-PROJECT-HANDOVER.md` as our source of truth.** Keep the existing 16:9/no-scrolling UI and tap-to-select/red-outline/CONFIRM/10-second-timeout rules. Donkey currently runs Eldoret on Chromebook Linux at 10.0.0.27:8765, via Tailscale, but is unreliable after reboots. The latest functional architecture is **Mac runs Bull's Hits audio and keeps playing if Donkey disconnects; Donkey or replacement is the home controller and Airlite hardware-event bridge**. We have discussed a Pi 5 8GB, a lower-cost x86 mini PC and a Beelink SER8, a detachable touchscreen and UPS, but **nothing has been bought or finally selected**. An Airlite Mk2-to-Mac pairing/receiver bridge was reportedly committed but not end-to-end verified. **Our first job is to get Airlite out and actually play music on the Mac controlled via Donkey, testing fader Channel 1 OFF→ON, channel mapping and fail-safe continuation.** Then revisit the replacement host decision, checking actual requirements, compatibility and UK prices. Continue incrementally, show exactly what is verified vs planned, maintain this handover and do not assume access to services or repos you have not checked. The Bosch SMV2HTX02G has just been added to Home Connect alongside the Siemens; bringing both into Eldoret is a future task.

---
## 13. Checkpoint — 18 November 2026

**DOCUMENTATION VERIFIED:** Read both the short GitHub handover and the full 17 November handover from the ChatGPT file library. Full text restored here as the source of truth. No deployed system has been modified or tested remotely during this session.

**NEW USER-SUPPLIED PHOTOGRAPHIC EVIDENCE (18 Nov):** Existing small Raspberry Pi touchscreen system found and shown powered on, with a graphical desktop. Rear photo shows Raspberry Pi board with stacked Ethernet/USB sockets, a full-size HDMI-looking port, micro-USB-looking power and attached display ribbon/cabling. Exact Pi model, RAM, OS release, touchscreen resolution and free storage are NOT confirmed; do not identify a specific model or infer current network reachability from photos. Older Pi 2/3-family appearance is tentative. This existing device is a strong zero-purchase candidate for a *pilot* Eldoret controller; do not wipe its SD card or disrupt existing use until inventory and backup.

**INVARIANT:** Mac stays the independent Bull's Hits playout and recording engine; Donkey/existing Pi/future host handles control and only physically compatible hardware events. Prove uninterrupted Mac audio when control host drops. Preserve existing 16:9 no-scroll UI, first tap/red outline/top-right explicit CONFIRM and 10-second cancel, Hue bridges, Sky Q, LG, Velux, UniFi, Tailscale; Bosch and Siemens Home Connect app paired but Eldoret API integration untested.

**UNVERIFIED:** Existing reported Airlite pairing receiver bridge, Mk2 USB audio/HID mapping, fader OFF/ON start, multi-output audio, Mac independence, live Eldoret availability at Donkey 10.0.0.27:8765, and operation of any of the integrations on the newly found Pi. Do not mark as passed.

**NEXT SAFE PI INSPECTION:** On the Pi open Terminal and run `cat /proc/device-tree/model` (may have trailing NUL), `free -h`, `cat /etc/os-release`, `df -h /`, and `hostname -I`. Record outputs, check whether Pi is already serving anything, inventory existing SD/storage, and back up before install. Check screen resolution via display settings. Only then decide whether to pilot local Eldoret and whether Pi 5/budget mini-PC/touchscreen/UPS purchases are justified.

**Airlite test sequence:** Determine physical USB connection and macOS enumerated devices, establish Donkey-to-Mac control pairing (if code located), test one fader OFF→ON to intended deck, observe signal path and proper feedback, disconnect control host, confirm uninterrupted Mac playback, and record pass/fail with real observations.


### 18 Nov 2026 — existing Raspberry Pi positively identified
- **VERIFIED by user on device:** `cat /proc/device-tree/model` returned **Raspberry Pi 3 Model B Rev 1.2**.
- Hardware characteristics of Pi 3 Model B: 1 GB RAM, 1.2 GHz quad-core CPU, 100 Mb/s Ethernet, 2.4 GHz Wi-Fi, four USB 2.0 ports. Treat as a lightweight pilot controller, not an approved permanent purchase replacement yet.
- User clarified the attached little touchscreen is **only for a compact engine-room health/status screen**; the main Eldoret 16:9 UI will live on a separate large touchscreen/browser client. Do not evaluate the Pi based on its small display or make the small display run the main interface.
- **UNTESTED:** installed OS, available memory/storage, network access, SSH/Tailscale, service integrations and load, reboot recovery. No live automation service has been migrated.
- **Next read-only device checks:** `cat /etc/os-release`, `free -h`, `df -h /`, `hostname -I`; then discover current running services and safely image/backup the SD card before installation or migration. Keep Donkey as fallback. Airlite tests remain outstanding, Mac independent audio unchanged.


### 18 Nov 2026 — Motor touchscreen Pi software confirmed by terminal photograph
- **VERIFIED from visible on-device terminal:** hostname/user prompt `pi@Motor`; Raspberry Pi 3 Model B Rev 1.2; TeamViewer `13.1.1548 (DEB)`; `getconf LONG_BIT` -> `32`; `/etc/os-release` -> Raspbian GNU/Linux 8 (jessie), `VERSION_ID=8`.
- **Decision:** Do not force TeamViewer upgrade or in-place distribution upgrade on old Jessie installation. Treat as end-of-support and do not expose SSH publicly; inspect existing roles and backup or retain original microSD, then trial supported Pi OS on a separate microSD if compatible. Main touchscreen remains separate. SSH over trusted LAN first, then secure Tailscale if supported by new OS.
- **Not yet verified:** network address, SSH daemon status, available storage, current workload, updated OS installation, modern remote-access compatibility, Eldoret integrations.


### 18 Nov 2026 — Motor SSH verified locally
- **VERIFIED by user screenshot of `sudo systemctl status ssh`:** `ssh.service` OpenBSD Secure Shell server loaded, enabled and `active (running)` on Motor. `sshd` listening on IPv4 `0.0.0.0` port 22 and IPv6 `::` port 22. The screenshot indicates service started on 18 Nov 2026.
- **NOT YET VERIFIED:** LAN IP, successful remote SSH login, authentication/key policy, or ability of modern SSH clients to negotiate with Jessie. Next check `hostname -I` and attempt LAN-only connection; avoid router port forwarding and public exposure. Back up original microSD and trial supported Pi OS on separate card before running permanent Eldoret services.


### 18 Nov 2026 — second Raspberry Pi discovered
- **VERIFIED from user's terminal photograph:** separate machine with prompt `pi@raspberrypi`, `cat /proc/device-tree/model` -> **Raspberry Pi 3 Model B Rev 1.2**, `cat /etc/os-release` -> **Raspbian GNU/Linux 10 (buster)**. Thus hardware is *not* newer than Motor, but OS is newer than Motor's Jessie; Buster is also end of support.
- **UNVERIFIED:** second Pi's storage, network, SSH, workloads, memory pressure, and Eldoret integration compatibility. Neither machine has been migrated or wiped.
- **Next action:** prefer inspecting second Pi as potential pilot; run read-only `hostname -I`, `free -h`, `df -h /`, and `systemctl is-active ssh`; inventory pre-existing use and back up SD before any fresh OS installation. Preserve Mac-independent audio and Donkey fallback.


### 18 Nov 2026 — second Pi SSH remotely accessible
- **VERIFIED by user report:** SSH login from Mac to second Pi at LAN IP `10.0.0.26` succeeded after locally resetting `pi` account password using `sudo passwd pi`. Earlier Mac SSH prompt confirmed host reached and ED25519 host fingerprint presented; remote interactive access now confirmed by user.
- **Security follow-up:** SSH password authentication currently likely enabled; do not publish new password, move to SSH keys after backup/reimage, and do not expose port 22 on internet.
- **Next read-only baseline:** inspect Pi model, OS, memory, storage, processor temperature and uptime through SSH, then inventory running services before wiping/updating. No new Eldoret services installed yet.


### 18 Nov 2026 14:50 GMT — Second Pi SSH baseline (user-run, verified output)
- Model: Raspberry Pi 3 Model B Rev 1.2; OS Raspbian GNU/Linux 10 (buster).
- `free -h`: 926 MiB total RAM, 592 MiB used, 36 MiB free, 296 MiB buff/cache, **181 MiB available**; swap 99 MiB total, 86 MiB used, 13 MiB free. Indicates limited headroom; swap use alone is not proof of current thrashing.
- `df -h /`: root volume 6.9 GiB, 5.4 GiB used, 1.2 GiB available, 82% full.
- `vcgencmd measure_temp`: 53.7 C at test time.
- `uptime`: 14:50:28, up 33 minutes, 3 users, 1/5/15 min loads 1.11/1.18/1.13; these are load averages, not CPU percentages.
- **Assessment, not performance validation:** this Buster graphical installation has limited spare RAM and storage. Do not deploy Eldoret yet. A backed-up clean supported lightweight OS could be evaluated, but must inventory installed workloads and storage first. No Pi performance benchmark or integration test performed.
- **Next read-only inspection:** `ps -eo pid,comm,%cpu,%mem --sort=-%mem | head -n 20`, `systemctl --type=service --state=running --no-pager`, `lsblk -o NAME,SIZE,TYPE,MOUNTPOINT`, `uname -m`. Inspect purpose of pre-existing services before changing SD card.


### 18 Nov 2026 14:56 GMT — CRITICAL DISCOVERY: second Pi runs Rivendell
- **VERIFIED from user-supplied `systemctl --type=service --state=running --no-pager` output:** `rivendell.service` (Rivendell Radio Automation System), `mariadb.service` (MariaDB 10.3.17), `apache2.service`, `alsa-state.service`, `bluealsa.service`, `lightdm.service`, `teamviewerd.service`, `vncserver-x11-serviced.service`, `ssh.service`, plus core networking and OS services active. 28 units listed.
- This explains some workload but does **not** prove which application owns the DB/webserver, that an audio library exists, or that Rivendell plays audio successfully. Treat all content as potentially valuable and preserve it.
- **IMPORTANT CHANGE CONTROL:** Do NOT wipe, reimage, upgrade, stop or disable Rivendell/MariaDB/Apache on the original SD until configuration/data and storage locations are inventoried and a restorable backup exists. Second Pi may represent historic radio automation work relevant to Bull's Hits. Mac remains planned independent playback engine; do not mistake this old service for current working Mac playout.
- **NEXT READ-ONLY:** capture remaining `lsblk -o NAME,SIZE,TYPE,MOUNTPOINT` output; inspect `systemctl status rivendell --no-pager`, `systemctl cat rivendell`, `sudo ss -lntp`, `du` of candidate app/library paths only after confirming paths; inventory Rivendell version and databases without exposing credentials. Prefer a spare SD for Eldoret trial.


### 18 Nov 2026 15:16 GMT — Rivendell metadata matched to cut identifiers
- **VERIFIED from user's MariaDB query output:** `Rivendell.CART` joined to `Rivendell.CUTS` on `CUTS.CART_NUMBER = CART.NUMBER` successfully returned cart, artist, title, album and cut identifiers. Sample includes The Jacksons — Blame It On The Boogie (`010002_001`), Little Mix — Black Magic (`010003_001`), Coolio — Gangsta's Paradise (`010001_001`), plus Galaxy Idents cart 60101 with cuts 001-004 and Power FM voice/jingle carts 60102-60104.
- **NOT VERIFIED:** audio on disk matching every database cut; file extension/path, playable content, total number of cuts, completeness of USB copy, and album metadata completeness. Do not rename original Rivendell assets or alter DB. Preserve historic Power FM/Galaxy material and library metadata as an independent radio-automation workstream.
- **Next:** export the `CART`/`CUTS` mapping read-only to a TSV on Pi and transfer via `scp` to Mac, inspect cut paths and verify filesystem match. Back up database before OS migration.


### 18 Nov 2026 16:39 GMT — revised hardware consolidation decision
- **USER DECISION:** Return to first Pi, `Motor` (Pi 3 Model B Rev 1.2, attached small touchscreen), as the primary Eldoret controller/Engine Room **trial**; avoid running both Pi boards continuously just for Eldoret because of unnecessary power draw.
- Use newly ordered SanDisk microSD for a **clean test OS** on Motor while preserving its original Jessie SD card; evaluate DietPi plus lightweight GUI/status presentation subject to up-to-date Pi 3 support and touchscreen driver compatibility. Keep its small display for health status, not the primary Eldoret 16:9 UI.
- **Second Pi** (`raspberrypi`, Pi 3 B Rev 1.2, Buster), retains original Rivendell/MariaDB/Apache/audio installation and should be preserved as a separate historical radio automation investigation; no wipe or migration of Rivendell until archive/backups are complete. It does not need to remain continuously powered if preservation permits safe shutdown.
- **Mac** stays independent Bull's Hits audio engine; **Donkey** stays operational until proven migration and rollback; larger separate touchscreen drives the main no-scroll 16:9 UI.
- **Not yet tested:** DietPi image boot on Motor, screen support, performance, Eldoret integrations, Airlite fader-start/routing or Mac continuity. Do not mark Motor production-ready.


### 18 November 2026 ~18:08 — recovered WAV filename inventory audit
- **VERIFIED through exact string comparison:** user-supplied `rivendell-wav-files.txt` lists 124 WAV paths on Mac, all 124 basename cut IDs match 124 unique non-NULL `Audio_File` IDs in `rivendell-catalogue.tsv` (125 DB rows total). Zero missing cut identifiers, zero unmatched extra Mac filenames and zero duplicate basename IDs. One DB record (`50001`, `Test Macro`) has `Audio_File=NULL` and is not a WAV expectation.
- **Scope limitation:** filename-level comparison only. WAV bytes, audio decodability, media durations, sonic content and actual track-title correctness have NOT been tested. Keep originals, backup media and Rivendell database; descriptive rename mapping should be applied to copies only after content validation.
- Audited workbook and CSV created in conversation: `Rivendell_Recovered_Catalogue_Audited.xlsx` and `Rivendell_Filename_Verification.csv`; they distinguish filename matches from audio-content verification.


### 18 November 2026 18:21 GMT — WAV descriptive-copy operation completed
- **VERIFIED from user's Mac Terminal screenshot:** `SUCCESS: 124 named copies created and SHA-256 verified. Originals unchanged.` The dry run first displayed correct examples (e.g. `010001_001.wav` -> `Coolio - Gangsta's Paradise [010001_001].wav`) and clearly reported PREVIEW ONLY. User then ran the copy mode successfully.
- **Mac source folder:** `/Users/bulln80/Documents/Files from Rivendell`; destination sibling folder `/Users/bulln80/Documents/Files from Rivendell_NAMED_COPIES` as reported by script preview. 124 named copies are byte-identical to original WAV files according to script's SHA-256 verification. Original WAV files were not modified by this operation.
- **Still unverified:** independent playback/decoding and audio-content-versus-title accuracy for each file, completed backup of named copies and database, and import into Bull's Hits. Keep originals and Rivendell SD card preserved.
- **Next optional work:** spot-check representative music and imaging tracks by listening; preserve checksums and catalogue; optionally organise named copies by type without modifying source. Continue Motor/DietPi Eldoret migration separately, without touching Rivendell original card.


### 18 November 2026 — oral provenance for recovered Nick Bull ident
- **User-supplied first-hand provenance (not independently externally verified):** the recovered `Nick Bull ACAP [060124_001].wav` was produced by **Alpha Sound** for **BBC Somerset's 30th birthday**, during the period when the user was running the stations.
- The user supplied/playback-shared the corresponding audio ident in chat. Preserve original cut ID `060124_001` and provenance in future Bull's Hits metadata; classify as personal/station imaging, not a commercial music track.
- This is historic attribution supplied by the user; no date/year of the anniversary or contract/license terms established. Retain audio original and checksum-verified named copy.


### 18 November 2026 18:39 GMT — Motor renamed Bulldog (selected name)
- **User decision:** the former motorhome Pi `Motor` is to be called **Bulldog**, a Bull-family wordplay, and serve as the single Eldoret controller/Engine Room pilot. Proposed Linux hostname `bulldog` (apply only after DietPi is installed and booted; not yet changed).
- Existing hardware: first Raspberry Pi 3 Model B Rev 1.2 with small attached screen for text-only Engine Room health. Main Eldoret 16:9 no-scroll controls use a separate large touchscreen/browser client. Preserve original Jessie SD card and Rivendell second Pi; Mac runs independently playing Bull's Hits audio; Donkey stays fallback until tested migration.


### 18 November 2026 19:03 GMT — Bulldog DietPi initial boot VERIFIED
- **VERIFIED from user screenshot of SSH welcome banner:** First Pi 3 Model B (aarch64) with new SanDisk microSD successfully booted DietPi **v10.8.2**; `root@DietPi:~#` shell reached from Mac using Ethernet **10.0.0.39**. Initial software installation completed as a minimal image, no desktop selected; DietPi survey opted out. Login/software passwords configured during setup (values not stored here). UART console disable was selected per setup discussion, but hardware state not independently rechecked.
- Screenshot readouts: CPU temperature **43 C** (optimal according to DietPi), root disk **1.9 GiB of 58.2 GiB used (3.2%)**. These are point-in-time observations, not sustained load benchmark.
- **Next:** set hostname from `DietPi` to user-selected `bulldog`; retrieve Ethernet MAC with `cat /sys/class/net/eth0/address`; reserve `10.0.0.39` in DrayTek Bind IP to MAC with Strict Bind disabled; validate hostname/address on reconnect. Don't treat reservation as complete until router confirms.
- **Not yet verified:** attached touchscreen with DietPi (currently blank), Eldoret APIs/integrations, browser display, Tailscale, startup/recovery, and Airlite Mac audio tests. Keep original Motor/Jessie SD and Donkey fallback intact.


### 18 November 2026 19:07 GMT — Bulldog hostname and Ethernet identity verified
- **VERIFIED from user SSH terminal screenshot:** `hostname` -> `bulldog`; `cat /sys/class/net/eth0/address` -> `b8:27:eb:19:5d:bd`; `hostname -I` -> `10.0.0.39`. Old shell prompt still reads `root@DietPi`, but hostname command confirms configured name.
- **PENDING:** Create/check DrayTek Vigor 2865 LAN Bind IP to MAC entry mapping Ethernet MAC `b8:27:eb:19:5d:bd` to `10.0.0.39`, label Bulldog, keep Strict Bind disabled. Router reservation is NOT yet verified saved.
- Existing DietPi SSH session and minimal 64-bit boot are verified; small touchscreen display and Eldoret integrations not yet working/verified.


### 18 November 2026 19:13 GMT — DrayTek IP Bind list and reservation strategy
- **VERIFIED from user screenshot of DrayTek Vigor 2865 IP Bind List:** Donkey `10.0.0.27` / `DC-8B-28-1B-1E-F8`; Bulldog `10.0.0.39` / `B8-27-EB-19-5D-BD`; Velux gateway `10.0.0.22` / `70-EE-50-5B-FB-B5` with host ID `VELUXGateway`. Bulldog's entry is visibly saved/listed, though address persistence after DHCP renewal/reboot has not been tested.
- **User plan:** reserve stable addresses for other network automation dependencies. Recommended verified MAC-to-IP reservations for Hue bridges (`10.0.0.2`, `.4` historically), UniFi controller (`.29` historically), Sky Q hardware, LG TVs, printers, and compatible connected appliances where justified. Confirm every device's current IP and MAC before binding; account for already manually static addresses, DHCP scope and collision risks; do not blindly bind stale IPs or duplicate MACs.
- Keep `Strict Bind` disabled. Avoid reserving all temporary client devices; track infrastructure in an Eldoret device register with IP, MAC, hostname, role, state and last verification. No additional bindings confirmed yet.

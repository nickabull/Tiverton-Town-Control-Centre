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


### 18 November 2026 19:25 GMT — Expanded DrayTek bindings and backup inspection
- **VERIFIED from user's DrayTek IP Bind List screenshot:** visible bindings:
  - 10.0.0.2 / EC-B5-FA-23-39-08 / House-Hub / Hue House
  - 10.0.0.3 / E0-BB-9E-44-ED-51 / EPSON44ED51 / Epson Print
  - 10.0.0.4 / EC-B5-FA-22-EA-B7 / Utility-Hub / Hue Utility
  - 10.0.0.6 / E0-63-DA-EC-2C-AD / OfficeKitchen / Wifi Off/Kit
  - 10.0.0.7 / F4-92-BF-C0-D4-34 / Utility / Wifi Util
  - 10.0.0.8 / F4-92-BF-66-06-2D / Garden / Wifi Garden
  - 10.0.0.9 / F4-92-BF-C0-CF-73 / Landing / Wifi Landing
  - 10.0.0.11 / 94-E6-86-18-C5-54 / Zappi / Car Charger
  - 10.0.0.12 / 68-A4-0E-4F-CA-E4 / NEFF-D95FMW1N0B... / Cooker Hood
  - 10.0.0.13 / 68-A4-0E-4A-60-59 / NEFF-T59TS5RN0... / Cooker Hob
  - 10.0.0.14 / 68-A4-0E-23-9D-22 / SIEMENS-SN878D26PE... / Kit Dishwasher
  - 10.0.0.16 / 68-A4-0E-35-73-F3 / NEFF-B58CT68H0B... / Left Oven
  - 10.0.0.17 / 68-A4-0E-4E-74-B1 / NEFF-B48FT78H0B... / Right Oven
  - 10.0.0.18 / D4-DA-CD-51-FE-01 / Sky Q
- **Previously verified listed:** Donkey .27 / DC-8B-28-1B-1E-F8; Bulldog .39 / B8-27-EB-19-5D-BD; Velux gateway .22 / 70-EE-50-5B-FB-B5. Current screenshot shows only top portion of list; entries below visible scroll not newly verified.
- **CRITICAL BACKUP LIMITATION:** User uploaded `ipbindmac_20261118.cfg` (50 bytes, inspected 18 November); exact content is just `10.0.0.27 dc-8b-28-1b-1e-f8 Donkey` and `End of file!!!`. It does **not** contain the new reservations despite the screenshot proving they appear in the router's IP Bind List. **Do not describe this .cfg as a complete backup or use it to restore the new bindings.** Investigate export behavior / save state and re-export full list, verify export file content and row count before accepting it as backup.
- Existing uploaded .cfg retained in conversation as evidence of incomplete export, not committed to GitHub. Avoid storing sensitive full router configuration in public repository. Do not enable Strict Bind.


### 18 November 2026 ~19:28 GMT — DrayTek IP Bind backup corrected and inspected
- **VERIFIED via direct inspection of user-uploaded `ipbindmac_20261118(1).cfg`:** 790-byte text file, 20 IP/MAC bindings, all 20 distinct IPs and MACs, correct-looking three-field format with backtick-encoded spaces in comments, ends `End of file!!!`. **This supersedes the earlier INCOMPLETE `ipbindmac_20261118.cfg` export (only Donkey).** The new export contains the complete set of *20 entries shown in the file*; no restore test has been performed.
- Confirmed entries from file (IP / MAC / label):
  - 10.0.0.2 / ec-b5-fa-23-39-08 / Hue House
  - 10.0.0.3 / e0-bb-9e-44-ed-51 / Epson Print
  - 10.0.0.4 / ec-b5-fa-22-ea-b7 / Hue Utility
  - 10.0.0.6 / e0-63-da-ec-2c-ad / Wifi Off/Kit
  - 10.0.0.7 / f4-92-bf-c0-d4-34 / Wifi Util
  - 10.0.0.8 / f4-92-bf-66-06-2d / Wifi Garden
  - 10.0.0.9 / f4-92-bf-c0-cf-73 / Wifi Landing
  - 10.0.0.11 / 94-e6-86-18-c5-54 / Car Charger
  - 10.0.0.12 / 68-a4-0e-4f-ca-e4 / Cooker Hood
  - 10.0.0.13 / 68-a4-0e-4a-60-59 / Cooker Hob
  - 10.0.0.14 / 68-a4-0e-23-9d-22 / Kit Dishwash
  - 10.0.0.16 / 68-a4-0e-35-73-f3 / Left Oven
  - 10.0.0.17 / 68-a4-0e-4e-74-b1 / Right Oven
  - 10.0.0.18 / d4-da-cd-51-fe-01 / Sky Q
  - 10.0.0.22 / 70-ee-50-5b-fb-b5 / Velux
  - 10.0.0.27 / dc-8b-28-1b-1e-f8 / Donkey
  - 10.0.0.39 / b8-27-eb-19-5d-bd / Bulldog
  - 10.0.0.48 / 5c-84-3c-8c-79-87 / PS 5
  - 10.0.0.5 / b8-27-eb-de-7f-82 / A&H Conrol (spelling as exported)
  - 10.0.0.20 / f0-5c-19-cd-bc-c0 / BBC Aruba
- **Backup location:** original uploaded file stored in conversation, not committed to GitHub. User should keep an independent copy in a secure backup location. A binding-list export is not necessarily a full router configuration backup; do not assume other DrayTek settings are protected. Keep Strict Bind disabled.


### 18 November 2026 ~19:29 GMT — Eldoret Network tab accepted as design requirement
- **User request:** surface the 20-entry DrayTek IP/MAC reservation inventory directly in an Eldoret dashboard tab. Design a fixed 16:9/no-scroll `NETWORK` view and searchable/filterable detail experience, while retaining the explicit select → red outline → CONFIRM safety rule for any future write actions.
- **Source:** complete, locally exported IP bind list `ipbindmac_20261118(1).cfg` as documented above; display the known address, MAC, name/label, role, room/type, and backup provenance. Distinguish static saved inventory from live availability.
- **Future features (not built):** network device live checks with last-seen times and sensible protocol-specific validation (do not equate unanswered ping with failure), alerts, individual device details, import and compare new DrayTek exports, controlled download/export, historical change log/audit. Keep passwords, router config secrets and internal network management actions out of public pages. The 20-entry list is a reservation register, NOT a complete census of all network clients.
- **Status:** design/proposal logged, not deployed to Eldoret, Bulldog or central dashboard yet.


### 18 November 2026 ~19:30 GMT — Network heartbeat UI requested
- **USER-APPROVED DESIGN:** Network tab should display a small animated **beating heart** beside each device when its *appropriate* connectivity/health check is passing. Bulldog's small Engine Room display can aggregate this as a large heart and simple status. Keep main 16:9 no-scroll UX and explicit confirm guard for actions; monitoring itself is read-only.
- **Health semantics:** Green beating heart = recent successful service-appropriate check; amber = asleep/stale/unknown, not automatically failure; red static/broken heart = repeated confirmed failures; grey = unconfigured/unchecked. Display `last checked`, `last successful`, method and error details on selection; stale status must not be shown as live. Avoid treating ICMP ping failure as proof of outage (many IoT devices reject or sleep through ping). Use safe, rate-limited checks with per-device adapters (Hue bridge API, Velux, Sky Q, UniFi etc. as supported), start with ~30-60s interval for lightweight checks, backoff/retries and configurable thresholds; do not generate network load or issue device commands just to health-check.
- **Status:** design requirement logged only. Heart animations, checks, dashboard tab, aggregated status and alerting have not been built, deployed or verified. No device health test conducted yet. Preserve IP Bind inventory as static source data separate from runtime health signals.


### 18 November 2026 19:31 GMT — Persistent global alert strip on unreachable devices
- **USER REQUIREMENT:** If Bulldog detects a monitored device as truly unreachable, a visible alert slot/strip must appear on **every Eldoret page/tab**, persist until user responds, and be immediately actionable. Do not hide it just because the user navigates to Lights, Sky, etc.
- **Proposed interaction:** global fault strip with affected device/name/IP, last successful check, severity and fault count; `Acknowledge` marks seen but does NOT falsely close a still-active incident (minimise to visible indicator if needed), `Investigate` opens diagnostics, `Resolved` only after successful recovery verification. Multiple failures group into one summary with drill-down. Maintain incident history/audit and timestamps; use recovery debounce to prevent flapping. If unknown/sleeping, show amber rather than falsely declaring unreachable.
- **Critical UI invariants:** reserve vertical space in fixed no-scroll 16:9 layout, do not obscure navigation or the existing top-right explicit CONFIRM; no automatic disruptive remediation or device changes without select/red outline/CONFIRM. Make alerts accessible, readable and persistent across page transitions; allow safe dismissal only as acknowledgement, not suppression of active fault.
- **Status:** user-approved functional design requirement, NOT implemented or live-tested on Bulldog or Eldoret yet.


### 18 November 2026 ~19:32 GMT — Global Eldoret network-fault alert code committed
- **CODE VERIFIED IN GITHUB, NOT YET LIVE-TESTED:** committed to `nickabull/Eldoret-Home-Automation` `main`, file `kiosk.js`, commit `fa5c17dabee0490a428ae5ca5f44b48999ce1169`. Existing shared kiosk script now appends a read-only global, fixed-position network fault strip on pages including it; original idle-return logic retained.
- Fetches existing `/api/network/status` every 30 seconds (10-second request timeout). Watches a **limited first set** of infrastructure targets: router `.1`, Hue `.2`/`.4`, UniFi `.6`–`.9`, Sky Q `.18`, Velux `.22`. The broader 20-entry binding inventory, Bulldog `.39`, sleeping appliances, etc. are **not yet all monitored**. Initial check failure stays unknown; only a device successfully seen earlier and then failing three consecutive polls is shown unreachable. Connector outage does not by itself trigger device faults. This is a conservative first pass to avoid false alerts.
- Alert includes device(s), last successful check, `Acknowledge` (retains warning indicator), `Investigate` (opens Network tab), auto-clears after successful probe, and survives tab navigation within one browser session via `sessionStorage`. Reduced-motion preference respected. No device-control API is called; explicit CONFIRM behavior for disruptive actions unaffected.
- **IMPORTANT LIMITATIONS / QA REQUIRED:** GitHub commit does not prove Donkey connector has fetched the refreshed file (connector caches repo content up to ~300s), and no live browser/16:9 visual QA or simulated outage/recovery test has been performed. Not server-persistent across different clients or restarts; no central fault audit yet. Existing network status probes can fail on sleeping devices, so require per-device integration-aware health checks before expanding. Heart indicators for every one of the 20 reserved devices and the full reserved-device tab are still planned, not implemented. Check mobile and no-scroll impact as next test.


### 18 November 2026 ~19:43 GMT — priority reset: Bulldog migration tonight
- **Explicit user priority:** park network heartbeat hearts, global alert visual work and network tab expansion (all still desired; do not forget). Focus on moving live Eldoret services from Donkey to Bulldog this evening if safely possible.
- **Approach:** verify Bulldog baseline and network; inventory Donkey's actual running `~/eldoret-connector` install, data, private secrets, service mechanism and current behavior; install required Python/runtime dependencies on Bulldog; migrate files/config securely off GitHub and preserve permissions; run side-by-side on Bulldog `10.0.0.39:8765`, validate fixed 16:9 and explicit CONFIRM, Hue, Sky Q, LG, Velux, UniFi, Tailscale and known integrations; verify auto-start, reboot and stale-state behavior; then switch clients to Bulldog and retain Donkey as a powered-off fallback only after acceptance tests. Do not claim same-day retirement without test results.
- **Specific caution:** connector in `nickabull/Eldoret-Home-Automation` pulls assets from GitHub and currently has a read-only global alert implementation in `kiosk.js`, untested. Preserve and inspect existing local connector data and ensure no private keys/tokens are committed. Home Connect paired in vendor app but dashboard API remains future integration; don't falsely mark it working.


### 18 Nov 2026 19:45 GMT — Bulldog resource baseline
- **VERIFIED from user SSH output** on Bulldog (`10.0.0.39`): `free -h` reports 954 MiB total RAM, 65 MiB used, **888 MiB available**, 1.1 GiB swap and 0 B swap used. `df -h /`: 59G root, 1.9G used, 54G available, 4% use. `hostname -I`: `10.0.0.39`.
- `python3 --version` returned `-bash: python3: command not found` — minimal DietPi image has no Python installed. **Installation proposed, not yet verified:** `apt update && apt install -y python3`, then verify Python version before attempting connector migration. No Eldoret workload/performance validation yet; keep Donkey running side-by-side.


### 18 Nov 2026 19:48 GMT — Bulldog Python prerequisite verified
- **VERIFIED by user from Bulldog terminal:** `python3 --version` returned **Python 3.13.5** after installation on DietPi. Previously missing Python prerequisite is now satisfied.
- **Next safe migration stage:** Inspect Donkey's local `~/eldoret-connector` directory layout and launch mechanism without printing secrets. Transfer local configuration securely host-to-host only after inventory and permissions review. Do not claim connector running on Bulldog yet.


### 18 November 2026 ~19:56 GMT — Donkey local connector inventory verified
- **VERIFIED from user's Donkey ChromeOS Linux terminal screenshot:** `/home/nickabull/eldoret-connector` exists. `connector.py` (~125,586 bytes) present; process PID 261 runs `/usr/bin/python3 /home/nickabull/eldoret-connector/connector.py`; `systemctl --user list-unit-files | grep -i eldoret` shows `eldoret.service` enabled.
- Visible contents include `agent-results.json`, `agent-state.json`, `cloudflared` executable, `connector.log`, `connector.py`, `device-registry.json`, `install.sh`, `manager.py`, `remote-tunnel.json`, `router-snmp/`, `skyboxremote.py`, `unifi/`, `__pycache__/`.
- **Important:** unifi/router-snmp/remote-tunnel and perhaps other local files may hold secrets. No contents have been disclosed or migrated. Verify unit/service definition and file permission/layout before transferring over trusted LAN, and do not push credentials to public GitHub. User service runs as `nickabull`; Bulldog currently connects as `root`, so paths/ownership/startup service must be adjusted.
- **Next inspection:** `systemctl --user cat eldoret.service` and a secrets-safe runtime/module inventory; then prepare secure host-to-host transfer and side-by-side test at Bulldog `10.0.0.39:8765`. Donkey remains running; no production cutover yet.


### 18 November 2026 ~19:59 GMT — Donkey systemd startup configuration confirmed
- **VERIFIED from user photo of `systemctl --user cat eldoret.service`:** service located at `/home/nickabull/.config/systemd/user/eldoret.service`, `Description=Eldoret Home Automation`, `After=network-online.target`; `Type=simple`; `EnvironmentFile=/home/nickabull/.config/eldoret.env` (PRIVATE, contents not shared); `ExecStart=/usr/bin/python3 /home/nickabull/eldoret-connector/manager.py`; `Restart=always`, `RestartSec=3`; `WantedBy=default.target`.
- **VERIFIED in GitHub source** `nickabull/Eldoret-Home-Automation/manager.py`: fetches `connector.py` from `main` on startup and every 30 seconds; replaces local connector if hash changes and restarts child. Thus copying connector code alone is insufficient; include launcher plus local private environment/config, and keep version-change/restart behavior in mind during staged testing. Do not commit `eldoret.env` or private UniFi/router/tunnel files to public GitHub.
- **Next migration gate:** confirm Donkey can SSH to Bulldog, inventory local file permissions and dependencies without showing secret values; transfer securely on trusted LAN, test Bulldog side-by-side, set up system service for boot. Donkey remains production until explicit functional and reboot tests pass. No cutover yet.


### 18 November 2026 20:31 GMT — Donkey to Bulldog private environment transfer confirmed
- **User-confirmed output:** secure `tar | ssh` transfer of `/home/nickabull/.config/eldoret.env` from Donkey to `/home/dietpi/.config/eldoret.env` on Bulldog completed with `Private settings transferred successfully`, after `chmod 600` and `test -s`. Values were not exposed in chat or GitHub.
- **User-confirmed earlier:** two copied Python files `connector.py` and `manager.py` are listed on Bulldog. The bulk `eldoret-connector` folder was transferred securely over SSH. Runtime compatibility and completeness of additional private directories have not yet been validated.
- `scp` transfer failed with `scp: command not found` on minimal DietPi (likely remote SCP program); successful alternative used SSH plus tar. No need to expose credentials.
- **NEXT:** verify transferred files, Python compilation, directory ownership/permissions without printing configuration contents; then configure non-root systemd service using `EnvironmentFile=/home/dietpi/.config/eldoret.env` and `ExecStart=/usr/bin/python3 /home/dietpi/eldoret-connector/manager.py`; inspect logs and dashboard side-by-side before any cutover. Remember Donkey x86 `cloudflared` executable must not be run on Pi ARM. Donkey remains production fallback.


### 18 Nov 2026 20:34 GMT — Bulldog Eldoret systemd first start VERIFIED
- **VERIFIED from user's Bulldog screenshot:** `sudo systemctl enable --now eldoret.service` created `/etc/systemd/system/multi-user.target.wants/eldoret.service` symlink and `systemctl status eldoret.service --no-pager` shows **loaded, enabled, active (running)** since 2026-11-18 20:33:57 UTC. Main PID 1855 `/usr/bin/python3 /home/dietpi/eldoret-connector/manager.py` with child PID 1856 `/usr/bin/python3 /home/dietpi/eldoret-connector/connector.py`.
- **Scope:** validates systemd service and both processes started, **NOT YET** HTTP reachability, all integrations, 16:9 UI, security-confirm control, restart-on-boot, data completeness, or dependency compatibility. Donkey is still the production controller/rollback.
- **Next:** browse `http://10.0.0.39:8765` from Mac, check read-only APIs and visually inspect dashboard; then controlled device tests and reboot recovery before considering Donkey retirement. Preserve private `eldoret.env` and verify secrets not leaked in log output.


### 18 Nov 2026 20:35 GMT — First Bulldog-hosted Eldoret dashboard confirmed
- **VERIFIED by user screenshot:** `http://10.0.0.39:8765/index.html` loads Eldoret Home through Bulldog rather than Donkey, with normal visual styling. Screenshot home status at 20:35: Hue bridges 2/2 responding (62 lights in groups), Sky Q now-playing data `1st Test Day 2: SA v BAN Hlts`, Jesse's PlayStation connected, four Wi-Fi access points reachable, Epson printer status displaying low magenta ink. These are dashboard-reported statuses, not yet independently exercised control commands.
- **Visible gap:** router panel says `The SNMP reader is not installed on the Eldoret host`, so Bulldog needs an SNMP client (e.g. `snmp` package) and working migrated private router SNMP setup before speed readings work. Other detailed integrations (Velux, LG TVs, UniFi telemetry, appliance control), CONFIRM guard, layout at target screen and reboot/startup recovery remain to be tested.
- **Migration status:** website and first read-only API responses WORK on Bulldog; Donkey must remain intact and active until acceptance tests and reboot. Avoid marking full cutover complete.


### 18 November 2026 20:45 GMT — Bulldog DrayTek SNMPv3 LIVE verified
- **VERIFIED from user screenshot of Bulldog-hosted Eldoret Home:** router card now says `CONNECTED` / `Your router is connected`, showing WAN2 download **2.25 Mbps** and upload **0.26 Mbps**, updating every 5 seconds. These are traffic rates, not an internet speed test.
- Root cause found on DrayTek Vigor 2865 `System Maintenance > SNMP`: SNMPv3 management access allowed only Donkey `10.0.0.27/32`. User added Bulldog `10.0.0.39/32` as second Manager Host while retaining existing Donkey access, SHA authentication and AES privacy. Bulldog had NET-SNMP installed with `snmp.conf` owner dietpi mode 600. Prior SNMP timeout and error cleared following access-list update.
- **Status:** SNMPv3 integration with live metrics demonstrated. Donkey still active fallback. **NEXT PRIORITIES:** safe Hue control test, Sky Q control test, critical LG/Velux/UniFi status and control tests as applicable, inspect watchdog/explicit CONFIRM behavior, controlled reboot of Bulldog and automatic recovery, confirm credential/config preservation and resources before retiring Donkey. No full migration signoff yet.


### 18 Nov 2026 20:47 GMT — User-confirmed Bulldog Hue + Sky Q control tests
- **VERIFIED by user's explicit report:** both Bulldog-hosted Eldoret tests requested at 20:45 passed: physical Hue light control and Sky Q harmless remote command (`all working perfectly`). No independent log captures, response timings, or detailed identities of the tested light/command; do not imply more specificity than reported.
- Bulldog-hosted Home dashboard, dual Hue status, Sky Q now-playing, PlayStation status, four Wi-Fi AP reachability, Epson printer status and encrypted router SNMP traffic readings demonstrated earlier.
- **CRITICAL CUTOVER GATE:** `eldoret.service` is enabled/running, but no full reboot and automatic recovery test yet. Also check essential LG/Velux/UniFi detailed functions and fixed 16:9 confirm UX as practical, plus credentials and performance. Keep Donkey available as fallback until explicitly signed off. Do not mistake Home Connect pairing for fully integrated Eldoret appliance control.


### 18 November 2026 ~20:49 GMT — Bulldog reboot recovery SUCCESS; Donkey trial retirement approved
- **User-confirmed after instructed `sudo reboot` on Bulldog:** `Yep all good!` meaning Bulldog rebooted, browser Eldoret returned at `http://10.0.0.39:8765`, and previously requested quick checks of Hue, Sky Q and DrayTek readings were satisfactory. This is user-reported acceptance, not independent device-log validation; no elapsed recovery time measured.
- **Core migration milestone reached:** DietPi 10.8.2 / Python 3.13.5 on Pi 3 B, service enabled/running, private environment migrated securely, dashboard served by Bulldog, physical Hue control and Sky Q controls previously tested successfully, SNMPv3 DrayTek WAN telemetry recovered after adding `10.0.0.39/32` as permitted manager, and successful reboot autostart observed.
- **Donkey decision:** user may now gracefully power down Donkey as a **trial retirement**, retaining its filesystem, service, configuration and credentials unmodified as immediate rollback. Do NOT delete, wipe, repurpose or claim all integrations tested. Note that switching from Donkey `10.0.0.27` to Bulldog `10.0.0.39` may require updating saved browser/Tailscale links and remote endpoints. Distinct dashboard URL remains `http://10.0.0.39:8765`.
- **Outstanding before full final sign-off:** hands-on Velux, LG TV(s), UniFi detailed metrics, remote/Tailscale reachability, fixed 16:9 CONFIRM safeguarding, printer/appliances and long-term stability; small physical touchscreen still blank and deferred; watchdog heartbeat hearts/alert strip not fully live-tested; Mac Airlite audio independent and untested. Retain original Pi SD cards and Rivendell archive.


### 18 Nov 2026 ~20:52 GMT — Bulldog legacy touchscreen diagnostics (read only)
- **VERIFIED from user's SSH screenshot:** `/sys/class/drm/` does **not** exist (`ls: cannot access...`); `/dev/fb0` **does** exist. `grep` in `/boot/firmware/config.txt` shows `#dtoverlay=vc4-kms-v3d,noaudio` (commented out) and `dtoverlay=disable-wifi` (active). No matching settings shown from `/boot/config.txt`.
- **Interpretation not yet verified:** generic framebuffer exists but does not establish that the attached touchscreen is recognized or powered; no DRM/KMS device reported. Display interface/driver not identified yet. Avoid changing dtoverlays or rebooting production Bulldog until display wiring/model and framebuffer identity are checked. Original small-screen photo shows ribbon/driver board, not yet confidently classified as HDMI/DSI/SPI.
- **Next safe checks:** read `/sys/class/graphics/fb0/name`, `virtual_size` and `bits_per_pixel`; inspect output of `dmesg` filtered for HDMI/DSI/panel/fb/drm and screen hardware/model if labelled. Keep Eldoret `10.0.0.39:8765` operational while testing.


### 18 November 2026 21:02 GMT — Bulldog touchscreen backlight readings verified
- **VERIFIED from user's Bulldog SSH transcript:** `/sys/class/backlight/rpi_backlight/brightness` = `255`, `max_brightness` = `255`, `bl_power` = `0` (enabled), `actual_brightness` = `255`.
- Combined earlier facts: framebuffer `/dev/fb0` BCM2708 FB at 800x480x16, kernel enumerates `raspberrypi-ts` touch device and `rpi_backlight`, no `/sys/class/drm/`, KMS overlay disabled, 7-inch DSI overlay file exists; display still visually blank as reported.
- **Interpretation:** driver reports backlight enabled/full, but physical LCD brightness/panel signal not verified. Do not assume brightness issue or blindly enable overlays on live Eldoret controller. Suggested safe next test: temporarily change brightness and restore in same command to see if actual panel responds. If no physical response, inspect power/wiring/model and boot config carefully before graphics changes.


### 18 November 2026 ~21:16 GMT — Dual KMS overlay screen test unsuccessful
- **USER VERIFIED:** After backing up `/boot/firmware/config.txt` to `/boot/firmware/config.txt.before-screen`, appended `[all]`, `dtoverlay=vc4-kms-v3d`, and `dtoverlay=vc4-kms-dsi-7inch`, then rebooted Bulldog, **Eldoret still works perfectly** at `10.0.0.39:8765` but **the attached screen remains fully blank**. Do not claim screen fixed.
- No desktop was installed. The exact screen model/DSI variant is still not definitively known; overlays are appropriate for original official 7-inch Raspberry Pi display, not necessarily all similar panels.
- **Next non-destructive diagnostic:** check post-reboot `/sys/class/drm`, framebuffer identity/resolution and filtered kernel `drm/vc4/dsi/panel/backlight` messages. Avoid further boot edits until the result. Preserve `/boot/firmware/config.txt.before-screen` for rollback; do not unnecessarily disrupt now-production Eldoret service.


### 18 November 2026 21:25 GMT — KMS overlay attempt duplicated; driver still absent
- **VERIFIED from user's pasted complete shell transcript:** the append command `printf '\n[all]\ndtoverlay=vc4-kms-v3d\ndtoverlay=vc4-kms-dsi-7inch\n' | sudo tee -a /boot/firmware/config.txt` was run **twice**. The `config.txt.before-screen` backup exists (2724 bytes; original timestamp 19:02). At subsequent diagnostic, `/sys/class/drm` absent; `/sys/class/graphics/fb0/name` still `BCM2708 FB`, `virtual_size` `800,480`; `dmesg | grep -Ei 'drm|vc4|dsi|panel|backlight'` produced no lines. User had reported Eldoret remained working after reboot, screen blank.
- **Interpretation:** appended overlay text has not yielded an active DRM/KMS driver; duplicate blocks need safe clean-up, but do not make further boot changes until kernel/module and effective boot config diagnostics. May be incorrect timing of reboot relative to duplicate append; do not presume both blocks were active at last boot.
- **Next read-only check recommended:** `uname -r`, `modinfo vc4`, `grep -nE '^\\[|dtoverlay=|display_auto_detect=|framebuffer_|max_framebuffers=' /boot/firmware/config.txt`, and `findmnt /boot/firmware` to establish kernel support, conflicting settings, and actual mounted boot partition. Preserve the original backup and keep house controller uninterrupted.


### 18 November 2026 21:26 GMT — Screen boot configuration inspection
- **User-verified terminal results:** running kernel `6.18.60+rpt-rpi-v8`; `modinfo` unavailable (`command not found`, so no conclusion about kernel driver availability); `/boot/firmware` is the real mounted VFAT boot partition from `/dev/mmcblk0p1` and is read/write. `config.txt` contains commented `#dtoverlay=vc4-kms-v3d,noaudio` line 89, active `dtoverlay=disable-wifi` line 91, then duplicated `[all]` overlay pairs at lines 93–95 and 97–99: `dtoverlay=vc4-kms-v3d`, `dtoverlay=vc4-kms-dsi-7inch` twice.
- The previous post-reboot `BCM2708 FB` framebuffer and missing `/sys/class/drm` suggest KMS was not active during that reading. Do not assume the duplicate lines themselves are the cause or that the panel was actually driven. DietPi March 2026 developer thread distinguishes legacy 800x480 framebuffer settings from modern KMS/DRM; panel model still uncertain.
- **Next safe read-only diagnostic:** enumerate `/lib/modules/$(uname -r)` vc4/drm files and read `/proc/cmdline` for modesetting overrides. Once understood, clean duplicate overlay blocks using preserved `/boot/firmware/config.txt.before-screen` backup and one known configuration, then reboot only in a controlled maintenance window. Working Eldoret controller remains highest priority.


### 18 Nov 2026 21:27 GMT — VC4 kernel module confirmed present, legacy framebuffer bootargs
- **Verified from user's Bulldog shell output:** kernel `6.18.60+rpt-rpi-v8` contains `/lib/modules/6.18.60+rpt-rpi-v8/kernel/drivers/gpu/drm/vc4/vc4.ko.xz` as well as DRM supporting modules. Overlay files available include `vc4-kms-v3d.dtbo`, `vc4-kms-dsi-waveshare-800x480.dtbo`, and other vendor DSI variants. This confirms driver files are installed, **not that module loaded or that panel variant matches**.
- `/proc/cmdline` includes `bcm2708_fb.fbwidth=800 bcm2708_fb.fbheight=480 bcm2708_fb.fbdepth=16 bcm2708_fb.fbswap=1`, together with standard DietPi boot options. Those legacy framebuffer bootargs are not alone proof KMS is disabled; can reflect firmware-generated settings. Do not edit `/proc/cmdline` or assume removal of those arguments fixes the LCD.
- Previously: no `/sys/class/drm`, `BCM2708 FB`, screen blank, dual KMS overlays duplicated in `/boot/firmware/config.txt`, Eldoret works. Need check actual loaded modules (`lsmod` / `/proc/modules`) and firmware overlay load errors before further config changes. Preserve backup `/boot/firmware/config.txt.before-screen`; no more blind reboots or hardware wiring changes.


### 18 November 2026 21:30 GMT — VC4 modprobe dry-run successful
- **VERIFIED from user's `sudo modprobe -n -v vc4` output:** `modprobe` resolves graphics dependencies and would load `/lib/modules/6.18.60+rpt-rpi-v8/kernel/drivers/gpu/drm/vc4/vc4.ko.xz`, including DRM and sound dependencies. The `-n` flag made this a simulation; it **does not verify module actually loading, binding to hardware, rendering output or detecting the panel**.
- `fb0`, `fbcon` only in `/sys/class/graphics`; no active DRM seen previously. Dual `[all]` `dtoverlay=vc4-kms-v3d` and `vc4-kms-dsi-7inch` blocks remain in boot config; preserve `config.txt.before-screen` backup.
- **Next safe inspection:** search `/etc/modprobe.d`, `/etc/modules-load.d`, `/boot/firmware/cmdline.txt` for VC4 blacklisting/modesetting blocks, inspect `journalctl -b -k` for VC4/DRM/DSI/overlay/panel warnings. Do not force-load driver or reboot until reason for absent KMS is understood; Eldoret remains production on Bulldog.


### 18 Nov 2026 21:32 GMT — Manual VC4 load creates DRM sysfs, but no card/connector
- **Verified from user terminal transcript:** `sudo modprobe vc4` returned without visible error. `ls /sys/class/drm/` then listed only `version`; no `card0` or registered DRM connectors. Before load, `/sys/class/drm` was absent entirely.
- **Interpretation:** driver module can be loaded but no usable display device has registered; NOT proof that DSI hardware is recognised or LCD is faulty. Need inspect post-load `lsmod` and kernel `dmesg` for device-tree/DRM/DSI errors. Do not append another overlay; two duplicate `[all]` blocks already present, and original `config.txt.before-screen` backup exists.
- Production Eldoret at `10.0.0.39:8765` was previously verified; manual modprobe has not been followed by a fresh user-confirmed Eldoret health check.


### 18 November 2026 22:29 GMT — Bulldog local graphical Eldoret SUCCESS
- **User-confirmed:** DietPi LXDE desktop now appears on physical HDMI Acer monitor after installation of LXDE and Chromium and selection of DietPi AutoStart option 2 (automatic desktop login as `dietpi`). Earlier headless framebuffer text and HDMI attempts did not display a usable picture. Original ribbon-connected DSI touchscreen remains unverified/blank.
- **User-confirmed direct browser test ON Bulldog:** both `http://127.0.0.1:8765` and `http://10.0.0.39:8765` resolve to working Eldoret dashboard in Chromium, and user successfully changed the Sky Q channel from Bulldog's physical GUI. This is a functional end-to-end controller UI test, not just status.
- **NEXT:** verify Chromium fullscreen with F11, then configure reliable unattended Chromium launch at boot in a single window/kiosk mode after testing memory, and check Eldoret system service autostarts independently. Preserve service credentials and do not run browser as root. Need still test DSI panel model/driver separately. Investigate long-term Chromium memory demand on 1 GB Pi 3.


### 18 November 2026 23:52 GMT — FINAL HANDOVER / DECISION FOR THURSDAY 19 NOVEMBER

**DECISION AGREED WITH USER (supersedes earlier advice to retain DietPi or buy a new SD card):** Stop pursuing DietPi as the final OS for Bulldog. Preserve its connector/data and replace it with **Raspberry Pi OS (32-bit) with Desktop**, on the **same new ~64GB SD card**. No purchase of another SD card. No further Donkey work unless truly unavoidable emergency fallback. User explicitly agrees to execute the backup and restore plan in exact order, including two independently verified backups, before any erase.

**Validated evening achievements (do not lose):**
- Bulldog is a Raspberry Pi 3 Model B, hostname \`bulldog\`, DietPi 10.8.2 with Python 3.13.5, installed on ~64GB SD card.
- Functional Eldoret installation on DietPi: \`/home/dietpi/eldoret-connector/\` (including \`manager.py\`, \`connector.py\`, \`device-registry.json\`, \`unifi/\`, \`router-snmp/\`, \`remote-tunnel.json\`, \`skyboxremote.py\`, etc.) and private \`/home/dietpi/.config/eldoret.env\` (chmod 600). Do not publish any secrets. Running as non-root \`dietpi\`.
- \`/etc/systemd/system/eldoret.service\`: enabled system service, \`EnvironmentFile=/home/dietpi/.config/eldoret.env\`, \`ExecStart=/usr/bin/python3 /home/dietpi/eldoret-connector/manager.py\`, \`Restart=always\`, \`RestartSec=5\`. Manager refreshes connector code from GitHub. It successfully recovered after multiple deliberate reboots earlier in the evening.
- The original stable wired address is **10.0.0.39**, wired Ethernet MAC **B8:27:EB:19:5D:BD**, reserved in DrayTek. Physical Hue commands, Sky Q controls (including channel changes from Chromium ON Bulldog), 2/2 Hue bridge status, dashboard, PlayStation status, four Wi-Fi access points, printer status, and DrayTek encrypted SNMP WAN readings were verified before Wi-Fi changes. Router SNMPv3 manager access list was changed to allow BOTH Donkey \`10.0.0.27/32\` and Bulldog \`10.0.0.39/32\` (SHA/AES preserved). Working dashboard at \`http://10.0.0.39:8765\` and from local Chromium \`http://127.0.0.1:8765\` while wired.
- LXDE and Chromium installed and **HDMI desktop works**; desktop autostart DietPi option 2 for \`dietpi\`. But local Chromium was **very laggy** on the Pi 3 (1GB RAM); remote browser UI on Mac/PC fast. Do not require local heavyweight Chromium to run continuously if unnecessary.
- Little ~800x480 ribbon-connected DSI touchscreen remained entirely blank under DietPi even though touch \`raspberrypi-ts\`, framebuffer \`BCM2708 FB\`, and \`rpi_backlight\` were reported. Extensive KMS overlay trials failed; NO working DSI output under DietPi. **DECISIVE CONTROL TEST:** user safely booted Pi with **original motorhome SD card** (NOT Rivendell), and the exact same mini touchscreen worked perfectly with existing hardware/cables/power. On reinserting DietPi card the mini screen was completely blank again. This strongly localises the display issue to OS/boot config, not panel hardware. Preserve motorhome card completely unchanged.
- **Last networking state is uncertain / partial outage.** After enabling onboard Wi-Fi in DietPi (initial boot config had \`dtoverlay=disable-wifi\`) and configuring SSID, DietPi prompted to turn Ethernet off; Mac SSH to \`10.0.0.39\` timed out. Local LXDE on Bulldog still ran and showed \`IP: 10.0.0.34\`, *possibly Wi-Fi* but interface not independently verified. User could not reconnect to \`10.0.0.39\`, and DietPi-Config warned about concurrent execution on an abandoned SSH terminal. Attempting to kill old PIDs returned "No such process" — stale processes likely exited. **DO NOT ASSUME ELDORET REMAINS REMOTELY ACCESSIBLE AFTER THIS CHANGE.** Verify network/connector on working card if feasible before image capture, but do not destabilise it further. No need to power Donkey on.
- DietPi boot settings were edited during display tests, including a preserved \`/boot/firmware/config.txt.before-screen\` backup, subsequent duplicated overlays, and later HDMI test settings; current final config contents not freshly verified. Full disk image should capture actual last state, and standalone archive should contain all important configuration.
- Previous notes mention **Rivendell** audio collection and Donkey, but neither is needed for this rebuild; do not confuse original motorhome touchscreen card with Rivendell.

**FIRST TASK TOMORROW — BACKUP GATE (MANDATORY):**
1. With Bulldog powered down **properly**, remove its **DietPi 64GB SD card** and attach to Mac with card reader. Check Mac free space sufficient for raw SD image (nominal card capacity ~64GB) **plus** separate archive. Check actual card device carefully; never confuse with Mac internal drive or motorhome card.
2. Create a **complete restorable byte-for-byte disk image** of Bulldog's DietPi SD card on the Mac. Use a proven workflow appropriate to macOS, avoiding destructive commands. Prefer GUI imaging if viable. Verify image file exists, plausible size, checksum, and readable partition layout; note raw image may occupy ~64GB even if only a little space is used inside partitions. Store safely outside the SD card.
3. Independently export a **separate Eldoret application/configuration backup** to the Mac (NOT just rely on full disk image). Include entire \`/home/dietpi/eldoret-connector\`, \`/home/dietpi/.config/eldoret.env\`, \`/etc/systemd/system/eldoret.service\`, any additional dependencies/secrets, runtime service/unit metadata, device registry, router SNMP and UniFi settings, remote tunnel settings as appropriate. Preserve file permissions and owner metadata; never paste private file contents into chat or upload to public GitHub. Because Mac cannot natively read ext4 on SD card, determine extraction method **before wiping**: either temporarily boot Bulldog with DietPi card and transfer encrypted archive over local network/USB to Mac, or use trustworthy ext4 read tooling or a VM; could also archive from Bulldog to external USB storage and copy to Mac. DO NOT pretend merely mounting the small FAT boot partition exposes \`/home/dietpi\`. Verify archive contents by listing expected paths and hashes without revealing secrets.
4. **Hard stop:** Do not erase/reflash SD until BOTH backup #1 full image and backup #2 standalone Eldoret archive exist, are accessible from Mac, and have passed appropriate checks. Record actual Mac paths and checksums privately/in handover only if non-sensitive. If cannot safely make standalone archive, pause and resolve before wiping; do not resort to Donkey unless user explicitly agrees.

**AFTER TWO VERIFIED BACKUPS:**
5. Use **Raspberry Pi Imager** to write Raspberry Pi OS **32-bit with Desktop** to the **same 64GB Bulldog SD card**. Set hostname \`bulldog\`, credentials, SSH, Wi-Fi SSID/country in Imager if supported. Ensure DrayTek reservations/IP choice do not conflict; wireless MAC differs from Ethernet. Validate Pi 3 compatibility and preserve old motorhome SD card.
6. **FIRST TEST after boot:** Does physical ribbon DSI touchscreen show graphical desktop? Also verify HDMI and Wi-Fi/SSH and identify current IP before installing the connector. If screen blank, compare working motorhome SD boot config/device support rather than broad speculative modifications.
7. Restore Eldoret from **standalone archive on Mac** (not Donkey) using a repeatable, preferably **single scripted restoration** with safety checks, correct Python dependencies and package prerequisites (\`snmp\`/Net-SNMP for DrayTek; any system-specific utilities such as cloudflared must be ARM-compatible rather than copied x86 binaries). Put secrets at restricted permissions; recreate systemd service for correct new username/paths, preserving non-root identity. Check manager's GitHub pull/restart behaviour. Keep private settings out of GitHub.
8. Functional tests: dashboard locally and remotely, Hue physical switching, Sky Q real command, SNMP WAN readings, UniFi 4 AP visibility/detail, TV/Velux and other integrations as practical, CONFIRM controls, automatic service recovery after reboot; verify no conflicts between LXDE/Chromium and system service, and reasonable RAM load. Avoid long-running browser if Pi too slow; the primary web server must remain responsive.
9. Once verified, finish kiosk/Engine Room display and postponed animated heartbeat/status on Network tab and global alert propagation. Two dishwashers (Bosch + Siemens/Home Connect) and migrating UniFi management off intermittently powered Mac remain future tasks. UniFi controller server should NOT be loaded on Pi 3 with 1GB alongside Eldoret and desktop without careful resource analysis.

**NEXT USER PROMPT:** "Morning Dano — let's rebuild Bulldog. Start with backup one." Start by checking Mac disk space/card mounting and preparing full disk image, then separate private Eldoret export. ONE CLEAR ACTION AT A TIME, GUI FIRST where possible, no repetitive speculative diagnostics. Do not claim backups already made: **as at this entry, neither of the two required backups is complete**. User agreed to perform both tomorrow.

**Decision ownership:** User explicitly rejected buying a new SD card, accepted reusing the new Bulldog card after two verified backups, and wants **zero further work using Donkey**. Keep this explicit and stable across new chats.


### 19 Nov 2026 09:53 GMT — Bulldog TWO BACKUPS REPORTED CREATED AND VERIFIED (user's Mac, not uploaded to GitHub)
- **Backup 1:** User made raw byte-for-byte DietPi SD image using macOS `sudo dd if=/dev/rdisk2` after moving USB card reader to a different USB-C port; first attempt failed at ~449 MB and was renamed incomplete. Successful image saved at `/Users/bulln80/Documents/Bulldog-Backups/Bulldog-DietPi-2026-11-19.img` with exact 63,864,569,856-byte size matching original physical card. Its SHA-256 is `faba26876c1b9069040aeaec401677a692b5861972566d72da0243cf17e9f081`. macOS `hdiutil attach -readonly -nomount` recognized FDisk partition map, FAT32 (`disk4s1`) and Linux (`disk4s2`); virtual image then detached. **Caveat:** full source-vs-image hash comparison and test restore were not performed; these are structural / file-read checks, not proof all source sectors match.
- **Backup 2:** User booted existing DietPi SD on Bulldog, HDMI LXDE GUI works, SSH accessible at `10.0.0.34` (wireless likely but interface not explicitly verified). Created `/home/dietpi/eldoret-migration-2026-11-19.tar.gz` via `sudo tar -C / -czpf` of `home/dietpi/eldoret-connector`, `home/dietpi/.config/eldoret.env`, `etc/systemd/system/eldoret.service`; size ~19MB, chmod 600. macOS SCP/SFTP failed because server lacks `/usr/lib/sftp-server`, and `scp -O` failed because Bulldog lacks `scp`; transferred successfully over `ssh dietpi@10.0.0.34 'cat ...' > ...` to `/Users/bulln80/Documents/Bulldog-Backups/eldoret-migration-2026-11-19.tar.gz`. `tar -tzf` passed; five paths confirmed: `device-registry.json`, `connector.py`, `manager.py`, `.config/eldoret.env`, `etc/systemd/system/eldoret.service`. Mac SHA-256 and Bulldog source SHA-256 both exactly `96e91573f5a51ffd6b91697152d920ca1dc825c187776da88d3d1b6fcd2c2c5e`. This establishes archive transfer identity. **Security to do:** Mac copy was initially `-rw-r--r--`; chmod 600 recommended. Never commit archives or secrets to GitHub.
- **NEXT immediate step:** securely set permissions of local archive to 600, capture runtime dependency inventory (without printing secret values), and check for configuration files outside these three archived paths BEFORE reflashing. Keep original backup images on Mac. Reflash only when complete; install Raspberry Pi OS (32-bit) with Desktop on same SD card, then restore using archive. Donkey should not be used.


### 19 Nov 2026 10:31 GMT — NEW Raspberry Pi OS SCREEN SUCCESS
- User wrote Raspberry Pi OS (32-bit) with Desktop (Debian Trixie, selected image dated 2026-10-06) to SAME Bulldog SD card using Raspberry Pi Imager v2.0.12, after checked full image and Eldoret archive backups on Mac. Imager summary included Pi 3, configured hostname, localisation, user, Wi-Fi, SSH enabled, Raspberry Pi Connect enabled; chosen username was intended `dietpi`, but not independently verified after boot.
- First boot performed with HDMI unplugged, original ribbon-connected 800x480 mini touchscreen connected. **USER CONFIRMED 'screen is working'**. This conclusively supports the OS/config compatibility diagnosis; do not waste time repeating old DietPi display diagnostics.
- **Next:** confirm whether the Raspberry Pi desktop is visible and touch input works; verify Wi-Fi reachability and actual IP, SSH and Connect; then restore separately backed-up Eldoret app using Mac archive `/Users/bulln80/Documents/Bulldog-Backups/eldoret-migration-2026-11-19.tar.gz` checksum `96e91573f5a51ffd6b91697152d920ca1dc825c187776da88d3d1b6fcd2c2c5e`. Validate hostname/account, Python and systemd path; dependencies such as `snmpget`. Restore carefully without publishing secrets. Crucially **Eldoret NOT YET RESTORED** at this checkpoint. Full DietPi image still on Mac, not on the SD card.


### 19 Nov 2026 11:33 GMT — Eldoret RESTORED and major live integrations verified on Raspberry Pi OS
- User restored verified 19MB archive to new Raspberry Pi OS desktop installed on same card. SSH accessible as `dietpi@10.0.0.34`; verified host ED25519 fingerprint matched physical Pi and replaced stale Mac SSH host key. Network IP `10.0.0.34` now reserved in DrayTek. Original ribbon-connected touchscreen works.
- Extracted `/home/dietpi/eldoret-connector` and `/home/dietpi/.config/eldoret.env`, preserving credential mode 600, restored `/etc/systemd/system/eldoret.service`. Python 3.13.5, Git 2.47.3, Net-SNMP 5.9.4.pre2 confirmed. Service started: `manager.py` and `connector.py` active (systemd) and user subsequently enabled startup: `is-enabled=enabled`, `is-active=active`. **Reboot persistence NOT YET TESTED**.
- Dashboard responds at `http://10.0.0.34:8765`; Hue and Sky Q real device controls USER CONFIRMED working perfectly.
- DrayTek SNMP manager IPv4 `/32` access list now includes `10.0.0.34` (old `10.0.0.27` also shown), and screenshot at 11:33 shows Internet DrayTek card `CONNECTED`, WAN2 live download 8.10 Mbps and upload 0.53 Mbps, updates every 5 seconds. Actual rates are a point-in-time observation.
- **NEXT:** controlled reboot `sudo reboot` and verify mini touch screen, `http://10.0.0.34:8765`, `systemctl is-active eldoret`, router statistics, Hue/Sky Q. Afterward explore Pi Connect sign-in and configure lightweight mini-screen engine-room view; note Pi 3 browser lag and 1GB RAM. Do not declare fully commissioned before reboot test and other integration checks. Preserve Mac backups and avoid Donkey.


### 19 Nov 2026 11:40 GMT — AUTO-REBOOT RECOVERY VERIFIED; UI SCALING DEFECT
- User confirmed Eldoret dashboard loads **automatically after Bulldog reboots** on Raspberry Pi OS (32-bit); no manual service intervention, and user successfully **changed a Sky Q channel after reboot**. Thus systemd autostart and control path passed a real end-to-end reboot test. Mini DSI touchscreen previously confirmed working on new OS. Hue and DrayTek verified before this reboot; recheck if final commissioning needs it.
- User screenshot of Eldoret Sky Q controls after shrinking page shows **ugly/nonresponsive button scaling**: boxes have overly heavy outlines, narrow/cramped rectangular buttons, tiny/misaligned labels, and poor spacing when browser zoom reduces. **Follow-up:** implement responsive compact layout for Sky Q remote controls at small widths, preserve existing desktop appearance and usable touchscreen touch target sizes, prevent icon/label clipping, avoid treating browser zoom as the fix. Relevant screenshot provided by user this turn, not stored in repo. Remember goal of a lightweight 800x480 touch Engine Room / heartbeat kiosk; dashboard UI may differ from dedicated monitoring display.
- Raspberry Pi Connect is enabled in Imager but its actual remote access/login is not yet user-tested. Next commissioning: test Connect and design/install dedicated low-resource Engine Room screen; avoid heavy always-on browser if performance problematic on 1 GB Pi 3.


### 19 Nov 2026 11:42 GMT — Raspberry Pi Connect REMOTE DESKTOP VERIFIED
- User screenshot clearly shows live Raspberry Pi Connect web session for Bulldog, with the remote Raspberry Pi desktop, 'Disconnect', 'Enter full screen', 'Copy from remote', and 'Paste to remote' controls visible. Therefore **remote graphical desktop through Raspberry Pi Connect works**, not merely installed/enabled. Useful for away-from-home maintenance without local keyboard/mouse. Do not assume remote Terminal feature or unattended availability after the next reboot has been separately tested.
- Next task: preserve working baseline; design lightweight 800x480 dedicated Eldoret Engine Room heartbeat display, consider kiosk/browser overhead on Pi 3 1GB and Raspberry Pi Connect's graphical session requirements. Sky Q UI responsive scaling defect recorded separately.


### 19 Nov 2026 12:13 GMT — DIRECT UniFi AP SNMPv3 PROVEN without Mac controller
- Four UniFi APs on DrayTek reserved IPs: Office/Kitchen `10.0.0.6`, Utility `10.0.0.7`, Garden `10.0.0.8`, Landing `10.0.0.9`. Bulldog pinged all 4 with 0% loss (three probes each); mean latency 6.921ms, 4.054ms, 4.751ms, 15.411ms respectively. These are snapshots.
- UniFi Network Server 8.1.127 on Mac had SNMP disabled. User enabled SNMPv3 in UniFi settings and set private dedicated `eldoret-monitor` credentials. **NEVER place SNMP password in GitHub or chat.** A test from Bulldog using `snmpget -v3 -l authPriv -u eldoret-monitor -a SHA -x AES` (same private password for authentication/privacy) succeeded directly against `10.0.0.6`, returning `iso.3.6.1.2.1.1.3.0 = Timeticks: (259752100) 30 days, 1:32:01.00`. This proves direct authenticated encrypted SNMP response, independent of actively querying the controller (though AP provisioning of SNMP settings was done via controller). It is SNMP-agent uptime, not guaranteed identical to device boot time.
- NEXT: probe all four APs via secure SNMPv3; enumerate supported read-only standard MIB OIDs for interface counters/identification and any supported clients/radio statistics, then implement low-resource direct collector on Bulldog with private protected credentials, bounded polls, cached history, direct heartbeats and alert detection. Preserve existing Eldoret as stable; do not move heavy UniFi server onto Pi 3 1GB. Do not assume all fields are available from SNMP. If no further stats supported, ping+uptime baseline still usable.


### 19 Nov 2026 12:14 GMT — ALL FOUR UniFi AP SNMPv3 queries confirmed
- Bulldog queried each reserved AP directly using authenticated encrypted SNMPv3, separate `eldoret-monitor` credentials (password NOT stored in GitHub): Office/Kitchen `10.0.0.6` -> Timeticks 259756800 = 30d 1h32m48s; Utility `10.0.0.7` -> 259758700 = 30d 1h33m07s; Garden `10.0.0.8` -> 1545242200 = 178d20h20m22s; Landing `10.0.0.9` -> 1545201300 = 178d20h13m33s. All 4 responded. These are SNMP agent uptime snapshots, not necessarily hardware boot uptimes. Combined with all 4 responding to ping, this establishes controller-independent direct monitoring is feasible. NOT YET incorporated into Eldoret Network tab as continuous polling.
- Suggested next action: query read-only standard MIB system identification/interface list, assess supported metrics, create a low-overhead collector using SNMPv3 protected credentials, with bounded polling and no secrets in shell history/public repo. Avoid extra always-on server and keep Pi3 resources under control.


### 19 Nov 2026 12:15 GMT — UniFi identity and firmware over direct SNMPv3
- User confirmed direct `snmpget` results on Bulldog for OIDs `1.3.6.1.2.1.1.1.0` (sysDescr) and `1.3.6.1.2.1.1.5.0` (sysName), authenticated/encrypted SNMPv3 (Mac-hosted controller not used to answer):
  - `10.0.0.6`: `UAP-AC-Pro-Gen2 6.8.2.15592`, `OfficeKitchen`
  - `10.0.0.7`: same model/firmware, `Utility`
  - `10.0.0.8`: same model/firmware, `Garden`
  - `10.0.0.9`: same model/firmware, `Landing`
- Thus all four APs expose direct identity, firmware and SNMP agent uptime. Next read-only investigation: discover standard IF-MIB/ifXTable counters and interfaces (without uncontrolled full MIB walks); determine whether client counts / radio metrics exist before claiming. Direct monitoring dashboard still not implemented.


### 19 Nov 2026 12:18 GMT — Office/Kitchen UniFi IF-MIB interface enumeration via direct SNMPv3
- User ran `snmpwalk` for IF-MIB `ifName` OID `1.3.6.1.2.1.31.1.1.1.1` against `10.0.0.6`, returning indexed interfaces: `1 lo`, `2 eth0`, `3 teql0`, `4 wifi0`, `5 wifi1`, `6 wifi0ap0`, `7 wifi0ap1`, `8 wifi0ap2`, `9 vwiresta3`, `10 wifi1ap4`, `11 wifi1ap5`, `12 wifi1ap6`, `13 vwireap7`, `14 br0`. Index assignments are confirmed **only for Office/Kitchen**; do not assume other APs share indices without checking.
- Next read-only test: SNMPv3 ifHCInOctets `.1.3.6.1.2.1.31.1.1.1.6.2` and ifHCOutOctets `.1.3.6.1.2.1.31.1.1.1.10.2` (eth0 index 2). If supported, sample twice over time and calculate byte counter deltas per second, treating ingress/egress directions relative to AP interface, not WAN speeds. No continuous collector built yet.


### 19 Nov 2026 12:21 GMT — UniFi Ethernet 64-bit traffic counters confirmed
- User ran direct authenticated/encrypted SNMPv3 on Office/Kitchen AP `10.0.0.6`, `eth0` interface index 2, obtaining `ifHCInOctets` `.1.3.6.1.2.1.31.1.1.1.6.2` = `Counter64: 790737130` and `ifHCOutOctets` `.1.3.6.1.2.1.31.1.1.1.10.2` = `Counter64: 2983040888`. These are cumulative octet totals, not Mbps. To calculate per-interface Mbps: `(delta_octets * 8) / elapsed_seconds / 1e6`; handle counter reset or device restart. In/out labels are relative to AP eth0 interface. Need verify indices on other APs and do two timed samples before claiming real-time bandwidth. Direct controller-free monitoring now proven for AP ping, SNMP identity, uptime, ifName, and these two counters. Credentials must remain private and not checked into repo.


### 19 Nov 2026 12:23 GMT — FIRST measured live UniFi AP Ethernet throughput
- User took two direct SNMPv3 samples from Office/Kitchen `10.0.0.6` `eth0` (interface index 2), read-only authenticated+encrypted. SAMPLE 1 12:22:44: ifHCInOctets=866535007; ifHCOutOctets=2986944926. SAMPLE 2 12:22:55: ifHCInOctets=871214606; ifHCOutOctets=2987069954. Delta in=4,679,599 bytes; out=125,028 bytes; over observed timestamp difference 11 sec -> mean in=3.4033447 Mbps, out=0.0909295 Mbps. Direction is **relative to AP eth0**, do not label as internet download/upload; packet throughput is not necessarily wireless-only. Note shell `sleep 10` plus SNMP overhead led to 11 sec wall timestamps. Live background collector and dashboard not yet implemented. Next validate ifIndex on other 3 APs, set secured credential storage, polling and counter reset handling, then integrate into Eldoret. Never publish auth secrets.


### 19 November 2026 ~12:25 GMT — Direct UniFi monitoring implementation committed, activation pending
- User explicitly requested complete implementation and nice UniFi UAP-AC-Pro imagery. GitHub repository nickabull/Eldoret-Home-Automation commits:
  - bce1a3e2 connector.py: encrypted direct SNMPv3 of four APs in parallel; cache; ping latency; system/firmware/uptime; ifHCIn/Out eth0 rates when interface index2 confirms eth0; 5-minute history and outage transitions persisted locally to unifi/direct-history.json. Falls back to old Mac-hosted UniFi controller path when no private config is set.
  - 38131676 network.html: responsive 4-card heartbeat UI, AP photo from media.s-bol.com/lWrXynKBVEzM/r0E4vJW/1198x1200.jpg, latency/throughput/uptime/firmware; reduced-motion support; old controller UI fallback.
  - 8ed06521 index.html: clarify that detailed direct monitoring is available.
- **NOT YET VERIFIED RUNNING ON BULLDOG:** The private Net-SNMP config must be created locally at /home/dietpi/eldoret-connector/unifi/snmp.conf with chmod 600, parent directory chmod 700. Contents should use defSecurityName eldoret-monitor, defSecurityLevel authPriv, defAuthType SHA, defPrivType AES, defPassphrase of the private SNMPv3 password supplied interactively by user (never in GitHub or chat). Connector subprocess sets SNMPCONFPATH to that directory. Test from Bulldog with SNMPCONFPATH and snmpget without -A or -X; syntax-check connector and verify service remains active; inspect /api/unifi/status and Network tab. Existing manager.py polls connector.py from GitHub every 30 sec and will restart it on code update. Protect operational baseline. Archive sensitive local configuration into fresh private backup after successful activation.


### 19 Nov 2026 ~12:58 GMT — UniFi Network tab live; Ethernet parsing fixed
- User screenshot confirms the direct SNMPv3 UniFi cards render all 4 APs with matching AC Pro imagery, uptime, firmware, and latency: 4/4 responding. New dashboard is live at `http://10.0.0.34:8765/network.html`, no UniFi Network Server required for these readings.
- Screenshot showed all cards saying `Ethernet interface index differs; traffic not reported` despite previously confirmed eth0 index2. Root cause in connector parser: `iface.strip().strip('"')` incorrectly removes only the trailing quote of `STRING: "eth0"`, never matching. Corrected check to split at `:` and strip quotes; committed `d4351656` to `nickabull/Eldoret-Home-Automation` connector.py. Manager auto-updates within ~30 sec and restarts connector. **Await user verification that Mbps appears after two polling cycles**; traffic counters are per-AP eth0 and directions are relative to AP. Preserve secure SNMP private config on Bulldog.


### 19 Nov 2026 12:59 GMT — DEDUPLICATED UniFi AP cards in Eldoret Network UI
- User screenshot showed Wi-Fi APs duplicated: four generic inventory `Your devices` cards and four detailed direct-SNMP cards. In `nickabull/Eldoret-Home-Automation`, removed the 4 UniFi AP entries ONLY from the `network` group in `devices.js` commit `65ea81fb`. Preserved other general device cards (DrayTek, Hue bridges, Pi, etc.) and detailed UniFi monitored cards. Bumped `network.html` `devices.js?v=14` to `v=15` commit `bf279b20` to invalidate browser cached version. User needs refresh at `http://10.0.0.34:8765/network.html` to verify. Screenshot also still showed old `Ethernet interface index differs` note; corrected parsing was committed just before screenshot and could have been stale; verify after fresh poll and two counter samples; do not claim Mbps fixed before user confirms. Once verified, revisit 16:9 compact layout if needed.


### 19 Nov 2026 13:03 GMT — ALL FOUR UNIFI AP TRAFFIC RATES LIVE, USER VERIFIED
- User screenshot of `/network.html` now shows all four detailed UniFi SNMPv3 AP cards responding and **numeric live eth0 in/out Mbps** (earlier interface parser fixed successfully): Office/Kitchen 0.56 / 0.10 Mbps, Utility 0.01 / 0.01 Mbps, Garden 0.02 / 0.01 Mbps, Landing 16.34 / 0.37 Mbps; latencies around 5.9, 6.7, 5.6, 6.4 ms respectively. Snapshot as of 13:03 GMT, NOT persistent speeds. All show uptime and firmware and AP photos. No Mac-hosted UniFi server needed for these metrics.
- User previously flagged duplicate four UniFi AP cards in generic `Your devices` section; code removed APs from generic device group and bumped script cache version. Most recent screenshot is a close-up of detailed section only, so deduplication has not yet been separately visually confirmed by a full-page screenshot.
- Future improvements: confirm truly offline Mac controller while AP SNMP continues; check failure alert/history; 800x480 heartbeat Engine Room layout; remove any unneeded generic network clutter. Important remaining security task: ensure private Net-SNMP snmp.conf (600) and unifi config (700 directory) included in updated secure post-migration backup, without exposing credentials in GitHub.


### 19 Nov 2026 ~13:05 GMT — NEW BULLDOG STATUS TAB BUILT (awaiting live user acceptance)
- User asked for a separate Eldoret **Bulldog** tab with many live Raspberry Pi stats and a real bulldog photograph.
- In nickabull/Eldoret-Home-Automation main: connector.py commit d28a41c4 added read-only GET /api/bulldog/status and static /bulldog.html route. Metrics from local Linux /proc, /sys, shutil.disk_usage: CPU usage sampled across requests, 1/5/15-minute load averages, core count, CPU temperature, total/used RAM, swap, used/total SD storage, system uptime, Wi-Fi/Ethernet carriers, local RFC1918 IPs, Pi model, host, OS, kernel, Python. No credentials exported. Connector process availability is inferred from serving the request, NOT independent systemd verification.
- bulldog.html commit 0c685db1 builds high-contrast responsive cards, gauges, 10-second polling while visible, friendly full-page Bulldog portrait from Wikimedia Commons Special:FilePath/Bulldog2f.jpg (attributed WolvenRose, CC BY-SA 3.0); external image requires Internet and may fail gracefully.
- Added Bulldog tab to primary navigation in index.html, lights.html, sky.html, av.html, network.html, office.html, appliances.html, radio.html (commits 8cf27148, 052d31be, 0a74332a, 333d883f, ae17bc8d, 0b7d0739, 558efadb, 24d6b216). New page links back to all main sections.
- **NOT YET USER-VERIFIED LIVE**. Manager on Bulldog auto-polls GitHub every 30s and restarts connector after update; direct URL http://10.0.0.34:8765/bulldog.html. Have user load page and check metrics. CPU % may show blank on initial sample because it needs two readings. If startup fails, inspect service logs; preserve secure settings. Next potential enhancement: 800x480 Engine Room heartbeat kiosk.


### 19 November 2026 13:11 GMT — Bulldog graphs, alerts, and independent Home Wi-Fi health committed
- User requested immediate implementation of proposed system-health graphs/amber warnings, and the earlier Wi-Fi improvement.
- Eldoret-Home-Automation main: connector.py commit 47f24aa7 adds a low-cost daemon sampler (60 sec) recording CPU%, temp Celsius, memory%, disk%, and load. Rolling 1,440 samples/24h, saved every 5 samples to a protected local Bulldog file at ~/eldoret-connector/bulldog-health-history.json. API /api/bulldog/status includes history plus status warnings if temp >=70/80C, RAM >=80/90%, or storage >=80/90%. Historical graph data only accumulates from activation, not retroactive.
- bulldog.html commit 9fe1d3de renders SVG chart of rolling CPU %, temperature C, and RAM % with time labels, and amber badge with warning reasons.
- index.html commit d9b8d78f makes Home Wi-Fi card fetch /api/unifi/status (direct encrypted SNMPv3 on Bulldog) instead of general TCP device status, showing all four APs, direct monitoring and aggregate inbound Ethernet Mbps (not internet bandwidth), with latency hints. Controller fallback remains supported.
- Code committed; user has not yet confirmed live render after these changes. Reload Bulldog page at http://10.0.0.34:8765/bulldog.html and Home at http://10.0.0.34:8765/ after updater cycles; check chart (initially sparse), warnings and Wi-Fi status. If page stops working, check systemctl is-active eldoret and logs. Credentials stay only on Bulldog, not GitHub.


### 19 Nov 2026 14:07 GMT — HOME CONNECT OAUTH AND ALL SIX KITCHEN APPLIANCES VERIFIED
- User created Home Connect physical-appliance OAuth Authorization Code application `Eldoret Home Automation`, redirect `https://localhost/callback`, scopes `IdentifyAppliance Monitor`. Client ID/secret privately saved on Bulldog `/home/dietpi/.config/home-connect.json` (0600). OAuth exchange succeeded after fresh authorization: access and refresh tokens privately saved `/home/dietpi/.config/home-connect-tokens.json` (0600); initial token expiry 86400 seconds. **NEVER commit or print secrets or device haId.** No automatic refresh or durable Home Connect connector yet.
- Official API GET `https://api.home-connect.com/api/homeappliances` needs `Accept: application/vnd.bsh.sdk.v1+json`; plain `application/json` produced 406. User verified API returned 6 appliances, all `connected=True`:
  1. Right Oven — Neff — B48FT78H0B
  2. Hob — Neff — T59TS5RN0
  3. Main Kitchen Dishwasher — Siemens — SN878D26PE
  4. Hood — Neff — D95FMW1N0B
  5. Left Oven — Neff — B58CT68H0B
  6. Back Kitchen Dishwasher — Bosch — SMV2HTX02G
- Six local devices were pinged previously, including back dishwasher candidate IP 10.0.0.10, but **mapping from Home Connect appliance to local IP still provisional**. Also 10.0.0.10 had previously been classified as Tuya. Do not claim it is definitely the Bosch from ping alone.
- Eldoret-Home-Automation GitHub devices.js commit e3a7d4f9 updates Appliances inventory brand/model/name with provisional-IP notes; appliances.html commit c4b2b996 bumps cache version v17.
- NEXT: read-only test per-appliance status and active program via API using existing token, redact haId and secrets in printout. Then build Home Connect integration with protected token refresh and bounded polling / SSE, no start/stop/program commands. Keep appliance cards grounded in actual API capabilities. Avoid overloading Pi3 and avoid publishing secrets.


### 19 Nov 2026 14:10-14:15 GMT — Live kitchen Home Connect integration COMMITTED (pending user verification)
- User reports DrayTek IPs are bound/reserved. Official Home Connect status probe for all six appliances succeeded; operation state for ovens/hob/hood was Inactive; kitchen and back dishwashers both Ready, DoorState Open. Right oven 21C, Left oven 60C. Active programme endpoint returned HTTP 404 for all; likely no active programmes. RemoteControl flags were read but DO NOT expose any control functionality.
- `nickabull/Eldoret-Home-Automation` connector.py commit `8a9bc0dc`: new GET `/api/home-connect/status` with **read-only** Home Connect API GET /homeappliances, GET per-device /status, GET per-device /programs/active; 60s cache, 3-worker concurrency. Private OAuth config and tokens loaded only on Bulldog from `~/.config/home-connect.json` and `~/.config/home-connect-tokens.json` (owner-read 0600). Refresh tokens exchanged when access expires; token rotation protected using atomic private file writes. Response strips haId, OAuth secrets and raw error response. Requires `Accept: application/vnd.bsh.sdk.v1+json`.
- appliances.html commit `74d6f05a`: new live 6-card grid showing actual appliance names/models, connected, operation, door, cavity temperatures and active programme/options when reported. 60s browser refresh. User can manually refresh; never sends PUT/DELETE commands. Other network devices remain in separate section.
- devices.js commit `65b6ae44` removes duplicate six kitchen appliance cards from generic 'Your devices' list (same duplication as old UniFi) while preserving VELUX and unclassified smart devices.
- **NOT YET VERIFIED ON RUNNING BULLDOG**: User should open `http://10.0.0.34:8765/appliances.html` and screenshot. Auto-updater should install connector changes. If errors, check status and logs, maintain known-working Eldoret. No data yet about Home Connect automatic refresh observed under expiry; test in future. Credentials and tokens must remain private; update secure local backup after verification. Bound IPs do not cryptographically establish haId to local IP, so don't rely on unverified mapping.


### 19 Nov 2026 ~14:18 GMT — Per-appliance Home Connect detail views + activity + quota-safe SSE committed
- User requested each of six kitchen appliance cards open their own richer sub-tabs: programme (including remaining time while running), detailed statuses and settings/options, event history, plus Home Connect-style start/stop controls. User understands only read-only monitoring authorised so far.
- Eldoret-Home-Automation: connector.py commits 377be54c / 78998cd5 / c37b027a / 288670a2 / 8a2ab4cd add GET /api/home-connect/details?name=..., on-demand (10m cached) selected and available programmes, monitored settings placeholder (current IdentifyAppliance Monitor OAuth **does not grant Settings**; no unauthorized requests); local status change history and Home Connect server-sent events global stream (GET /homeappliances/events), state updates including door, operation, temp, progress, remaining time. SSE one persistent long-lived stream with backoff, event history bounded to 300 and persisted on Bulldog with restricted local file/limited SD writes; credentials and haId never exposed. Regular REST status refresh reduced from 60 sec to 30min to respect official **1000 API requests/day**; browser reads local cache every 60sec; SSE drives interim changes. On errors next cache refresh after ~120sec. SSE connectivity and last event exposed to UI. Read-only GET only; no PUT/DELETE.
- appliances.html commits 3f10f0ad / 1596ee6b: per-appliance View Details & Options button opens responsive modal with Overview, Programmes, Settings, Activity, Controls tabs. Operating states, door, temperature, programme, progress and remaining time displayed when reported; controls visibly disabled because OAuth only grants IdentifyAppliance Monitor and remote cooking control requires additional permissions/safety preconditions. Settings tab explains current permission limitation. Activity log shows observed changes. SSE connection status shown in footer.
- **IMPORTANT NOT YET VERIFIED ON BULLDOG LIVE**: Browser test at http://10.0.0.34:8765/appliances.html, click each 'View details & options' and see tabs. Check service remains active, no unhandled errors; validate SSE stream connected and live change updates. Do not promise remote control yet. Later user can opt to re-authorize only selected device-specific control scopes, subject to appropriate safety restrictions, for allowed non-hazardous controls such as dishwasher; don't enable remote ovens/hob automatically. Confirm quota via official docs https://api-docs.home-connect.com/general and SSE docs https://api-docs.home-connect.com/events.


### 19 Nov 2026 ~14:56 GMT — Jesse PS5 Now Playing/Activity UI COMMITTED (test when console reports a game)
- User can see Jesse_Dub_Dub's **recently played** games in official PlayStation App under their own account but cannot/should not sign into Jesse's protected PSN account. No PSN API access authorised. The existing local PS5 discovery at `10.0.0.48` returned host_type=PS5, host_name=PS5-086, system_version=14230000, status_code=200 even while a game was deliberately launched, but `running_app_name` and `running_app_titleid` remained null. Do not claim the local endpoint can identify running game; this may be unsupported on their PS5 firmware.
- Eldoret-Home-Automation GitHub connector.py commit `10c65f53` adds lightweight 60s read-only local PS5 UDP discovery collector; bounded 150 availability/game event history and 100 observed game sessions stored only locally as owner-private `~/eldoret-connector/playstation-activity.json`, with GET `/api/playstation/activity`. It records game sessions ONLY if local discovery actually reports game name/ID. Does not collect PSN accounts, tokens or recent-played info.
- av.html commit `51a67e1f` replaces previous simple PlayStation panel with attractive Now Playing, Activity, and Console sub-tabs showing PS5 reachability, game title (or explicit "not reported"), host name/firmware, observed session history. Polls local API every 30sec in visible browser; collector samples each minute even if browser closed. No game-name invention and no Sony login or account privacy bypass. Existing Sky Q and general AV inventory unaffected.
- **NOT YET USER VERIFIED LIVE**: ask to open `http://10.0.0.34:8765/av.html` and see three new PS5 tabs; test again with game running / when Jesse is home. Game name may still show "No game reported" because the Sony local discovery doesn't include it. For PSN presence, would require an authorised, compliant integration and appropriate privacy settings; no such integration implemented. Additionally user asks to rotate physical Pi screen 180 degrees (previously advised Control Centre Screens Orientation Inverted), not yet confirmed complete.


### 19 Nov 2026 15:03 GMT — Bulldog 800x480 Mission Control Heartbeats BUILT, awaiting live verification
- User requested animated heartbeats before further monitoring features, on the Pi's dedicated 800x480 touchscreen in 16:10 orientation (no scrolling), to run as display mode. GitHub repo `nickabull/Eldoret-Home-Automation`: new `/heartbeats.html` commit `489c8248` (further fixes `3f6ecd9e`, `ef07a1e7`) is a dedicated 4x4 grid of 16 heartbeats, compact dark dashboard, top clock, freshness/alert overview, fixed 100dvh no scrolling, on-screen Full screen button (browser fullscreen API), manual refresh and links back. Uses only existing read-only APIs: Bulldog `/api/bulldog/status`, DrayTek `/api/router/status`, Hue house+utility `/api/hue/group?bridge=...&group=0`, 4 UniFi APs `/api/unifi/status`, six Home Connect kitchen devices `/api/home-connect/status`, Sky `/api/sky/now`, PS5 `/api/playstation/status`. Green animated hearts indicate fresh responding systems; amber = stale/unknown, red = confirmed no reply. Appliance heartbeats mean connected, not actively running; operating state shown separately. Errors are isolated per source and never fabricate green health. Refresh intervals 10-30s on browser; Home Connect uses Bulldog's server-side 30m cache plus SSE (no extra cloud requests per browser poll). Reduced-motion supported. No credentials or identifiers exposed beyond known local IPs/API output. Hue uses aggregated group.any_on to avoid mistaking Hue light ID strings for objects. Sky channel field handled as string or object.
- connector.py routing `/heartbeats.html` added commit `6da145c4`; link on Bulldog System Stats page added commit `a9835081`. When user tests at http://10.0.0.34:8765/heartbeats.html inspect layout on touchscreen and Mac; click Full screen; see whether browser really sizes at 800x480 and whether all 16 show appropriate statuses. **Not yet visually or live tested by user.** Pi screen 180-degree rotation was previously requested but not confirmed completed; rotate via Raspberry Pi OS Control Centre > Screens > Orientation > Inverted before kiosk autostart. Do not auto-launch kiosk on reboot until user approves after visual check. Document fallback remote access remains through Raspberry Pi Connect.


### 19 Nov 2026 15:49 GMT — Interactive touchscreen heartbeat tiles and Sky Q remote committed
- User realised physical 800x480 DSI-1 screen is touch-sensitive, asked that heartbeat tiles open expanded control/detail views. Specifically requested remote control of Sky Q from heartbeat display. Rotation `wlr-randr --output DSI-1 --transform 180` worked; touch coordinates also tested successfully. **Rotation persistence across reboot NOT confirmed**, prior read-only next step was `cat ~/.config/kanshi/config`.
- Eldoret-Home-Automation `heartbeats.html` commits d528a41e + e89254d8: all 16 heartbeats are keyboard/touch clickable; a modal overlays the compact dashboard without leaving fullscreen. All tiles show current status and button to full existing Eldoret page. Sky Q tile additionally opens large touch remote with supported local `/api/sky/key` POST commands (power, channel up/down, arrows, select, home, back, play, pause, rewind, forward, record, red, stop, search). Unsupported green/blue keys were removed. Existing Sky Q code and API reused; no new backend control permission or stored credentials. Other tiles link to Bulldog stats, Network, Lights, Appliances, Jesse/AV as appropriate. Cooking appliance remote starts remain disabled/read-only. Esc/backdrop/close dismiss modal.
- **NOT YET VERIFIED LIVE ON TOUCHSCREEN**: open `http://10.0.0.34:8765/heartbeats.html`, press Full screen, touch Sky Q tile and test Home, arrows, Select, Play/Pause, Back. Screenshot modal at 800x480 and verify no scrolling/overlap. Keep original Sky Q page as fallback if touch remote fails.
- Follow-on: photographic backgrounds are still a design mockup, not implemented into live heartbeat.html. Existing generated design image demonstrated visual direction, but must not be described as live. Sky Q current programme image may be obtainable from existing programme/EPG readback; PS5 local discovery continues to return null game title even while game runs, so live game artwork cannot yet be populated reliably without authorised PSN presence source. Don't fabricate either data source.


### 19 Nov 2026 21:42 GMT — Mission Control photographic storytelling tile upgrade committed, pending on-device verification
- User wants subtle, dark photographic art and human-readable 'headline' like the full Eldoret home dashboard in each of the 16 heartbeat tiles; live programme artwork and name for Sky Q; PS5 game cover when available. Existing 800x480 4x4, animated heartbeat, touch-only popup and Sky remote with number keypad must remain intact.
- GitHub `nickabull/Eldoret-Home-Automation` `heartbeats.html` commits `aff35d5e`, `9c4211bb`, `4d6e5575`: each tile now displays category + small name + prominent human headline + supporting live metric, on subtle photographic backgrounds with strong dark overlay; existing Eldoret photography assets reused: `/network-patchbay-background.webp`, `/eldoret-house-night.webp`, `/eldoret-home-dusk.webp`, `/sky-streaming-background.png`. Individual CSS cropping. Sky Q's `GET /api/sky/now` provides `programme` string and `programmeuuid`; programme now becomes 'Watching {programme}', and if UUID is valid attempts `https://images.metadata.sky.com/pd-image/{uuid}/16-9` as tile image with error fallback to local static art (based on existing open Sky Q integration references). Do not claim every programme has art; currently no validated PSN game name/cover, so PS5 uses static artwork/appropriate status until Sony source actually supplies it. Appropriate statuses include 'Ready for next cycle', 'Not currently running', 'Wi-Fi is responding', 'Bulldog running smoothly', and 'Internet is connected'. Images are purely cosmetic and do not replace backend heartbeats.
- `connector.py` commit `fd308704`: added static asset routes for `/network-patchbay-background.webp` and `/eldoret-home-dusk.webp` which existed in repository but had not been exposed on Bulldog HTTP server.
- **Pending live QA:** user must reload `http://10.0.0.34:8765/heartbeats.html` in Chromium. Confirm 16 tiles fit at 800x480, live text readable; Sky Q artwork may be absent if image service has no still or network blocks it; fallback expected. Confirm tap Sky → Remote / Channel number and Back to heartbeats still work. Browser caching of HTML may require refresh; connector live-auto-update may need restart to see new asset routes. No automatic image art for PS5 until an authorised source can identify playing game. Do not claim actual system verified until user confirms.


### 19 Nov 2026 22:37 GMT — PSN presence research and corrected tile headline
- Jesse's PS5 local UDP discovery still returns online true and `running_app_name=null`, `running_app_titleid=null` while actively in use; local activity recorded console Responding event at 22:16, no game sessions. User showed PlayStation App screenshot labelled `Your PS5`, `EA SPORTS FC 27`, `Game progress 6%`. **Crucial ambiguity:** this screenshot proves the *app* can display the title on a linked console but does not necessarily prove that friend `Jesse_Dub_Dub`'s current PSN presence exposes the same game, nor that 6% is a live session metric. Do not assume game name for Jesse in live dashboard. 
- Research: unofficial `psn-api` JS and `PSNAWP` Python expose PSN basic presence `primaryPlatformInfo.onlineStatus`, `gameTitleInfoList[].titleName`, `npTitleIconUrl` / `conceptIconUrl`, governed by friend privacy; e.g. https://psnawp.readthedocs.io/en/stable/generated/psnawp_api.models.user.html and https://www.npmjs.com/package/psn-api. Sony supplies no supported public consumer API; unofficial endpoints may change / account risk. NPSSO browser token is password-equivalent, NEVER ask user to paste it in chat, into GitHub, or put credentials in public files. If agreed later, use authenticated user browser on Bulldog and private 0600 token file, refresh with strict rate limits and error handling. Don't install or connect until user confirms and secure process worked.
- Heartbeats tile GitHub `nickabull/Eldoret-Home-Automation/heartbeats.html` commit `7f23db5d` changed online heartbeat to `Jesse’s PlayStation is online` rather than `PlayStation is available`, and offline to `PlayStation not responding` instead of claiming sleeping. 
- Next: in user's PS App Friends look up `Jesse_Dub_Dub` and whether it currently shows playing FC27 or just recently played, as opposed to `Your PS5` device card. If visible, test authorised PSN friend presence from parent's own account, **without Jesse's password or privacy bypass**; then design read-only endpoint returning `name`, `online`, `game_title`, `game_cover`, `last_checked`, with stale handling and minimal polling. No live PSN integration currently implemented.


### 19 Nov 2026 23:15 GMT — Photo tile imagery integrated in live 800x480 Mission Control
- User approved exactly photographic mockup: colourfully lit actual home on Bulldog tile, keep DrayTek + Sky Q tile artwork unchanged, same warm coloured Hue lamp photo for both Hue bridges, same Ubiquiti UniFi access point photo for all four APs, dishwasher photo for both dishwashers, oven for both ovens, induction hob and cooker extractor photos for remaining kitchen tiles; heartbeat, headline, data and touch-modal overlays must remain.
- `nickabull/Eldoret-Home-Automation/heartbeats.html` commits `0c2f5283` + `13c0b5e0`: image preloading with failure-safe fallback to locally hosted assets, device-specific browser tile backgrounds: Philips Hue ambiance OBI image for both Hue; CC-licensed Wikimedia Commons photo of Ubiquiti AP (L3u) reused for all four; Commons kitchen appliance photographs for dishwasher (Nenad Stojkovic), oven (Nenad Stojkovic), hob (Willtron), extractor (Tomwsulcer); Bulldog photo now uses `/eldoret-house-night.webp` (colourful illuminated house), DrayTek remains network-patchbay image, Sky Q live programme art untouched. Attribution text added inside device detail popup where external photo loaded; retained modal-only navigation, Sky remote and number keypad. **Backgrounds are loaded from external sources while Pi is online**; on errors cards keep their previous generic photo. These are illustrations of appliance types, not photos of user's exact individual installed appliance models. Image-gen mockup itself is NOT used as a static screenshot; live dynamic data retained.
- At 23:15 user also sent `xdotool` install shell output, showing installation successful but pasted command got literal bracketed-paste code (`^[[200~DISPLAY=:0`), causing bash command not found. Advised type `DISPLAY=:0 xdotool key ctrl+F5` manually; may fail on Wayland, in-page Refresh or Chromium Ctrl+R via remote desktop is alternative. Important: in-page Refresh only fetches data, to update HTML/CSS actual browser reload required. Not yet user verified image appearance on physical touchscreen.


### 19 November 2026 ~23:20 GMT — Resume checkpoint / source reconciliation
- **DOCUMENTATION VERIFIED:** Read this living GitHub handover, including the full 17 November handover text incorporated at its beginning, and inspected current `nickabull/Eldoret-Home-Automation` repository root plus `README.md`, `RUNTIME.md`, `PI-MIGRATION.md`. No separate 17 November attachment was visible in this chat. Current code repository contains `connector.py`, `heartbeats.html`, `appliances.html`, `av.html`, `manager.py` and associated interface files. Historical README/RUNTIME descriptions refer to Chromebook and should not override the more recent Bulldog checkpoints.
- **PRESERVE ARCHITECTURE:** Mac remains independent Bull's Hits audio/playout engine; Bulldog/Donkey/replacement solely controls/bridges physical events. Do not assume that Airlite USB audio or fader events are supported by the Pi. Retain 16:9 no-scroll main UI, explicit first tap/red highlight/top-right CONFIRM/10-second cancellation; 800x480 Bulldog Engine Room screen is separate from the main 16:9 UI. Preserve Hue, Sky Q, LG, Velux, UniFi and six Home Connect appliance integrations, with cooking controls read-only until separately authorised and safety-reviewed.
- **IMPORTANT ADDRESS RECONCILIATION:** Original Bulldog Ethernet/reservation recorded as `10.0.0.39`; later committed runtime UI URLs show `10.0.0.34:8765`. Treat actual IP, DHCP binding and reachability as **unverified for this session**; check live on Bulldog and router before editing bindings or routing. Donkey `10.0.0.27` remains fallback.
- **BUILT NOT LIVE-VERIFIED HERE:** recent heartbeat photo tiles, Sky modal remote, six-appliance Home Connect SSE/details, PS5 now-playing UI and auto-update deployment; inspect actual current screen and logs. No LAN-connected device, Mac or Airlite could be exercised by GitHub-only source inspection in this session.
- **NEXT TEST ORDER:** (1) user verifies Chromium hard reload on Bulldog 800x480 screen, photo tiles and no scrolling; check tap Sky remote and ensure no unintended controls; (2) inspect Bulldog actual IP, current status and backup / auto-update without disrupting household; (3) inventory Airlite Mk2 cabling, macOS USB enumeration and repo bridge; (4) test one fader OFF->ON, correct deck and audio path, then interrupt controller and verify Mac audio keeps playing; (5) only after evidence compare Pi 5 versus cost-conscious x86 mini-PC and touchscreen/UPS total cost.
- **NO PURCHASE, DEPLOYMENT OR HARDWARE TEST PERFORMED** during this checkpoint. Do not mark physical Airlite tests or continuity as passed. Preserve original Rivendell Pi SD, recovered 124 WAV originals and named checksum-verified copies.


### 19 November 2026 ~23:38 GMT — Dishwasher tile programme + countdown committed
- **USER VERIFIED via on-device screenshot:** Bulldog 800x480 /heartbeats.html renders 16 healthy heartbeats, photographic device backgrounds, live Sky Q programme art ('Question Time'), and main Siemens dishwasher in Run state with 98m remaining at screenshot time. Screenshot alone does not prove all physical integrations function or that 16/16 stay healthy over time.
- **SOURCE CHANGES COMMITTED, LIVE QA PENDING:** `nickabull/Eldoret-Home-Automation` connector.py commit `45b267d8` records `remaining_updated_at` when Home Connect active-programme options are fetched and when RemainingProgramTime SSE arrives; heartbeats.html commit `42e1c39d` shows active cycle name from real `active_program` API field (fallback: Programme running), and a locally recalculated whole-minute countdown from remaining seconds plus original sample time. UI updates every 15s from existing local cache, **without additional Home Connect REST requests**. Missing/stale remaining-time data explicitly displays unavailable rather than an invented countdown; can still be approximate because Home Connect data may be delayed and cycles can adjust.
- **TEST NEXT:** After Bulldog updater deploys both files, hard reload heartbeats screen; confirm main dishwasher displays real programme when API supplies one and remaining minutes decrease over several minutes. Validate actual appliance displayed timer against UI; test completion, pause, stale SSE and reconnect. If appliance API fails to report cycle name, show fallback, do not guess. No appliance commands added.
- **OTHER REQUESTS PARKED:** user wants a small moving router traffic graph, more meaningful House/Utility Hue statuses than binary any_on, and improved UniFi tiles. Wait for user to describe Wi-Fi ideas; preserve 4x4 touchscreen layout and avoid clutter.


### 19 Nov 2026 ~23:42 GMT — Heartbeat artwork rollback
- User reported imagery changing unexpectedly after dashboard reload. Reverted **only** externally loaded device-specific photo overrides and their attribution popup in `nickabull/Eldoret-Home-Automation/heartbeats.html` commit `c781b7ab`, restoring original repository-local artwork/fallbacks as per pre-photo commit `7f23db5d`. Retained 16 heartbeat tiles, live status, Sky Q live programme artwork, touch modal and remote, and newly committed Home Connect dishwasher cycle/countdown logic. No backend changes in this rollback. **Pending on-device check:** hard reload after updater and confirm backgrounds match desired earlier style; Sky imagery naturally changes with live programming. Countdown remains pending validation because API may omit/stale out its remaining-time timestamp.


### 19 Nov 2026 ~23:50 GMT — UniFi tile priority and Event Archive captured
- **USER PRIORITY:** First improve four UniFi heartbeat tiles (Office/Kitchen, Utility, Garden, Landing), replacing generic 'Wi-Fi is responding' with genuine controller-reported Experience (e.g. Excellent) and connected-client counts. Keep real SNMP reachability and traffic metrics as fallback; do not mislabel ping latency as Wi-Fi experience; show unavailable or last-seen if Mac-hosted UniFi controller is not reachable.
- **USER SCREENSHOT VERIFIED at 23:46:** Mac UniFi Network UI (`127.0.0.1:8080/manage/default/devices`) shows Office/Kitchen IP .6 15 connected Excellent 7.03GB/24h; Utility .7 2 Excellent 141MB; Garden .8 4 Excellent 3.49GB; Landing .9 7 Excellent 21.0GB. Values are point-in-time, NOT feed data. Note Mac loopback 127.0.0.1:8080 is not directly accessible to Bulldog; confirm remote HTTPS controller endpoint and view-only API before modifying backend.
- **SOURCE CHECK:** Existing `connector.py` direct SNMP branch `_unifi_snmp_status()` provides reachability/latency/traffic but sets `clients: null`. Alternate UniFi controller `_unifi_devices()` maps `num_sta` to `clients`, but lacks Experience extraction. Because `unifi_status()` prefers direct SNMP when configured, simply adding a controller field to the fallback will NOT populate live tiles. Need test live API data and secure hybrid/fallback design. No changes to the live UniFi code have been made by this checkpoint.
- **NEXT IN ORDER:** verify whether a reachable view-only UniFi Network API provides per-AP client counts and an Experience indicator; implement defensively with freshness/source labels, no fabricated rating, preserve existing 4x4 design and artwork, test on Bulldog.
- **DURABLE FOLLOW-ON:** User explicitly requested searchable Eldoret Event Archive *after* UniFi tile work and asked not to forget. Created issue `nickabull/Eldoret-Home-Automation#1` at https://github.com/nickabull/Eldoret-Home-Automation/issues/1 . Archive should combine events, sampled performance and CONFIRM audit logs in separate main 16:9 tab, privacy-safe bounded storage and indexed search, exports and tested backup/recovery. Do not repurpose 800x480 Pi heartbeat display as scrolling archive.


### 19 Nov 2026 ~23:59 GMT — Mac-independent UniFi client-count pilot deployed in source
- **RESEARCH CONFIRMED:** Ubiquiti UniFi MIB `unifiVapNumStations` OID `1.3.6.1.4.1.41112.1.6.1.2.1.8` reports station count per virtual access point/BSSID; summing available instances may give AP client count. This is NOT UniFi controller's official Experience rating. Device firmware support and correspondence to controller's client count remain unverified.
- **SOURCE CHANGES:** `nickabull/Eldoret-Home-Automation/connector.py` commit `c1b53507` adds GET `/api/unifi/client-count-pilot`: explicit, on-demand, read-only SNMPv3 `snmpwalk` test targeting Office/Kitchen AP `10.0.0.6` only, using Bulldog's existing private SNMP configuration, with bounded timeout and safe sanitized JSON `status`, `clients`, `virtual_ap_count` and `reason`. It does **not** modify normal four-tile data, issue Wi-Fi commands, access the Mac controller or reveal SNMP credentials.
- **NOT LIVE VERIFIED:** Need confirm `snmpwalk` binary exists (the existing collector uses `snmpget`), auto-updater has loaded updated connector, endpoint returns populated client count, and sum approximately matches fresh UniFi UI count allowing for moving clients. If missing binary or unsupported AP OID it returns a reason instead of invented numbers. Try from Mac/browser on trusted LAN at Bulldog's confirmed port/address; if no response, troubleshoot code/service logs safely. Never claim 'Excellent' directly from SNMP without a verified source.
- **NEXT:** Once pilot validated, expand bounded periodic direct probes to all four APs, show connected devices in existing tiles, then test radio-quality metrics separately with honest labels; leave main 16 tile photographic artwork and layout unchanged. Event Archive Issue #1 remains queued after UniFi.


### 20 November 2026 ~00:05 GMT — UniFi station count validated and four AP implementation committed
- **PHYSICAL DEVICE VERIFIED FROM USER-SUPPLIED JSON:** GET `/api/unifi/client-count-pilot` returned Office/Kitchen `10.0.0.6` direct SNMPv3 `clients:15`, `status:ok`, `virtual_ap_count:7`, checked at `2026-11-20T00:04:52.295579+00:00`. Previous UniFi screenshot also showed 15 connected; exact simultaneous count can vary. This proves that specific AP exposes station counts directly without Mac, NOT that all four will, or that SNMP exposes UniFi Experience labels.
- **SOURCE COMMITTED, PENDING ON-DEVICE VERIFICATION:** `nickabull/Eldoret-Home-Automation/connector.py` commit `2303ae3c` adds rate-limited per-AP direct SNMPv3 client counting for `10.0.0.6/.7/.8/.9`, queries in parallel and caches for 90 seconds. Failure returns unknown instead of fabricated zero. Existing 20-second SNMP health/traffic readings and 5-minute bounded history remain. A background daemon/poll beyond existing UI requests has NOT been introduced; the regular status path executes this probe when called and due.
- **HEARTBEAT CODE COMMITTED, PENDING USER LIVE QA:** `heartbeats.html` commit `00925ec0` uses fresh count (within 180s) as each AP headline (e.g. '15 devices connected'), retains ping and real throughput as supporting line, and shows 'clients unavailable' if not reported. Expanded AP popup now includes count, direct-SNMP provenance and its checked-at timestamp. Existing artwork, 4x4 800x480 no-scroll layout, Sky remote and other device tiles untouched. No 'Excellent' rating invented.
- **VERIFY NEXT:** Hard reload Heartbeats after Bulldog auto-updater picks up connector and page; inspect all four AP tiles and compare with fresh UniFi controller (if available). Confirm Office/Kitchen approximately 15 and Utility/Garden/Landing return valid numbers or explicit unavailable. Check startup/latency under concurrent SNMP walks, and confirm no loss of prior heartbeat artwork. If heavy for Pi 3, extend count cache to 2-5 minutes. Mac independence remains.
- **NEXT AFTER COUNTS:** seek real direct AP quality measures (e.g. utilisation/retries) using a carefully bounded experimental SNMP probe; do not conflate derived quality with UniFi controller Experience. Event Archive remains GitHub issue #1 after UniFi.


### 20 Nov 2026 ~00:07 GMT — Main Eldoret UI synchronisation rule + Sky artwork
- **USER REQUIREMENT:** Whenever monitoring features change on Bulldog's 800x480 Heartbeats, apply the same relevant data/features to the main Eldoret dashboard and detailed pages in the same change set; avoid drift. Preserve each display's native artwork, layout and main 16:9/no-scroll behaviour. Use the same canonical Bulldog API values rather than separate guesses.
- **SOURCE COMMITTED (LIVE QA PENDING):** `nickabull/Eldoret-Home-Automation/index.html` commit `4b3c2cb7` updates home Wi-Fi tile to show fresh direct-SNMP client-count totals and per-AP counts in the four badges, with stale/unavailable handling; replaces the previous 'Dishwasher NOT LINKED' placeholder with read-only Siemens Main Kitchen Dishwasher operating status, actual active programme (when API supplies), and locally decreasing remaining time (when timestamp/current data valid); and adds Sky Q live programme background artwork based on the existing programme UUID/images.metadata.sky.com logic, with image load failure/standby fallback and untouched main-card content/navigation. The source is `/api/unifi/status`, `/api/home-connect/status`, and `/api/sky/now`, respectively. Original main dashboard CSS/layout/other tile artwork preserved.
- **SOURCE COMMITTED:** `network.html` commit `4961e404` adds direct-SNMP connected-client counts to detailed UniFi AP cards while retaining their existing product artwork and metrics. Experience 'Excellent' still NOT proven independently from Mac; do not label as such.
- **WHAT WAS NOT CHANGED:** Main Hue presentation and DrayTek miniature graph remain requested future improvements; the Event Archive issue #1 remains queued. No new Sky Q control actions or appliance writes, no Mac dependency, no hardware purchases.
- **VERIFY NEXT ON PHYSICAL UI:** Reload `http://10.0.0.34:8765/index.html` and `/network.html` after updater, confirm exactly four fresh UniFi AP counts, Main dishwasher cycle/time, Sky Q programme still image when available and fallback when absent; compare with Bulldog /heartbeats.html. Verify 16:9 no-scroll, responsiveness, safety rules, and no broken artwork. Code commits do NOT establish on-device verification; correct any issues before marking passed.


### 20 November 2026 ~00:13 GMT — USER APPROVED VISUAL BASELINE / CHANGE CONTROL LOCK

**IMPORTANT — MUST READ BEFORE TOUCHING ELDORRET UI:** The user supplied a 20 November 2026 00:11 GMT screenshot of the *correct* Bulldog / Heartbeats 4x4 artwork and explicitly reported severe repeated visual regressions across chat-length rollovers. The image as supplied in chat is authoritative. A textual lock has been committed to **[VISUAL-BASELINE-LOCK.md](https://github.com/nickabull/Eldoret-Home-Automation/blob/main/VISUAL-BASELINE-LOCK.md)** in the live source repository, commit `0eb37d7e`. Read that file first before any future Eldoret interface edit.

**NON-NEGOTIABLE:** No replacement artwork, external photo overlays, card CSS/crop, tile reordering, changing themes/spacing, or other visual redesign unless user explicitly asks. A data/API change is NOT permission for visual changes. Keep both main Eldoret and Bulldog synced in functionality, **not** identical in visual layout. Preserve 800x480 4x4 no-scroll Bulldog and distinct main 16:9 no-scroll UI and select-red-outline/top-right CONFIRM/10s expiry safety rule. User's screenshot shows illuminated Bulldog house, blue DrayTek patch panel, identical warm Hue photo on both Hue tiles, identical white/blue UniFi ceiling AP photo on all four UniFi tiles, open-dishwasher image on both dishwashers, same glowing-oven photo on both ovens, steaming hob photo, illuminated extractor, live Sky programme still, dark home PS5 tile. All 16 cards and live metrics must remain readable.

**SOURCE EVIDENCE, NOT ACCEPTANCE TAGS:** at the time of the lock `heartbeats.html` blob `b0494149b2170a9957328304580741e145e614a7` and `index.html` blob `3ac7e1c32339d92db4f5980dc650165c3bfb5d99` were inspected. They are not asserted to reproduce the accepted screenshot: Chromium cache / runtime photography may differ from current source. Don't roll back code to those SHAs thinking they are a verified visual baseline.

**NEXT PROTECTION STEP:** Save the user-supplied screenshot as a stable image asset in an enduring project location and record the exact path/commit in the lock. The text file currently references the conversation image, but repository binary screenshot has not yet been uploaded. After user confirms a specific on-device revision, tag known-good visual versions for both displays and follow the change checklist in VISUAL-BASELINE-LOCK.md.

**PROCESS:** Review intended diff before commit and visual regression check afterward; always separate 'source committed' from 'verified on-device'. The user also requested a feedback/bug report about chat-length rollover regressions; a draft was provided in chat for them to submit. No platform bug submission can be claimed without evidence of submission.


### 20 Nov 2026 ~00:23 GMT — Approved artwork image vs running source; LG five-TV discovery begins
- **VISUAL STATUS:** User re-shared the desired 4x4 Bulldog artwork screenshot (house, patch panel, warm Hue lamp, blue-lit ceiling UniFi AP, open dishwasher, oven, hob/steaming pan, extractor, live Sky, dark home PS5). Inspection of current GitHub `heartbeats.html` revealed that its current code only assigns generic `/network-patchbay-background.webp`, `/eldoret-house-night.webp`, `/eldoret-home-dusk.webp` and `/sky-streaming-background.png`; thus the live code does **not** contain all category-specific artwork shown in the reference. The earlier external replacement URLs were different from this approved visual and must NOT be restored as though they were identical. **Art restoration NOT complete.** The canonical screenshot remains in current conversation and visual lock; source asset images need to be sourced/approved and stored immutably for exact reproduction. Do not claim exact screenshot restored merely by a CSS tweak.
- **LG WORKSTREAM:** User has five LG TVs and wants to investigate lounge TV next, without disrupting existing household. Current `connector.py` had an LG presence check `/api/lg/status` defaulting via registry/legacy `10.0.0.33`, which does NOT establish that this is the lounge TV. Existing legacy LG pairing HTML hardcodes `10.0.0.33` and displays a private pairing key onscreen; do not use it before correct TV identification and secure credential handling. `av.html` also describes `.33` as first target, not room-verified.
- **NEW SAFE DIAGNOSTIC COMMITTED:** `nickabull/Eldoret-Home-Automation/connector.py` commit `610f989a` adds GET `/api/lg/discovery`: bounded local read-only scan of webOS ports 3000/3001 on `10.0.0.x`, returns candidate IP/ports only, marks room/identity unknown; no pairing, wake, control or private tokens. **Not live-verified yet**. Test from trusted local browser using `http://10.0.0.34:8765/api/lg/discovery`, ensure lounge TV powered on, user to identify it based on model/IP/MAC or power-on/off correlation. Do not assume all five will appear if TVs are sleeping or port disabled. Next implement secure per-TV pairing with keys stored only on Bulldog after explicit TV confirmation; retain confirm-before-control rule.


### 20 Nov 2026 ~00:34 GMT — LG lounge Tivvy TV one-touch goal
- **USER VISION:** Eldoret button to turn ON lounge LG, launch built-in browser, open the known working short URL `https://is.gd/TivvyTV26` for Tiverton Town live 16:9 coverage. Five LG TVs in house; first lounge TV only, others later. Do not confuse or target others.
- **USER-VERIFIED DISCOVERY:** `/api/lg/discovery` from Bulldog returned at 2026-11-20 00:30:23 UTC one candidate `10.0.0.51`, both `webos_plain: true` (TCP3000) and `webos_tls: true` (TCP3001), identity/room explicitly unverified. User said the lounge was the on TV and expects .51 is it, but this remains *probable not proven*. Do not target legacy hard-coded `10.0.0.33`.
- **RESEARCH:** LG webOS supports app launch of `com.webos.app.browser` with launch parameters `{"target":"https://is.gd/TivvyTV26"}` (LG dev docs); Wake-on-LAN magic packet to known TV MAC may turn on some TVs if TV Mobile TV On / wake via Wi-Fi/network enabled. Websocket/SSAP cannot connect while TV is fully off. URL opening and power-on not yet tested on this model. SSAP pairing shows TV approval prompt once; store client key only in Bulldog private 0600 file, never GitHub/chat/frontend response. Browser-side legacy pairing page references .33 and displays key in plaintext and MUST NOT be used.
- **SAFETY:** Before implementing one-touch, verify lounge identity with explicit TV on-screen prompt and/or MAC correlated in DrayTek, verify browser launch while powered on before any power-on/WOL test. Do not send unattended commands to any TV until explicit pairing and TV selection. Preserve user approval / first tap and confirm, and never store secrets in GitHub. Future 'Tivvy TV' preset should be user-triggered, not automatic or recurring.
- **STATUS:** feasibility researched, no LG pairing / browser launch / Wake-on-LAN committed or live-tested.


### 20 Nov 2026 ~00:36 GMT — LG lounge Tivvy TV pilot page source committed
- **SOURCE ONLY (NOT LIVE VERIFIED):** New `nickabull/Eldoret-Home-Automation/lg-tivvy-test.html` commit `a0017036`, served through `connector.py` update commit `23b12af3` at `http://10.0.0.34:8765/lg-tivvy-test.html`. This is a manual *two-button* browser-side test targeting **only `10.0.0.51`** (the probable lounge LG while powered on). Button 1 sends local webOS register/pairing request; requires on-TV user approval; button 2 asks `ssap://system.launcher/launch` to open `com.webos.app.browser` with `params.target: "https://is.gd/TivvyTV26"`. No Wake-on-LAN, volume, channel, or other TV commands. No other LGs targeted. This must be tested with TV physically on.
- **SECURITY / LIMITATION:** Test holds client pairing key only inside **browser tab sessionStorage**, never prints it, includes it in chat or sends it back to Bulldog; this is temporary and **not** a completed production arrangement. A real always-on Bulldog-based five-TV controller requires keys in private 0600 local files, explicit TV identity and confirm-before-action, and possibly a local websocket client dependency. Do not claim one-touch or power-on works. Pairing and launch behaviour may differ by webOS model; ask user for nonsecret status and on-screen results. If pairing fails, debug rather than guessing the TV's identity.
- **ARTWORK:** None of the existing main or Heartbeats UI artwork, CSS, images or layouts was touched in this test. The visual restoration and canonical screenshot asset archival remain unfinished separate tasks.


### 20 Nov 2026 ~00:40 GMT — Bulldog DrayTek live sparkline committed to actual page
- User explicitly corrected image mockup response: **Do not draw another screenshot. Change the actual GitHub-sourced live page.**
- `nickabull/Eldoret-Home-Automation/heartbeats.html` commit `40b197c96722cb556bc341779c4cf7979bd2ba61` adds an SVG bandwidth sparkline **inside the existing DrayTek router tile only**, plotting real `/api/router/status` WAN2 history `download` and `upload` values (60 samples, backend already sampling at 5s), refreshes with existing 10s job. Bounded, no fake values, clears on offline; thin mint down / pale blue up paths at bottom; no other tile CSS/layout/photo changes. **Source committed, not yet user visually verified.**
- **ARTWORK REMAINS UNRESOLVED**: current GitHub `heartbeats.html` source uses 4 generic local photo assets for many categories and therefore cannot reproduce the user’s canonical screenshot's separate Hue/UniFi/dishwasher/oven/hob/extractor artwork. Earlier externally sourced Wikimedia/OBI overrides were explicitly rejected by user; NEVER reapply them merely because they appear in git history. Need approved original image source files or exact image URLs and upload into GitHub before declaring the visual restoration done. Don't substitute a generated mockup for actual page.
- The main 16:9 dashboard already has its own router WAN2 chart; no extra code required there for this specific graph, but compare both screens during live QA.


### 20 Nov 2026 ~00:51 GMT — NEW Bulldog SD-card recovery installer created
- User wants a **mouse-click recovery kit for a new Pi** after Raspberry Pi Imager, so a dead SD card or replacement Pi can be recovered without recreating Eldoret by hand.
- **COMMITTED (but NOT yet run on fresh Pi):** `nickabull/Eldoret-Home-Automation/recovery/backup-restore.py` commit `d49448a8`: produces private `bulldog-private-v1` `.tar.gz` archive of `~/.config/eldoret.env` plus regular private files in `~/eldoret-connector` except replaceable source scripts/cache; embedded SHA256 per file; rejects symlinks/unsafe paths and checksum mismatches; refuses restore overwrite. **Backup itself not encrypted**, store only on encrypted Mac or USB. It does NOT capture OS/network/kiosk/Pi Connect and any secrets elsewhere.
- **COMMITTED:** `recovery/install-eldoret.sh` commit `992883dd`: gated fresh Pi install, verifies backup before apt/deploy, installs Python/curl/Net-SNMP, securely restores private data, uses GitHub (or local offline) connector.py and manager.py, creates owner-user systemd service at actual home location, enables service and checks. Refuses running/installed production Eldoret; no SD formatting or OS flashing. **NOT LIVE TESTED.**
- **COMMITTED:** `recovery/README.md` commit `4fb16e6`: preparation, Mac backup copy verification, recovery instructions, limitations. `recovery/Install Eldoret.desktop` commit `40cdcd69`: desktop launcher intended for `~/Bulldog-Recovery/` folder, Terminal wizard, dependent on Raspberry Pi desktop's trusted-launch behaviour.
- **DISASTER-RECOVERY NOT YET READY:** User must still run recovery/backup-restore.py backup on CURRENT functioning Bulldog and copy resulting private archive to FileVault-encrypted Mac/USB, verify copied archive. Existing 19 Nov older migration archive is *different format* and cannot be directly consumed by this v1 tool. Current runtime service remains untouched. Need audit actual private token location coverage and smoke-test on spare fresh Pi before claiming one-click end-to-end success.
- **IMPORTANT:** Avoid saying installer and backup already proven; no backup was automatically created on Bulldog or Mac in this turn. All source public, no private secrets committed. Dashboard artwork and TV pairing unrelated and untouched.


### 20 Nov 2026 ~01:00 GMT - Bulldog encrypted LG control pilot
- User requested immediate safe retry for probable lounge LG 10.0.0.51. Previous direct-browser unencrypted websocket pairing did not show TV prompt.
- GitHub Eldoret-Home-Automation connector.py commit 3519f64d: Python stdlib TLS websocket on LG port 3001; GET /api/lg/control-status; same-origin LAN-only POST /api/lg/pair (async) and /api/lg/open-tivvy (LG browser target https://is.gd/TivvyTV26). No auto actions, wake, volume or channel changes, no other TVs targeted. Private key stored only on Bulldog at ~/eldoret-connector/lg/lounge.json owner mode 0600; LG certificate fingerprint captured when pairing accepted and checked subsequently. TLS on first connect not CA-authenticated, as many TVs have self-signed certs.
- New page lg-bulldog.html commit 42c0d6a2 at http://10.0.0.34:8765/lg-bulldog.html with separate Pair and Open Tivvy buttons and polling status, no key to browser.
- LIVE NOT VERIFIED: actual LG firmware pairing manifest may need adjustment. After auto-update, verify /api/lg/control-status and the working main Eldoret dashboard before pressing Pair. The connector is auto-updated by manager and a bad source change could affect availability. No Mac or LAN test has been run. The code is source committed only.
- No Eldoret Heartbeats artwork touched by these commits.


### 20 Nov 2026 01:02 GMT - LG LOUNGE SUCCESS CONFIRMED BY USER PHOTO
- User supplied photograph of the lounge LG screen showing the actual Tivvy Live page with yellow/black branding and match timeline, immediately following the new Bulldog-side LG encrypted pairing and Open Tivvy workflow. User reaction: 'Omg extraordinary!'. This is persuasive on-device evidence that Bulldog can launch the LG browser to https://is.gd/TivvyTV26; distinguish this from the earlier unverified code commit. The page at that time reported waiting for source-verified match data, normal between fixtures, not a TV pairing issue.
- Pilot: IP 10.0.0.51, LG webOS port 3001 encrypted connection; browser launch via ssap://system.launcher/launch, id com.webos.app.browser, target short URL. Pairing key stored privately on Bulldog, not GitHub; all 5 TV integration still planned but only lounge test validated.
- NEXT: WOL/standby power-on with correct MAC, LG TV settings and on-device test; then a single opt-in button in Eldoret. Check persistent pairing after restarting connector and an LG standby/off-on cycle, confirm device identity, and do not change any existing dashboard artwork without consent.


### 20 Nov 2026 ~01:05 GMT - Dedicated TVs dashboard BUILT; live verification needed
- User requested a new main Eldoret TVs navigation tab with six (not five) named room sub-tabs: **Lounge TV, Kitchen TV, Pit TV, Main bedroom TV, Ella's TV, Thea's TV**. Preserve those exact room labels and do not infer device addresses for the remaining five.
- New `nickabull/Eldoret-Home-Automation/tvs.html` commit `22d79a404b009618d56c5c86c95bf98b8565a355`, routed by `connector.py` commit `9fd4f564` as http://10.0.0.34:8765/tvs.html. Six selectable accessible room tabs, lounge pairing status from /api/lg/control-status, lounge Pair/reconnect via /api/lg/pair, lounge **Open Tivvy TV** via **already proven** /api/lg/open-tivvy. The launch requires an additional on-page Confirm that times out after ten seconds to preserve Eldoret safety conventions. New page reuses existing styles.css, kiosk.js and mobile.js; other five tabs present but deliberately without active commands until each room is identified, paired and user-verified. Currently LG lounge IP=10.0.0.51, powered-on launch proven by photograph, Wake-on-LAN not yet built.
- Added TV main-nav link after Sky Q with narrow markup changes to index.html, lights.html, sky.html, av.html, network.html, bulldog.html, office.html, appliances.html, radio.html, preserving existing source design/artwork. Fixed stale `10.0.0.33` reference in av.html, replacing with link to TVs control centre and confirmed .51. Other specialized Sky subpages may not yet have TVs main-nav link; no bulk redesign performed.
- **Source committed, not yet live screen verified**: open TV tab, inspect six tabs, check lounge reports paired and two-step Open Tivvy action; no other LG actions have been sent in this work. Six rooms are named, but user previously said five LG sets, so do not assume all six correspond to distinct LG devices. User's latest explicit list takes precedence for room navigation.


### 20 Nov 2026 ~01:08 GMT — Lounge LG two-way readbacks + basic remote experiment COMMITTED
- User requested live return information and expected familiar TV controls. Scope deliberately only proven lounge IP 10.0.0.51; other five room tabs unchanged.
- `nickabull/Eldoret-Home-Automation/connector.py` commit `de176aed0b21ad714e2c4021872e15b209aeaaa7`: adds GET `/api/lg/live`, connects with Bulldog's existing private LG pairing key and TLS WebSocket port 3001, queries app foreground (`com.webos.applicationManager/getForegroundAppInfo`), list of external inputs, volume/mute, live current channel, power state; caches 15 seconds; returns `null`/unknown for unsupported/no-response readings rather than inferring. Adds whitelisted same-origin LAN-only POST `/api/lg/control` for volume up/down, mute/unmute, channel up/down, input switch by IDs actually returned from that TV; no arbitrary SSAP endpoint. Expands requested permissions for new pairing to include readbacks/audio/input. Existing paired key may need user-authorized re-pairing if the LG refuses newly requested permissions.
- `tvs.html` commit `21251ccdf1dfa5267ec24b1ca665f98dee297e1e` adds live state cards, input dropdown, basic remote buttons, ten-second confirm dialog for every TV control. All readings from actual LG requests, no simulated state. Poll every 15 seconds. Existing Tivvy browser launch remains intact.
- **NOT YET LIVE VERIFIED**: on actual lounge TV (and TV tab) check readback values, LG permissions, response times, and individual controls. Some SSAP endpoints may be unavailable; do not claim all standard navigation/power controls are already built. Home/Back/arrows/OK require LG pointer input socket and are deferred. Standby WOL deferred. The other five room tabs have no controls enabled. No artwork changed.


### 20 Nov 2026 ~01:17 GMT - Lounge LG working controls confirmed, WOL test committed
- User confirmed Lounge TV change source, volume and mute controls are **working perfectly** on actual TV. This is significant user verification of experimental LG two-way controls. User requested one final Wake-on-LAN test before bed. TV source etc return info still needs feedback of actual values.
- User reiterated that **all confirm prompts must use the compact top-right Sky Q / Hue style**; previous full-width brown inline TV confirm rejected. `tvs.html` commit `a43349dfc8b7398c1a1da1c297c5adfaf25454f0` replaces TV inline confirm CSS with compact top-right red CONFIRM styling for Tivvy and remote controls, plus a WOL confirm. Do not alter other page artwork. Still requires actual screen check.
- Backend `connector.py` commit `b984297384b35d85b85544facefef97d75275c23`: safe **Lounge-only** WOL proof-of-concept. GET `/api/lg/wol-status`, POST `/api/lg/learn-mac` and POST `/api/lg/wake`, same LAN origin guard as existing LG actions. Learn only while TV ON: authenticate over TLS/paired LG key, read current /proc/net/arp neighbour entry for fixed 10.0.0.51, store validated MAC and paired LG certificate fingerprint in private `~/eldoret-connector/lg/lounge-wol.json` chmod 0600. Wake sends one standard UDP9 broadcast magic packet to saved MAC on 10.0.0.255, refuses if config missing or paired fingerprint changed. Packet acceptance does NOT prove television woke; requires user screen verification. No power-off command; user places TV in standby with LG remote only after MAC learned. TV model-specific standby network/mobile wake options may need enabling.
- UI WOL buttons in lounge tab: `Remember TV for wake` (while TV is still on), then `Wake lounge TV` (after user manually puts TV in standby); top-right confirm within 10 sec. Other five TV room tabs untouched. **Committed but NOT live tested**, and no wake packets sent during development. Mac cannot access local Bulldog directly from tool context.
- IMPORTANT: User reported menu sizes jumping between Eldoret pages. A separate workstream to normalize shared header/nav sizes remains PENDING; don't describe that as already completed merely because TVs confirm CSS is now changed.


### 20 Nov 2026 ~01:19 GMT - Expanded lounge LG return information
- User explicitly asked to add as many real 'revertives' (TV readback/feedback fields) as possible; all *Lounge TV only* and no guesses.
- `nickabull/Eldoret-Home-Automation/connector.py` commit `7ffd724029ccad7c70a8ad542a09b66b80add0d2`: expanded bounded LG SSAP readback with per-service availability, foreground app ID/title, input list and connected state, volume and mute, current channel name/number/type, power state, system model/software/device name (when reported), audio output; backend 20s cache. Unsupported results stay null and UI shows Unknown/Unavailable. Read-only; no additional control commands sent.
- `tvs.html` commit `b26137a620cad944fc29e9672a6240ea7c2042df`: nine additional metrics for lounge + collapsible service diagnostics, preserving original page theme, six room tabs, proven control buttons, compact top-right confirm, WOL pilot. Source committed; **not yet live verified** against LG, some webOS SSAP queries may be unavailable or omit data. No new IPs assumed or other rooms controlled.


### 20 November 2026 ~01:21 GMT - Wake-on-LAN verification improved (source committed, on-device test pending)
- User believes multiple LG TVs should be repeatable, having deliberately kept them all LG. Do not assume all models support identical webOS permissions, power-on network settings or hardware.
- GitHub Eldoret-Home-Automation connector.py commit `fcd8eddc01d404f95acc8fd2fba6009f625b9ac5` adds a bounded 42-second asynchronous post-WOL verification. After the opt-in lounge-only magic packet, Bulldog attempts to authenticate via its already paired encrypted webOS connection and query actual foreground-app status. GET `/api/lg/wol-status` includes a `verification` object: idle/checking/responding/timeout, explanatory detail and timestamp. A mere sent UDP packet is not reported as successful TV wake. Even an authenticated response is not *proof the picture illuminated*; user visually confirms.
- `tvs.html` commit `29f861902ef92960a4519279258f8dc04a8922bd` polls WOL status every 3.5 seconds and reports outcome on Lounge tab. Existing top-right confirmation and live diagnostics remain. No commands were transmitted by code authoring. The current Bulldog host's auto-updater needs to pick up this source and the user needs to test while lounge LG on, then standby and click Wake/CONFIRM. 
- IF WOL does not work: verify private MAC learned and actual wake settings (Mobile TV On/Wake via LAN, Quick Start+ on some models), network type and that TV is in standby rather than mains off. Do not infer success from an online socket or packet send.


### 20 Nov 2026 ~01:44 GMT — Sky Q instability and polling protection
- User observed Sky Q box at 10.0.0.18 hung twice in one evening (unusual for this household): actual physical remote inoperative, Eldoret reports UNKNOWN / Sky Q unavailable. User's browser to 10.0.0.18:49153/description0.xml showed ERR_EMPTY_RESPONSE; to port 9006 showed ERR_CONNECTION_REFUSED; /api/sky/now returned {available:false,host:'10.0.0.18',error:'Sky Q SkyPlay SOAP service not found'}. Thus Sky Q box's local services and physical controls were not working; **not proven caused by Eldoret**, but user suspects excessive interrogation.
- Investigation confirmed `sky.js` refreshes /api/sky/now every 15s, and `sky_soap_control_url()` in connector.py previously scanned up to 50 description XML URLs on **every** refresh, each potentially 2s, possibly with parallel client scans. This was a plausible contributor to load on Sky Q, though causation unproven.
- Mitigation committed to `nickabull/Eldoret-Home-Automation/connector.py` commit `c63c3b60da7c0535f92cec5364bfd0ef06cc900d`: cache successful SkyPlay discovery URL, serialize/limit retries by shared 180s circuit breaker after failure, shorter 0.8s per-probe timeout and early stop after first 3 failures with zero valid XML. **Not yet verified on live Bulldog**. No changes to Sky Q artwork or remote key implementation. Sky Q needs restart/recovery by user after quieting polling. Existing Sky Q page(s) may still query at 15s but no more repeated 50-URL scans.
- Next steps: once TV box rebooted and physical remote works, ensure /api/sky/now returns available and programme art, verify remote. Watch for repeat hangs. If failures persist despite lower traffic, explore box firmware/thermal/network independently. Avoid concluding cause without logs.


### 20 Nov 2026 ~02:08 GMT — LG lounge wake CONFIRM fixed; user confirmed
- Lounge LG at `10.0.0.51`; user checked LG **Connection → Mobile TV On** and both **Turn On via Wi-Fi** and **Turn On via Bluetooth** were already enabled. MAC had been privately learned and stored on Bulldog; diagnostic `GET /api/lg/wol-status` showed `ready:true`, MAC recorded, but `verification.state:"idle"` and `detail:"No wake test has run."` despite previous attempts at the page's wake confirmation. This conclusively showed no backend wake attempt had been initiated at that time; it did **not** establish that the TV lacked WOL ability.
- Investigated `tvs.html` confirmation markup/listeners. Commit `d6bf10a1a031cd682d086ef5181f49bc0ebf66ea` moved **Wake lounge TV** confirmation inline within lounge panel (not floating beneath/fighting the fixed global header), relabeled action **SEND WAKE PACKET**, explicitly displayed **Wake confirmed — contacting Bulldog…** on confirmed click, and retained the POST `/api/lg/wake` + polling flow. No LG pairing credentials altered, no other page artwork modified.
- User immediately replied **“Yep you have cracked it”**. This confirms the UI/confirmation problem is resolved from user's perspective. **The user has not explicitly stated in this exchange whether the physical LG screen actually woke from standby or provided post-fix verification output**; do not falsely mark Wake-on-LAN physical success until that is confirmed. If asked, clarify the distinction.
- This log is the living handover `ELDORET-DONKEY-AIRLITE-PROJECT-HANDOVER.md`; update after subsequent milestones. The repo's Git commit history separately records precise code changes.


### 20 Nov 2026 ~02:10 GMT — single button LG wake then Tivvy TV test
- User requested **Wake up TV and load Tivvy TV** test button; placed lounge LG into standby to test. Added button in `nickabull/Eldoret-Home-Automation/tvs.html`, commit `3472611983abcdb875e7ba2eb90d0312fe210e38`.
- The new button has inline explicit confirmation **WAKE & LOAD TIVVY**, then posts same-origin LAN-only `/api/lg/wake`; polls `/api/lg/wol-status` every ~3 sec until its authenticated verification reports `responding` (or fails/timeouts around 45s), then and only then posts `/api/lg/open-tivvy` using existing paired LG credentials and hardcoded `https://is.gd/TivvyTV26`. Displays stage-by-stage progress / failure and inhibits duplicate combined attempts. No backend permissions expanded and other LG buttons kept intact.
- **Commit made; live test still awaits user's confirmation.** Do not mark physical wake + browser launch successful solely from implementation.


### 20 Nov 2026 ~02:16 GMT — Eldoret TV build/version tracking and stale page repair
- User could not see newly committed LG combined wake+Tivvy button, asked for version numbers. Confirmed `manager.py` pulls latest connector.py every 30 sec, but `connector.py` `fetch_github()` cached fetched static HTML for 300 sec. The TV page can therefore be stale for up to five minutes despite updated connector.
- Committed `nickabull/Eldoret-Home-Automation/connector.py` `bc86af36c5916c33f78dbf3f4388295fe72d29cc`: use **15-second GitHub source cache TTL for `tvs.html` only**, leaving other site cache unchanged.
- Committed `nickabull/Eldoret-Home-Automation/tvs.html` `23507c61930a27e1c4cfde3022b91185e451177b`: page has visible **TV build v1.2.0** and **Check for update** button; checks Bulldog-served latest source via no-store fetch of `/tvs.html?fresh=...`, reports current/stale and reloads if a different build is detected. Auto checks once after page loads. No artwork/layout redesign. The previously added **Wake up TV and load Tivvy TV** is part of build v1.2.0.
- User must reload `http://10.0.0.34:8765/tvs.html?v=120` or hard refresh after manager picks up connector; then verify v1.2.0 is visible. This is **source committed, not yet live user verified**. Future TV UI revisions should bump both meta version and visible number and JS comparison value (currently hardcoded).


### 20 Nov 2026 ~02:17 GMT — FULL LG WAKE + TIVVY TV SUCCESS (USER VERIFIED)
- **User explicitly confirmed:** “Thats has worked PERFECTLY OMG.. I can't believe that is even possible!” following the new **Wake up TV and load Tivvy TV** button test with the lounge LG in standby.
- This verifies the actual end-to-end workflow from standby: WOL magic packet to previously learned/verified lounge LG MAC, authenticated response from TV, launch LG browser to `https://is.gd/TivvyTV26`, and Tivvy TV displayed. This supersedes prior notes marking physical wake as unverified.
- As of TV build **v1.2.0**, the one-button workflow is successful. Version indicator and reduced cache update were also visible to user (user said “i have it now.. will try”). Preserve this working behavior; use it as regression baseline when editing home automation code.

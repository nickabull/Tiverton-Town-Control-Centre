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

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

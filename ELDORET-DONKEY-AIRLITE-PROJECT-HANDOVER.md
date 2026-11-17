# Eldoret / Donkey / Airlite — PROJECT-HANDOVER.md

**Working snapshot: 17 November 2026.** This GitHub copy summarises the more detailed local handover prepared on 17 November; it must not be assumed to contain every line of that original. Verify live services before acting.

## Mission
A unified 16:9, no-scroll Eldoret home automation controller and separately resilient Bull's Hits radio playout setup. Donkey is the current Chromebook controller; replacement hardware has NOT been purchased or decided.

## Known architecture
- DrayTek Vigor 2865 router; 10.0.0.x LAN. Donkey previously at 10.0.0.27; Eldoret service historically on port 8765. Tailscale remote access.
- Two Philips Hue bridges 10.0.0.2 and 10.0.0.4; Sky Q HDMI/Cat6 to multiple TVs; LG TVs; Velux blind; UniFi Mac mini/controller; printers; PS5.
- Bosch SMV2HTX02G joined the existing Siemens dishwasher in the Home Connect app on 17 November 2026. App setup is done; Eldoret control is NOT yet implemented.
- UI: fixed 16:9, large touch controls, no scrolling, themed backgrounds, Lights tab. Select action, red outline, then explicit CONFIRM; cancel timeouts and accurate action feedback.
- Audio principle: Mac handles playback and recording; Donkey/replacement handles user interface/control and potentially Airlite bridge. Music must keep playing if controller fails.

## Airlite / Bull's Hits
- Airlite Mk2 hardware and faders A/B/C/J discussed; actual USB/audio device mapping must be verified.
- Proposed Mac receiver pairing and Donkey bridge should be tested, not marked working without physical proof.
- Near-term test by 20 Nov: connect Airlite, establish Mac-to-Donkey control, trigger music playback (a-ha example), then prove uninterrupted Mac playback on controller dropout.

## Replacement hardware — open decision
- Raspberry Pi 5 (8GB, SSD, Ethernet, cooling, UPS) is plausible for always-on automation.
- Lower-cost x86 mini-PC could be preferable for integrations and screen-driving.
- Powerful x86 example Beelink SER8 was investigated but may be unnecessary if Mac retains audio.
- Desired detachable ~10.1-inch touchscreen with HDMI/USB-C/DisplayPort possibilities, ability to dock, reliable network and small UPS.
- Do not buy on the basis of old pricing or hypothetical audio loads. Check current specs, OS compatibility and budget first.

## Safety and operational notes
Use secure secrets outside GitHub. Audit actual device state rather than assuming last-known positions. Keep Donkey operational during staged migration and preserve rollback plan.

## Next steps
1. Physically test Airlite + Mac + Donkey bridge.
2. Inventory all current automation features and service launch mechanisms.
3. Benchmark Pi versus lower-cost mini-PC for controller-only duty.
4. Choose screen and UPS; test restore, Tailscale, static address and autostart.
5. Update this record after changes with tested/unverified labels and commit references.

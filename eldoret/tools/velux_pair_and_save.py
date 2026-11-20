#!/usr/bin/env python3
"""Pair a VELUX ACTIVE HAP gateway locally and persist credentials securely.

Runs on Bulldog inside ~/velux-homekit-venv; does NOT control any windows.
Secrets remain on Bulldog, never in GitHub. Use only when HAP advertises sf=1.
"""
import asyncio
import contextlib
import getpass
import json
import os
import pathlib
import re
import sys
import tempfile
from argparse import Namespace

from aiohomekit import hkjson
from aiohomekit.__main__ import get_controller

FILE = pathlib.Path.home() / ".config/eldoret-homekit/pairings.json"
DEVICE_ID = "E0:59:AE:CD:41:28"
ALIAS = "velux"
REQUIRED = {"AccessoryPairingID", "AccessoryLTPK", "iOSPairingId", "iOSDeviceLTSK", "iOSDeviceLTPK"}


def prepare():
    FILE.parent.mkdir(parents=True, exist_ok=True)
    FILE.parent.chmod(0o700)
    if FILE.exists():
        current = json.loads(FILE.read_text(encoding="utf-8"))
        if not isinstance(current, dict):
            raise RuntimeError("Existing pairing file is not a JSON object; refusing to overwrite.")
        if current:
            raise RuntimeError("Existing nonempty pairing file found; refusing to overwrite.")
    return FILE


def persist(pairing):
    data = pairing.pairing_data
    missing = REQUIRED.difference(data)
    if missing:
        raise RuntimeError("Pairing returned incomplete credentials (missing: " + ", ".join(sorted(missing)) + ")")
    contents = hkjson.dumps_indented({ALIAS: data})
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=FILE.parent,
        prefix=".pairings-", suffix=".tmp", delete=False
    ) as tmp:
        temp_path = pathlib.Path(tmp.name)
        os.chmod(temp_path, 0o600)
        tmp.write(contents)
        tmp.flush()
        os.fsync(tmp.fileno())
    try:
        verify = json.loads(temp_path.read_text(encoding="utf-8"))
        if ALIAS not in verify or not REQUIRED.issubset(verify[ALIAS]):
            raise RuntimeError("Saved pairing file failed structural verification")
        os.replace(temp_path, FILE)
    finally:
        with contextlib.suppress(FileNotFoundError):
            temp_path.unlink()
    print("SUCCESS: pairing credentials saved and structure verified.")
    print("Private file:", FILE, "| bytes:", FILE.stat().st_size)
    print("Do not print, share or commit the contents of this file.")


async def main():
    prepare()
    args = Namespace(file=str(FILE))
    async with get_controller(args) as controller:
        if ALIAS in controller.aliases:
            raise RuntimeError("Alias already exists, refusing to pair again.")
        discovery = await controller.async_find(DEVICE_ID, timeout=20)
        finish = await discovery.async_start_pairing(ALIAS)
        code = getpass.getpass("HomeKit code (XXX-YY-ZZZ; input hidden): ")
        if not re.fullmatch(r"\d{3}-\d{2}-\d{3}", code):
            raise RuntimeError("Code must use XXX-YY-ZZZ format.")
        pairing = await finish(code)
        code = ""
        persist(pairing)


if __name__ == "__main__":
    os.umask(0o077)
    try:
        asyncio.run(main())
    except Exception as exc:
        print("ERROR:", type(exc).__name__, str(exc))
        print("If the gateway switched to sf=0, do not retry pairing until its state is checked.")
        sys.exit(1)

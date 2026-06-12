#!/usr/bin/env python3
"""One-off batch downloader for the models.txt expansion (2026-06).
Downloads each accepted Sketchfab model's glTF archive into
assets-src/<id>/raw with a LICENSE.txt record. Token comes from
SKETCHFAB_API_TOKEN env var.
"""
import json, os, sys, time, urllib.request, zipfile, datetime

TOKEN = os.environ.get("SKETCHFAB_API_TOKEN") or sys.exit("SKETCHFAB_API_TOKEN not set")

MODELS = [
    ("audi-sport-quattro", "a2e98736245448afa807a2b5cabe05c7"),
    ("audi-r8-gt-2011", "82a564b96dde47a78925d9e45b78aaa1"),
    ("audi-r8-v10-gt", "0701d14ce550407f900df891316788f0"),
    ("audi-rs6-avant-gt", "85ccb4a2903e4eeab4c8298a8fa4e39f"),
    ("audi-r15-tdi", "f64fce5acb8a4d81a08b1bd84a6792d9"),
    ("vw-idr", "109ed75bc4df4400a308cbff7cc70f6d"),
    ("vw-w12-concept", "4b8faf5ec5274676b1f16cbe3f836e03"),
    ("honda-s800", "fa6c6113f1e34d9baaff80b5b586a25d"),
    ("honda-nsx-r", "a21edb35a7714774a10b74642e815ca2"),
    ("honda-civic-type-r-fk8", "c312252877204a44999bf084d1e19118"),
    ("honda-integra-dc5", "0fea873aaf694d1b98c308b0becd51ce"),
    ("honda-civic-type-r-fl5", "8c9484184a2b4254aafd67418b8c18db"),
    ("honda-civic-type-r-fk2", "423afaa1c6664859832d4a5458d90b52"),
    ("honda-civic-type-r-ek9", "4715562e16c44c5e9e847d9ff3fc2170"),
    ("honda-crx", "573d5c2480324a879ee15221ee426160"),
    ("honda-integra-dc2", "db88d2cc21654a4eb73ec9f0c2a7e113"),
    ("lexus-lfa", "83d062d1cd144e6a944c7415ef864889"),
    ("lexus-lfa-nurburgring", "c9d725a16ea6424fa74403b5138808b2"),
    ("toyota-ts030", "59f9ff1cbd144e3fa1f2d195512ca248"),
    ("toyota-gr-yaris", "98e6611ad034451982b6a9908c63fc47"),
    ("toyota-gr-supra", "9231f2d5e71a43dd87603dc0b339d99d"),
    ("toyota-ae86", "a5737bf3cc9b4179a6e5ebe173ff70d9"),
    ("toyota-supra-a80", "dd897d7823784bc5893c183c1328e8cb"),
    ("mazda-787b", "2d23833aba9b4efcbf3ec4876a12f715"),
    ("peugeot-9x8", "b3efbf3a774c4411983e630d764c8cea"),
]

def api(path):
    req = urllib.request.Request(
        f"https://api.sketchfab.com/v3{path}", headers={"Authorization": f"Token {TOKEN}"}
    )
    return json.load(urllib.request.urlopen(req))

ok, failed = 0, []
for cid, uid in MODELS:
    d = f"assets-src/{cid}"
    if os.path.exists(f"{d}/raw/scene.gltf"):
        print(f"{cid}: already present, skipping", flush=True)
        ok += 1
        continue
    try:
        meta = api(f"/models/{uid}")
        dl = api(f"/models/{uid}/download")
        pick = dl.get("gltf") or dl.get("glb")
        kind = "gltf" if dl.get("gltf") else "glb"
        os.makedirs(d, exist_ok=True)
        zpath = f"{d}/{kind}.zip"
        print(f"{cid}: downloading {kind} ({pick['size']/1e6:.1f} MB)...", flush=True)
        urllib.request.urlretrieve(pick["url"], zpath)
        with zipfile.ZipFile(zpath) as z:
            z.extractall(f"{d}/raw")
        os.remove(zpath)
        lic = meta["license"]
        with open(f"{d}/LICENSE.txt", "w") as f:
            f.write(
                f"Model: {meta['name']}\n"
                f"Author: {meta['user']['username']} ({meta['user']['profileUrl']})\n"
                f"Source: {meta['viewerUrl']}\n"
                f"License: {lic['label']} ({lic['slug']}) — {lic['url']}\n"
                f"Downloaded: {datetime.date.today().isoformat()} via Sketchfab Download API\n"
                "Modifications: scale-normalized, meshopt-compressed, textures "
                "resized/transcoded to webp for real-time display.\n"
            )
        ok += 1
        time.sleep(12)  # stay under the download-API rate limit
    except Exception as e:
        print(f"{cid}: FAILED — {e}", flush=True)
        failed.append(cid)

print(f"\ndone: {ok}/{len(MODELS)} ok; failed: {failed or 'none'}")

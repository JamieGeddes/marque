#!/usr/bin/env python3
"""One-off batch downloader for the models.txt expansion (2026-06).
Downloads each accepted Sketchfab model's glTF archive into
assets-src/<id>/raw with a LICENSE.txt record. Token comes from
SKETCHFAB_API_TOKEN env var.
"""
import json, os, sys, urllib.request, zipfile, datetime

TOKEN = os.environ.get("SKETCHFAB_API_TOKEN") or sys.exit("SKETCHFAB_API_TOKEN not set")

MODELS = [
    ("lotus-exige-s-2006", "13d071ac1288486b990be3ef818d8181"),
    ("lotus-emira", "a5d1f1962b4d4ebab6b449824fc58c9a"),
    ("lotus-esprit-v8", "fdc64e96ed3349d9bf4aff9db79e5aa2"),
    ("lotus-evora-gt430", "aa58af64c5a74660b06ca517e8c7f50e"),
    ("lotus-exige-360-cup", "ccc280412c5b47478127aef8986d4903"),
    ("lotus-elise-sprint", "fd5980631d4049259cff55bbf422aa81"),
    ("lotus-3-eleven", "d63c1150da8e45f88e526c99cc889bfd"),
    ("porsche-959", "0530aa8fa4b74427a71c961a5bdd7087"),
    ("porsche-gt3-992", "ba01afbaf32846e598db315be3507db3"),
    ("porsche-gt3-rs-992", "f17a982d5d8a4d97baef4b00b51a4e9a"),
    ("porsche-911-dakar", "3d08be7f0ed04c368d487ee72bc05225"),
    ("porsche-carrera-gt", "9d48aa751ab24becbf7110e93c8a7a1f"),
    ("ferrari-laferrari", "979f7085012e4d6399f38de3f9c39012"),
    ("ferrari-12cilindri", "cb0b42a5bda844bd8ccd62451f1db427"),
    ("ferrari-sf90-xx", "2c80c667232544649328cf3589921bcd"),
    ("ferrari-f8-tributo", "8a86c4d634f64f8b8ee836bc93fa6ac8"),
    ("ferrari-f50", "9d7ec096be3546e3967ebdb5e4a87e31"),
    ("ferrari-monza-sp2", "09b0681baaed40d9aada9138a5f75875"),
    ("ferrari-488-pista", "1d1344847d8540e9a6a7f21184ab7769"),
    ("ferrari-enzo", "9e790860a49d4594a6eef87cab190bba"),
    ("ferrari-250-gto", "0d2a7ee6ace246c0b545280ca5cc4031"),
    ("ferrari-599-gto", "14b4f6d9f84d4e30be52a2158685d3ff"),
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
    except Exception as e:
        print(f"{cid}: FAILED — {e}", flush=True)
        failed.append(cid)

print(f"\ndone: {ok}/{len(MODELS)} ok; failed: {failed or 'none'}")

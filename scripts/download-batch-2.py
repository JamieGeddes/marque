#!/usr/bin/env python3
"""Second batch downloader for the models.txt expansion (2026-06, part 2:
McLaren / Mini / boutique hypercars + a few marque infills). Mirrors
download-batch.py: fetches each model's glTF into assets-src/<id>/raw with a
LICENSE.txt record. Token from SKETCHFAB_API_TOKEN. The "McLaren P1" link in
models.txt was a mislabelled 1993 McLaren F1 duplicate and is intentionally omitted.
"""
import json, os, sys, time, urllib.request, zipfile, datetime

TOKEN = os.environ.get("SKETCHFAB_API_TOKEN") or sys.exit("SKETCHFAB_API_TOKEN not set")

MODELS = [
    # McLaren (new "Made in Woking" hall)
    ("mclaren-f1", "d96ebc208df54311964cad24f83e1656"),
    ("mclaren-f1-lm", "a0ef25e23a4a423d8fca5c62da54db77"),
    ("mclaren-senna", "725c62082f754cb28bd07e7e55bfbefc"),
    ("mclaren-speedtail", "f2364571602342e798b98f8fee14e2ed"),
    ("mclaren-600lt", "3eac09c5ff3646fb94709bc1b31b1943"),
    ("mclaren-675lt-spider", "7f3fcc4ef1a7472c91e0aaa9d0a86a89"),
    ("mclaren-mp4-12c", "ae2ed2bccbc84bccb21407e1657d860f"),
    ("mclaren-artura", "d393abd807f04d62b96b1bd82119b5d4"),
    ("mclaren-solus-gt", "452421d5d503479bb6e75e4a627b5490"),
    ("mclaren-w1", "519ee6f9089b4d548cd4384ef159f62e"),
    # Mini (new "Small Wonders" hall)
    ("mini-jcw-gp", "f8fa0409d83a4b099590dbcc7884a908"),
    ("mini-cooper-s-classic", "8b063519ced9423db1210bb2423c7d2a"),
    ("mini-jcw-cabrio", "704688ec24e04155aa45a1a2018286eb"),
    # Boutique hypercars (new "Atelier Hypercars" hall)
    ("pagani-zonda-f", "708ee246211244a88aa3c36f0f21f4df"),
    ("rimac-nevera-r", "755944b48f4b49bd820fa7cb73d906c5"),
    ("glickenhaus-scg-004c", "de1b2e02fb094e09a54bc27c72912852"),
    # Marque infills
    ("jaguar-xkr", "f3967a3f59fc469e91be12effce74904"),
    ("aston-martin-one-77", "bc691ea66a2747aca226fbf3c51fbb04"),
    ("tvr-sagaris", "41c36ef256214e0f99d317c0369f1bab"),
    ("ferrari-430-scuderia", "b00843d61131449595b82ac83f341558"),
    ("porsche-963", "0b46fea1c4484a0c887bd0b9aac86f5d"),
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

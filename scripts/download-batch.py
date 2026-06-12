#!/usr/bin/env python3
"""One-off batch downloader for the models.txt expansion (2026-06).
Downloads each accepted Sketchfab model's glTF archive into
assets-src/<id>/raw with a LICENSE.txt record. Token comes from
SKETCHFAB_API_TOKEN env var.
"""
import json, os, sys, time, urllib.request, zipfile, datetime

TOKEN = os.environ.get("SKETCHFAB_API_TOKEN") or sys.exit("SKETCHFAB_API_TOKEN not set")

MODELS = [
    ("ferrari-849-testarossa", "6e0619a84ef746998989d633a33a1851"),
    ("ferrari-296-gts", "9a596b9d09414adfad64fc1f5fd019f9"),
    ("lamborghini-gallardo", "ff0eb2242d0e42eb8b7034b4db639e56"),
    ("lamborghini-aventador", "e328d9f5dcfd48bdbe8c73324b52ece3"),
    ("bmw-m3-e46", "a067132c75f5456daa4f60c4001337d7"),
    ("bmw-m5-competition", "29a4c13761cb40e6a050871bd40a0963"),
    ("bmw-m1", "cd1d528eee2e4d9298c4e8647116545a"),
    ("bmw-m3-e36", "76401039fa80419ab036bea09acb898d"),
    ("bmw-m4-f82", "6dcbd7234690431e87e68f580be60e22"),
    ("bmw-m3-gts-e92", "ba0c261ab55649f5a8ec1572700ae0e3"),
    ("bmw-m3-csl-e46", "9a44382562e243a78badb5c080714508"),
    ("bmw-i8-roadster", "57f9d1de23534a80878d048684c0e60f"),
    ("bmw-m4-g82", "b16d7a4d771e4abd85ce4e29d41402ed"),
    ("bmw-30-csl", "86ee7c1a83334576933ab431542269d5"),
    ("bmw-m2-g87", "7a608716b25b4589a8cc323e9cbd1e8d"),
    ("bac-mono", "06e164b7dc9b42129c5882f043016591"),
    ("mercedes-slr-mclaren", "6dd3f12d311d4d1f8a55ce0e1596a442"),
    ("mercedes-amg-one", "0f75e0705a1f455585813859d901458a"),
    ("audi-r18", "3a5f4938e662429b8633120aa62805a4"),
    ("audi-ur-quattro", "b9ccdd8ddc154ee99ab153794042fd07"),
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

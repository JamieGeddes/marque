#!/usr/bin/env python3
"""One-off batch downloader for the models.txt expansion (2026-06).
Downloads each accepted Sketchfab model's glTF archive into
assets-src/<id>/raw with a LICENSE.txt record. Token comes from
SKETCHFAB_API_TOKEN env var.
"""
import json, os, sys, time, urllib.request, zipfile, datetime

TOKEN = os.environ.get("SKETCHFAB_API_TOKEN") or sys.exit("SKETCHFAB_API_TOKEN not set")

# 2026-06 expansion batch: the 31 new candidates from models.txt. Already-present
# ids are skipped by the on-disk check, so re-running is safe.
MODELS = [
    # Lotus (join the existing Lotus Collection)
    ("lotus-exige-240", "5795366af7bc4fd985c86a3dc81234f5"),
    ("lotus-evora-s", "63588352602445dfb94549bda26ce123"),
    # Bugatti
    ("bugatti-tourbillon", "4f63f5a74611477989cefd9861b9784a"),
    ("bugatti-divo", "7849e9f9cf2347c28fb5e41b1629991c"),
    ("bugatti-bolide", "658684653b154ffba72d5f9511312ca8"),
    ("bugatti-chiron", "f791c209b88249e9856a552672b64fea"),
    ("bugatti-veyron", "33da16dacdb34d8088324a24645a1802"),
    # Koenigsegg
    ("koenigsegg-one", "26d50f742f3241f5a36081d93205c764"),
    ("koenigsegg-jesko", "c657f51fb0db43e38fea172dfa385287"),
    ("koenigsegg-agera-rs", "a30e098257254fcfa1323f2841e26d13"),
    ("koenigsegg-ccx", "10efe5c94dd747b4a5157cfd229a8049"),
    # Maserati
    ("maserati-mc20", "6811b291cda74d468fab04298029135f"),
    ("maserati-mc12", "a801759b1a2447869f1186372eb320f0"),
    # Lancia
    ("lancia-037", "36f1c5964de14e0088d828e88a3749b9"),
    ("lancia-delta-integrale", "6ebb1a271c714e1dacfe4eba04f0e4c3"),
    ("lancia-stratos", "76dfbe905346419d817fa03d1e46e547"),
    # British GT
    ("noble-m600", "746187c4345543e0b09a06fe20c80d6e"),
    ("jaguar-xj220", "7dd7bc17b4564f6eb03542ad6cab6dda"),
    ("aston-martin-valiant", "49e5a4e4f02a42f895e2374487490989"),
    ("mclaren-765lt", "7c1940823fe94e05b7ced7de8ff9fe48"),
    # Lamborghini (expand Raging Bulls)
    ("lamborghini-countach", "75acd9a580574e128c0886d2bc5a2b21"),
    ("lamborghini-reventon", "0269b1057e224f7c85de8bafc43500bb"),
    ("lamborghini-veneno", "5884f95259ff411c95510cdde5ede33e"),
    ("lamborghini-centenario", "55968d5e76f24ba3ab85b5a373074787"),
    ("lamborghini-revuelto", "9128ccf717f641b9bcdaa5f06a613f01"),
    ("lamborghini-temerario", "223504eacee54eaf9169cc60db1c0a70"),
    ("lamborghini-sian", "ddedd95cd1bf478ebe476c8eb9dbe78d"),
    ("lamborghini-huracan-sterrato", "7af3c1063acf4439a7e69e05eaf94b9b"),
    # Volkswagen
    ("vw-golf-gti-mk1", "1fc46cb37bd748e3bb9355fcedaf3817"),
    ("vw-beetle", "969a477451ee40bb8e715ec0907d187e"),
    # Audi (join Four Rings)
    ("audi-rs-etron-gt", "e5b032ec99bc44be9f31761c574fe4c2"),
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

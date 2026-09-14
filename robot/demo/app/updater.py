import hashlib
import json
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

OWNER = "Totrungtv"
REPO = "appleseed-website"
BRANCH = "robot-demo"
REMOTE_ROOT = "robot/demo/"
ROOT = Path(__file__).resolve().parents[1]
BACKUP_ROOT = ROOT / "data" / "backups"
API_TREE = f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees/{BRANCH}?recursive=1"
RAW_BASE = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/"

# Large/local runtime data must never be touched by source sync.
EXCLUDED_TOP = {"runtime", "models", "data"}


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("utf-8")
    return hashlib.sha1(header + data).hexdigest()


def request_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Apple-Seed-Robot-Updater/1.0", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def download_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Apple-Seed-Robot-Updater/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def managed(rel: str) -> bool:
    parts = Path(rel).parts
    return bool(parts) and parts[0] == REMOTE_ROOT.rstrip("/").split("/")[0] and len(parts) >= 3 and parts[1] == "demo" and parts[2] not in EXCLUDED_TOP


def remote_files():
    tree = request_json(API_TREE)
    if tree.get("truncated"):
        raise RuntimeError("GitHub tree quá lớn, không thể đồng bộ an toàn bằng snapshot này.")
    out = {}
    prefix = REMOTE_ROOT
    for item in tree.get("tree", []):
        path = item.get("path", "")
        if item.get("type") != "blob" or not path.startswith(prefix):
            continue
        rel = path[len(prefix):]
        if not rel or rel.split("/", 1)[0] in EXCLUDED_TOP:
            continue
        out[rel.replace("/", os.sep)] = item.get("sha")
    return out


def local_files():
    out = {}
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT)
        if rel.parts and rel.parts[0] in EXCLUDED_TOP:
            continue
        try:
            out[str(rel)] = git_blob_sha(p.read_bytes())
        except OSError:
            pass
    return out


def safe_backup(path: Path, backup_root: Path):
    if not path.exists():
        return
    dst = backup_root / path.relative_to(ROOT)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dst)


def main():
    print("=" * 62)
    print("APPLE SEED ROBOT — ĐỒNG BỘ GITHUB")
    print("Chỉ đồng bộ source/config/assets; KHÔNG đụng runtime/models/data.")
    print("=" * 62)
    try:
        remote = remote_files()
        local = local_files()
    except Exception as e:
        print(f"\n[LOI] Không thể kiểm tra GitHub: {e}")
        return 1

    changed = [rel for rel, sha in remote.items() if local.get(rel) != sha]
    deleted = [rel for rel in local if rel not in remote]

    print(f"\nGitHub: {len(remote)} file source")
    print(f"Máy:   {len(local)} file source")
    print(f"Thay đổi/thêm: {len(changed)}")
    print(f"Xóa theo GitHub: {len(deleted)}")

    if not changed and not deleted:
        print("\n✓ Máy đã đồng bộ. Không cần tải gì thêm.")
        return 0

    print("\nCác file sẽ cập nhật:")
    for rel in changed:
        print("  +/M", rel)
    for rel in deleted:
        print("  -", rel)

    answer = input("\nTiến hành đồng bộ? (Y/N): ").strip().lower()
    if answer not in {"y", "yes", "c", "co"}:
        print("Đã hủy.")
        return 0

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = BACKUP_ROOT / stamp
    backup_root.mkdir(parents=True, exist_ok=True)

    try:
        for rel in changed:
            target = ROOT / rel
            safe_backup(target, backup_root)
            url = RAW_BASE + "robot/demo/" + rel.replace(os.sep, "/")
            data = download_bytes(url)
            target.parent.mkdir(parents=True, exist_ok=True)
            fd, tmp = tempfile.mkstemp(prefix="as_update_", dir=str(target.parent))
            try:
                with os.fdopen(fd, "wb") as f:
                    f.write(data)
                os.replace(tmp, target)
            finally:
                if os.path.exists(tmp):
                    os.remove(tmp)

        for rel in deleted:
            target = ROOT / rel
            safe_backup(target, backup_root)
            target.unlink(missing_ok=True)

    except Exception as e:
        print(f"\n[LOI] Cập nhật thất bại: {e}")
        print(f"Backup nằm tại: {backup_root}")
        return 2

    print(f"\n✓ Đồng bộ xong. Backup: {backup_root}")
    print("✓ runtime/models/data được giữ nguyên.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

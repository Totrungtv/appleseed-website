# Apple Seed ADB Bridge
# Windows: run with Python 3:
#   py apple-seed-adb-bridge.py
# The bridge is localhost-only and uses the existing adb.exe/ADB server.

import base64
import hashlib
import json
import os
import shutil
import socket
import struct
import subprocess
import tempfile
import threading
from http import HTTPStatus

HOST = "127.0.0.1"
PORT = 8765
ADB = shutil.which("adb") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "adb.exe")

def adb_run(args, timeout=60, data=None):
    if not os.path.exists(ADB) and shutil.which(ADB) is None:
        raise RuntimeError("Không tìm thấy adb.exe. Đặt adb.exe cạnh file Bridge hoặc thêm ADB vào PATH.")
    p = subprocess.run([ADB] + args, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return p.returncode, p.stdout, p.stderr

def devices():
    rc, out, err = adb_run(["devices", "-l"])
    rows = []
    for line in out.decode(errors="replace").splitlines()[1:]:
        line = line.strip()
        if not line or line.startswith("*"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            rows.append({"serial": parts[0], "state": parts[1]})
    return {"devices": rows, "adb": ADB}

def shell(serial, command):
    if not serial:
        raise RuntimeError("Thiếu serial thiết bị.")
    rc, out, err = adb_run(["-s", serial, "shell", command], timeout=120)
    return {"exitCode": rc, "stdout": out.decode(errors="replace"), "stderr": err.decode(errors="replace")}

def push(serial, path, b64):
    if not serial:
        raise RuntimeError("Thiếu serial thiết bị.")
    fd, local = tempfile.mkstemp(prefix="appleseed_", suffix=".apk")
    os.close(fd)
    try:
        with open(local, "wb") as f:
            f.write(base64.b64decode(b64))
        rc, out, err = adb_run(["-s", serial, "push", local, path], timeout=180)
        if rc:
            raise RuntimeError((err or out).decode(errors="replace") or "adb push thất bại")
        return {"output": out.decode(errors="replace")}
    finally:
        try:
            os.remove(local)
        except OSError:
            pass

def handle(req):
    action = req.get("action")
    if action == "ping":
        return {"ok": True, "data": {"name": "Apple Seed ADB Bridge", "version": 1}}
    if action == "devices":
        return {"ok": True, "data": devices()}
    if action == "shell":
        return {"ok": True, "data": shell(req.get("serial", ""), req.get("command", ""))}
    if action == "push":
        return {"ok": True, "data": push(req.get("serial", ""), req.get("path", ""), req.get("base64", ""))}
    raise RuntimeError("Action không được hỗ trợ: " + str(action))

def recv_exact(sock, n):
    b = b""
    while len(b) < n:
        x = sock.recv(n - len(b))
        if not x:
            raise ConnectionError("socket closed")
        b += x
    return b

def recv_frame(sock):
    h = recv_exact(sock, 2)
    b1, b2 = h
    opcode = b1 & 0x0F
    masked = b2 & 0x80
    ln = b2 & 0x7F
    if ln == 126:
        ln = struct.unpack("!H", recv_exact(sock, 2))[0]
    elif ln == 127:
        ln = struct.unpack("!Q", recv_exact(sock, 8))[0]
    if ln > 64 * 1024 * 1024:
        raise RuntimeError("WebSocket message quá lớn")
    mask = recv_exact(sock, 4) if masked else b""
    data = bytearray(recv_exact(sock, ln))
    if masked:
        for i in range(len(data)):
            data[i] ^= mask[i & 3]
    return opcode, bytes(data)

def send_frame(sock, data, opcode=1):
    if isinstance(data, str):
        data = data.encode()
    n = len(data)
    if n < 126:
        head = bytes([0x80 | opcode, n])
    elif n <= 65535:
        head = bytes([0x80 | opcode, 126]) + struct.pack("!H", n)
    else:
        head = bytes([0x80 | opcode, 127]) + struct.pack("!Q", n)
    sock.sendall(head + data)

def websocket_handshake(sock):
    request = b""
    while b"\r\n\r\n" not in request and len(request) < 16384:
        request += sock.recv(4096)
    text = request.decode("latin1", errors="replace")
    lines = text.split("\r\n")
    headers = {}
    for line in lines[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.lower().strip()] = v.strip()
    origin = headers.get("origin", "")
    if origin and not (origin.startswith("https://appleseedtravinh.com") or origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1")):
        raise PermissionError("Origin không được phép")
    key = headers.get("sec-websocket-key")
    if not key:
        raise RuntimeError("Không phải WebSocket handshake")
    accept = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode()
    response = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n"
    sock.sendall(response.encode())

def client(sock):
    try:
        websocket_handshake(sock)
        while True:
            opcode, payload = recv_frame(sock)
            if opcode == 8:
                break
            if opcode == 9:
                send_frame(sock, payload, 10)
                continue
            if opcode != 1:
                continue
            req = json.loads(payload.decode("utf-8"))
            rid = req.get("id")
            try:
                result = handle(req)
                response = {"id": rid, **result}
            except Exception as e:
                response = {"id": rid, "ok": False, "error": str(e)}
            send_frame(sock, json.dumps(response, ensure_ascii=False))
    except Exception:
        pass
    finally:
        try:
            sock.close()
        except OSError:
            pass

def main():
    print("Apple Seed ADB Bridge")
    print("ADB:", ADB)
    print("WebSocket: ws://127.0.0.1:%d" % PORT)
    print("Giữ cửa sổ này mở trong lúc dùng Huawei / Android Service Tool.")
    print()
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen(5)
        while True:
            sock, addr = s.accept()
            threading.Thread(target=client, args=(sock,), daemon=True).start()

if __name__ == "__main__":
    main()

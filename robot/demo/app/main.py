import sys, os, json, base64, mimetypes, tempfile, subprocess, time, urllib.request, urllib.error, threading
from pathlib import Path
from PySide6.QtCore import Qt, QThread, Signal, QMimeData, QTimer, QEvent
from PySide6.QtGui import QFont, QPixmap, QIcon, QImage
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QFrame, QLabel, QPushButton,
    QVBoxLayout, QHBoxLayout, QGridLayout, QStackedWidget, QTextEdit,
    QLineEdit, QListWidget, QListWidgetItem, QFileDialog, QSplitter,
    QSizePolicy, QMessageBox
)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
CONFIG = ROOT / "config"
MODELS = ROOT / "models"
RUNTIME = ROOT / "runtime"
DATA = ROOT / "data"
TECH_IMAGE = ASSETS / "apple_seed_technician.png"
LOGO_IMAGE = ASSETS / "apple_seed_logo.png"
MODEL = MODELS / "Qwen3VL-4B-Instruct-Q4_K_M.gguf"
MMPROJ = MODELS / "mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf"
LLAMA = RUNTIME / "llama-server.exe"
PORT = 8081
BASE = f"http://127.0.0.1:{PORT}"

STYLE = """
* { font-family:"Segoe UI"; }
QMainWindow { background:#f5f7fb; }
QFrame#sidebar { background:#0f172a; }
QFrame#topbar { background:white; border-bottom:1px solid #e7ebf2; }
QLabel#brandTitle { color:white; font-size:19px; font-weight:700; }
QLabel#brandSub { color:#94a3b8; font-size:11px; }
QPushButton#nav,QPushButton#navActive { text-align:left; padding:11px 14px; border:0; border-radius:9px; font-size:13px; }
QPushButton#nav { color:#cbd5e1; background:transparent; }
QPushButton#nav:hover { background:#1e293b; color:white; }
QPushButton#navActive { color:white; background:#2563eb; font-weight:600; }
QLabel#pageTitle { color:#0f172a; font-size:22px; font-weight:700; }
QLabel#pageSub,QLabel#muted { color:#64748b; font-size:12px; }
QFrame#card { background:white; border:1px solid #e7ebf2; border-radius:14px; }
QLabel#cardTitle { color:#0f172a; font-size:14px; font-weight:700; }
QLabel#statusOk { color:#16a34a; font-size:12px; font-weight:600; }
QLabel#statusBad { color:#dc2626; font-size:12px; font-weight:600; }
QPushButton#primary { background:#2563eb; color:white; border:0; border-radius:9px; padding:9px 14px; font-weight:600; }
QPushButton#primary:hover { background:#1d4ed8; }
QPushButton#ghost { background:#f8fafc; color:#334155; border:1px solid #e2e8f0; border-radius:9px; padding:8px 12px; }
QTextEdit#chat { background:white; border:1px solid #e7ebf2; border-radius:12px; padding:12px; color:#0f172a; font-size:13px; }
QLineEdit#chatInput { background:white; border:1px solid #dbe2ea; border-radius:10px; padding:11px; color:#0f172a; font-size:13px; }
QListWidget#history { background:white; border:1px solid #e7ebf2; border-radius:12px; padding:6px; }
QLabel#imageDrop { background:#f8fafc; border:1px dashed #94a3b8; border-radius:10px; color:#64748b; padding:8px; }
"""

def pix(name, w, h):
    p = ASSETS / name
    if not p.exists(): return QPixmap()
    return QPixmap(str(p)).scaled(w,h,Qt.KeepAspectRatio,Qt.SmoothTransformation)

def data_url(path):
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    return "data:%s;base64,%s" % (mime, base64.b64encode(Path(path).read_bytes()).decode())

def health():
    try:
        with urllib.request.urlopen(BASE + "/health", timeout=1.2) as r:
            return r.status == 200
    except Exception:
        return False

class Engine:
    def __init__(self):
        self.proc = None

    def start(self):
        if not LLAMA.exists():
            return False, "Thiếu llama-server.exe"
        if not MODEL.exists() or not MMPROJ.exists():
            return False, "Thiếu model Vision"
        if health(): return True, "Đã chạy"
        cmd = [
            str(LLAMA), "-m", str(MODEL), "--mmproj", str(MMPROJ),
            "--host","127.0.0.1","--port",str(PORT),
            "-c","4096","-ngl","99","-t","8","--jinja"
        ]
        try:
            log_dir = DATA
            log_dir.mkdir(parents=True, exist_ok=True)
            log = open(log_dir / "llama-server.log", "a", encoding="utf-8", errors="ignore")
            self.proc = subprocess.Popen(
                cmd, cwd=str(ROOT), stdout=log, stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        except Exception as e:
            return False, "Không thể khởi động llama-server: " + str(e)
        for _ in range(80):
            if health(): return True, "Đã chạy"
            if self.proc.poll() is not None:
                return False, "llama-server đã dừng. Xem data\\llama-server.log"
            time.sleep(0.25)
        return False, "Engine khởi động quá lâu"

class ChatWorker(QThread):
    done = Signal(str, str)
    def __init__(self, messages):
        super().__init__(); self.messages=messages
    def run(self):
        payload=json.dumps({"messages":self.messages,"temperature":0.2,"max_tokens":700},ensure_ascii=False).encode()
        req=urllib.request.Request(BASE+"/v1/chat/completions",data=payload,headers={"Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(req,timeout=180) as r:
                obj=json.loads(r.read().decode("utf-8",errors="ignore"))
            text=obj.get("choices",[{}])[0].get("message",{}).get("content","")
            self.done.emit(text,"")
        except Exception as e:
            self.done.emit("",str(e))

class Dashboard(QWidget):
    def __init__(self, open_assistant):
        super().__init__(); root=QVBoxLayout(self); root.setContentsMargins(24,20,24,24)
        hero=QFrame(); hero.setObjectName("card"); hv=QHBoxLayout(hero); hv.setContentsMargins(18,18,18,18)
        img=QLabel(); img.setPixmap(pix("apple_seed_technician.png",100,100)); hv.addWidget(img)
        c=QLabel("Apple Seed Assistant"); c.setObjectName("pageTitle"); hv.addWidget(c); hv.addStretch(); root.addWidget(hero)
        q=QPushButton("✦  Mở Apple Seed Assistant"); q.setObjectName("primary"); q.clicked.connect(open_assistant); root.addWidget(q,0,Qt.AlignLeft); root.addStretch()

class Assistant(QWidget):
    def __init__(self):
        super().__init__()
        self.messages=[{"role":"system","content":"Bạn là Apple Seed Robot, trợ lý kỹ thuật của Apple Seed. Trả lời tiếng Việt có dấu. Không hiển thị chain-of-thought. Khi người dùng đưa ảnh, hãy mô tả những gì thực sự thấy, không đoán bừa. Khi được yêu cầu sửa code, chỉ đề xuất thay đổi khi có đủ dữ liệu."}]
        self.pending_image=None; self.worker=None
        root=QVBoxLayout(self); root.setContentsMargins(24,20,24,24); root.setSpacing(10)
        h=QHBoxLayout(); av=QLabel(); av.setPixmap(pix("apple_seed_technician.png",64,64)); av.setFixedSize(70,70); h.addWidget(av)
        tt=QVBoxLayout(); a=QLabel("Apple Seed Assistant"); a.setObjectName("pageTitle"); tt.addWidget(a); b=QLabel("Trợ lý kỹ thuật • chat + vision"); b.setObjectName("pageSub"); tt.addWidget(b); h.addLayout(tt); h.addStretch()
        self.status=QLabel("● Đang kiểm tra engine"); self.status.setObjectName("statusBad"); h.addWidget(self.status); root.addLayout(h)
        split=QSplitter(Qt.Horizontal); hist=QListWidget(); hist.setObjectName("history"); hist.setMaximumWidth(230)
        for x in ["Cuộc trò chuyện mới","Theme Builder","Lỗi giao diện","Phân tích ảnh iPhone"]: hist.addItem(QListWidgetItem(x))
        split.addWidget(hist)
        right=QWidget(); rl=QVBoxLayout(right); rl.setContentsMargins(10,0,0,0); rl.setSpacing(8)
        self.chat=QTextEdit(); self.chat.setObjectName("chat"); self.chat.setReadOnly(True); self.chat.setHtml("<b>Apple Seed Robot</b><br><span style='color:#64748b'>Đang khởi động engine local...</span>"); rl.addWidget(self.chat,1)
        row=QHBoxLayout(); self.imageDrop=QLabel("📎 Dán ảnh bằng Ctrl+V • hoặc chọn ảnh"); self.imageDrop.setObjectName("imageDrop"); row.addWidget(self.imageDrop,1)
        choose=QPushButton("Chọn ảnh"); choose.setObjectName("ghost"); choose.clicked.connect(self.choose_image); row.addWidget(choose)
        clear=QPushButton("Xóa ảnh"); clear.setObjectName("ghost"); clear.clicked.connect(self.clear_image); row.addWidget(clear); rl.addLayout(row)
        line=QHBoxLayout(); self.input=QLineEdit(); self.input.setObjectName("chatInput"); self.input.setPlaceholderText("Nhập yêu cầu…"); self.input.returnPressed.connect(self.send); line.addWidget(self.input,1)
        send=QPushButton("Gửi  ↵"); send.setObjectName("primary"); send.clicked.connect(self.send); line.addWidget(send); rl.addLayout(line)
        split.addWidget(right); split.setSizes([220,900]); root.addWidget(split,1); self.setFocusPolicy(Qt.StrongFocus); QApplication.instance().installEventFilter(self)

    def eventFilter(self,obj,event):
        if event.type()==QEvent.KeyPress and event.key()==Qt.Key_V and event.modifiers() & Qt.ControlModifier:
            md=QApplication.clipboard().mimeData()
            if md.hasImage():
                img=QApplication.clipboard().image(); p=Path(tempfile.gettempdir())/"apple_seed_clipboard.png"
                if img.save(str(p),"PNG"): self.set_image(p); event.accept(); return True
        return super().eventFilter(obj,event)
    def set_engine(self,ok,msg):
        self.status.setText("● Local engine sẵn sàng" if ok else "● "+msg); self.status.setObjectName("statusOk" if ok else "statusBad"); self.status.style().unpolish(self.status); self.status.style().polish(self.status)
        self.chat.setHtml("<b>Apple Seed Robot</b><br><span style='color:#64748b'>Sẵn sàng. Mày có thể hỏi hoặc Ctrl+V ảnh.</span>" if ok else "<b>Apple Seed Robot</b><br><span style='color:#dc2626'>"+msg+"</span>")
    def choose_image(self):
        p,_=QFileDialog.getOpenFileName(self,"Chọn ảnh","","Images (*.png *.jpg *.jpeg *.webp *.bmp)")
        if p: self.set_image(Path(p))
    def set_image(self,p):
        self.pending_image=Path(p); pm=QPixmap(str(p)).scaled(180,100,Qt.KeepAspectRatio,Qt.SmoothTransformation); self.imageDrop.setPixmap(pm); self.imageDrop.setToolTip(str(p))
    def clear_image(self): self.pending_image=None; self.imageDrop.setText("📎 Dán ảnh bằng Ctrl+V • hoặc chọn ảnh")
    def keyPressEvent(self,event):
        if event.key()==Qt.Key_V and event.modifiers() & Qt.ControlModifier:
            md=QApplication.clipboard().mimeData()
            if md.hasImage():
                img=QApplication.clipboard().image(); p=Path(tempfile.gettempdir())/"apple_seed_clipboard.png"; img.save(str(p),"PNG"); self.set_image(p); event.accept(); return
        super().keyPressEvent(event)
    def send(self):
        text=self.input.text().strip()
        if not text and not self.pending_image: return
        content=[]
        if self.pending_image: content.append({"type":"image_url","image_url":{"url":data_url(self.pending_image)}})
        if text: content.append({"type":"text","text":text})
        self.messages.append({"role":"user","content":content if len(content)>1 or self.pending_image else text}); self.chat.append(f"<div style='margin-top:8px'><b>Bạn</b><br>{text or '📷 Ảnh'}</div>"); self.input.clear(); self.status.setText("● Đang xử lý…")
        self.worker=ChatWorker(self.messages.copy()); self.worker.done.connect(self.answer); self.worker.start()
    def answer(self,text,err):
        if err: self.chat.append(f"<div style='margin-top:8px'><b>Apple Seed Robot</b><br><span style='color:#dc2626'>Lỗi: {err}</span></div>"); self.status.setText("● Engine lỗi"); return
        self.messages.append({"role":"assistant","content":text}); safe=text.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\n","<br>"); self.chat.append(f"<div style='margin-top:8px'><b>Apple Seed Robot</b><br>{safe}</div>"); self.status.setText("● Local engine sẵn sàng"); self.pending_image=None; self.imageDrop.setText("📎 Dán ảnh bằng Ctrl+V • hoặc chọn ảnh")

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__(); self.engine=Engine(); self.setWindowTitle("Apple Seed Robot")
        if LOGO_IMAGE.exists(): self.setWindowIcon(QIcon(str(LOGO_IMAGE)))
        self.resize(1240,760); self.setMinimumSize(1000,650); shell=QWidget(); self.setCentralWidget(shell); outer=QHBoxLayout(shell); outer.setContentsMargins(0,0,0,0); outer.setSpacing(0)
        side=QFrame(); side.setObjectName("sidebar"); side.setFixedWidth(218); sl=QVBoxLayout(side); sl.setContentsMargins(14,16,14,14); sl.setSpacing(5)
        bi=QLabel(); bi.setPixmap(pix("apple_seed_logo.png",120,88)); bi.setAlignment(Qt.AlignCenter); sl.addWidget(bi); b=QLabel("APPLE SEED"); b.setObjectName("brandTitle"); b.setAlignment(Qt.AlignCenter); sl.addWidget(b); sub=QLabel("ROBOT • LOCAL WORKSTATION"); sub.setObjectName("brandSub"); sub.setAlignment(Qt.AlignCenter); sl.addWidget(sub); sl.addSpacing(18)
        self.stack=QStackedWidget(); self.dash=Dashboard(lambda:self.show_page(1)); self.assist=Assistant(); self.stack.addWidget(self.dash); self.stack.addWidget(self.assist); self.navs=[]
        for text,idx in [("⌂   Tổng quan",0),("✦   AI Assistant",1),("▣   Image Inspector",1),("⌘   Code Agent",1),("⚙   Cài đặt",0)]:
            n=QPushButton(text); n.setObjectName("navActive" if idx==0 else "nav"); n.clicked.connect(lambda _,i=idx:self.show_page(i)); sl.addWidget(n); self.navs.append(n)
        sl.addStretch(); q=QLabel("LOCAL • SECURE"); q.setStyleSheet("color:#64748b;font-size:10px;"); sl.addWidget(q); outer.addWidget(side)
        main=QFrame(); ml=QVBoxLayout(main); ml.setContentsMargins(0,0,0,0); ml.setSpacing(0); top=QFrame(); top.setObjectName("topbar"); top.setFixedHeight(54); tl=QHBoxLayout(top); tl.setContentsMargins(18,0,18,0); title=QLabel("Apple Seed Service Center"); title.setStyleSheet("font-size:13px;font-weight:600;color:#334155;"); tl.addWidget(title); tl.addStretch(); self.topstatus=QLabel("● Đang khởi động"); self.topstatus.setStyleSheet("color:#64748b;font-size:12px;font-weight:600;"); tl.addWidget(self.topstatus); ml.addWidget(top); ml.addWidget(self.stack,1); outer.addWidget(main,1)
        self.engine_result=None; self.engine_thread=threading.Thread(target=self.boot_engine,daemon=True); self.engine_thread.start(); self.poll=QTimer(self); self.poll.timeout.connect(self.apply_engine_result); self.poll.start(150)
    def boot_engine(self): self.engine_result=self.engine.start()
    def apply_engine_result(self):
        if self.engine_result is None: return
        ok,msg=self.engine_result; self.engine_result=None; self.assist.set_engine(ok,msg); self.topstatus.setText("● Máy tính sẵn sàng" if ok else "● Engine chưa sẵn sàng"); self.topstatus.setStyleSheet("color:#16a34a;font-size:12px;font-weight:600;" if ok else "color:#dc2626;font-size:12px;font-weight:600;")
    def show_page(self,idx):
        self.stack.setCurrentIndex(idx)
        for i,n in enumerate(self.navs): n.setObjectName("navActive" if ((idx==0 and i==0) or (idx==1 and i in [1,2,3])) else "nav"); n.style().unpolish(n); n.style().polish(n)

if __name__=="__main__":
    app=QApplication(sys.argv); app.setStyleSheet(STYLE); w=MainWindow(); w.show(); sys.exit(app.exec())

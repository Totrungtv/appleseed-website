import os
from pathlib import Path
from PySide6.QtCore import Qt
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtWidgets import QWidget,QVBoxLayout,QHBoxLayout,QPushButton,QLabel,QFileDialog,QSpinBox,QLineEdit,QMessageBox,QScrollArea,QFrame
try:
    import fitz
except Exception:
    fitz=None

class PdfCanvas(QLabel):
    def __init__(self,owner):
        super().__init__(); self.owner=owner; self.setAlignment(Qt.AlignCenter); self.setMinimumSize(600,700); self.setCursor(Qt.CrossCursor)
        self.setStyleSheet('background:#1e293b;border:1px solid #334155;border-radius:10px;')
    def mousePressEvent(self,event):
        if event.button()==Qt.LeftButton and self.owner.doc and self.owner.add_text_mode:
            p=self.owner.widget_to_pdf(event.position().x(),event.position().y())
            if p: self.owner.insert_text_at(p.x,p.y)
        super().mousePressEvent(event)

class PdfEditor(QWidget):
    def __init__(self):
        super().__init__(); self.doc=None; self.path=None; self.page_index=0; self.zoom=1.0; self.add_text_mode=False
        self.canvas=PdfCanvas(self); self.status=QLabel('Mở một file PDF để bắt đầu.'); self.status.setStyleSheet('color:#64748b;')
        self.text_input=QLineEdit(); self.text_input.setPlaceholderText('Nhập chữ rồi bấm Thêm chữ, sau đó click lên trang PDF…')
        self.build_ui()
    def build_ui(self):
        root=QVBoxLayout(self); root.setContentsMargins(20,18,20,20); root.setSpacing(10)
        title=QLabel('📄  PDF READER & EDITOR'); title.setStyleSheet('font-size:22px;font-weight:700;color:#0f172a;'); root.addWidget(title)
        root.addWidget(QLabel('Đọc PDF • phóng to • xoay • thêm chữ • lưu thành file mới'))
        bar=QHBoxLayout()
        for text,fn in [('📂 Mở PDF',self.open_pdf),('💾 Lưu thành…',self.save_as),('↶ Xoay',self.rotate),('＋ Thêm chữ',self.toggle_text)]:
            b=QPushButton(text); b.setObjectName('primary' if text=='📂 Mở PDF' else 'ghost'); b.clicked.connect(fn); bar.addWidget(b)
        prev=QPushButton('◀'); prev.clicked.connect(lambda:self.goto_page(-1)); nxt=QPushButton('▶'); nxt.clicked.connect(lambda:self.goto_page(1))
        self.page_spin=QSpinBox(); self.page_spin.setMinimum(1); self.page_spin.setMaximum(1); self.page_spin.valueChanged.connect(self.spin_page)
        bar.addWidget(prev); bar.addWidget(self.page_spin); bar.addWidget(nxt)
        minus=QPushButton('−'); minus.clicked.connect(lambda:self.change_zoom(-0.1)); plus=QPushButton('＋'); plus.clicked.connect(lambda:self.change_zoom(0.1)); bar.addWidget(minus); bar.addWidget(plus); bar.addStretch(); root.addLayout(bar)
        root.addWidget(self.text_input)
        scroll=QScrollArea(); scroll.setWidgetResizable(True); scroll.setFrameShape(QFrame.NoFrame); scroll.setWidget(self.canvas); root.addWidget(scroll,1); root.addWidget(self.status)
    def open_pdf(self):
        if fitz is None:
            QMessageBox.critical(self,'Thiếu PyMuPDF','Robot chưa có PyMuPDF. Chạy INSTALL_UI.bat để cài thư viện PDF.'); return
        path,_=QFileDialog.getOpenFileName(self,'Mở PDF','','PDF files (*.pdf)')
        if not path:return
        try:
            self.doc=fitz.open(path); self.path=path; self.page_index=0; self.zoom=1.0; self.page_spin.setMaximum(max(1,len(self.doc))); self.page_spin.setValue(1); self.status.setText(f'Đã mở: {Path(path).name} • {len(self.doc)} trang'); self.render()
        except Exception as e: QMessageBox.critical(self,'Không mở được PDF',str(e))
    def render(self):
        if not self.doc:return
        page=self.doc[self.page_index]; mat=fitz.Matrix(self.zoom*1.4,self.zoom*1.4); pix=page.get_pixmap(matrix=mat,alpha=False)
        img=QImage(pix.samples,pix.width,pix.height,pix.stride,QImage.Format_RGB888).copy(); self.canvas.setPixmap(QPixmap.fromImage(img)); self.canvas.adjustSize(); self.status.setText(f'Trang {self.page_index+1}/{len(self.doc)} • zoom {self.zoom:.1f}x')
    def goto_page(self,delta):
        if not self.doc:return
        self.page_index=max(0,min(len(self.doc)-1,self.page_index+delta)); self.page_spin.blockSignals(True); self.page_spin.setValue(self.page_index+1); self.page_spin.blockSignals(False); self.render()
    def spin_page(self,value):
        if self.doc:self.page_index=max(0,min(len(self.doc)-1,value-1)); self.render()
    def change_zoom(self,delta): self.zoom=max(0.4,min(3.0,self.zoom+delta)); self.render()
    def rotate(self):
        if not self.doc:return
        page=self.doc[self.page_index]; page.set_rotation((page.rotation+90)%360); self.render(); self.status.setText('Đã xoay trang • bấm Lưu thành… để ghi file')
    def toggle_text(self):
        if not self.doc: QMessageBox.information(self,'PDF','Mở PDF trước.'); return
        if not self.text_input.text().strip(): QMessageBox.information(self,'PDF','Nhập nội dung cần thêm trước.'); return
        self.add_text_mode=not self.add_text_mode; self.status.setText('CHẾ ĐỘ THÊM CHỮ: click vào vị trí trên trang PDF.' if self.add_text_mode else 'Đã tắt chế độ thêm chữ.')
    def widget_to_pdf(self,x,y):
        if not self.doc:return None
        pix=self.canvas.pixmap()
        if not pix or pix.width()==0:return None
        page=self.doc[self.page_index]; return fitz.Point(x*page.rect.width/pix.width(),y*page.rect.height/pix.height())
    def insert_text_at(self,x,y):
        text=self.text_input.text().strip(); self.doc[self.page_index].insert_text((x,y),text,fontsize=12,color=(0.05,0.35,0.8),overlay=True); self.add_text_mode=False; self.status.setText(f'Đã thêm chữ: {text}'); self.render()
    def save_as(self):
        if not self.doc: QMessageBox.information(self,'PDF','Chưa có PDF để lưu.'); return
        path,_=QFileDialog.getSaveFileName(self,'Lưu PDF','apple_seed_edited.pdf','PDF files (*.pdf)')
        if not path:return
        try:self.doc.save(path,garbage=4,deflate=True); self.status.setText(f'Đã lưu: {Path(path).name}')
        except Exception as e: QMessageBox.critical(self,'Không lưu được',str(e))

from pathlib import Path
from PySide6.QtCore import Qt, QPoint
from PySide6.QtGui import QImage, QPixmap, QPainter, QPen
from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QFileDialog, QSpinBox, QLineEdit, QMessageBox, QScrollArea, QFrame, QColorDialog
try:
    import fitz
except Exception:
    fitz = None


class PdfCanvas(QLabel):
    def __init__(self, owner):
        super().__init__()
        self.owner = owner
        self.setAlignment(Qt.AlignLeft | Qt.AlignTop)
        self.setMinimumSize(800, 1100)
        self.setCursor(Qt.OpenHandCursor)
        self._drag_start = None
        self._dragging = False
        self._draft_start = None
        self._draft_end = None
        self.setStyleSheet('background:#1e293b;border:1px solid #334155;border-radius:10px;')

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton and self.owner.doc:
            tool = self.owner.tool
            if tool == 'text':
                p = self.owner.widget_to_pdf(event.position().x(), event.position().y())
                if p:
                    self.owner.insert_text_at(p.x, p.y)
                return
            if tool in ('highlight', 'rect', 'draw'):
                self._draft_start = event.position().toPoint()
                self._draft_end = self._draft_start
                self.setCursor(Qt.CrossCursor)
                return
        if event.button() in (Qt.MiddleButton, Qt.RightButton):
            self._drag_start = event.position().toPoint()
            self._dragging = True
            self.setCursor(Qt.ClosedHandCursor)
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if self._draft_start is not None:
            self._draft_end = event.position().toPoint()
            self.update()
            return
        if self._dragging and self.parentWidget() is not None:
            delta = event.position().toPoint() - self._drag_start
            self._drag_start = event.position().toPoint()
            area = self.owner.scroll
            area.horizontalScrollBar().setValue(area.horizontalScrollBar().value() - delta.x())
            area.verticalScrollBar().setValue(area.verticalScrollBar().value() - delta.y())
            return
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        if self._draft_start is not None and event.button() == Qt.LeftButton:
            self._draft_end = event.position().toPoint()
            a = self.owner.widget_to_pdf(self._draft_start.x(), self._draft_start.y())
            b = self.owner.widget_to_pdf(self._draft_end.x(), self._draft_end.y())
            self._draft_start = None
            self._draft_end = None
            self.setCursor(Qt.CrossCursor)
            if a and b:
                self.owner.apply_area_tool(a, b)
            self.update()
            return
        if self._dragging and event.button() in (Qt.MiddleButton, Qt.RightButton):
            self._dragging = False
            self.setCursor(Qt.OpenHandCursor)
        super().mouseReleaseEvent(event)

    def wheelEvent(self, event):
        # Normal wheel = scroll the PDF. Ctrl + wheel = zoom.
        if event.modifiers() & Qt.ControlModifier:
            self.owner.change_zoom(0.1 if event.angleDelta().y() > 0 else -0.1)
            event.accept()
            return
        self.owner.scroll.verticalScrollBar().setValue(
            self.owner.scroll.verticalScrollBar().value() - event.angleDelta().y()
        )
        self.owner.scroll.horizontalScrollBar().setValue(
            self.owner.scroll.horizontalScrollBar().value() - event.angleDelta().x()
        )
        event.accept()

    def paintEvent(self, event):
        super().paintEvent(event)
        if self._draft_start is None or self._draft_end is None:
            return
        painter = QPainter(self)
        pen = QPen(Qt.yellow if self.owner.tool == 'highlight' else Qt.red, 3)
        painter.setPen(pen)
        painter.drawRect(self._draft_start.x(), self._draft_start.y(),
                         self._draft_end.x() - self._draft_start.x(),
                         self._draft_end.y() - self._draft_start.y())
        painter.end()


class PdfEditor(QWidget):
    def __init__(self):
        super().__init__()
        self.doc = None
        self.path = None
        self.page_index = 0
        self.zoom = 1.0
        self.tool = 'pan'
        self.text_input = QLineEdit()
        self.text_input.setPlaceholderText('Nhập chữ rồi chọn Thêm chữ → click lên trang PDF…')
        self.status = QLabel('Mở một file PDF để bắt đầu.')
        self.status.setStyleSheet('color:#64748b;font-weight:600;')
        self.canvas = PdfCanvas(self)
        self.build_ui()

    def build_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(20, 18, 20, 20)
        root.setSpacing(9)

        title = QLabel('📄  PDF READER & EDITOR')
        title.setStyleSheet('font-size:22px;font-weight:700;color:#0f172a;')
        root.addWidget(title)
        root.addWidget(QLabel('Đọc PDF • kéo/scroll • zoom • xoay • thêm chữ • tô sáng • vẽ • khung • lưu file mới'))

        bar = QHBoxLayout()
        buttons = [
            ('📂 Mở PDF', self.open_pdf, 'primary'),
            ('💾 Lưu thành…', self.save_as, 'ghost'),
            ('↶ Xoay', self.rotate, 'ghost'),
            ('🖐 Di chuyển', lambda: self.set_tool('pan'), 'ghost'),
            ('＋ Thêm chữ', lambda: self.set_tool('text'), 'ghost'),
            ('🖍 Tô sáng', lambda: self.set_tool('highlight'), 'ghost'),
            ('▣ Khung', lambda: self.set_tool('rect'), 'ghost'),
            ('✎ Vẽ', lambda: self.set_tool('draw'), 'ghost'),
            ('↶ Xóa chú thích', self.remove_last_annotation, 'ghost'),
        ]
        for text, fn, obj in buttons:
            b = QPushButton(text)
            b.setObjectName(obj)
            b.clicked.connect(fn)
            bar.addWidget(b)
        prev = QPushButton('◀')
        prev.setToolTip('Trang trước')
        prev.clicked.connect(lambda: self.goto_page(-1))
        nxt = QPushButton('▶')
        nxt.setToolTip('Trang sau')
        nxt.clicked.connect(lambda: self.goto_page(1))
        self.page_spin = QSpinBox()
        self.page_spin.setMinimum(1)
        self.page_spin.setMaximum(1)
        self.page_spin.valueChanged.connect(self.spin_page)
        bar.addWidget(prev)
        bar.addWidget(self.page_spin)
        bar.addWidget(nxt)
        minus = QPushButton('−')
        minus.setToolTip('Thu nhỏ')
        minus.clicked.connect(lambda: self.change_zoom(-0.1))
        plus = QPushButton('＋')
        plus.setToolTip('Phóng to')
        plus.clicked.connect(lambda: self.change_zoom(0.1))
        bar.addWidget(minus)
        bar.addWidget(plus)
        bar.addStretch()
        root.addLayout(bar)

        root.addWidget(self.text_input)
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(False)
        self.scroll.setFrameShape(QFrame.NoFrame)
        self.scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.scroll.setWidget(self.canvas)
        root.addWidget(self.scroll, 1)
        root.addWidget(self.status)

    def set_tool(self, tool):
        self.tool = tool
        names = {'pan': 'DI CHUYỂN', 'text': 'THÊM CHỮ', 'highlight': 'TÔ SÁNG', 'rect': 'KHUNG', 'draw': 'VẼ'}
        self.canvas.setCursor(Qt.OpenHandCursor if tool == 'pan' else Qt.CrossCursor)
        self.status.setText(f'Đang chọn: {names.get(tool, tool)} • {"click" if tool == "text" else "kéo trên trang"}')

    def open_pdf(self):
        if fitz is None:
            QMessageBox.critical(self, 'Thiếu PyMuPDF', 'Robot chưa có PyMuPDF. Chạy START_UI.bat để tự cài thư viện PDF.')
            return
        path, _ = QFileDialog.getOpenFileName(self, 'Mở PDF', '', 'PDF files (*.pdf)')
        if not path:
            return
        try:
            self.doc = fitz.open(path)
            self.path = path
            self.page_index = 0
            self.zoom = 1.0
            self.page_spin.setMaximum(max(1, len(self.doc)))
            self.page_spin.setValue(1)
            self.render()
            self.status.setText(f'Đã mở: {Path(path).name} • {len(self.doc)} trang • dùng con lăn hoặc kéo chuột phải để xem')
        except Exception as e:
            QMessageBox.critical(self, 'Không mở được PDF', str(e))

    def render(self):
        if not self.doc:
            return
        page = self.doc[self.page_index]
        mat = fitz.Matrix(self.zoom * 1.4, self.zoom * 1.4)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = QImage(pix.samples, pix.width, pix.height, pix.stride, QImage.Format_RGB888).copy()
        self.canvas.setPixmap(QPixmap.fromImage(img))
        self.canvas.setMinimumSize(pix.width + 8, pix.height + 8)
        self.canvas.adjustSize()
        self.scroll.horizontalScrollBar().setValue(0)
        self.scroll.verticalScrollBar().setValue(0)
        self.status.setText(f'Trang {self.page_index + 1}/{len(self.doc)} • zoom {self.zoom:.1f}x • Công cụ: {self.tool}')

    def goto_page(self, delta):
        if not self.doc:
            return
        self.page_index = max(0, min(len(self.doc) - 1, self.page_index + delta))
        self.page_spin.blockSignals(True)
        self.page_spin.setValue(self.page_index + 1)
        self.page_spin.blockSignals(False)
        self.render()

    def spin_page(self, value):
        if self.doc:
            self.page_index = max(0, min(len(self.doc) - 1, value - 1))
            self.render()

    def change_zoom(self, delta):
        self.zoom = max(0.4, min(4.0, self.zoom + delta))
        self.render()

    def rotate(self):
        if not self.doc:
            return
        page = self.doc[self.page_index]
        page.set_rotation((page.rotation + 90) % 360)
        self.render()
        self.status.setText('Đã xoay trang • bấm Lưu thành… để ghi file')

    def widget_to_pdf(self, x, y):
        if not self.doc:
            return None
        pix = self.canvas.pixmap()
        if not pix or pix.width() == 0:
            return None
        page = self.doc[self.page_index]
        return fitz.Point(x * page.rect.width / pix.width(), y * page.rect.height / pix.height())

    def insert_text_at(self, x, y):
        text = self.text_input.text().strip()
        if not text:
            QMessageBox.information(self, 'PDF', 'Nhập nội dung cần thêm trước.')
            return
        page = self.doc[self.page_index]
        page.insert_text((x, y), text, fontsize=12, color=(0.05, 0.35, 0.8), overlay=True)
        self.render()
        self.status.setText(f'Đã thêm chữ: {text}')
        self.set_tool('pan')

    def apply_area_tool(self, a, b):
        page = self.doc[self.page_index]
        rect = fitz.Rect(min(a.x, b.x), min(a.y, b.y), max(a.x, b.x), max(a.y, b.y))
        if rect.width < 3 or rect.height < 3:
            return
        if self.tool == 'highlight':
            annot = page.add_highlight_annot(rect)
            annot.update()
            msg = 'Đã tô sáng vùng chọn.'
        elif self.tool == 'rect':
            annot = page.add_rect_annot(rect)
            annot.set_colors(stroke=(0.9, 0.1, 0.1))
            annot.update()
            msg = 'Đã tạo khung vùng chọn.'
        else:
            annot = page.add_ink_annot([[(a.x, a.y), (b.x, b.y)]])
            annot.set_colors(stroke=(0.1, 0.3, 0.9))
            annot.update()
            msg = 'Đã vẽ đường.'
        self.render()
        self.status.setText(msg + ' • bấm Lưu thành… để lưu')
        self.set_tool('pan')

    def remove_last_annotation(self):
        if not self.doc:
            return
        page = self.doc[self.page_index]
        annots = list(page.annots() or [])
        if not annots:
            self.status.setText('Trang hiện tại chưa có chú thích để xóa.')
            return
        page.delete_annot(annots[-1])
        self.render()
        self.status.setText('Đã xóa chú thích cuối trên trang hiện tại • bấm Lưu thành… để lưu')

    def save_as(self):
        if not self.doc:
            QMessageBox.information(self, 'PDF', 'Chưa có PDF để lưu.')
            return
        path, _ = QFileDialog.getSaveFileName(self, 'Lưu PDF', 'apple_seed_edited.pdf', 'PDF files (*.pdf)')
        if not path:
            return
        try:
            self.doc.save(path, garbage=4, deflate=True)
            self.status.setText(f'Đã lưu: {Path(path).name}')
        except Exception as e:
            QMessageBox.critical(self, 'Không lưu được', str(e))

import sys
from PySide6.QtWidgets import QApplication, QPushButton
from PySide6.QtGui import QPixmap
import main
from pdf_tool import PdfEditor


def pix_with_fallback(name, w, h):
    p = main.ASSETS / name
    if not p.exists() and p.suffix.lower() == '.png':
        # Prefer the real uploaded assets; SVG remains the final fallback.
        for ext in ('.jpg', '.jpeg', '.svg'):
            candidate = p.with_suffix(ext)
            if candidate.exists():
                p = candidate
                break
    if not p.exists():
        return QPixmap()
    pm = QPixmap(str(p))
    if pm.isNull():
        return QPixmap()
    return pm.scaled(w, h, main.Qt.KeepAspectRatio, main.Qt.SmoothTransformation)

main.pix = pix_with_fallback

class AppleSeedWindow(main.MainWindow):
    def __init__(self):
        super().__init__()
        self.pdf_editor = PdfEditor()
        self.stack.addWidget(self.pdf_editor)
        self.pdf_index = self.stack.count() - 1
        side = self.navs[0].parentWidget()
        layout = side.layout()
        btn = QPushButton('▤   PDF Reader / Editor')
        btn.setObjectName('nav')
        btn.clicked.connect(lambda: self.show_page(self.pdf_index))
        layout.insertWidget(len(self.navs), btn)
        self.pdf_nav = btn

    def show_page(self, idx):
        self.stack.setCurrentIndex(idx)
        for i, n in enumerate(self.navs):
            active = ((idx == 0 and i == 0) or (idx == 1 and i in [1,2,3]))
            n.setObjectName('navActive' if active else 'nav')
            n.style().unpolish(n)
            n.style().polish(n)
        if hasattr(self, 'pdf_nav'):
            self.pdf_nav.setObjectName('navActive' if idx == self.pdf_index else 'nav')
            self.pdf_nav.style().unpolish(self.pdf_nav)
            self.pdf_nav.style().polish(self.pdf_nav)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    app.setStyleSheet(main.STYLE)
    w = AppleSeedWindow()
    w.show()
    sys.exit(app.exec())

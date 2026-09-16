# APPLE SEED — PANIC LOOKUP KNOWLEDGE BASE v1

Nguồn: Hồ sơ kỹ thuật sửa main iPhone do Apple Seed cung cấp.

## ROBOT RULES
1. Chỉ tra Sensor Array khi PANIC/OCR thật sự có dòng `sensor array`, `sensor array 1` hoặc `sensor array 2`.
2. Nếu giá trị là decimal: đổi DEC → HEX.
3. Nếu đã là `0x...`: chuẩn hóa về cùng dạng HEX.
4. Lookup phải EXACT MATCH trong bảng; không dùng mã gần nhất và không đoán.
5. Lookup trả 3 dữ liệu: HEX → kết quả gốc → ghi tiếng Việt.
6. Lookup là dữ liệu xác định từ hồ sơ; Gemini chỉ giải thích sau lookup.
7. Không có Sensor Array thì tuyệt đối không tự thêm Sensor Array vào kết quả.
8. Không được lấy giả thuyết của CASE trước sang CASE mới.
9. Không nhắc tên linh kiện/sensor/bus/rail chỉ để phủ nhận nếu chúng không xuất hiện trong bằng chứng.

## PANIC KEYWORD MAP
| Từ khóa | Ưu tiên |
|---|---|
| AOP PANIC | Cảm biến / Cụm sạc |
| TTBR | Flex cảm biến / Audio |
| Pulse | Flex cảm biến |
| Moly | Flex cảm biến |
| Pearl | Flex cảm biến |
| Dart-aop | Flex cảm biến / Audio |
| I2C0 | Cụm sạc |
| I2CSCM0 / I2CSCM1 | Thay cụm sạc trước (đa số done) |
| PRS0 | Cảm biến áp suất → ưu tiên cụm sạc |
| MIC1 | Cụm sạc / Micro |
| SMC PANIC | Pin / Nhiệt độ / Charging |
| TB0T / TB0V / TG0B / TG0V | Pin / Socket pin |
| PCIe PANIC | NAND / WiFi / Baseband |
| ANS2 PANIC | CPU ↔ NAND |
| DCP PANIC | Màn hình / Socket màn / Đường DCP |
| prox(7) | Flex cảm biến (Proximity) |
| Kernel Abort Report | Ưu tiên restore, sau đó kiểm tra CPU/NAND nếu còn lặp |

## SENSOR ARRAY 1
| HEX | Kết quả gốc | Tiếng Việt |
|---|---|---|
| 0x80000 | Proximity Flex Cable | Cáp cảm biến |
| 0x140000 | Charging Port Flex / Power Button Flex / Barometer | Cáp sạc / cáp nguồn / barometer |
| 0x180000 | Proximity Flex & Power Button Flex | Cáp cảm biến + cáp nguồn |
| 0x20000 | Sandwich / Gyro | Sandwich / gyro |
| 0x40000 | Charging Port Flex | Cáp sạc |
| 0x60000 | Proximity Flex Cable | Cáp cảm biến |
| 0x1800 | Charging Port Flex & Proximity Flex | Cáp sạc + cáp cảm biến |
| 0x4000 | Battery Communications | Giao tiếp pin |
| 0x10000 | Power Button Flex | Cáp nút nguồn |
| 0x800 | Charging Port Flex | Cáp sạc |
| 0x1000 | Proximity Flex Cable | Cáp cảm biến |
| 0x194 | Magnetometer / Compass | La bàn |
| 0x204 | Humidity Sensor | Cảm biến ẩm |
| 0x104 | Accelerometer | Cảm biến gia tốc |
| 0x114 | Gyroscope | Cảm biến xoay |
| 0x124 | Magnetometer / Compass | La bàn |
| 0x134 | Proximity / Light Sensor | Cáp cảm biến |
| 0x144 | Temperature Sensor | Cảm biến nhiệt |
| 0x154 | Humidity Sensor | Cảm biến ẩm |
| 0x164 | Pressure Sensor / Barometer | Cảm biến áp suất |
| 0x174 | Pressure Sensor | Cảm biến áp suất |
| 0x184 | Gyroscope | Cảm biến xoay |
| 0x71 | Audio / Speaker System | Audio / loa |
| 0x73 | Ambient Light Sensor | Cảm biến ánh sáng |
| 0x74 | Speaker Output | Loa |
| 0x61 | Display / Digitizer | Màn hình / cảm ứng |
| 0x63 | Motion Sensor | Cảm biến chuyển động |
| 0x64 | Microphone | Micro |
| 0x41 | Battery Communications | Giao tiếp pin |
| 0x42 | Thermal Issue | Lỗi nhiệt |
| 0x51 | Security / Secure Enclave | Face ID / bảo mật |

## SENSOR ARRAY 2
| HEX | Kết quả gốc | Tiếng Việt |
|---|---|---|
| 0x1A4 | Proximity / Light Sensor | Cáp cảm biến |
| 0x1B4 | Ambient Light Sensor | Cảm biến ánh sáng |
| 0x1C4 | Proximity Auto Dimming | Cáp cảm biến |
| 0x1D4 | Gyroscope / Rotation Sensor | Cảm biến xoay |
| 0x1E4 | Pressure Sensor / Barometer | Cảm biến áp suất |
| 0x1F4 | Temperature Sensor | Cảm biến nhiệt |
| 0x100000 | Power Button Flex / Charging Port Flex | Cáp nguồn / cáp sạc |
| 0x200000 | Proximity Flex Cable | Cáp cảm biến |
| 0x280000 | Charging Port Flex & Wireless Charging Flex | Cáp sạc + sạc không dây |
| 0x300000 | Camera / Imaging System | Camera |
| 0x400000 | Wireless Charging Flex | Cáp sạc không dây |
| 0x500000 | Battery Communications / NFC | Pin / NFC |
| 0x600000 | Wireless Charging Flex & Proximity Flex | Sạc không dây + cáp cảm biến |
| 0x700000 | Charging Port Flex & Wireless Charging Flex | Cáp sạc + sạc không dây |
| 0x800000 | Software / iOS Issue | Lỗi phần mềm |
| 0xA00000 | Battery Issue | Pin |
| 0xB00000 | Audio / Speaker System | Audio / loa |
| 0xC0000 | It’s the Prox Flex & Charging Port Flex | Cáp cảm biến + cáp sạc |
| 0xC00000 | Security / Secure Enclave | Face ID / bảo mật |
| 0xD00000 | Sensor Group Failure | Nhóm cảm biến |
| 0xF00000 | General Hardware Failure | Lỗi phần cứng |
| 0xA1 | GPS System | GPS |
| 0xB1 | Face ID / Touch ID | Face ID / Touch ID |
| 0xC1 | Microphone / Audio Input | Micro |
| 0xD1 | Vibration / Haptic Engine | Motor rung |
| 0xE1 | Ambient Light / Proximity | Cáp cảm biến |
| 0xF1 | Gyroscope / Accelerometer | Cảm biến xoay |
| 0xA4 | Touch / Digitizer | Cảm ứng |
| 0xB4 | SIM / Cellular System | SIM / sóng |
| 0xC4 | Fingerprint / Biometrics | Vân tay |
| 0xD4 | Ambient Temperature Sensor | Cảm biến nhiệt |
| 0xE4 | Humidity Sensor | Cảm biến ẩm |
| 0xF4 | Pressure Sensor | Cảm biến áp suất |

## SPECIAL
| HEX | Kết quả gốc | Tiếng Việt |
|---|---|---|
| 0x240000 | Panic SMC 2359296 | Thay IC la bàn 👍 |

## ROBOT OUTPUT
Khi tìm thấy mã:
`RAW → DEC/HEX chuẩn hóa → EXACT MATCH → Kết quả gốc → Tiếng Việt → hướng kiểm tra`

Khi không tìm thấy:
`Mã không có trong KB → không đoán → yêu cầu thêm ảnh/log hoặc bổ sung tài liệu.`

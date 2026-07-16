import http.server
import json
import sqlite3
from datetime import datetime

PORT = 8000
DB_FILE = 'exam_records.db'

# データベース初期化
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            last_name TEXT,
            first_name TEXT,
            grade TEXT,
            score INTEGER,
            rate INTEGER,
            cert_no TEXT UNIQUE,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/issue-certificate':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                last_name = data.get('lastName', '')
                first_name = data.get('firstName', '')
                grade = data.get('grade', '5kyu')
                score = data.get('score', 0)
                rate = data.get('rate', 0)
                
                # DB接続して採番
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                
                # 現在のその級の合格者数をカウントして採番
                cursor.execute("SELECT COUNT(*) FROM certificates WHERE grade = ?", (grade,))
                count = cursor.fetchone()[0]
                next_num = count + 1
                
                grade_num = grade.replace('kyu', '')
                cert_no = f"SC-{grade_num}-{next_num:05d}"
                
                created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                date_display = datetime.now().strftime('%Y年%m月%d日')
                
                try:
                    cursor.execute('''
                        INSERT INTO certificates (last_name, first_name, grade, score, rate, cert_no, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (last_name, first_name, grade, score, rate, cert_no, created_at))
                    conn.commit()
                except sqlite3.IntegrityError:
                    # 重複時のセーフティ
                    cert_no += f"-{int(datetime.now().timestamp())}"
                    cursor.execute('''
                        INSERT INTO certificates (last_name, first_name, grade, score, rate, cert_no, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (last_name, first_name, grade, score, rate, cert_no, created_at))
                    conn.commit()
                    
                conn.close()
                
                # 正常レスポンス
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'certNo': cert_no,
                    'date': date_display
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    init_db()
    print(f"Starting custom IBT server on port {PORT}...")
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, CustomHandler)
    httpd.serve_forever()

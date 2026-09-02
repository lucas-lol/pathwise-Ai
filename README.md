# PathWise AI

比赛 MVP。9 月 3 日范围：学生画像漏斗 + SQLite 落库。不接 DeepSeek。

## 启动

在仓库根目录 `D:\编程快闪`：

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\pip install -r backend\requirements.txt
backend\.venv\Scripts\uvicorn backend.main:app --reload --app-dir .
```

另开终端：

```powershell
cd frontend
npm install
npm run dev
```

浏览器打开 Vite 提示的地址（默认 http://localhost:5173）。

# DEXsystem 💃

街舞教室管理系統 — 點名、薪資計算、銷售記錄一站搞定。

## 功能

- 📋 **點名系統** — 教練上課點名，自動計算課堂薪資
- 💰 **薪資計算** — 依人數分級計薪，一鍵結算月薪
- 🛒 **銷售記錄** — 課卡銷售追蹤（單堂卡 / 五堂卡 / 十堂卡）
- ⚙️ **規則管理** — 後台設定薪資級距，歷史紀錄可查
- 🔒 **管理後台** — 密碼保護，儀表板總覽營收與薪資

## Tech Stack

| 層級 | 技術 |
|---|---|
| Frontend | Next.js 15 (App Router) + React 18 + Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| Database | Google Sheets (via Google Sheets API) |
| Auth | Session-based (sessionStorage) |
| Deployment | Vercel |

## 快速開始

### 環境需求

- Node.js ≥ 18
- npm ≥ 9
- Google Cloud Service Account（已啟用 Sheets API）

### 安裝

```bash
# 安裝依賴
npm install

# 複製環境變數範本
cp .env.example .env.local
# 填入你的 Google Sheets API 設定

# 啟動開發伺服器
npm run dev
```

瀏覽器打開 http://localhost:3000

### 環境變數

參考 `.env.example`，需要設定：

| 變數 | 說明 |
|---|---|
| `GOOGLE_SPREADSHEET_ID` | Google 試算表 ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account Email |
| `GOOGLE_PRIVATE_KEY` | Service Account Private Key |
| `NEXT_PUBLIC_USE_SUPABASE` | 設為 `false`（Phase 1 用 Sheets） |

### Google Sheets 結構

試算表需包含以下工作表：

| 工作表 | 欄位 |
|---|---|
| `Attendances` | ID, Date, CoachID, CourseID, StudentCount, CreatedAt |
| `Teachers` | ID, Name, Email, Phone, CreatedAt |
| `Sales` | ID, Date, CoachID, ProductName, Quantity, UnitPrice, CreatedAt |
| `Courses` | ID, Name, Description, CreatedAt |
| `MonthlySalary` | ID, Month, TeacherID, TeacherName, TotalClasses, TotalStudents, AttendanceSalary, SalesSalary, TotalSalary, CreatedAt |
| `SalaryRules` | ID, EffectiveMonth, Rule1to5, Rule6to10, Rule11to15, Rule16Plus, SalesBonus, IsLocked, LockedAt, CreatedAt |
| `Settings` | Key, Value |

## 部署

```bash
# 部署到 Vercel
vercel --prod
```

或連接 GitHub repo 後自動部署。記得在 Vercel Dashboard 設定環境變數。

## 專案結構

```
├── app/                    # Next.js App Router
│   ├── admin/              # 管理後台
│   │   ├── dashboard/      # 儀表板、薪資、規則、設定
│   │   └── page.tsx        # 登入頁
│   ├── attendance/         # 點名頁面
│   ├── sales/              # 銷售記錄
│   └── api/                # API Routes
├── lib/
│   ├── dal/                # Data Access Layer
│   │   ├── sheets/         # Google Sheets 實作
│   │   └── types.ts        # 型別定義
│   └── services/           # 業務邏輯
│       ├── salary-calculator.ts
│       └── rule-manager.ts
├── components/             # 共用元件
└── public/                 # 靜態資源
```

## License

Private — All Rights Reserved.

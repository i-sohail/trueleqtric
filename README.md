# ⚡ Trueleqtric — MERN Stack CRM

> Full-stack CRM for Power & Renewable Energy trading companies.  
> Converted from a single-file HTML prototype into a production-grade MERN application.

---

## 🏗 Architecture

```
trueleqtric/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/
│       │   └── common/      # AppShell, Sidebar, Topbar, Modal, DataTable, ui.jsx
│       ├── pages/           # 28 page components
│       ├── services/        # api.js + modules.js (all API calls)
│       ├── context/         # AuthContext, SidebarContext
│       ├── hooks/           # useFormModal, useLists
│       ├── utils/           # format.js (currency, dates, calculations)
│       └── styles/          # globals.css (CSS variables, exact CRM theme)
└── server/                  # Node.js + Express backend
    ├── config/              # db.js, logger.js, multer.js
    ├── controllers/         # 20 controllers
    ├── middleware/          # auth.js, errorHandler.js, asyncHandler.js
    ├── models/              # 22 Mongoose schemas
    ├── routes/              # 28 route files
    ├── scripts/             # seed.js
    ├── utils/               # financials.js, softDelete.js, crudFactory.js
    └── uploads/             # file storage
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-org/trueleqtric.git
cd trueleqtric

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

**Server** (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trueleqtric
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Trueleqtric
```

### 3. Seed the Database

```bash
cd server
node scripts/seed.js
```

This creates:
- Admin user: `admin@trueleqtric.com` / `admin123`
- 8 sample customers, 5 vendors, 6 catalog items
- Sample leads, sales orders, AR, inventory

### 4. Run Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open: **http://localhost:5173**

---

## 📋 Modules & Features

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | KPIs, pipeline funnel, alerts, business commentary |
| Analytics | `/analytics` | Revenue trends, AR aging, category breakdown, sales rep scoreboard, forecasting, margin waterfall, lead funnel |
| Leads & CRM | `/leads` | Full CRUD, stage tracking, convert-to-quote workflow |
| Quotations | `/quotations` | Multi-line items, margin calc, convert-to-PO, document generation |
| Sales Orders | `/salespo` | Full order lifecycle, AR/procurement creation, document print |
| Procurement | `/procurement` | Purchase PO management, AP creation |
| Inventory | `/inventory` | Stock tracking with computed status, reorder alerts |
| Delivery Log | `/delivery` | Dispatch tracking, POD, LD calculation |
| AR — Receivables | `/ar` | Invoice tracking, payment recording, aging |
| AP — Payables | `/ap` | Vendor bill tracking, payment recording |
| Customers | `/customers` | Master data, credit limits, rating |
| Vendors | `/vendors` | Master data, scorecard integration |
| Product Catalog | `/catalog` | SKU management, pricing |
| Pricing Master | `/pricing` | Price updates with history tracking |
| BG & LC Tracker | `/bglc` | Bank Guarantees & LCs, expiry alerts |
| Tender Management | `/tenders` | Tender lifecycle, checklist, EMD tracking |
| Documents DMS | `/documents` | File upload, categorized storage |
| Payment Schedules | `/payment-schedules` | Milestone-based payment tracking |
| Production Tracking | `/prod-tracking` | Manufacturing progress monitoring |
| Commissions | `/commissions` | Trading margin & commission tracking |
| Vendor Scorecards | `/vendor-scores` | Multi-dimension vendor rating |
| Credit Monitor | `/credit-monitor` | Real-time credit utilisation vs limits |
| Cash Flow | `/cash-flow` | 13-week AR/AP projection |
| Dropdown Lists | `/lists` | Editable master lists for all dropdowns |
| Seller Recommendations | `/sellers` | Curated supplier database, add-as-vendor |
| Recycle Bin | `/trash` | Soft-delete recovery |

---

## 🔑 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me
PUT    /api/auth/change-password
GET    /api/auth/users          (admin)
```

### All Modules (pattern)
```
GET    /api/{module}            List with filters & search
POST   /api/{module}            Create
GET    /api/{module}/:id        Get one
PUT    /api/{module}/:id        Update
DELETE /api/{module}/:id        Soft delete → trash
```

### Special Endpoints
```
POST   /api/leads/:id/convert-to-quote
POST   /api/quotations/:id/convert-to-po
POST   /api/salespo/:id/create-ar
POST   /api/salespo/:id/create-procurement
POST   /api/ar/:id/record-payment
POST   /api/ap/:id/record-payment
GET    /api/dashboard/kpis
GET    /api/dashboard/pipeline-funnel
GET    /api/dashboard/alerts
GET    /api/analytics/monthly-trend
GET    /api/analytics/ar-aging
GET    /api/analytics/forecast
GET    /api/analytics/margin-waterfall
GET    /api/analytics/lead-funnel
GET    /api/credit-monitor
GET    /api/cash-flow
GET    /api/reports/excel
GET    /api/reports/document/:type/:id
POST   /api/documents           (multipart/form-data)
GET    /api/documents/:id/download
POST   /api/trash/:id/restore
DELETE /api/trash               (empty all)
```

---

## 🏗 Database Collections

| Collection | Auto-ID Format | Key Relations |
|------------|---------------|---------------|
| users | TASK-#### | — |
| customers | CUST-### | → leads, quotations, salespo, ar |
| vendors | VEND-### | → procurement, ap, vendorscores |
| catalog | SKU-CAT-### | → leads, quotations, salespo, inventory |
| leads | LD-YYYY-### | → quotations |
| quotations | QT-YYYY-### | → salespo |
| salespo | SPO-YYYY-### | → ar, procurement, delivery, bglc |
| procurement | PPO-YYYY-### | → ap, prodtracking, vendorreviews |
| inventory | INV-### | → catalog |
| delivery | DEL-YYYY-### | → salespo |
| ar | AR-YYYY-### | → salespo, customers |
| ap | AP-YYYY-### | → procurement, vendors |
| bglc | BG/LC-YYYY-### | → salespo, tenders, leads |
| tenders | TND-YYYY-### | → leads, customers |
| documents | DOC-#### | → any collection |
| paymentschedules | PS-YYYY-### | → salespo |
| prodtracking | PT-YYYY-### | → salespo, vendors |
| commissions | COM-YYYY-### | → salespo |
| vendorscores | VR-YYYY-### | → vendors, procurement |
| tasks | TASK-#### | → users |
| dropdownlists | (key-based) | — |
| trash | TRH-##### | — |

---

## 🔒 User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access including user management |
| `sales` | Leads, Quotations, Sales POs, Customers |
| `finance` | AR, AP, Cash Flow, Credit Monitor |
| `operations` | Procurement, Inventory, Delivery |
| `viewer` | Read-only all modules |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, TanStack Query |
| Styling | CSS Variables (matching original CRM), Tailwind utilities |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer |
| Excel Export | ExcelJS |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston |

---

## 🚢 Production Deployment

### Build
```bash
cd client && npm run build
```

### Serve static files (add to server.js)
```js
app.use(express.static(path.join(__dirname, '../client/dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')))
```

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trueleqtric
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://your-domain.com
```

### Recommended Hosting
- **Backend**: Railway, Render, Heroku, AWS EC2
- **Database**: MongoDB Atlas
- **Frontend**: Vercel, Netlify (or serve from Express in prod)
- **Files**: AWS S3 / Cloudinary (replace local Multer in production)

---

## 🗺 Feature → Code Mapping

| HTML Feature | React Component | API Endpoint | MongoDB Collection |
|---|---|---|---|
| Dashboard KPIs | `Dashboard.jsx` | `GET /api/dashboard/kpis` | all collections |
| Pipeline Funnel | `Dashboard.jsx` | `GET /api/dashboard/pipeline-funnel` | leads |
| Analytics Charts | `Analytics.jsx` | `GET /api/analytics/*` | salespo, leads, ar |
| Lead CRUD | `Leads.jsx` | `CRUD /api/leads` | leads |
| Convert Lead→Quote | `Leads.jsx` | `POST /api/leads/:id/convert-to-quote` | leads, quotations |
| Quote multi-items | `Quotations.jsx` | `CRUD /api/quotations` | quotations |
| Convert Quote→PO | `Quotations.jsx` | `POST /api/quotations/:id/convert-to-po` | salespo |
| Print Quotation | `Reports.jsx` | `GET /api/reports/document/quotation/:id` | quotations |
| Sales PO lifecycle | `SalesPO.jsx` | `CRUD /api/salespo` | salespo |
| AR payment recording | `AR.jsx` | `POST /api/ar/:id/record-payment` | ar |
| Credit Monitor | `CreditMonitor.jsx` | `GET /api/credit-monitor` | customers, ar, salespo |
| Cash Flow 13-week | `CashFlow.jsx` | `GET /api/cash-flow` | ar, ap, paymentschedules |
| BG/LC expiry alerts | `BGLC.jsx` | `GET /api/bglc/stats` | bglc |
| Vendor scoring | `VendorScores.jsx` | `POST /api/vendor-scores` | vendorscores, vendors |
| Document upload | `Documents.jsx` | `POST /api/documents` | documents (disk) |
| Seller recommendations | `SellerRecommendations.jsx` | `GET /api/sellers` | static DB + vendors |
| Soft delete / Trash | `Trash.jsx` | `GET/POST/DELETE /api/trash` | trash |
| Excel export | Sidebar button | `GET /api/reports/excel` | all collections |
| Dropdown lists | `DropdownLists.jsx` | `GET/PUT /api/lists` | dropdownlists |
| MIS Report | Dashboard action | `GET /api/reports/mis` | all collections |

---

## 📝 Development Notes

1. **Financial calculations** are performed server-side in `utils/financials.js` and also mirrored client-side in `utils/format.js` for instant UI feedback.

2. **Soft delete**: All records are soft-deleted (moved to `Trash` collection). MongoDB TTL index auto-purges trash after 30 days.

3. **File storage**: Currently uses local disk (`/uploads`). For production, replace Multer `diskStorage` with an S3 stream adapter.

4. **ID generation**: Uses `countDocuments + 1` pattern. For true concurrency safety in production, use a MongoDB counter collection or UUID.

5. **Dropdown lists**: Seeded with 35+ default lists from the original HTML. All lists are user-editable and persisted in the `dropdownlists` collection.

6. **PDF generation**: The reports controller returns styled HTML that browsers can print-to-PDF. For server-side PDF, integrate Puppeteer in `reportsController.js`.

# 🏢 AMP Tiles Dashboard

> **Enterprise Management System & ERP for AMP Tiles Pty Ltd**  
> An end-to-end business management dashboard engineered for tile inventory control, multi-unit quotation generation, automated invoice processing, purchase orders, packing slips, and role-based financial administration.

---

## 🌟 Features

### 🔐 1. Role-Based Access Control (RBAC)
- **Admin Role**: Full access to dashboard analytics, inventory management, stock controls, customer management, supplier setup, invoice payment recording, and monthly statements.
- **Employee Role**: Tailored view limited to Purchase Orders, Quotations, Invoices, and Packing Slips.
  - **Financial Privacy Controls**: Automatically hides sensitive financial figures (*Received Amount*, *Pending Amount / Remaining Balance*, and revenue analytics) from invoice tables, detail views, creation screens, CSV exports, and generated PDFs.

### 📄 2. Quotation & Invoice Engine
- **Multi-Unit Pricing Support**: Seamlessly calculates quantities and pricing across **Sq Meters (SQM)**, **Sq Feet (SQFT)**, **Boxes**, and **Pieces**.
- **Automated Calculation & Discounts**: Real-time line-item tax, discount percentages, and delivery cost calculations.
- **Invoice Status Workflow**: Draft → Confirmed → Sent → Delivered → Paid / Partially Paid / Unpaid / Overdue / Cancelled.
- **Granular Invoice Filtering**: Instant filter options for **All**, **Paid**, **Unpaid**, **Partially Paid**, and individual lifecycle states.
- **High-Definition PDF Generation**: Powered by Puppeteer to generate crisp, print-ready PDF documents for Invoices and Packing Slips.
- **One-Click Emailing**: Integrated SMTP transport via Nodemailer to deliver invoices directly to customer email addresses with PDF attachments.
- **Customer Share Links**: Shareable tokenized quotation links allowing clients to review and accept quotes online.

### 📦 3. Purchase Orders & Packing Slips
- **Purchase Order Tracking**: Create and manage purchase orders linked directly to registered suppliers.
- **Packing Slips**: Generate clean packing slips from confirmed orders for warehouse dispatch.

### 📦 4. Stock & Inventory Management
- **Product Catalog**: Manage SKU, product sizes, unit coverage per box, retail pricing, and supplier associations.
- **Stock Audit & History**: Monitor stock levels, track quantity updates, and highlight low-stock thresholds.

### 📊 5. Comprehensive Reporting & CSV Data Export
- **Dashboard Analytics**: Visual summary cards, trend graphs via Recharts, quick action launchers, and recent activity logs.
- **Full CSV Exports**: Download comprehensive invoice datasets including line-item summaries, customer billing/delivery details, and payment statuses.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Icons & Visuals**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tablericons.com/)
- **Charts & Notifications**: [Recharts](https://recharts.org/) & [Sonner](https://sonner.emilkowal.ski/)

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ORM](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) & [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **PDF Engine**: [Puppeteer](https://pptr.dev/)
- **Email Service**: [Nodemailer](https://nodemailer.com/)

---

## 📁 Repository Structure

```text
AMP-Tiles-Dashbaord/
├── client/                      # Next.js 16 Frontend Application
│   ├── app/                     # Next.js App Router pages
│   │   ├── (auth)/login/        # Authentication login page
│   │   ├── dashboard/           # Analytics dashboard
│   │   ├── inventory/           # Products & Stock management (Admin)
│   │   ├── invoices/            # Invoice list, detail, create, edit
│   │   ├── packing-slips/       # Dispatch packing slips
│   │   ├── purchase-orders/     # Purchase order workflows
│   │   ├── quotations/          # Quote generation & customer approval
│   │   ├── customers/           # Customer directory (Admin)
│   │   ├── suppliers/           # Supplier directory (Admin)
│   │   └── records/             # Monthly statements & accounting (Admin)
│   ├── components/              # Shared UI components & widgets
│   ├── contexts/                # AuthContext provider
│   ├── lib/                     # API client, sidebar routing, & utilities
│   └── package.json
│
└── server/                      # Express.js REST API Backend
    ├── src/
    │   ├── config/              # Database connection & env config
    │   ├── controllers/         # API request handlers
    │   ├── middleware/          # JWT auth & RBAC authorization guards
    │   ├── models/              # Mongoose schemas (User, Product, Invoice, etc.)
    │   ├── routes/              # Express API router endpoints
    │   ├── scripts/             # DB Seeding scripts (seedAdmin.js, seedUsers.js)
    │   ├── utils/               # PDF builders & email notification utilities
    │   └── server.js            # Server entry point
    └── package.json
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster URL

---

### **1. Backend Setup (`/server`)**

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `server/` root:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/amp_tiles
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:3000

   # SMTP Configuration (For emailing PDF Invoices/Quotations)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=sales@amptiles.com.au
   FROM_NAME=AMP Tiles
   ```

4. Seed default accounts into the database:
   ```bash
   npm run seed:admin
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

---

### **2. Frontend Setup (`/client`)**

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `client/` root:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The client app will open on `http://localhost:3000`.*

---

## 🔑 Default User Accounts

After running the database seed script (`npm run seed:admin`), the following credentials are ready for use:

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@amptiles.com.au` | `admin@amptiles.com.au` | Full System Access & Financial Reporting |
| **Employee** | `employee@amptiles.com.au` | `employee@amptiles.com.au` | POs, Quotations, Invoices, & Packing Slips |

---

## 📡 API Endpoint Highlights

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user details |
| `GET` | `/api/invoices` | Authenticated | Fetch filtered list of invoices |
| `GET` | `/api/invoices/:id` | Authenticated | Fetch invoice details by ID |
| `POST` | `/api/invoices` | Authenticated | Create a new invoice |
| `PUT` | `/api/invoices/:id` | Authenticated | Update existing invoice |
| `POST` | `/api/invoices/:id/pay` | Admin Only | Record payment against invoice |
| `GET` | `/api/invoices/:id/pdf` | Authenticated | Generate and stream PDF invoice |
| `POST` | `/api/invoices/:id/send-email` | Authenticated | Email PDF invoice to customer |
| `GET` | `/api/quotations` | Authenticated | List all quotations |
| `GET` | `/api/purchase-orders` | Authenticated | List all purchase orders |
| `GET` | `/api/products` | Authenticated | Fetch products catalog |
| `POST` | `/api/products` | Admin Only | Add new product to inventory |
| `PATCH` | `/api/stock/update` | Admin Only | Update product stock levels |

---

## 📄 License & Attribution

Designed and built for **AMP Tiles Pty Ltd**.  
All rights reserved.

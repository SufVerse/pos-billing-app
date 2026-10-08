# POS Billing & Inventory Management System

A production-ready, full-stack Point of Sale (POS) and Inventory Management web application designed for retail stores, supermarkets, cafes, and bakeries. Built with **FastAPI**, **React 19**, and **MongoDB**.

---

## 🚀 Features

### 🛒 Point of Sale & Billing
- **Fast Split-Screen Interface**: Left panel for category filters, product search, and barcode scanning; right panel for real-time cart calculations.
- **Multiple Payment Methods**: Supports Cash, Card, and UPI payments.
- **Discounts & Taxes**: Item-level and cart-level discount handling, dynamic GST/tax calculation.
- **Receipts & Invoicing**: Automatic invoice generation with sequential numbering, print-ready receipt view, and browser PDF export.
- **Barcode & Keyboard First**: Fast checkout experience with barcode reader compatibility and keyboard navigation.

### 📦 Inventory & Stock Management
- **Real-Time Stock Updates**: Stock automatically decrements upon completed sales.
- **Stock Movements Tracking**: Complete audit log for inwards, sales, adjustments, and damages.
- **Low Stock Alerts**: Visual notifications and dashboard badges for items falling below minimum stock thresholds.
- **Bulk Product Import/Export**: Excel-based catalog import and export.

### 👥 User Roles & Security (RBAC)
- **Role-Based Access Control**:
  - **Admin**: Full control over products, inventory, users, suppliers, reports, and settings.
  - **Cashier**: Streamlined interface restricted to the billing counter and personal shift sales history.
- **JWT Authentication**: Secure stateless token authentication with bcrypt password hashing.

### 📊 Reports & Analytics
- **Dashboard Overview**: 7-day revenue charts, total daily sales, transaction counts, and active product stats.
- **Detailed Reporting**:
  - Sales breakdown (date range filters)
  - Top-selling products
  - Slow-moving stock
  - Current stock valuation (cost price vs. retail value)

### ⚙️ Store Customization
- Configurable store name, address, contact details, and GSTIN.
- Customizable invoice prefixes (e.g., `INV-2026-XXXX`).
- Editable receipt headers and footers.
- Tax enable/disable toggle.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, [FastAPI](https://fastapi.tiangolo.com/), [Motor](https://motor.readthedocs.io/) (Async MongoDB driver), [Pydantic v2](https://docs.pydantic.dev/), PyJWT, bcrypt, openpyxl, Uvicorn
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives), [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/), [Axios](https://axios-http.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (4.4+)

---

## 🔑 Default Credentials

When the backend starts for the first time, it automatically creates sample categories, suppliers, 15 demo products, and two default users:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full administrative access |
| **Cashier** | `cashier` | `cashier123` | POS billing & own sales history |

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18+ & npm/yarn**: [Download Node.js](https://nodejs.org/)
- **MongoDB**: Local MongoDB instance or free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## ⚡ Quick Start Guide

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd pos-billing-app
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env   # On Windows PowerShell: Copy-Item .env.example .env
   ```
   Default `.env` configuration:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=pos_db
   CORS_ORIGINS=*
   JWT_SECRET=pos-secret-change-me-please-3782
   PORT=8001
   ```

5. **Start the backend server**:
   ```bash
   python server.py
   # Or using uvicorn directly:
   # uvicorn server:app --reload --port 8001
   ```
   The backend API will run at `http://localhost:8001`.
   Interactive API docs are available at `http://localhost:8001/docs`.

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env   # On Windows PowerShell: Copy-Item .env.example .env
   ```
   Default `.env` configuration:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

4. **Start the React development server**:
   ```bash
   npm start
   # or
   yarn start
   ```
   The frontend will open at `http://localhost:3000`.

---

## 🧪 Running Tests

To run the automated backend test suite (36+ tests verifying auth, RBAC, inventory transactions, and sales):

```bash
# Make sure the backend server is running on http://localhost:8001
pytest backend/tests/backend_test.py -v
```

---

## 📁 Project Structure

```text
pos-billing-app/
├── backend/
│   ├── tests/
│   │   ├── __init__.py
│   │   └── backend_test.py         # Full API & RBAC test suite
│   ├── .env.example                # Backend configuration template
│   ├── requirements.txt            # Python dependencies
│   └── server.py                   # FastAPI server & route handlers
├── frontend/
│   ├── public/                     # Static HTML & assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/             # Admin layout & navbar
│   │   │   └── ui/                 # shadcn UI components
│   │   ├── lib/
│   │   │   ├── api.js              # Axios instance & interceptors
│   │   │   └── auth.jsx            # Auth context provider & hooks
│   │   ├── pages/
│   │   │   ├── Billing.jsx         # Counter POS screen
│   │   │   ├── Dashboard.jsx       # Analytics overview
│   │   │   ├── Products.jsx        # Catalog management
│   │   │   ├── Inventory.jsx       # Stock movement & audits
│   │   │   ├── Categories.jsx      # Category management
│   │   │   ├── Suppliers.jsx       # Supplier directory
│   │   │   ├── SalesHistory.jsx    # Orders & receipts
│   │   │   ├── Reports.jsx         # Financial & stock reports
│   │   │   ├── Users.jsx           # Staff & cashier management
│   │   │   ├── Settings.jsx        # Store configuration
│   │   │   └── Login.jsx           # Sign-in screen
│   │   ├── App.jsx                 # App routing & protected routes
│   │   └── index.jsx               # React entry point
│   ├── .env.example                # Frontend configuration template
│   ├── package.json                # Node dependencies & scripts
│   └── tailwind.config.js          # Styling configurations
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
└── requirements.txt                # Root Python dependencies
```

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login and receive JWT access token | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Authenticated |
| `GET` | `/api/products` | List all products with filtering | Authenticated |
| `POST` | `/api/products` | Create a new product | Admin |
| `GET` | `/api/categories` | List product categories | Authenticated |
| `POST` | `/api/categories` | Add a new category | Admin |
| `POST` | `/api/sales` | Process new checkout / sale | Cashier / Admin |
| `GET` | `/api/sales` | List sales history (cashier sees own) | Authenticated |
| `POST` | `/api/stock-movements` | Log inward/adjustment/damage stock | Admin |
| `GET` | `/api/dashboard` | Fetch dashboard stats & charts | Admin |
| `GET` | `/api/reports/sales` | Fetch aggregated sales report | Admin |
| `GET` | `/api/settings` | Get store settings & invoice info | Authenticated |
| `PUT` | `/api/settings` | Update store details & tax flags | Admin |
| `GET` | `/api/users` | List system users | Admin |
| `POST` | `/api/users` | Create cashier or admin accounts | Admin |

---

## 📄 License

This project is licensed under the MIT License.


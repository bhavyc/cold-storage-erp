# 🧊 Cold Storage ERP

A professional, full-stack Enterprise Resource Planning (ERP) system designed specifically for managing cold storage operations. Built with modern web technologies for high performance, reliability, and ease of use.

## 🚀 Features

### 📦 Inward & Outward Management
- **Material Receipt (MR):** Track incoming stock with detailed lot and marka information.
- **Gate Pass (GP):** Efficiently manage outgoing goods with lot-lookup and automated documentation.
- **Stock Tracking:** Real-time visibility into inventory across different chambers and pallets.

### 💰 Billing & Finance
- **Automated Invoicing:** Generate professional invoices and proforma invoices (PI).
- **Accounting Integration:** Automatic journal entries and P&L posting on invoice generation.
- **Ledger Management:** Maintain accurate party-wise ledgers and revenue accounts.

### 🏢 Warehouse Operations
- **Pallet Assignment:** Optimize space utilization with intelligent pallet tracking.
- **Chamber Analysis:** Monitor storage capacity and distribution across various chambers.

### 📊 Dashboard & Analytics
- **Live Metrics:** Real-time overview of business performance.
- **Visual Analytics:** Interactive charts for stock levels, billing trends, and operational efficiency.

### 🔐 Security & Access
- **Role-Based Access:** Secure authentication and authorization for different staff roles.
- **Audit Integrity:** Precise tracking of all transactions for audit compliance.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bhavyc/cold-storage-erp.git
   cd cold-storage-erp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your connection strings:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cold_storage"
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Migration:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📄 License

This project is private and proprietary.

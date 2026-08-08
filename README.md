# Business In A Box 💼📦

A full-stack, customizable business management suite designed for SMEs, freelancers, and businesses. Manage Invoices, Quotes, Purchase Orders, Customers, Vendors, Employees, Catalog Items, and Financial Transactions with dynamic vocabulary, customizable PDF generation, and Google Sheets synchronization.

---

## 🚀 Deploy to Render

Deploying **Business In A Box** to [Render](https://render.com) is fast and free.

### Option 1: Automatic Blueprint (Recommended)
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `https://github.com/solasiya/business-in-a-box`.
4. Render will detect [`render.yaml`](render.yaml) automatically.
5. Click **Apply**. Render will install dependencies, build the React frontend with Vite, and start the Express server.

---

### Option 2: Manual Web Service Setup
1. On Render, click **New +** → **Web Service**.
2. Select repository: `solasiya/business-in-a-box`.
3. Configure the following settings:
   - **Name**: `business-in-a-box`
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Click **Create Web Service**.

---

## 🛠️ Architecture

- **Frontend**: React 18 (Vite), Lucide Icons, Chart.js, Vanilla CSS design system.
- **Backend**: Node.js & Express API with full CRUD and dynamic vocabulary mapping.
- **PDF Generation**: Native `pdf-lib` vector engine with custom layouts & company branding.
- **Persistence**: JSON DataStore with Google Sheets two-way sync support.
- **Unified Hosting**: The Express server automatically serves the compiled production client bundle (`client/dist`) and all `/api/*` endpoints.

---

## 💻 Local Development

1. Install dependencies for both client and server:
   ```bash
   npm run install:all
   ```
2. Start development servers:
   ```powershell
   .\start.ps1
   ```
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

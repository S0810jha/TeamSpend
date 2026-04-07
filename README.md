# TeamSpend: Finance Data Processing & Access Control System

**Live Deployment:** [Insert Vercel Link Here]  
**Repository:** [https://github.com/S0810jha/TeamSpend.git](https://github.com/S0810jha/TeamSpend.git)

## 📌 Objective
This project is a submission for the **Backend Developer Intern** assignment. **TeamSpend** is a multi-tenant B2B financial dashboard system built to process financial records, enforce strict access controls, and generate real-time analytical summaries. 

While this repository includes a fully functional frontend, the core architectural focus of this submission is on the **backend design**, including database modeling, server-side data fetching, middleware-based route protection, and Role-Based Access Control (RBAC).

---

## 🛠 Tech Stack & Architecture

* **Framework:** Next.js 16 (App Router)
* **Backend Paradigm:** React Server Components (RSC), Server Actions, and Next.js Route Handlers.
* **Database:** PostgreSQL (Hosted on Supabase)
* **Authentication:** Supabase SSR Auth (JWT-based)
* **Data Validation:** Strict TypeScript interfaces.

**Architectural Choice Note:** Instead of a traditional decoupled Node.js/Express REST API, this project leverages **Next.js Server Components**. This allows direct, secure, server-to-database communication without exposing intermediate API endpoints, resulting in faster execution, reduced latency, and built-in type safety.

---

## 🗄️ Database Modeling & Schema

The relational database is in **PostgreSQL**, designed in **Third Normal Form (3NF)** to support complex joins, aggregations, and multi-tenancy.

### Entity Relationship Overview
* **`startups`** (1) ── (∞) **`teams`**
* **`startups`** (1) ── (∞) **`users`**
* **`teams`** (1) ── (∞) **`budgets`**
* **`teams`** (1) ── (∞) **`team_members`** (∞) ── (1) **`users`** *(Many-to-Many junction)*
* **`teams`** (1) ── (∞) **`expenses`** (∞) ── (1) **`users`** ### Key Tables
* **`users`**: `id` (UUID), `startup_id` (UUID), `full_name`, `role` (Enum), `email`.
* **`startups`**: `id` (UUID), `name`, `created_at`.
* **`teams`**: `id` (UUID), `startup_id` (UUID), `name`.
* **`budgets`**: `id` (UUID), `team_id` (UUID), `total_amount`, `start_date`, `end_date`.
* **`expenses`**: `id` (UUID), `startup_id`, `team_id`, `user_id`, `amount`, `category`, `status` (PENDING | APPROVED | REJECTED), `description`.

---

## 🔐 Role-Based Access Control (RBAC)

The system implements a strict 3-tier role hierarchy. Access control is enforced at multiple layers: **Middleware** (protecting routes), **Server Components** (verifying roles before fetching data), and **Database** (Row Level Security considerations).

### 1. Admin (Founder)
* **Capabilities:** Full system access.
* **Backend Logic:** Can create workspaces, invite users, assign employees to teams, define team budgets, and strictly **Approve or Reject** pending financial records.

### 2. Analyst
* **Capabilities:** Global Read-Only Analytics.
* **Backend Logic:** Cannot manipulate data or invite users. Has backend clearance to query company-wide expenses, aggregate data across all teams, and calculate 6-month burn rates, category distributions, and top spenders.

### 3. Employee
* **Capabilities:** Restricted / Localized Access.
* **Backend Logic:** Can only submit (`POST`) new expenses. Can only query (`GET`) data strictly tied to their assigned `team_id` and view their specific team's remaining budget.

---

## ⚙️ Core Backend Features Implemented

### 1. Secure Server Actions (API Equivalents)
Rather than standard REST endpoints, mutations are handled via secure Server Actions:
* `createExpense(data)`: Validates user session, extracts `team_id`, and inserts a `PENDING` record.
* `updateExpenseStatus(id, status)`: Admin-only action. Verifies the requester's role before transitioning an expense to `APPROVED` or `REJECTED`.
* `assignUserToTeam(userId, teamId)`: Manages the many-to-many junction table safely.

### 2. Aggregation & Dashboard Summary Logic
Rather than fetching raw lists to the client, the backend crunches financial data server-side to minimize payload size.
* **Budget Utilization:** Calculates `total_budget - approved_spend` per team.
* **Trend Analysis:** Maps approved expenses over a rolling 6-month window grouping by month.
* **Categorization:** Reduces expenses into category buckets (Software, Travel, Payroll) for visualizations.
* **Burn Rate Forecasting:** Calculates daily burn rates to project when a team's budget will be depleted.

### 3. Middleware & Security
* **JWT Verification:** A custom Next.js `middleware.ts` intercepts every request, validates the Supabase session cookie, and automatically redirects unauthenticated users.

---

## 🤔 Assumptions & Trade-offs

1. **Server Components over REST APIs:** I opted to use Next.js Server Components for data fetching. This tradeoff sacrifices external API consumability (e.g., by a separate mobile app) in exchange for significantly faster server-side rendering, tighter security, and zero client-side waterfall fetching.
2. **Soft Deletes:** Currently, rejected expenses remain in the database with a `REJECTED` status rather than being hard-deleted. This assumption was made to maintain a complete financial audit trail.
3. **Authentication:** Leveraged Supabase Auth instead of building a custom JWT/Bcrypt implementation from scratch to ensure enterprise-grade security and focus engineering effort on the business logic.

---

## 🚀 Future Roadmap (If given more time)
* **Redis Caching:** Implement Upstash/Redis to cache the heavy aggregation queries for the Analyst dashboard.
* **Pagination:** Add cursor-based pagination for the master ledger tables as the database grows.
* **Audit Logs:** Create an `audit_logs` table to track exactly *which* Admin approved/rejected a transaction and at what timestamp.

---

## 💻 Local Setup Instructions

### Prerequisites
* Node.js (v18 or higher)
* A Supabase Account (Free Tier)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/S0810jha/TeamSpend.git](https://github.com/S0810jha/TeamSpend.git)
    cd TeamSpend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    * Create the necessary tables (`users`, `startups`, `teams`, `budgets`, `expenses`, `team_members`) in your Supabase SQL editor.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.
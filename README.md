# cloud-app-coursework
Cloud application coursework group project

# Identity & Salary Platform

A minimalist, high-end platform for anonymous salary sharing, community verification, and statistical insights.

## Project Structure

-   `/IdentityService.Api`: .NET 10 Web API for Authentication and Identity (Port 5100).
-   `/SalaryService.Api`: .NET 10 Web API for Salary Submissions and Stats (Port 5001).
-   `/VoteService.Api`: .NET 10 Web API for Votes, Reports, and Approval Thresholds (Port 5002).
-   `/StatsService.Api`: .NET 10 Web API for Aggregated Salary Insights (Port 5019).
-   `/SearchService.Api`: .NET 10 Web API for Public Salary Search (Port 5020).
-   `/web`: Next.js 15 Frontend with Tailwind CSS (Port 3000).
-   `docker-compose.yml`: Infrastructure (PostgreSQL).

---

## 🛠️ Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- .NET 10 SDK
- Node.js 18+ & npm

### 2. Infrastructure Setup (Database)
Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```

### 3. Backend Setup
You need to run each microservice in a separate terminal window:

**Identity Service (Auth)**
```bash
cd IdentityService.Api
dotnet run
```
- **Swagger**: `http://localhost:5100/swagger`

**Salary Service (Data)**
```bash
cd SalaryService.Api
dotnet run
```
- **Swagger**: `http://localhost:5001/swagger`

**Vote Service (Community)**
```bash
cd VoteService.Api
dotnet run
```
- **Swagger**: `http://localhost:5002/swagger`

**Stats Service (Insights)**
```bash
cd StatsService.Api
dotnet run
```
- **Swagger**: `http://localhost:5019/swagger`

**Search Service (Approved Salary Lookup)**
```bash
cd SearchService.Api
dotnet run
```
- **Swagger**: `http://localhost:5020/swagger`

### 4. Frontend Setup
Navigate to the web directory and start the dev server:
```bash
cd web
npm install
npm run dev
```
- **App URL**: `http://localhost:3000`

---

## 🏁 Summary of Services
| Service | Technology | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL 15 | `5432` | Shared data storage |
| **Identity API** | .NET 10 | `5100` | Auth, Signup, Login |
| **Salary API** | .NET 10 | `5001` | Salary data & Moderation |
| **Vote API** | .NET 10 | `5002` | Upvote/Downvote, Reports, Auto-Approval |
| **Stats API** | .NET 10 | `5019` | Aggregated Salary Insights |
| **Search API** | .NET 10 | `5020` | Filtered lookup over approved salaries |
| **Frontend** | Next.js 15 | `3000` | User Interface |

---

## 🚀 Key Features

### 💰 Salary Transparency
- **Anonymous Submission**: No login required to share salary data.
- **Community Voting**: Upvote or Downvote entries to establish a **Trust Score**.
- **Insights**: Aggregated statistics (Average, Median, P25, P75) based on approved data.

### 📊 Salary Insights (Stats Service)
- **No Login Required**: Insights are publicly accessible to all users.
- **Aggregated Only**: Returns computed metrics only — no individual records or personal data exposed.
- **Filterable**: Filter insights by `country`, `role`, and `level`.
- **Metrics**: Average, Median (P50), Lower Quartile (P25), Upper Quartile (P75).
- **Endpoint**: `GET /api/stats/summary?country=&role=&level=`

### 🔎 Salary Search (Search Service)
- **Public Search**: No login required for browsing approved salaries.
- **Privacy-Safe Output**: Anonymous records always return `company = "Anonymous"`.
- **Filters**: `q`, `country`, `company`, `role`, `level`, `currency`, `period`, min/max experience and salary.
- **Pagination & Sorting**: `page`, `pageSize`, `sortBy` (`submittedAt`, `salaryAmount`, `experienceYears`), `sortOrder` (`asc`, `desc`).
- **Endpoint**: `GET /api/search/salaries?...`

### 🛡️ Moderation
- Users can moderate submissions directly from the **Salary Details** page.
- Statuses: `PENDING` (Default), `APPROVED`, `REJECTED`.
- Only `APPROVED` data is included in the **Insights** calculations.

---

## 💾 Administration via CLI
To manually inspect data:
1. Connect to Docker container: `docker exec -it identity_db psql -U admin -d identity_db`
2. List tables: `\dt`
3. View Salaries: `SELECT * FROM "SalarySubmissions";`
4. View Approved Salaries: `SELECT * FROM "SalarySubmissions" WHERE "Status" = 'APPROVED';`

---

## 🎨 Design Principles
- **Minimalist Aesthetic**: Pure black and white design system.
- **Premium UX**: Smooth transitions, card-based layouts, and absolute clarity.
- **Security First**: JWT-based authentication for sensitive community actions.

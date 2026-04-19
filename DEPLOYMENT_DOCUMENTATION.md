# Deployment Documentation
## TechSalary.lk – Cloud Application Coursework

---

**Branch:** dev_asmitha_deployment_voteservice
**Deployed By:** Asmitha (Docker Hub: it21176210)
**Date:** 19 April 2026
**Live Application URL:** http://20.44.215.186

---

## Table of Contents

1. Project Overview
2. Application Architecture
3. Services Summary
4. Prerequisites
5. Docker Hub Setup
6. Dockerfiles Created
7. GitHub Actions CI/CD Workflows
8. Kubernetes Manifests
9. Azure Infrastructure Setup
10. Step-by-Step Deployment Process
11. Verification and Testing
12. Troubleshooting
13. Useful kubectl Commands

---

## 1. Project Overview

TechSalary.lk is a microservices-based salary transparency platform built for cloud deployment. The application allows users to submit, view, vote on, and search salary information across different companies and roles.

The system is composed of the following components:

- **IdentityService** – Handles user authentication, registration, JWT token generation, and role management (Admin, Moderator, User)
- **SalaryService** – Manages salary submissions, moderation, and salary data
- **VoteService** – Handles upvoting/downvoting salary entries and generating reports
- **Frontend** – Next.js 15 web application providing the user interface
- **PostgreSQL** – Shared relational database for all services

---

## 2. Application Architecture

```
Internet Traffic
       │
       ▼
┌─────────────────────────────────────┐
│   Nginx Ingress Controller          │
│   External IP: 20.44.215.186:80     │
└─────────────────────────────────────┘
       │
       ├── /api/auth      ──► IdentityService (port 5100)
       ├── /api/Auth      ──► IdentityService (port 5100)
       ├── /api/salaries  ──► SalaryService   (port 5001)
       ├── /api/Salaries  ──► SalaryService   (port 5001)
       ├── /api/votes     ──► VoteService     (port 5002)
       ├── /api/reports   ──► VoteService     (port 5002)
       └── /              ──► Frontend        (port 3000)

Azure Kubernetes Service (AKS)
├── Namespace: app
│   ├── identityservice  Pod  →  it21176210/identityservice:latest
│   ├── salaryservice    Pod  →  it21176210/salaryservice:latest
│   ├── voteservice      Pod  →  it21176210/voteservice:latest
│   └── frontend         Pod  →  it21176210/frontend:latest
│
└── Namespace: data
    └── postgres         Pod  →  postgres:15
```

**Database Connectivity:**
All services connect to PostgreSQL via Kubernetes internal DNS:
`postgres.data.svc.cluster.local:5432`

---

## 3. Services Summary

| Service | Technology | Container Port | Database | Docker Image |
|---------|-----------|---------------|----------|--------------|
| IdentityService | .NET 10 | 5100 | identity_db | it21176210/identityservice:latest |
| SalaryService | .NET 10 | 5001 | paymentappdb | it21176210/salaryservice:latest |
| VoteService | .NET 10 | 5002 | paymentappdb | it21176210/voteservice:latest |
| Frontend | Next.js 15 | 3000 | – | it21176210/frontend:latest |
| PostgreSQL | Postgres 15 | 5432 | identity_db, paymentappdb | postgres:15 |

---

## 4. Prerequisites

The following tools must be installed before deployment:

| Tool | Purpose | Installation |
|------|---------|-------------|
| Docker Desktop | Build and run containers locally | https://www.docker.com/products/docker-desktop |
| Azure CLI | Manage Azure resources from terminal | `brew install azure-cli` (macOS) |
| kubectl | Kubernetes command-line tool | Installed automatically with Docker Desktop |
| Git | Version control | https://git-scm.com |

**Accounts Required:**
- Docker Hub account (username: it21176210)
- Azure account with active subscription (Azure for Students)
- GitHub account with repository access

---

## 5. Docker Hub Setup

Docker Hub is used to store the Docker images built by GitHub Actions.

**Steps:**

1. Go to https://hub.docker.com and login
2. Navigate to Account Settings → Personal Access Tokens
3. Click "Generate new token"
   - Description: `github-actions`
   - Permissions: Read & Write
4. Copy the generated token

**GitHub Repository Secrets Setup:**

Go to GitHub Repository → Settings → Secrets and Variables → Actions → New repository secret

| Secret Name | Value |
|-------------|-------|
| `DOCKER_USERNAME_ASMITHA` | it21176210 |
| `DOCKER_PASSWORD_ASMITHA` | (Docker Hub Access Token) |

Note: Separate secret names were used (with `_ASMITHA` suffix) because the repository already had secrets `DOCKER_USERNAME` and `DOCKER_PASSWORD` belonging to other team members.

---

## 6. Dockerfiles Created

A Dockerfile was created for each service to containerise the application.

### 6.1 IdentityService Dockerfile
**File Path:** `IdentityService.Api/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["IdentityService.Api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "IdentityService.Api.dll"]
```

**Explanation:**
- Stage 1 (build): Uses the .NET 10 SDK to restore dependencies and publish the application in Release mode
- Stage 2 (runtime): Uses the lightweight ASP.NET runtime image to run the published application
- `ASPNETCORE_HTTP_PORTS=8080` sets the container port

### 6.2 SalaryService Dockerfile
**File Path:** `SalaryService.Api/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SalaryService.Api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]
```

### 6.3 VoteService Dockerfile
**File Path:** `VoteService.Api/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["VoteService.Api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VoteService.Api.dll"]
```

### 6.4 Frontend Dockerfile
**File Path:** `web/Dockerfile`

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_AUTH_API_URL
ARG NEXT_PUBLIC_SALARY_API_URL
ARG NEXT_PUBLIC_VOTE_API_PROXY_PATH
ARG NEXT_PUBLIC_SEARCH_API_PROXY_PATH
ARG NEXT_PUBLIC_STATS_API_URL
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_SALARY_API_URL=$NEXT_PUBLIC_SALARY_API_URL
ENV NEXT_PUBLIC_VOTE_API_PROXY_PATH=$NEXT_PUBLIC_VOTE_API_PROXY_PATH
ENV NEXT_PUBLIC_SEARCH_API_PROXY_PATH=$NEXT_PUBLIC_SEARCH_API_PROXY_PATH
ENV NEXT_PUBLIC_STATS_API_URL=$NEXT_PUBLIC_STATS_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

**Explanation:**
- Stage 1 (deps): Installs Node.js dependencies using `npm ci` for reproducible installs
- Stage 2 (builder): Builds the Next.js application with API URLs baked in as build-time arguments (required because `NEXT_PUBLIC_*` variables are embedded at build time, not runtime)
- Stage 3 (runner): Lightweight production image that runs the built application

---

## 7. GitHub Actions CI/CD Workflows

Four separate GitHub Actions workflow files were created. Each workflow automatically triggers when code changes are pushed to the `dev_asmitha_deployment_voteservice` branch for the specific service folder.

### 7.1 IdentityService Workflow
**File Path:** `.github/workflows/identity-deploy.yml`

```yaml
name: IdentityService Docker Build & Push

on:
  push:
    branches:
      - dev_asmitha_deployment_voteservice
    paths:
      - "IdentityService.Api/**"

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME_ASMITHA }}
          password: ${{ secrets.DOCKER_PASSWORD_ASMITHA }}

      - name: Build and Push IdentityService
        uses: docker/build-push-action@v5
        with:
          context: ./IdentityService.Api
          dockerfile: ./IdentityService.Api/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME_ASMITHA }}/identityservice:latest
            ${{ secrets.DOCKER_USERNAME_ASMITHA }}/identityservice:${{ github.sha }}
```

### 7.2 SalaryService Workflow
**File Path:** `.github/workflows/salary-deploy.yml`

Same structure as above. Triggers on changes to `SalaryService.Api/**`. Builds and pushes `it21176210/salaryservice:latest`.

### 7.3 VoteService Workflow
**File Path:** `.github/workflows/vote-deploy.yml`

Same structure as above. Triggers on changes to `VoteService.Api/**`. Builds and pushes `it21176210/voteservice:latest`.

### 7.4 Frontend Workflow
**File Path:** `.github/workflows/frontend-deploy.yml`

```yaml
name: Frontend Docker Build & Push

on:
  push:
    branches:
      - dev_asmitha_deployment_voteservice
    paths:
      - "web/**"

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME_ASMITHA }}
          password: ${{ secrets.DOCKER_PASSWORD_ASMITHA }}

      - name: Build and Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./web
          dockerfile: ./web/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME_ASMITHA }}/frontend:latest
            ${{ secrets.DOCKER_USERNAME_ASMITHA }}/frontend:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_AUTH_API_URL=http://20.44.215.186/api
            NEXT_PUBLIC_SALARY_API_URL=http://20.44.215.186/api
            NEXT_PUBLIC_VOTE_API_PROXY_PATH=http://20.44.215.186/api
            NEXT_PUBLIC_SEARCH_API_PROXY_PATH=http://20.44.215.186/api
            NEXT_PUBLIC_STATS_API_URL=http://20.44.215.186/api
```

**CI/CD Flow Diagram:**
```
Developer pushes code to branch
            │
            ▼
    GitHub detects changes
            │
            ▼
  Correct workflow triggers
  (based on changed file path)
            │
            ▼
  ubuntu-latest runner starts
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
Checkout code    Login to Docker Hub
    │                │
    └───────┬────────┘
            │
            ▼
  Docker Buildx builds image
            │
            ▼
  Image pushed to Docker Hub
  (it21176210/<service>:latest)
            │
            ▼
  Manual K8s rollout restart
  (kubectl rollout restart)
```

---

## 8. Kubernetes Manifests

All Kubernetes configuration files are stored in the `k8/` directory.

### 8.1 PostgreSQL – `k8/postgres.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init
  namespace: data
data:
  init.sql: |
    CREATE DATABASE identity_db;
    CREATE DATABASE paymentappdb;
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: data
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: admin
            - name: POSTGRES_PASSWORD
              value: password123
            - name: POSTGRES_DB
              value: postgres
          volumeMounts:
            - name: init-script
              mountPath: /docker-entrypoint-initdb.d
      volumes:
        - name: init-script
          configMap:
            name: postgres-init
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: data
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

**Explanation:**
- ConfigMap contains SQL script to create both databases on first startup
- Deployment runs PostgreSQL 15 with 1 replica
- Service exposes PostgreSQL internally via DNS `postgres.data.svc.cluster.local`

### 8.2 IdentityService – `k8/identity.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: identityservice
  namespace: app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: identityservice
  template:
    metadata:
      labels:
        app: identityservice
    spec:
      containers:
        - name: identityservice
          image: it21176210/identityservice:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 5100
          env:
            - name: ConnectionStrings__DefaultConnection
              value: Host=postgres.data.svc.cluster.local;Database=identity_db;Username=admin;Password=password123
---
apiVersion: v1
kind: Service
metadata:
  name: identityservice
  namespace: app
spec:
  selector:
    app: identityservice
  ports:
    - port: 80
      targetPort: 5100
```

**Note:** `containerPort: 5100` is used because the application hardcodes `UseUrls("http://0.0.0.0:5100")` in Program.cs, which overrides the `ASPNETCORE_HTTP_PORTS` environment variable.

### 8.3 SalaryService – `k8/salary.yaml`

Same structure as identity.yaml.
- Image: `it21176210/salaryservice:latest`
- Container Port: 5001
- Service targetPort: 5001
- Database: `paymentappdb`

### 8.4 VoteService – `k8/vote.yaml`

Same structure as identity.yaml.
- Image: `it21176210/voteservice:latest`
- Container Port: 5002
- Service targetPort: 5002
- Database: `paymentappdb`

### 8.5 Frontend – `k8/frontend.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: it21176210/frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_AUTH_API_URL
              value: http://20.44.215.186/api
            - name: NEXT_PUBLIC_SALARY_API_URL
              value: http://20.44.215.186/api
            - name: NEXT_PUBLIC_VOTE_API_PROXY_PATH
              value: http://20.44.215.186/api
            - name: NEXT_PUBLIC_SEARCH_API_PROXY_PATH
              value: http://20.44.215.186/api
            - name: NEXT_PUBLIC_STATS_API_URL
              value: http://20.44.215.186/api
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: app
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### 8.6 Ingress – `k8/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: app
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /api/auth
            pathType: Prefix
            backend:
              service:
                name: identityservice
                port:
                  number: 80
          - path: /api/Auth
            pathType: Prefix
            backend:
              service:
                name: identityservice
                port:
                  number: 80
          - path: /api/salaries
            pathType: Prefix
            backend:
              service:
                name: salaryservice
                port:
                  number: 80
          - path: /api/Salaries
            pathType: Prefix
            backend:
              service:
                name: salaryservice
                port:
                  number: 80
          - path: /api/votes
            pathType: Prefix
            backend:
              service:
                name: voteservice
                port:
                  number: 80
          - path: /api/reports
            pathType: Prefix
            backend:
              service:
                name: voteservice
                port:
                  number: 80
          - path: /api/stats
            pathType: Prefix
            backend:
              service:
                name: statsservice
                port:
                  number: 80
          - path: /api/search
            pathType: Prefix
            backend:
              service:
                name: searchservice
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

---

## 9. Azure Infrastructure Setup

### Azure Resources Created

| Resource | Name | Details |
|----------|------|---------|
| Resource Group | cloud-app-rg | Region: Southeast Asia |
| AKS Cluster | cloud-app-aks | 1 node, Standard_D4ds_v4 |
| Kubernetes Version | – | 1.34.4 |
| Pricing Tier | – | Free |
| Subscription | – | Azure for Students |

### Why Southeast Asia Region?

The University of Westminster's Azure for Students subscription has regional restrictions. After attempting multiple regions (ukwest, eastus, uksouth, westeurope), only `southeastasia` successfully allowed AKS cluster creation.

### Azure Providers Registered

```bash
az provider register --namespace Microsoft.ContainerService
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

---

## 10. Step-by-Step Deployment Process

### Phase 1: Install Tools

**Install Azure CLI on macOS:**
```bash
brew install azure-cli
```

**Verify installation:**
```bash
az --version
kubectl version --client
```

### Phase 2: Azure Login and Setup

**Step 1: Login to Azure**
```bash
az login
```
A browser will open for authentication. Select the Azure for Students subscription.

**Step 2: Create Resource Group**
```bash
az group create --name cloud-app-rg --location southeastasia
```

Expected output:
```json
{
  "location": "southeastasia",
  "name": "cloud-app-rg",
  "properties": {
    "provisioningState": "Succeeded"
  }
}
```

**Step 3: Register AKS Provider**
```bash
az provider register --namespace Microsoft.ContainerService
az provider show --namespace Microsoft.ContainerService --query "registrationState"
```
Wait until output shows `"Registered"`.

**Step 4: Create AKS Cluster**
```bash
az aks create \
  --resource-group cloud-app-rg \
  --name cloud-app-aks \
  --node-count 1 \
  --generate-ssh-keys
```
This takes approximately 5-10 minutes.

**Step 5: Connect kubectl to AKS Cluster**
```bash
az aks get-credentials --resource-group cloud-app-rg --name cloud-app-aks
```

**Step 6: Verify Connection**
```bash
kubectl get nodes
```
Expected output:
```
NAME                                STATUS   ROLES    AGE   VERSION
aks-nodepool1-XXXXXXXX-vmss000000   Ready    <none>   2m    v1.34.4
```

### Phase 3: Kubernetes Setup

**Step 7: Create Namespaces**
```bash
kubectl create namespace app
kubectl create namespace data
```

**Step 8: Install Nginx Ingress Controller**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

**Step 9: Get External IP**
```bash
kubectl get svc -n ingress-nginx
```

Wait until `EXTERNAL-IP` column shows an IP address (not `<pending>`).

```
NAME                       TYPE           CLUSTER-IP   EXTERNAL-IP      PORT(S)
ingress-nginx-controller   LoadBalancer   10.0.46.11   20.44.215.186    80:30318/TCP
```

This IP (`20.44.215.186`) is updated in:
- `k8/frontend.yaml` environment variables
- `.github/workflows/frontend-deploy.yml` build arguments

### Phase 4: CI/CD and Docker Images

**Step 10: Push Code to Trigger Workflows**

Each commit pushed to `dev_asmitha_deployment_voteservice` with changes in the relevant service folder triggers the corresponding GitHub Actions workflow.

```bash
git add .
git commit -m "Add deployment files"
git push origin dev_asmitha_deployment_voteservice
```

GitHub Actions automatically:
1. Checks out the code
2. Logs in to Docker Hub using secrets
3. Builds the Docker image
4. Pushes to Docker Hub with `:latest` and `:<commit-sha>` tags

### Phase 5: Deploy to Kubernetes

**Step 11: Deploy All Services**
```bash
# Deploy database first
kubectl apply -f k8/postgres.yaml

# Deploy application services
kubectl apply -f k8/identity.yaml
kubectl apply -f k8/salary.yaml
kubectl apply -f k8/vote.yaml
kubectl apply -f k8/frontend.yaml

# Deploy ingress routing
kubectl apply -f k8/ingress.yaml
```

**Step 12: Verify All Pods Are Running**
```bash
kubectl get pods -n app
kubectl get pods -n data
```

Expected output:
```
NAME                               READY   STATUS    RESTARTS   AGE
frontend-xxxxx                     1/1     Running   0          2m
identityservice-xxxxx              1/1     Running   0          2m
salaryservice-xxxxx                1/1     Running   0          2m
voteservice-xxxxx                  1/1     Running   0          2m

NAME                    READY   STATUS    RESTARTS   AGE
postgres-xxxxx          1/1     Running   0          3m
```

---

## 11. Verification and Testing

### Application Access

Open browser and navigate to: **http://20.44.215.186**

### Admin Account Setup

1. Go to `http://20.44.215.186/auth/signup`
2. Create account with:
   - Email: `admin@gmail.com`
   - Password: (any secure password)
3. Login at `http://20.44.215.186/auth/login`
4. Admin privileges are automatically granted (configured in `appsettings.json`)

### Moderator Account Setup

1. Create account with email: `mod@gmail.com`
2. Moderator role is automatically assigned

### Docker Hub Images Verification

All 4 images are publicly available at:
- https://hub.docker.com/u/it21176210

| Repository | Status |
|-----------|--------|
| it21176210/identityservice | Active |
| it21176210/salaryservice | Active |
| it21176210/voteservice | Active |
| it21176210/frontend | Active |

---

## 12. Troubleshooting

### Issue 1: 502 Bad Gateway on API calls

**Cause:** The .NET services use `builder.WebHost.UseUrls("http://0.0.0.0:<port>")` which overrides the `ASPNETCORE_HTTP_PORTS` environment variable. This means the service listens on a different port than what Kubernetes expects.

**Fix:** Update the Kubernetes service `targetPort` to match the actual port the service listens on:
- IdentityService: `targetPort: 5100`
- SalaryService: `targetPort: 5001`
- VoteService: `targetPort: 5002`

```bash
kubectl apply -f k8/identity.yaml
kubectl apply -f k8/salary.yaml
kubectl apply -f k8/vote.yaml
```

### Issue 2: Frontend still calling old IP

**Cause:** `NEXT_PUBLIC_*` environment variables in Next.js are baked into the JavaScript bundle at build time. Updating the Kubernetes env vars does not change the compiled JS.

**Fix:** The frontend Docker image must be rebuilt with the correct IP as a build argument. Update the workflow file with the new IP and trigger a rebuild by making a change in the `web/` folder.

```bash
# Touch a file to trigger workflow
echo "" >> web/next.config.ts
git add .
git commit -m "Trigger frontend rebuild with correct IP"
git push origin dev_asmitha_deployment_voteservice
```

After the new image is pushed, restart the frontend pod:
```bash
kubectl rollout restart deployment/frontend -n app
```

### Issue 3: AKS Creation Blocked by Policy

**Error:** `RequestDisallowedByAzure – This policy maintains a set of best available regions`

**Cause:** The University of Westminster Azure for Students subscription restricts which regions can be used.

**Fix:** Try the `southeastasia` region:
```bash
az group create --name cloud-app-rg --location southeastasia
az aks create --resource-group cloud-app-rg --name cloud-app-aks --node-count 1 --generate-ssh-keys
```

### Issue 4: GitHub Secret Already Exists

**Error:** `Failed to add secret, a secret with the same name (DOCKER_USERNAME) already exists`

**Cause:** Team members had already added `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets for their Docker Hub accounts.

**Fix:** Create secrets with a unique suffix:
- `DOCKER_USERNAME_ASMITHA` = it21176210
- `DOCKER_PASSWORD_ASMITHA` = (access token)

Update all workflow files to reference `${{ secrets.DOCKER_USERNAME_ASMITHA }}` and `${{ secrets.DOCKER_PASSWORD_ASMITHA }}`.

---

## 13. Useful kubectl Commands

### Check Status
```bash
# Check all pods in app namespace
kubectl get pods -n app

# Check all pods in data namespace
kubectl get pods -n data

# Check services
kubectl get svc -n app
kubectl get svc -n ingress-nginx

# Check ingress
kubectl get ingress -n app
```

### View Logs
```bash
# IdentityService logs
kubectl logs -n app -l app=identityservice --tail=50

# SalaryService logs
kubectl logs -n app -l app=salaryservice --tail=50

# VoteService logs
kubectl logs -n app -l app=voteservice --tail=50

# Frontend logs
kubectl logs -n app -l app=frontend --tail=50

# PostgreSQL logs
kubectl logs -n data -l app=postgres --tail=50
```

### Restart Deployments (after new Docker image push)
```bash
kubectl rollout restart deployment/identityservice -n app
kubectl rollout restart deployment/salaryservice -n app
kubectl rollout restart deployment/voteservice -n app
kubectl rollout restart deployment/frontend -n app
```

### Apply Updated Manifests
```bash
kubectl apply -f k8/postgres.yaml
kubectl apply -f k8/identity.yaml
kubectl apply -f k8/salary.yaml
kubectl apply -f k8/vote.yaml
kubectl apply -f k8/frontend.yaml
kubectl apply -f k8/ingress.yaml
```

### Describe a Pod (for debugging)
```bash
kubectl describe pod -n app -l app=identityservice
```

---

*Document prepared by Asmitha (it21176210) – 19 April 2026*

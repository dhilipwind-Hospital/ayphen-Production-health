# 🚀 Ayphen Hospital - Production Deployment Guide

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Vercel      │      │     Render      │      │    Supabase     │
│   (Frontend)    │ ───► │   (Backend)     │ ───► │   (Database)    │
│   React App     │      │  Express API    │      │   PostgreSQL    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `ayphen-hospital`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait for setup

### 1.2 Get Database Credentials
1. Go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Copy these values:
   - **Host**: `db.xxxxxxxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your database password

### 1.3 Run Database Migrations
Option A: Use Supabase SQL Editor
1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL migrations from `backend/migrations/` folder

Option B: Use psql (if you have it installed)
```bash
PGPASSWORD=your-password psql -h db.xxxxxxxxxx.supabase.co -U postgres -d postgres -f backend/migrations/init.sql
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account

### 2.2 Push Code to GitHub
```bash
# Initialize git if not already done
cd /Users/dhilipelango/Ayphen\ Hospital\ Production-final/hospital-website
git init
git add .
git commit -m "Prepare for production deployment"

# Create GitHub repo and push
# Or use: gh repo create ayphen-hospital --private --push
git remote add origin https://github.com/YOUR_USERNAME/ayphen-hospital.git
git push -u origin main
```

### 2.3 Create Web Service on Render
1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `ayphen-hospital-api`
   - **Root Directory**: `hospital-website/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for better performance)

### 2.4 Add Environment Variables on Render
Go to **Environment** tab and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DB_HOST` | `db.xxxxxxxxxx.supabase.co` |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `your-supabase-password` |
| `DB_NAME` | `postgres` |
| `JWT_SECRET` | `generate-a-32-char-secret` |
| `JWT_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |

5. Click **Deploy**

### 2.5 Note Your Backend URL
After deployment, your backend will be at:
```
https://ayphen-hospital-api.onrender.com
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Update Frontend API Configuration
Before deploying, update the API URL in the frontend:

```bash
# Create .env.production in frontend directory
echo "REACT_APP_API_URL=https://ayphen-hospital-api.onrender.com/api" > frontend/.env.production
```

### 3.3 Deploy to Vercel
```bash
cd frontend
vercel login
vercel --prod
```

Or via Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Import Project"**
3. Import from GitHub
4. Configure:
   - **Root Directory**: `hospital-website/frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.4 Add Environment Variables on Vercel
Go to Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://ayphen-hospital-api.onrender.com/api` |
| `REACT_APP_GOOGLE_CLIENT_ID` | `your-google-client-id` |

5. Click **Deploy**

---

## Step 4: Update CORS and URLs

### 4.1 Update Backend CORS
After getting your Vercel URL, update the backend environment on Render:
```
FRONTEND_URL=https://ayphen-hospital.vercel.app
```

### 4.2 Update vercel.json
Edit `frontend/vercel.json` and replace:
```json
"dest": "https://your-render-backend-url.onrender.com/api/$1"
```
with your actual Render URL.

---

## Step 5: Seed Initial Data

### 5.1 Create Super Admin
After deployment, run the seed script:

```bash
# SSH into Render or run locally with production DB
npm run seed:super-admin
```

Or create manually via Supabase SQL Editor.

---

## Step 6: Verify Deployment

### 6.1 Test Backend
```bash
curl https://ayphen-hospital-api.onrender.com/api/health
```

### 6.2 Test Frontend
Visit: `https://ayphen-hospital.vercel.app`

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database password saved securely
- [ ] Backend deployed to Render
- [ ] Environment variables configured on Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured on Vercel
- [ ] CORS updated with Vercel URL
- [ ] Super admin created
- [ ] Email notifications tested
- [ ] SSL/HTTPS working

---

## Troubleshooting

### Database Connection Issues
- Verify Supabase connection string
- Check if IP is allowlisted (Supabase: Database → Settings → Network)

### CORS Errors
- Update `FRONTEND_URL` on Render
- Verify API routes in vercel.json

### Build Failures
- Check build logs on Render/Vercel
- Ensure all dependencies are in package.json

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel | ✅ Free | $20/month |
| Render | ✅ Free (spins down after 15 min inactivity) | $7/month |
| Supabase | ✅ Free (500MB) | $25/month |
| **Total** | **$0** | **$52/month** |

---

## Support

For issues, check:
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)

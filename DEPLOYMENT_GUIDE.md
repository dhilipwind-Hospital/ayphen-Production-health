# 🚀 Ayphen Hospital - Production Deployment Guide

## 📋 Quick Reference

| Service | Platform | Repository | Status |
|---------|----------|------------|--------|
| **Backend** | Render | `ayphen-Production-health` | 🔄 Pending |
| **Frontend** | Vercel | `ayphen-Production-health` | 🔄 Pending |
| **Database** | Supabase | N/A | 🔄 Pending |

**GitHub Repository:** https://github.com/dhilipwind-Hospital/ayphen-Production-health

---

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Vercel      │      │     Render      │      │    Supabase     │
│   (Frontend)    │ ───► │   (Backend)     │ ───► │   (Database)    │
│   React App     │      │  Express API    │      │   PostgreSQL    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

# 🗄️ STEP 1: Set Up Supabase Database

## 1.1 Create Supabase Account (If New)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with:
   - **GitHub** (recommended) - Click "Continue with GitHub"
   - **Or** use Email/Password

---

## 1.2 Create a New Organization

> ⚠️ Organizations in Supabase help you manage multiple projects and team members.

### Step-by-Step:

1. After logging in, click on your **profile icon** (top right)
2. Click **"Create new organization"** or go to **Settings** → **Organizations**
3. Fill in the organization details:

| Field | Value |
|-------|-------|
| **Organization name** | `Ayphen Hospital` |
| **Type** | `Personal` or `Company` |
| **Billing email** | `your-email@example.com` |

4. Click **"Create organization"**

---

## 1.3 Create New Project

### Step-by-Step:

1. From the Supabase dashboard, click **"+ New project"** (green button, top right)
2. Select your organization: **"Ayphen Hospital"**
3. Fill in the project details:

| Field | Value |
|-------|-------|
| **Name** | `ayphen-hospital-prod` |
| **Database Password** | Create a strong password (e.g., `Hospital@Prod2026!`) |
| **Region** | `South Asia (Mumbai) - ap-south-1` |
| **Pricing Plan** | `Free` (can upgrade later) |

### ⚠️ CRITICAL: Save Your Database Password!

```
📝 DATABASE PASSWORD: ________________________
   (Write it down NOW - you cannot recover it later!)
```

4. Click **"Create new project"**
5. Wait **2-3 minutes** for the project to initialize

---

## 1.4 Get Database Connection Details

Once your project is ready:

### Step-by-Step:

1. In the left sidebar, click **⚙️ Settings** (gear icon at the bottom)
2. Click **"Database"** under Configuration
3. Scroll down to find **"Connection string"** section
4. Click on **"URI"** tab

### Copy These Values:

| Variable | Where to Find | Example |
|----------|---------------|---------|
| `DB_HOST` | Host field | `db.abcdefghij.supabase.co` |
| `DB_PORT` | Port field | `5432` (default) or `6543` (pooling) |
| `DB_USER` | User field | `postgres` |
| `DB_PASSWORD` | The password you saved | `Hospital@Prod2026!` |
| `DB_NAME` | Database field | `postgres` |

### Alternative: Copy Full Connection String

In the **"Connection string"** section, you can also copy:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
```

---

## 1.5 Configure Database Settings (Optional but Recommended)

### Enable Connection Pooling (For Better Performance):

1. Go to **Settings** → **Database**
2. Scroll to **"Connection Pooling"**
3. Toggle it **ON**
4. Note: When pooling is enabled, use port `6543` instead of `5432`

### Set Up SSL Mode:

For production, ensure SSL is enabled:
- Connection mode: `require` (default)

---

## 1.6 Quick Reference Card

Save this information:

```
┌─────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE CREDENTIALS              │
├─────────────────────────────────────────────────────────┤
│ Project:     ayphen-hospital-prod                       │
│ Region:      South Asia (Mumbai)                        │
│                                                         │
│ DB_HOST:     db.xxxxxxxxxx.supabase.co                  │
│ DB_PORT:     5432 (or 6543 for pooling)                 │
│ DB_USER:     postgres                                   │
│ DB_PASSWORD: [YOUR PASSWORD]                            │
│ DB_NAME:     postgres                                   │
│                                                         │
│ Connection String:                                      │
│ postgresql://postgres:[PASS]@db.xxx.supabase.co:5432/   │
└─────────────────────────────────────────────────────────┘
```
| `DB_NAME` | `postgres` |

## 1.3 Enable Connection from External Services

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Make sure it's enabled
3. Note: You might need to use port `6543` for pooled connections

---

# 🖥️ STEP 2: Deploy Backend to Render

## 2.1 Create New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"+ New"** (top right) → **"Web Service"**

## 2.2 Connect GitHub Repository

1. Click **"Build and deploy from a Git repository"** → **"Next"**
2. Connect your GitHub account if not already connected
3. Find and select: **`dhilipwind-Hospital/ayphen-Production-health`**
4. Click **"Connect"**

## 2.3 Configure Service Settings

Fill in the following:

| Setting | Value |
|---------|-------|
| **Name** | `ayphen-hospital-api` |
| **Region** | `Singapore (Southeast Asia)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or `Starter` for better performance) |

## 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add each:

### Required Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DB_HOST` | `db.xxxxxxxxxx.supabase.co` (from Supabase) |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `your-supabase-database-password` |
| `DB_NAME` | `postgres` |
| `JWT_SECRET` | `your-super-secret-key-minimum-32-characters` |
| `JWT_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://ayphen-hospital.vercel.app` (update after Vercel deploy) |

### Email Configuration (Gmail SMTP)

| Key | Value |
|-----|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your-gmail@gmail.com` |
| `SMTP_PASS` | `your-gmail-app-password` |
| `SMTP_FROM_NAME` | `Ayphen Care` |
| `SMTP_FROM_EMAIL` | `your-gmail@gmail.com` |

> **💡 Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App passwords → Generate new app password for "Mail"

## 2.5 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Once deployed, note your backend URL:
   ```
   https://ayphen-hospital-api.onrender.com
   ```

## 2.6 Verify Backend is Working

Visit in browser:
```
https://ayphen-hospital-api.onrender.com/api/health
```

Should return: `{"status":"ok"}`

---

# 🌐 STEP 3: Deploy Frontend to Vercel

## 3.1 Create Vercel Account & Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and import: **`dhilipwind-Hospital/ayphen-Production-health`**

## 3.2 Configure Project Settings

| Setting | Value |
|---------|-------|
| **Project Name** | `ayphen-hospital` |
| **Framework Preset** | `Create React App` |
| **Root Directory** | Click **"Edit"** → Select `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

## 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://ayphen-hospital-api.onrender.com/api` |
| `REACT_APP_GOOGLE_CLIENT_ID` | `866079047659-uhnesjlqma8c3a9fbipedb9qfqiaubqh.apps.googleusercontent.com` |

## 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Once deployed, note your frontend URL:
   ```
   https://ayphen-hospital.vercel.app
   ```

---

# 🔗 STEP 4: Update Cross-References

## 4.1 Update Backend CORS

1. Go to Render Dashboard → `ayphen-hospital-api`
2. Click **"Environment"** tab
3. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   https://ayphen-hospital.vercel.app
   ```
4. Click **"Save Changes"** - Render will auto-redeploy

## 4.2 Update vercel.json (If API Proxy Needed)

If using API proxy, update `frontend/vercel.json`:

```json
{
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "https://ayphen-hospital-api.onrender.com/api/$1"
        }
    ]
}
```

---

# 👤 STEP 5: Create Super Admin User

## Option A: Via Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL:

```sql
-- Create super admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, is_email_verified)
VALUES (
    'admin@ayphencare.com',
    '$2b$10$XXXX', -- Generate bcrypt hash for your password
    'Super',
    'Admin',
    'super_admin',
    true,
    true
);
```

## Option B: Via API (After Deployment)

Use Postman or curl:

```bash
curl -X POST https://ayphen-hospital-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ayphencare.com",
    "password": "YourSecurePassword123!",
    "firstName": "Super",
    "lastName": "Admin"
  }'
```

---

# ✅ STEP 6: Final Verification Checklist

## Test Backend API
```bash
# Health check
curl https://ayphen-hospital-api.onrender.com/api/health

# Expected: {"status":"ok"}
```

## Test Frontend
1. Visit: `https://ayphen-hospital.vercel.app`
2. Check that the page loads
3. Try logging in with your admin credentials

## Full Deployment Checklist

- [ ] ✅ GitHub repository created and code pushed
- [ ] Supabase project created
- [ ] Database credentials saved
- [ ] Backend deployed to Render
- [ ] Backend environment variables configured
- [ ] Backend health check passing
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] CORS configured (FRONTEND_URL on Render)
- [ ] Super admin user created
- [ ] Login tested successfully
- [ ] Email notifications tested

---

# 🔧 Troubleshooting

## Common Issues

### 1. Backend: "Database connection failed"
- Verify Supabase credentials
- Check if using correct port (`5432` or `6543` for pooling)
- Ensure Supabase project is not paused (free tier pauses after 1 week of inactivity)

### 2. Frontend: CORS errors
- Update `FRONTEND_URL` on Render to exact Vercel URL
- Ensure URL has no trailing slash

### 3. Frontend: API calls fail
- Check `REACT_APP_API_URL` is correct
- Verify backend is running (not sleeping on free tier)

### 4. Render free tier sleeping
- First request after sleep takes 30-60 seconds
- Upgrade to Starter ($7/month) to prevent sleeping

### 5. Build failures on Render
- Check build logs
- Ensure `package.json` has all dependencies
- Verify `npm run build` command is correct

---

# 💰 Cost Summary

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| **Render** | ✅ Free (sleeps after 15min inactivity) | $7/month Starter (no sleep) |
| **Vercel** | ✅ Free (100GB bandwidth) | $20/month Pro |
| **Supabase** | ✅ Free (500MB, pauses after 1 week inactivity) | $25/month Pro |
| **Total** | **$0/month** | **$52/month** |

---

# 📞 Support Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated:** January 8, 2026

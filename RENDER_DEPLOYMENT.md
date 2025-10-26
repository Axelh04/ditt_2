# Render Deployment Guide

This guide will help you deploy your DITT application to Render with both frontend and backend services.

## Prerequisites

1. A [Render account](https://render.com/) (free tier available)
2. Your GitHub repository connected to Render
3. API Keys:
   - [Google Gemini API Key](https://aistudio.google.com/app/apikey)
   - [ElevenLabs API Key](https://elevenlabs.io/app/settings/api-keys)

## Deployment Methods

### Method 1: Blueprint Deployment (Recommended - One-Click Setup)

This method uses the `render.yaml` file to deploy both services at once.

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository containing your app
   - Render will automatically detect `render.yaml`
   - Click **"Apply"**

3. **Add Environment Variables**
   
   After the services are created, you need to add your API keys:
   
   **For Backend Service (`ditt-backend`):**
   - Go to the backend service in Render Dashboard
   - Navigate to **"Environment"** tab
   - Add the following environment variables:
     ```
     GEMINI_API_KEY=your_actual_gemini_api_key
     ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key
     ```
   - Click **"Save Changes"**
   - The service will automatically redeploy

4. **Update CORS Origin (Optional)**
   
   If you want to restrict CORS to only your frontend:
   - Add another environment variable to backend:
     ```
     CORS_ORIGIN=https://ditt-frontend.onrender.com
     ```
   - Replace with your actual frontend URL

5. **Done!** 🎉
   - Frontend URL: `https://ditt-frontend.onrender.com`
   - Backend URL: `https://ditt-backend.onrender.com`
   - The frontend automatically connects to the backend

### Method 2: Manual Deployment

If you prefer to set up each service manually:

#### Backend Setup

1. **Create Web Service**
   - Go to Render Dashboard → **"New"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     ```
     Name: ditt-backend
     Runtime: Node
     Build Command: cd server && npm install && npm run build
     Start Command: cd server && npm run start
     ```

2. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   CORS_ORIGIN=https://ditt-frontend.onrender.com
   ```

3. **Set Health Check**
   - Path: `/api/health`

4. **Deploy**

#### Frontend Setup

1. **Create Static Site**
   - Go to Render Dashboard → **"New"** → **"Static Site"**
   - Connect your GitHub repository
   - Configure:
     ```
     Name: ditt-frontend
     Build Command: npm install && npm run build
     Publish Directory: dist
     ```

2. **Add Environment Variable**
   ```
   VITE_API_URL=https://ditt-backend.onrender.com
   ```
   ⚠️ **Important**: Replace with your actual backend URL from step 1

3. **Configure Rewrites** (for SPA routing)
   - Add rewrite rule:
     ```
     Source: /*
     Destination: /index.html
     Action: Rewrite
     ```

4. **Deploy**

## Post-Deployment Configuration

### Update Backend CORS

Once you know your frontend URL, update the backend environment variable:

```bash
CORS_ORIGIN=https://your-actual-frontend-url.onrender.com
```

### Verify Health Check

Visit your backend health check endpoint:
```
https://ditt-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T..."
}
```

## Important Notes

### Free Tier Limitations

- **Cold Starts**: Backend spins down after 15 minutes of inactivity
  - First request after inactivity takes ~30-60 seconds
  - Subsequent requests are fast
  - Solution: Upgrade to paid tier ($7/month) for always-on service

- **Build Minutes**: 500 minutes/month for free tier
  - Each deployment counts toward this limit

### Upgrade to Paid Tier (Optional)

Benefits of upgrading backend to Starter ($7/month):
- ✅ No cold starts (always-on)
- ✅ Better performance
- ✅ 1GB RAM (vs 512MB on free tier)
- ✅ Better for production use

Frontend static site remains free!

## Environment Variables Reference

### Backend (`ditt-backend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | No | Server port (auto-set by Render) | `3001` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIza...` |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key | `sk_...` |
| `CORS_ORIGIN` | No | Allowed frontend origin | `https://ditt-frontend.onrender.com` |

### Frontend (`ditt-frontend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://ditt-backend.onrender.com` |

## Monitoring and Logs

### View Logs

**Backend Logs:**
1. Go to Render Dashboard
2. Click on `ditt-backend` service
3. Click **"Logs"** tab
4. View real-time logs

**Frontend Logs:**
1. Go to Render Dashboard
2. Click on `ditt-frontend` service
3. Click **"Logs"** tab
4. View build and deployment logs

### Monitor Performance

- Check **"Metrics"** tab for each service
- Monitor response times, error rates, and resource usage

## Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms:** Network errors, CORS errors in browser console

**Solutions:**
1. Verify `VITE_API_URL` is set correctly in frontend environment variables
2. Check backend `CORS_ORIGIN` allows your frontend URL
3. Verify backend is running (check logs)
4. Test backend health check endpoint directly

### Backend API Key Errors

**Symptoms:** API errors, "Invalid API key" messages

**Solutions:**
1. Verify environment variables are set correctly
2. No quotes around API keys
3. No trailing spaces
4. Redeploy after adding variables

### Cold Start Issues (Free Tier)

**Symptoms:** First request takes 30-60 seconds, timeout errors

**Solutions:**
1. Wait for backend to wake up
2. Implement retry logic in frontend
3. Upgrade to paid tier for always-on service
4. Use a ping service to keep backend warm (e.g., [UptimeRobot](https://uptimerobot.com/))

### Build Failures

**Check Common Issues:**
1. Verify `package.json` has correct scripts
2. Check node version compatibility
3. Review build logs for specific errors
4. Ensure all dependencies are in `package.json`

## Continuous Deployment

Render automatically redeploys when you push to your repository:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Run build commands
# 3. Deploy new version
```

### Branch Deployments

You can also deploy from different branches:
1. Go to service settings
2. Change **"Branch"** to your desired branch
3. Save changes

## Custom Domains (Optional)

### Add Custom Domain

1. Go to service in Render Dashboard
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Add your domain
5. Configure DNS records as instructed

### SSL Certificates

- Render automatically provisions SSL certificates
- HTTPS is enabled by default
- Certificates auto-renew

## Costs Breakdown

### Free Tier

- **Frontend (Static Site)**: FREE forever
- **Backend (Web Service)**: FREE with limitations
  - 750 hours/month (31 days worth)
  - Spins down after 15min inactivity
  - 512MB RAM
  - 100GB bandwidth

### Recommended for Production

- **Frontend**: FREE (static site)
- **Backend**: $7/month (Starter tier)
  - Always-on (no cold starts)
  - 1GB RAM
  - Better performance
  
**Total: $7/month** for production-ready hosting

## Security Best Practices

1. **Never commit API keys** to Git
2. **Use environment variables** for all secrets
3. **Restrict CORS** to your frontend domain only
4. **Enable HTTPS** (automatic on Render)
5. **Monitor logs** for suspicious activity
6. **Rotate API keys** periodically

## Next Steps

After deployment:

1. ✅ Test all features in production
2. ✅ Set up monitoring/alerts
3. ✅ Add custom domain (optional)
4. ✅ Configure database if needed
5. ✅ Set up analytics
6. ✅ Consider upgrading for better performance

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com/
- **GitHub Issues**: Create issue in your repository

---

**Happy Deploying! 🚀**


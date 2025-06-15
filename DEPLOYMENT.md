# 🚀 Deployment Guide

This guide explains how to deploy your game to GitHub Pages while keeping your Supabase credentials secure.

## 🔒 Security Approach

The game uses a dual-credential system:
- **Local Development**: Uses `config.js` (not committed to GitHub)
- **Production Deployment**: Uses GitHub Secrets with automatic replacement

## 📋 Setup Instructions

### 1. Local Development Setup

1. Copy the example config:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` with your actual Supabase credentials:
   ```javascript
   const CONFIG = {
       SUPABASE_URL: 'https://your-project.supabase.co',
       SUPABASE_ANON_KEY: 'your-actual-anon-key-here'
   };
   ```

3. Test locally by opening `index.html` in your browser

### 2. GitHub Pages Deployment Setup

1. **Add Repository Secrets**:
   - Go to your GitHub repository
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anon key

2. **Enable GitHub Pages**:
   - Go to **Settings** → **Pages**
   - Source: **GitHub Actions**

3. **Deploy**:
   - Push to `main` or `master` branch
   - GitHub Actions will automatically deploy
   - Your game will be available at: `https://yourusername.github.io/your-repo-name`

## 🔧 How It Works

1. **Source Code**: Contains placeholder values `{{SUPABASE_URL}}` and `{{SUPABASE_ANON_KEY}}`
2. **GitHub Actions**: Replaces placeholders with actual values from secrets
3. **Deployment**: Only the processed files (with real credentials) are deployed
4. **Security**: Original source code never contains real credentials

## 🛠️ Manual Deployment (Alternative)

If you prefer manual deployment:

1. Create a `deploy` branch
2. In the deploy branch, replace the placeholders in `game.js`:
   ```javascript
   SUPABASE_URL = 'https://your-project.supabase.co';
   SUPABASE_ANON_KEY = 'your-actual-anon-key';
   ```
3. Set GitHub Pages to deploy from the `deploy` branch
4. Never merge the `deploy` branch back to `main`

## ⚠️ Important Notes

- **Never commit `config.js`** - it's in `.gitignore`
- **Supabase anon keys are safe for frontend use** - they're designed for client-side applications
- **Row Level Security (RLS)** in Supabase provides the actual security layer
- **The deployment process is automatic** - just push to trigger deployment

## 🔍 Troubleshooting

- **"Supabase credentials not configured"**: Check that GitHub secrets are set correctly
- **Game works locally but not on GitHub Pages**: Verify the workflow ran successfully
- **High scores not saving**: Check browser console for Supabase connection errors 
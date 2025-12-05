# Deploying AgentForge to Render

This guide explains how to deploy AgentForge as a Web Service on Render.

## Prerequisites

- A Render account (sign up at render.com)
- Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Configuration

### Runtime Environment
- **Runtime**: Node
- **Node Version**: 20.x (specify in `package.json` or environment variable)

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm run start
```

## Step-by-Step Deployment

### 1. Create a New Web Service

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Select the branch to deploy (usually `main` or `master`)

### 2. Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | agentforge (or your preferred name) |
| **Region** | Choose closest to your users |
| **Branch** | main |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | Free (for testing) or Starter (for production) |

### 3. Environment Variables

Add these environment variables in the Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Required for production mode |
| `PORT` | `10000` | Render uses port 10000 by default |

### 4. Node Version (Optional)

To specify Node.js version, add to your `package.json`:

```json
{
  "engines": {
    "node": "20.x"
  }
}
```

Or set the environment variable:
- `NODE_VERSION`: `20.18.0`

## What Happens During Deployment

### Build Phase
1. Render clones your repository
2. Runs `npm install` to install dependencies
3. Runs `npm run build` which:
   - Compiles TypeScript
   - Builds the Vite frontend
   - Prepares production assets

### Start Phase
1. Render runs `npm run start` which starts the Express server
2. The server serves both the API and the static frontend files
3. The app becomes accessible at your Render URL

## Health Checks

Render will automatically check your app's health. The app provides a health endpoint at:
```
GET /api/health
```

This returns `{"status":"ok","timestamp":"..."}` when the server is running.

## Database (Optional)

If you need a PostgreSQL database:

1. Go to Render Dashboard
2. Click "New +" and select "PostgreSQL"
3. Create the database
4. Copy the "Internal Database URL"
5. Add it as an environment variable: `DATABASE_URL`

## Deployment Types Comparison

| Type | Best For | Notes |
|------|----------|-------|
| **Web Service** | This app | Always running, handles HTTP requests |
| **Background Worker** | Long tasks | Not suitable for web apps |
| **Static Site** | Frontend only | Won't work - this app needs a backend |

## Troubleshooting

### Build Failures

1. **Missing dependencies**: Ensure all dependencies are in `package.json`
2. **TypeScript errors**: Run `npm run build` locally first to check
3. **Node version**: Make sure you're using Node 20.x

### Runtime Errors

1. **Port issues**: Render uses port 10000 by default. The app reads from `PORT` env variable.
2. **Database connection**: If using PostgreSQL, ensure `DATABASE_URL` is set correctly
3. **Memory issues**: Upgrade to a larger instance if needed

### Logs

View logs in the Render dashboard under your service's "Logs" tab to debug issues.

## Cost Estimates

| Plan | Cost | Notes |
|------|------|-------|
| Free | $0 | Spins down after 15 min of inactivity |
| Starter | $7/month | Always on, good for production |
| Standard | $25/month | More CPU/RAM for heavy workloads |

## Quick Reference

```
Runtime:       Node
Node Version:  20.x
Build:         npm install && npm run build
Start:         npm run start
Port:          10000 (or PORT env variable)
Health Check:  /api/health
```

## Alternative: Docker Deployment

If you prefer Docker, create a `Dockerfile`:

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "run", "start"]
```

Then select "Docker" as the runtime in Render.

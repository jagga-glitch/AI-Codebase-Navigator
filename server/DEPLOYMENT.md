# Deployment Guide

This guide details the requirements, configurations, and steps necessary to deploy the backend of the AI CodeBase Navigator to Render.

## Environment Variables Required

The following environment variables must be configured in your deployment environment (e.g., the `.env` file or the Render dashboard):

- **`PORT`**: The port number on which the Express server will listen (e.g., `5000` or `3001`). Render will automatically set this variable, but it should default to `5000`.
- **`MONGODB_URI`**: The connection string for your MongoDB database (e.g., MongoDB Atlas cluster URI).
- **`JWT_SECRET`**: A cryptographically secure random string used to sign and verify JSON Web Tokens (JWT).
- **`ANTHROPIC_API_KEY`**: The API key for Anthropic Claude, used to analyze codebase patterns and generate descriptions.
- **`CLIENT_URL`**: The URL of the client application (Frontend), used to configure CORS allowances.
- **`NODE_ENV`**: The runtime environment. Set to `production` in the production environment to disable development loggers and error details.
- **`GITHUB_TOKEN`**: (Optional) A GitHub Personal Access Token to avoid API rate limits when pulling public repository trees and details.

---

## Render Deployment Steps

Follow these steps to deploy the server service on Render:

1. **Create a New Web Service**:
   - Log into the Render Dashboard.
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository containing the AI CodeBase Navigator project.

2. **Configure Settings**:
   - **Name**: `codebase-navigator-api` (or any custom name)
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your database or users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

3. **Add Environment Variables**:
   In the **Environment** tab, click **Add Environment Variable** and enter:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `CLIENT_URL`
   - `NODE_ENV` (set to `production`)
   - `GITHUB_TOKEN` (optional but recommended)

4. **Deploy**:
   - Click **Create Web Service** at the bottom of the page to initiate the build and deployment process.

---

## MongoDB Atlas Setup

To allow the deployed Render service to connect to MongoDB Atlas:

1. **Whitelist IP Address**:
   - Render uses dynamic IP addresses that change frequently.
   - Navigate to the **Network Access** tab in your MongoDB Atlas Dashboard.
   - Click **Add IP Address** and whitelist `0.0.0.0/0` (allow access from anywhere). This allows Render instances to connect properly.

2. **Retrieve Connection String**:
   - In MongoDB Atlas, go to the **Database** tab and click **Connect** for your cluster.
   - Select **Drivers** under "Connect to your application".
   - Copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster.mongodb.net/codebase-navigator?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with database credentials created under the **Database Access** section.

---

## Post-Deployment Smoke Tests

Run these curl commands to verify that your deployed backend is running and secure:

1. **Verify Server Health Check**:
   ```bash
   curl -X GET https://YOUR-RENDER-APP.onrender.com/api/health
   ```

2. **Register a New User**:
   ```bash
   curl -X POST https://YOUR-RENDER-APP.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"smoketest\",\"email\":\"smoke@test.com\",\"password\":\"SecurePassword123\"}"
   ```

3. **Login with Registered Credentials**:
   ```bash
   curl -X POST https://YOUR-RENDER-APP.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"smoke@test.com\",\"password\":\"SecurePassword123\"}"
   ```

4. **Verify JWT Protection on Profile Endpoint**:
   *(Replace `YOUR_JWT_TOKEN` with the token received from the login response)*
   ```bash
   curl -X GET https://YOUR-RENDER-APP.onrender.com/api/auth/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

5. **Test Catch-all 404 Handler on Non-existent Route**:
   ```bash
   curl -X GET https://YOUR-RENDER-APP.onrender.com/api/non-existent-route
   ```

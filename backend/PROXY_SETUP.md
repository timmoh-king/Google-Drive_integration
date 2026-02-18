# Proxy Server Setup for Monday.com File Downloads

## Problem
Monday.com's protected file URLs don't allow CORS requests from browsers, which prevents direct file downloads from the React app.

## Solution
A simple Node.js proxy server that downloads files from Monday.com on behalf of your React app.

## Project Structure

This project uses a **backend/client** folder structure:
- `backend/` - Contains the proxy server (Express.js)
- `client/` - Contains the React application

## Setup Instructions

### 1. Backend Setup

Navigate to the `backend` folder and install dependencies:

```bash
cd backend
npm install
```

### 2. Configure Backend Environment Variables

Create a `.env` file in the `backend/` folder with:

```env
REACT_APP_MONDAY_USER_API_KEY=your_monday_api_key
PROXY_PORT=3001
CLIENT_URL=http://localhost:3000
```

### 3. Start the Proxy Server

From the `backend/` folder, run:

```bash
npm run proxy
```

Or directly:

```bash
node proxy-server.js
```

The proxy server will start on `http://localhost:3001` (or the port specified in `PROXY_PORT`).

### 4. Client Setup

Navigate to the `client` folder and install dependencies (if not already done):

```bash
cd client
npm install
```

### 5. Configure Client Environment Variables

Create a `.env` file in the `client/` folder with:

```env
REACT_APP_MONDAY_USER_API_KEY=your_monday_api_key
REACT_APP_PROXY_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_ITEM_ID=your_item_id (optional, for development)
REACT_APP_BOARD_ID=your_board_id
```

### 6. Start Your React App

From the `client/` folder, start your React app:

```bash
npm start
```

The React app will start on `http://localhost:3000`.

## How It Works

1. Your React app sends a request to the proxy server with the asset ID
2. The proxy server authenticates with Monday.com API using your API key
3. The proxy server downloads the file from Monday.com (no CORS restrictions)
4. The proxy server streams the file back to your React app

## Running Both Servers

You'll need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run proxy
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

## Production Deployment

For production, you'll need to:

1. Deploy the proxy server (`backend/`) to a backend service (e.g., Heroku, AWS, Railway, etc.)
2. Update `REACT_APP_PROXY_URL` in your client's production environment to point to your deployed proxy server
3. Update `CLIENT_URL` in your backend's production environment to match your deployed React app URL
4. Ensure both servers have access to your Monday.com API key

## Alternative Solutions

If you don't want to run a separate proxy server, you could:

1. Use a CORS proxy service (not recommended for production)
2. Deploy a serverless function (AWS Lambda, Vercel Functions, etc.) to handle file downloads
3. Use Monday.com's webhook system if available

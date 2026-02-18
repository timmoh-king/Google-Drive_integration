# Item View React App

A React application for viewing and managing Monday.com items with Google Drive integration.

## Project Structure

This project uses a **backend/client** folder structure:

```
item-view-reactjs/
├── backend/          # Express.js proxy server for Monday.com file downloads
│   ├── proxy-server.js
│   ├── package.json
│   └── .env          # Backend environment variables
└── client/           # React application
    ├── src/
    ├── public/
    ├── package.json
    └── .env          # Client environment variables
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
REACT_APP_MONDAY_USER_API_KEY=your_monday_api_key
PROXY_PORT=3001
CLIENT_URL=http://localhost:3000
```

Start the backend server:

```bash
npm run proxy
```

### 2. Client Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client/` folder:

```env
REACT_APP_MONDAY_USER_API_KEY=your_monday_api_key
REACT_APP_PROXY_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_ITEM_ID=your_item_id
REACT_APP_BOARD_ID=your_board_id
```

Start the React app:

```bash
npm start
```

## Running the Application

You need **two terminal windows** running simultaneously:

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

- Backend proxy server: `http://localhost:3001`
- React application: `http://localhost:3000`

## Features

- View and manage Monday.com items
- Inline editing of item fields
- Google Drive integration for file uploads
- Status management with visual indicators
- File download from Monday.com (via backend proxy)

## Environment Variables

### Backend (.env in backend/)

- `REACT_APP_MONDAY_USER_API_KEY` - Your Monday.com API key
- `PROXY_PORT` - Port for the proxy server (default: 3001)
- `CLIENT_URL` - URL of your React app for CORS (default: http://localhost:3000)

### Client (.env in client/)

- `REACT_APP_MONDAY_USER_API_KEY` - Your Monday.com API key
- `REACT_APP_PROXY_URL` - Backend proxy server URL (default: http://localhost:3001)
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `REACT_APP_GOOGLE_API_KEY` - Google API Key
- `REACT_APP_ITEM_ID` - Monday.com item ID (optional, for development)
- `REACT_APP_BOARD_ID` - Monday.com board ID

## Troubleshooting

### CORS Errors

If you see CORS errors, make sure:
1. The backend proxy server is running
2. `CLIENT_URL` in backend `.env` matches your React app URL
3. `REACT_APP_PROXY_URL` in client `.env` matches your backend server URL

### File Download Errors

If file downloads fail:
1. Verify the backend proxy server is running
2. Check that `REACT_APP_MONDAY_USER_API_KEY` is set correctly in both backend and client `.env` files
3. Check the backend console for error messages

## Production Deployment

For production:
1. Deploy the backend to a hosting service (Heroku, Railway, AWS, etc.)
2. Deploy the client to a hosting service (Vercel, Netlify, etc.)
3. Update environment variables in both deployments
4. Update `REACT_APP_PROXY_URL` in client to point to your deployed backend
5. Update `CLIENT_URL` in backend to point to your deployed client

## Documentation

- Backend proxy setup: See `backend/PROXY_SETUP.md`
- Google Drive integration: See `client/src/services/googleDrive.js`
# Google-Drive_integration

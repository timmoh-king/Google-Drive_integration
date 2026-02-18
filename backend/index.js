/**
 * Simple proxy server to download Monday.com files
 * This bypasses CORS restrictions by making the request from the server
 * 
 * Run this server with: node proxy-server.js
 * It will start on http://localhost:3001
 */

const express = require('express');
const cors = require('cors');

// Try to load dotenv if available
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, continue without it
}

// Use axios for HTTP requests (more reliable with Express)
const axios = require('axios');

const app = express();
const PORT = process.env.PROXY_PORT || 8080;

// Enable CORS for React app
// Allow requests from the client (React app running on port 3000)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
    origin: CLIENT_URL, // React app URL
    credentials: true
}));

app.use(express.json());

/**
 * Proxy endpoint to download Monday.com files
 * POST /api/download-file
 * Body: { assetId: string }
 */
app.post('/api/download-file', async (req, res) => {
    try {
        const { assetId } = req.body;
        const apiKey = process.env.REACT_APP_MONDAY_USER_API_KEY;

        if (!assetId) {
            return res.status(400).json({ error: 'Asset ID is required' });
        }

        if (!apiKey) {
            return res.status(500).json({ error: 'Monday.com API key is not configured' });
        }

        // Step 1: Get asset URL from Monday.com API
        const apiUrl = 'https://api.monday.com/v2';
        const query = `
            query ($ids: [ID!]!) {
                assets (ids: $ids) {
                    id
                    name
                    url
                    public_url
                }
            }
        `;

        const apiResponse = await axios.post(apiUrl, {
            query,
            variables: { ids: [assetId] }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });

        const apiJson = apiResponse.data;

        if (apiJson.errors) {
            return res.status(400).json({ error: `Monday.com API error: ${JSON.stringify(apiJson.errors)}` });
        }

        const asset = apiJson.data?.assets?.[0];
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const fileUrl = asset.url || asset.public_url;
        if (!fileUrl) {
            return res.status(404).json({ error: 'Asset URL not available' });
        }

        // Step 2: Download the file from Monday.com using axios with Authorization header
        const fileResponse = await axios.get(fileUrl, {
            responseType: 'stream',
            headers: {
                'Authorization': apiKey
            }
        });

        // Step 3: Set headers and stream the file back to the client

        res.setHeader('Content-Type', fileResponse.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${asset.name || 'file'}"`);
        // res.setHeader('Content-Disposition', `attachment; filename="${asset.name || `asset-${assetId}`}"`);
        if (fileResponse.headers['content-length']) {
            res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }

        // Stream the file
        fileResponse.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Accepting requests from: ${CLIENT_URL}`);
    console.log(`💡 Make sure your React app (client) is configured to use this proxy for file downloads\n`);
});

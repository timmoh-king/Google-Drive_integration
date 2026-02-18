/**
 * Google Drive Integration Service
 * Handles OAuth authentication, folder selection, and file uploads
 */

// Google API configuration
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient = null;

/**
 * Load Google API scripts
 */
export const loadGoogleAPIs = () => {
    return new Promise((resolve, reject) => {
        if (gapiLoaded && gisLoaded) {
            resolve();
            return;
        }

        const loadGapi = () => {
            return new Promise((resolveGapi, rejectGapi) => {
                if (window.gapi?.client) {
                    resolveGapi();
                    return;
                }

                const gapiScript = document.createElement('script');
                gapiScript.src = 'https://apis.google.com/js/api.js';
                gapiScript.onload = () => {
                    window.gapi.load('client:picker', {
                        callback: resolveGapi,
                        onerror: () => rejectGapi(new Error('Failed to load gapi'))
                    });
                };
                gapiScript.onerror = () => rejectGapi(new Error('Failed to load gapi script'));
                
                if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
                    document.head.appendChild(gapiScript);
                } else {
                    gapiScript.onload();
                }
            });
        };

        const loadGis = () => {
            return new Promise((resolveGis, rejectGis) => {
                if (window.google?.accounts) {
                    resolveGis();
                    return;
                }

                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.onload = resolveGis;
                gisScript.onerror = () => rejectGis(new Error('Failed to load GIS script'));
                
                if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
                    document.head.appendChild(gisScript);
                } else {
                    gisScript.onload();
                }
            });
        };

        Promise.all([loadGapi(), loadGis()])
            .then(() => {
                gapiLoaded = true;
                gisLoaded = true;
                resolve();
            })
            .catch(reject);
    });
};

/**
 * Initialize Google API client (WITHOUT auth - that's handled separately by GIS)
 */
export const initializeGoogleAPI = async () => {
    if (!GOOGLE_API_KEY) {
        throw new Error('Google API Key must be set in environment variables');
    }

    await loadGoogleAPIs();

    // FIXED: Initialize client with ONLY apiKey and discoveryDocs
    // Do NOT include clientId or scope here - that's for GIS
    await window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: DISCOVERY_DOCS
    });

    // Initialize the GIS token client separately
    if (!tokenClient && GOOGLE_CLIENT_ID) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: '', // We'll set this per-request
        });
    }
};

/**
 * Authenticate user with Google using GIS popup flow
 */
export const authenticateGoogle = () => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
        }

        try {
            // Update the callback for this specific request
            tokenClient.callback = async (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                
                // Set the access token for API calls
                window.gapi.client.setToken({
                    access_token: response.access_token
                });
                
                resolve(response);
            };

            // Request access token
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Check if user is already authenticated
 */
export const isAuthenticated = () => {
    const token = window.gapi?.client?.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (token.expires_at) {
        return Date.now() < token.expires_at;
    }
    
    return !!token.access_token;
};

/**
 * Sign out user
 */
export const signOut = () => {
    const token = window.gapi?.client?.getToken();
    if (token?.access_token) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            console.log('Token revoked');
        });
        window.gapi.client.setToken(null);
    }
};

/**
 * Show Google Picker for folder selection
 * Configured to match Google Drive's folder structure display
 */
export const showFolderPicker = () => {
    return new Promise((resolve, reject) => {
        if (!window.gapi || !window.google?.picker) {
            reject(new Error('Google Picker API not loaded'));
            return;
        }

        const token = window.gapi.client.getToken();
        if (!token?.access_token) {
            reject(new Error('User not authenticated'));
            return;
        }

        try {
            // Create a DocsView configured to show folders in Google Drive's hierarchical structure
            // This allows users to see and navigate through folders just like in Google Drive
            const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                .setIncludeFolders(true) // Include folders in the view
                .setSelectFolderEnabled(true) // Enable folder selection
                .setEnableDrives(true) // Show shared drives
                .setParent('root'); // Start from root (My Drive) to show full folder structure

            const picker = new window.google.picker.PickerBuilder()
                .addView(docsView)
                .setOAuthToken(token.access_token)
                .setDeveloperKey(GOOGLE_API_KEY)
                .setAppId("209498726107")
                .setOrigin(window.location.origin)
                .setCallback((data) => {
                    if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                        const selectedItem = data[window.google.picker.Response.DOCUMENTS][0];
                        
                        // Verify it's actually a folder (users can navigate into folders to see contents)
                        if (selectedItem.mimeType === 'application/vnd.google-apps.folder') {
                            resolve({
                                id: selectedItem.id,
                                name: selectedItem.name,
                                url: selectedItem.url
                            });
                        } else {
                            reject(new Error('Please select a folder, not a file.'));
                        }
                    } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
                        reject(new Error('User cancelled folder selection'));
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (error) {
            reject(new Error(`Failed to create picker: ${error.message}`));
        }
    });
};

/**
 * Retrieve file from Monday.com using asset ID
 * Uses proxy server to bypass CORS restrictions
 */
export const getFileFromMonday = async (assetId) => {
    try {
        // Use proxy server to download file (bypasses CORS)
        const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:8080';
        const response = await fetch(`${proxyUrl}/api/download-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assetId })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to download file: ${response.status} ${response.statusText}`);
        }

        // Get filename from Content-Disposition header or use asset ID
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `asset-${assetId}`;
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
            if (fileNameMatch) {
                fileName = fileNameMatch[1];
            }
        }

        const blob = await response.blob();
        
        // Store the filename in the blob for later use
        blob.filename = fileName;
        
        return blob;
    } catch (error) {
        console.error('Error fetching file from Monday.com:', error);
        
        // Provide helpful error message if proxy is not running
        if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
            throw new Error('Backend proxy server is not running. Please start it from the backend folder with: cd backend && npm run proxy');
        }
        
        throw error;
    }
};

/**
 * Upload file to Google Drive
 */
export const uploadFileToDrive = async (fileBlob, fileName, folderId, onProgress) => {
    try {
        const token = window.gapi.client.getToken();
        if (!token?.access_token) {
            throw new Error('User not authenticated');
        }

        // Create file metadata
        const metadata = {
            name: fileName,
            parents: folderId ? [folderId] : []
        };

        // Convert blob to File object for upload
        const file = new File([fileBlob], fileName, { type: fileBlob.type });

        // Create FormData for multipart upload
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        // Upload file with progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            id: response.id,
                            name: response.name,
                            webViewLink: response.webViewLink,
                            webContentLink: response.webContentLink
                        });
                    } catch (parseError) {
                        console.error('Error parsing upload response:', parseError);
                        reject(new Error('Failed to parse upload response'));
                    }
                } else {
                    let errorMessage = `Upload failed: ${xhr.statusText}`;
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.error?.message || errorMessage;
                    } catch (e) {
                        // Ignore parse error, use default message
                    }
                    reject(new Error(errorMessage));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink');
            xhr.setRequestHeader('Authorization', `Bearer ${token.access_token}`);
            xhr.send(form);
        });
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
};

/**
 * Complete workflow: Upload File to selected folder
 * Note: Folder selection should be handled separately before calling this function
 */
export const pushFileToGoogleDrive = async (assetId, fileName, folderId, onProgress) => {
    try {
        // Step 1: Initialize Google API
        await initializeGoogleAPI();

        // Step 2: Authenticate if not already authenticated
        if (!isAuthenticated()) {
            await authenticateGoogle();
        }

        // Step 3: Get file from Monday.com
        const fileBlob = await getFileFromMonday(assetId);

        // Step 4: Upload to Google Drive (use filename from blob if available)
        const finalFileName = fileName || fileBlob.filename || 'file';
        const uploadResult = await uploadFileToDrive(
            fileBlob,
            finalFileName,
            folderId,
            onProgress
        );

        return {
            success: true,
            file: uploadResult
        };
    } catch (error) {
        console.error('Error in pushFileToGoogleDrive:', error);
        throw error;
    }
};

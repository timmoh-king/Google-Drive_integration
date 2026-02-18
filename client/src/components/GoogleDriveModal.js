import React, { useState, useEffect } from 'react';
import {
    loadGoogleAPIs,
    initializeGoogleAPI,
    authenticateGoogle,
    isAuthenticated,
    signOut,
    showFolderPicker,
    pushFileToGoogleDrive
} from '../services/googleDrive.js';

const GoogleDriveModal = ({ isOpen, onClose, assetId, fileName }) => {
    const [step, setStep] = useState('loading'); // loading, auth, folder, upload, success, error
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);

    useEffect(() => {
        if (isOpen && assetId) {
            initializeModal();
        } else {
            resetModal();
        }
    }, [isOpen, assetId]);

    const initializeModal = async () => {
        try {
            setStep('loading');
            setError(null);
            
            // Load Google APIs
            await loadGoogleAPIs();
            await initializeGoogleAPI();

            // Check if already authenticated
            const authStatus = isAuthenticated();
            setIsUserAuthenticated(authStatus);

            if (authStatus) {
                setStep('folder');
            } else {
                setStep('auth');
            }
        } catch (err) {
            console.error('Error initializing modal:', err);
            setError(err.message || 'Failed to initialize Google Drive');
            setStep('error');
        }
    };

    const resetModal = () => {
        setStep('loading');
        setIsUserAuthenticated(false);
        setSelectedFolder(null);
        setUploadProgress(0);
        setError(null);
        setUploadResult(null);
    };

    const handleAuthenticate = async () => {
        try {
            setStep('loading');
            await authenticateGoogle();
            setIsUserAuthenticated(true);
            setStep('folder');
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message || 'Authentication failed');
            setStep('error');
        }
    };

    const handleSelectFolder = async () => {
        try {
            setStep('loading');
            const folder = await showFolderPicker();
            setSelectedFolder(folder);
            setStep('upload');
            
            // Automatically start upload after folder selection
            await handleUpload(folder);
        } catch (err) {
            if (err.message === 'User cancelled folder selection') {
                setStep('folder');
            } else {
                console.error('Folder selection error:', err);
                setError(err.message || 'Failed to select folder');
                setStep('error');
            }
        }
    };

    const handleUpload = async (folder = selectedFolder) => {
        if (!folder || !assetId || !folder.id) {
            setError('Missing folder or file information');
            setStep('error');
            return;
        }

        try {
            setStep('upload');
            setUploadProgress(0);

            const result = await pushFileToGoogleDrive(
                assetId,
                fileName || 'file',
                folder.id, // Pass folder ID to upload function
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            setUploadResult({ ...result, folder: folder });
            setStep('success');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
            setStep('error');
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleSignOut = () => {
        signOut();
        setIsUserAuthenticated(false);
        setStep('auth');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

            {/* Modal */}
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Push to Google Drive
                            </h3>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="mt-4">
                            {step === 'loading' && (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="mt-4 text-sm text-gray-600">Loading...</p>
                                </div>
                            )}

                            {step === 'auth' && (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Connect to Google Drive
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Please authenticate with Google to continue
                                    </p>
                                    <button
                                        onClick={handleAuthenticate}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Sign in with Google
                                    </button>
                                </div>
                            )}

                            {step === 'folder' && (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Select Destination Folder
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Choose a folder in your Google Drive where the file will be uploaded
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={handleSelectFolder}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Choose Folder
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'upload' && (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Uploading File
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {selectedFolder && `Uploading to: ${selectedFolder.name}`}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
                                </div>
                            )}

                            {step === 'success' && uploadResult && (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Upload Successful!
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        File has been uploaded to Google Drive
                                    </p>
                                    {uploadResult.file?.webViewLink && (
                                        <a
                                            href={uploadResult.file.webViewLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-4"
                                        >
                                            Open in Google Drive
                                        </a>
                                    )}
                                    <div className="mt-4">
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'error' && (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Error
                                    </h4>
                                    <p className="text-sm text-red-600 mb-6">
                                        {error || 'An error occurred'}
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                if (isUserAuthenticated) {
                                                    setStep('folder');
                                                } else {
                                                    setStep('auth');
                                                }
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleDriveModal;

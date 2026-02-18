import React, { useState, useMemo, useEffect } from 'react';
import { updateListItem, deleteListItem } from '../stores/listItem.js';
import { fieldKeyMappingReadable } from '../helpers/constants.js';
import { 
    getColumnValueByTitle,
    getColumnTypeByTitle,
    getItemDisplayFields,
    getFileAssetIds
} from '../helpers/translate.js';
import Swal from 'sweetalert2';
import GoogleDriveModal from './GoogleDriveModal.js';
import '../index.css';

const ItemCard = ({ item, boardId, onItemUpdate }) => {
    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [status, setStatus] = useState('');
    const [showDriveModal, setShowDriveModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const statusOptions = [
        { label: 'Working on it', value: 'Working on it', color: '#FDAB3D' },
        { label: 'Done', value: 'Done', color: '#00C875' },
        { label: 'Stuck', value: 'Stuck', color: '#E44258' }
    ];

    // Get display fields using translate helper - memoized based on item
    const displayFields = useMemo(() => {
        if (!item) return [];
        return getItemDisplayFields(item);
    }, [item]);

    // Initialize status when item loads
    useEffect(() => {
        if (item) {
            const statusValue = getColumnValueByTitle(item, fieldKeyMappingReadable.status);
            setStatus(statusValue);
        }
    }, [item]);

    const getStatusColor = (statusValue) => {
        const statusOption = statusOptions.find(opt => opt.value === statusValue);
        return statusOption?.color || '#E0E0E0';
    };

    const handleFieldClick = (fieldKey) => {
        const field = displayFields.find(f => f.key === fieldKey);
        if (field) {
            setEditingField(fieldKey);
            setEditValues({ ...editValues, [fieldKey]: field.value });
        }
    };

    const handleFieldChange = (fieldKey, value) => {
        setEditValues({ ...editValues, [fieldKey]: value });
    };

    const handleFieldBlur = async (fieldKey) => {
        if (editingField === fieldKey && editValues[fieldKey] !== undefined) {
            const newValue = editValues[fieldKey];
            const field = displayFields.find(f => f.key === fieldKey);
            const currentValue = field?.value || '';
            
            if (newValue !== currentValue) {
                await saveField(fieldKey, newValue);
            }
        }
        setEditingField(null);
    };

    const handleFieldKeyPress = (e, fieldKey) => {
        if (e.key === 'Enter') {
            handleFieldBlur(fieldKey);
        } else if (e.key === 'Escape') {
            setEditingField(null);
            const field = displayFields.find(f => f.key === fieldKey);
            setEditValues({ ...editValues, [fieldKey]: field?.value || '' });
        }
    };

    const saveField = async (fieldKey, value) => {
        if (!item || !boardId) return;

        try {
            const field = displayFields.find(f => f.key === fieldKey);
            if (!field || !field.columnId) return;

            // Get column type using translate helper
            const columnType = getColumnTypeByTitle(item, field.columnTitle);

            const colValues = {
                [field.columnId]: {
                    type: columnType,
                    value: value
                }
            };

            await updateListItem(boardId, item.id, colValues);
            if (onItemUpdate) {
                onItemUpdate();
            }
        } catch (error) {
            console.error('Error updating field:', error);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setStatus(newStatus);
        await saveField('status', newStatus);
    };

    const handleDelete = async () => {
        if (!item) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E44258',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const success = await deleteListItem(item.id);
                if (success && onItemUpdate) {
                    onItemUpdate();
                }
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        }
    };

    if (!item) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {/* Header with Item Name and Delete Button */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {item.name}
                    </h2>
                </div>
                
                {/* Delete Button */}
                <button
                    onClick={handleDelete}
                    className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete item"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Fields */}
            {/* Status Dropdown */}
            <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="relative inline-block">
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 rounded-lg font-semibold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all appearance-none pr-10"
                            style={{ 
                                backgroundColor: getStatusColor(status),
                                minWidth: '180px'
                            }}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value} style={{ backgroundColor: option.color }}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            <div className="space-y-4">
                {displayFields.map(field => {
                    // Skip status field as it's shown separately
                    if (field.key === 'status') return null;
                    
                    const isEditing = editingField === field.key;
                    const displayValue = field.value || '—';
                    const isFileField = field.type === 'file';
                    const isDriveLinkField = field.key === 'driveLink';
                    
                    return (
                        <div key={field.key} className="border-b border-gray-100 pb-3 last:border-0">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                {field.label}
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editValues[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    onBlur={() => handleFieldBlur(field.key)}
                                    onKeyDown={(e) => handleFieldKeyPress(e, field.key)}
                                    className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    autoFocus
                                />
                            ) : (
                                <div
                                    onClick={() => !isFileField && handleFieldClick(field.key)}
                                    className={`px-3 py-2 rounded-lg ${!isFileField ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors min-h-[2.5rem] flex items-center group`}
                                >
                                    {isFileField && field.fileNames && field.fileNames.length > 0 ? (
                                        <div className="flex-1">
                                            <ul className="list-disc list-inside space-y-1">
                                                {field.fileNames.map((fileName, index) => (
                                                    <li key={index} className="text-gray-800 text-sm">
                                                        {fileName}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-gray-800 flex-1">{displayValue}</span>
                                            {!isFileField && (
                                                <svg className="w-4 h-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {/* Push to Google Drive button for Drive Link field */}
                            {isDriveLinkField && !isEditing && (() => {
                                // Get files from the Files column
                                const files = getFileAssetIds(item, fieldKeyMappingReadable.files);
                                const hasFiles = files && files.length > 0;
                                
                                return (
                                    <div className="mt-2">
                                        {hasFiles ? (
                                            <div className="space-y-2">
                                                {files.map((file, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedFile(file);
                                                            setShowDriveModal(true);
                                                        }}
                                                        className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-sm font-medium flex items-center justify-between"
                                                    >
                                                        <span>Push "{file.name}" to Google Drive</span>
                                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'No Files',
                                                        text: 'No files found in this item to upload to Google Drive.',
                                                        icon: 'info'
                                                    });
                                                }}
                                                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                                                disabled
                                            >
                                                Push to Google Drive
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>

            {/* Google Drive Modal */}
            {selectedFile && (
                <GoogleDriveModal
                    isOpen={showDriveModal}
                    onClose={() => {
                        setShowDriveModal(false);
                        setSelectedFile(null);
                    }}
                    assetId={selectedFile.assetId}
                    fileName={selectedFile.name}
                />
            )}
        </div>
    );
};

export default ItemCard;

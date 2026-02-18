import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';
import { fetchListItem } from './stores/listItem.js';
import ItemCard from './components/itemCard.js';
import getItemId from './stores/dynamicBoard.js';
import Swal from 'sweetalert2';

function App() {
  // Option 1: Get itemId from environment variable (for development)
  // Comment this line when deploying to production
  // const envItemId = process.env.REACT_APP_ITEM_ID;
  
  const boardId = process.env.REACT_APP_BOARD_ID;
  const [itemId, setItemId] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get itemId from env or context
  useEffect(() => {
    const fetchItemId = async () => {
      setLoading(true);
      
      // Option 1: Use environment variable (development)
      // Comment out the entire if block below to use context only (production)
      const envItemId = process.env.REACT_APP_ITEM_ID;
      if (envItemId) {
        setItemId(envItemId);
        setLoading(false);
        return;
      }
      
      // Option 2: Get from Monday.com context (production)
      try {
        const contextItemId = await getItemId();
        if (contextItemId) {
          setItemId(contextItemId);
        }
      } catch (err) {
        console.error('Error getting item ID from context:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemId();
  }, []);

  const loadItem = useCallback(async () => {
    if (!itemId) {
      return;
    }

    try {
      const fetchedItem = await fetchListItem(itemId);
      
      if (fetchedItem) {
        setItem(fetchedItem);
      }
    } catch (err) {
      console.error('Error loading item:', err);
    }
  }, [itemId]);

  useEffect(() => {
    if (itemId && !loading) {
      loadItem();
    }
  }, [itemId, loadItem, loading]);

  const handleItemUpdate = () => {
    // Reload item after update or delete
    loadItem();
  };

  if (loading) {
    return (
      <div className="App min-h-screen bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!itemId) {
    Swal.fire({
      title: 'Error',
      text: 'Item ID not found. Please set REACT_APP_ITEM_ID in your .env file or ensure you\'re running in Monday.com context.',
      icon: 'error',
    })
    return null;
  }

  return (
    <div className="App min-h-screen bg-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <ItemCard 
          item={item} 
          boardId={boardId}
          onItemUpdate={handleItemUpdate}
        />
      </div>
    </div>
  );
}

export default App;

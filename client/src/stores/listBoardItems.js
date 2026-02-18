import mondaySdk from "monday-sdk-js";
import Swal from "sweetalert2";
import { createQuery, updateQuery, deleteQuery } from "../helpers/queries.js";

const monday = mondaySdk({
    apiVersion: "2023-10",
});

// Comment this line when deploying to monday
monday.setToken(process.env.REACT_APP_MONDAY_USER_API_KEY);

// Simple formatter for list items
const formatListItems = (items) => {
    if (!items || !Array.isArray(items)) {
        return [];
    }
    return items.map(item => ({
        id: item.id,
        name: item.name,
        column_values: item.column_values || []
    }));
};

export const fetchListItems = async (boardId) => {
    const query = `query { boards(ids: ${boardId}) { items_page(limit: 500) { items { id name column_values { id text column { id title }
          ... on PeopleValue { persons_and_teams { id
          ... on FileValue { files { ... on FileAssetValue { asset_id } } }
        } } } } }`;

    try {
        const res = await monday.api(query);

        if (res?.status_code === 403) {
            return [];
        } else if (res?.error_code !== undefined && res?.error_code !== "ComplexityException") {
            await Swal.fire({
                title: 'Error',
                text: 'List items could not be fetched.',
                icon: 'error'
            });
            return [];
        } else {
            const formattedItems = formatListItems(res.data?.boards[0]?.items_page?.items);
            return formattedItems;
        }
    } catch (error) {
        if (error.status_code === 403) {
            return [];
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'List items could not be fetched.',
                icon: 'error'
            });
            return [];
        }
    }
};

export const createListItem = async (boardId, itemName, colValues) => {
    try {
        const query = createQuery(boardId, itemName, colValues);
        
        const response = await monday.api(query);

        if (response?.error_code) {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be created.',
                icon: 'error'
            });
            return null;
        }

        const newItem = response?.data?.create_item;

        await Swal.fire({
            title: 'Success',
            text: 'List item created successfully.',
            icon: 'success',
            timer: 2000
        });

        return newItem;
    } catch (error) {
        if (error.status_code === 403) {
            return null;
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be created.',
                icon: 'error'
            });
            return null;
        }
    }
};

export const updateListItem = async (boardId, itemId, colValues) => {
    try {
        const query = updateQuery(boardId, itemId, colValues);
        
        const response = await monday.api(query);

        if (response?.error_code) {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be updated.',
                icon: 'error'
            });
            return null;
        }

        const updatedItem = response?.data?.change_multiple_column_values;

        await Swal.fire({
            title: 'Success',
            text: 'List item updated successfully.',
            icon: 'success',
            timer: 2000
        });

        return updatedItem;
    } catch (error) {
        if (error.status_code === 403) {
            return null;
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be updated.',
                icon: 'error'
            });
            return null;
        }
    }
};

export const deleteListItem = async (itemId) => {
    try {
        const query = deleteQuery(itemId);
        
        const response = await monday.api(query);

        if (response?.error_code) {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be deleted.',
                icon: 'error'
            });
            return false;
        }

        await Swal.fire({
            title: 'Success',
            text: 'List item deleted successfully.',
            icon: 'success',
            timer: 2000
        });

        return true;
    } catch (error) {
        if (error.status_code === 403) {
            return false;
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'List item could not be deleted.',
                icon: 'error'
            });
            return false;
        }
    }
};
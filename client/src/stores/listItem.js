import mondaySdk from "monday-sdk-js";
import Swal from "sweetalert2";
import { updateQuery, deleteQuery } from "../helpers/queries.js";

const monday = mondaySdk({
    apiVersion: "2023-10",
});

// Comment this line when deploying to monday
monday.setToken(process.env.REACT_APP_MONDAY_USER_API_KEY);

// Simple formatter for a single item
const formatListItem = (item) => {
    if (!item) {
        return null;
    }
    return {
        id: item.id,
        name: item.name,
        column_values: item.column_values || []
    };
};

export const fetchListItem = async (itemId) => {
    const query = `query { items(ids: ${itemId}) { id name column_values { id text column { id title }
      ... on PeopleValue { persons_and_teams { id kind } }
      ... on FileValue { files { ... on FileAssetValue { asset_id name } } } } } }`;

    try {
        const res = await monday.api(query);

        if (res?.status_code === 403) {
            return null;
        } else if (res?.error_code !== undefined && res?.error_code !== "ComplexityException") {
            await Swal.fire({
                title: 'Error',
                text: 'Item could not be fetched.',
                icon: 'error'
            });
            return null;
        } else {
            const item = res.data?.items?.[0];
            const formattedItem = formatListItem(item);
            return formattedItem;
        }
    } catch (error) {
        if (error.status_code === 403) {
            return null;
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'Item could not be fetched.',
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
                text: 'Item could not be updated.',
                icon: 'error'
            });
            return null;
        }

        const updatedItem = response?.data?.change_multiple_column_values;

        await Swal.fire({
            title: 'Success',
            text: 'Item updated successfully.',
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
                text: 'Item could not be updated.',
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
                text: 'Item could not be deleted.',
                icon: 'error'
            });
            return false;
        }

        await Swal.fire({
            title: 'Success',
            text: 'Item deleted successfully.',
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
                text: 'Item could not be deleted.',
                icon: 'error'
            });
            return false;
        }
    }
};

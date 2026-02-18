import mondaySdk from "monday-sdk-js";
import Swal from "sweetalert2";

const monday = mondaySdk({
    apiVersion: "2023-10"
});

// Comment this line when deploying to monday
monday.setToken(process.env.REACT_APP_MONDAY_USER_API_KEY);

export const fetchAccountUsers = async () => {
    const query = `query { users (limit: 500) { id name email } }`;

    try {
        const response = await monday.api(query);
        return response?.data?.users || [];
    } catch (error) {
        if (error.status_code === 403) {
            return [];
        } else {
            await Swal.fire({
                title: 'Error',
                text: 'Account users could not be loaded.',
                icon: 'error',
            });
            return [];
        }
    }
};

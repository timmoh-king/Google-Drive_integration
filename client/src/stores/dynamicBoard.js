import mondaySdk from "monday-sdk-js";
import Swal from "sweetalert2";

const monday = mondaySdk();

const getItemId = async () => {
    try {
        const response = await monday.get("context");
        
        // The context data is located in response.data
        const itemId = response.data?.itemId || response.data?.item?.id;

        if (!itemId) {
            await Swal.fire({
                title: 'Error',
                text: 'Item ID not found in current context.',
                icon: 'error',
            })
            return null;
        }

        return itemId;
    } catch (error) {
        console.error("Error fetching monday context:", error);
        await Swal.fire({
            title: 'Error',
            text: 'Error fetching monday context',
            icon: 'error',
        })
        return null;
    }
}

export default getItemId;

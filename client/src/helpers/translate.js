import { fieldKeyMappingReadable } from "./constants";


const replaceKeys = (originalObject, keyMappings) => {
    const replacedObject = {};

    for (const originalKey in originalObject) {
        const mappedKeyObject = keyMappings.find((item) => item.title === originalKey);
        const newKey = mappedKeyObject ? mappedKeyObject.id : originalKey;
        const type = mappedKeyObject ? mappedKeyObject.type : 'text';

        replacedObject[newKey] = {
            type: type,
            value: originalObject[originalKey]
        };
    }

    return replacedObject;
};

const checkMatches = (originalObject, keyMapper) => {
    const matches = {};

    for (const key in keyMapper) {
        const mapperKey = keyMapper[key];

        if (originalObject[key] !== undefined) {
            matches[mapperKey] = originalObject[key];
        }
    }

    return matches;
};

const itemsFormatted = (events) => {
    const formattedEvents = [];

    events.forEach((event) => {
        console.log("event", event);
        const clientName = event.column_values.find((col) => col.column.title === 'Name').text;
        const person = event.column_values.find((col) => col.column.title === fieldKeyMappingReadable.person)?.persons_and_teams?.[0]?.id || null;
        const acronym = person.value.find((val) => val.column.title === 'Acronym').text;
        const notes = person.value.find((val) => val.column.title === 'Notes').text;
        const driveLink = event.column_values.find((col) => col.column.title === 'Drive Link').text;
        const status = event.column_values.find((col) => col.column.title === 'Status').text;
        const date = event.column_values.find((col) => col.column.title === 'Date').text;
        const fileUrl = event.column_values.find((col) => col.column.title === 'Files').files[0].name;
        const fileId = event.column_values.find((col) => col.column.title === 'Files').files[0].asset_id;

        formattedEvents.push({
            id: event.id,
            clientName: clientName.value,
            person: person.value,
            acronym: acronym.value,
            notes: notes.value,
            driveLink: driveLink.value,
            status: status.value,
            date: date.value,
            files: fileUrl.value,
            fileId: fileId.value,
        });
    });
    return formattedEvents;
}

const formatColumnValuesToQuery = (colValues) => {
    return Object.entries(colValues)
        .filter(([key, colVal]) => colVal !== null)
        .map(([key, colVal]) => {
            // Check for board relationship,hour && boolean types, format them accordingly
            // Note: Quotes are escaped for GraphQL query string embedding
            if (colVal.type === 'board_relation') {
                return `\\"${key}\\":{\\"linkedPulseIds\\":[{\\"linkedPulseId\\":${colVal.value}}]}`;
            } else if (colVal.type === 'hour') {
                const [hours, minutes] = colVal.value.split(':');
                const formattedHours = parseInt(hours, 10);
                const formattedMinutes = parseInt(minutes, 10);

                if (!isNaN(formattedHours) && !isNaN(formattedMinutes)) {
                   return `\\"${key}\\":{\\"hour\\":${formattedHours},\\"minute\\":${formattedMinutes}}`;
                }

                return '';
            } else if (colVal.type === 'checkbox') {
                const booleanValue = colVal.value ? 'true' : 'false';
                return colVal.value ? `\\"${key}\\":{\\"checked\\":\\"${booleanValue}\\"}` : `\\"${key}\\" : null`;
            } else if (colVal.type === 'status') {
                return colVal.value ? `\\"${key}\\" : {\\"label\\" : \\"${colVal.value}\\"}` : '';
            } else if (colVal.type === 'people') {
                return colVal.value ? `\\"${key}\\" : {\\"personsAndTeams\\":[{\\"id\\":\\"${colVal.value}\\",\\"kind\\":\\"person\\"}]}` : '';
            } else if (colVal.type === 'email') {
                return `\\"${key}\\": {\\"email\\": \\"${colVal.value}\\", \\"text\\": \\"${colVal.value}\\"}`;
            } else if (colVal.type === 'timeline') {
                return `\\"${key}\\": {\\"from\\": \\"${colVal.value.from}\\", \\"to\\": \\"${colVal.value.to}\\"}`;
            } else {
                return `\\"${key}\\": \\"${colVal.value}\\"`;
            }
        })
        .filter(str => str !== '')  // Filter out empty strings
        .join(', ');
}


// Helper function to get file names from a file column
const getFileNames = (item, columnTitle) => {
    if (!item?.column_values) return [];
    const column = item.column_values.find(col => col.column?.title === columnTitle);
    if (!column?.files || !Array.isArray(column.files)) return [];
    return column.files.map(file => file.name).filter(name => name);
};

// Helper function to get file asset IDs from a file column
const getFileAssetIds = (item, columnTitle) => {
    if (!item?.column_values) return [];
    const column = item.column_values.find(col => col.column?.title === columnTitle);
    if (!column?.files || !Array.isArray(column.files)) return [];
    const fileAssetIds = column.files.map(file => ({
        assetId: file.asset_id,
        name: file.name
    })).filter(file => file.assetId);
    return fileAssetIds;
};

// Helper function to get column value by title from item
const getColumnValueByTitle = (item, columnTitle) => {
    if (!item?.column_values) return '';
    const column = item.column_values.find(col => col.column?.title === columnTitle);
    
    // Special handling for file columns - return file names
    if (column?.files && Array.isArray(column.files)) {
        const fileNames = column.files.map(file => file.name).filter(name => name);
        return fileNames.length > 0 ? fileNames.join(', ') : '';
    }
    
    return column?.text || '';
};

// Helper function to get column ID by title from item
const getColumnIdByTitle = (item, columnTitle) => {
    if (!item?.column_values) return null;
    const column = item.column_values.find(col => col.column?.title === columnTitle);
    return column?.id || null;
};

// Helper function to get column type by title (infer from column structure)
const getColumnTypeByTitle = (item, columnTitle) => {
    if (!item?.column_values) return 'text';
    const column = item.column_values.find(col => col.column?.title === columnTitle);
    if (!column) return 'text';
    
    // Check for PeopleValue
    if (column.persons_and_teams) return 'people';
    // Check for FileValue
    if (column.files) return 'file';
    // Check for status based on fieldKeyMappingReadable
    if (columnTitle === fieldKeyMappingReadable.status) return 'status';
    if (columnTitle === fieldKeyMappingReadable.date) return 'date';
    if (columnTitle === fieldKeyMappingReadable.person) return 'people';
    if (columnTitle === fieldKeyMappingReadable.files) return 'file';
    
    return 'text';
};

// Get all displayable fields for an item using fieldKeyMappingReadable
const getItemDisplayFields = (item) => {
    if (!item?.column_values) return [];
    
    return Object.entries(fieldKeyMappingReadable)
        .map(([key, columnTitle]) => {
            const columnValue = getColumnValueByTitle(item, columnTitle);
            const columnId = getColumnIdByTitle(item, columnTitle);
            const columnType = getColumnTypeByTitle(item, columnTitle);
            
            // Get file names for file columns
            const fileNames = columnType === 'file' ? getFileNames(item, columnTitle) : null;
            
            return {
                key: key,
                columnTitle: columnTitle,
                columnId: columnId,
                label: columnTitle,
                value: columnValue,
                type: columnType,
                fileNames: fileNames // Array of file names for file columns
            };
        })
        .filter(field => field.columnId !== null); // Only include fields that exist
};

export { 
    checkMatches, 
    replaceKeys, 
    itemsFormatted, 
    formatColumnValuesToQuery,
    getColumnValueByTitle,
    getColumnIdByTitle,
    getColumnTypeByTitle,
    getItemDisplayFields,
    getFileNames,
    getFileAssetIds
};
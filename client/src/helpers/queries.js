import {formatColumnValuesToQuery} from "./translate.js";

const createQuery = (boardID, itemName, colValues) => {
    // Constructing column values string
    const columnValuesString = formatColumnValuesToQuery(colValues);

    const mutationQuery = `mutation {
          create_item (
            board_id: ${boardID},
            group_id: "topics",
            item_name: "${itemName}",
            column_values: "{${columnValuesString}}"
          ) {
            id
          }
        }`;

    return mutationQuery;
}

const updateQuery = (boardId, itemId, colValues) => {
    // Constructing column values string
    const columnValuesString = formatColumnValuesToQuery(colValues);

    const mutationQuery = `
        mutation {
          change_multiple_column_values (
            board_id: ${boardId},
            item_id: ${itemId},
            column_values: "{${columnValuesString}}"
          ) {
            id
          }
        }
      `;

    return mutationQuery;
}

const deleteQuery = (itemId) => {
  const mutationQuery = `
      mutation {
        delete_item (
          item_id: ${itemId}
        ) {
          id
        }
      }
  `;

  return mutationQuery;
}

const statusUpdateQuery = (boardId, itemId, value) => {
    let columnValueString = '';

    if (value === 'Done') {
        columnValueString = `{\\"status\\" : {\\"label\\" : \\"Done\\"}}`
    } else if (value === 'Working on it') {
        columnValueString = `{\\"status\\" : {\\"label\\" : \\"Working on it\\"}}`
    } else if (value === 'Stuck') {
        columnValueString = `{\\"status\\" : {\\"label\\" : \\"Stuck\\"}}`
    }

    const mutationQuery = `
        mutation {
          change_multiple_column_values (
            board_id: ${boardId},
            item_id: ${itemId},
            column_values: "${columnValueString}"
          ) {
            id
          }
        }
      `;

    return mutationQuery;
}

export { createQuery, updateQuery, deleteQuery, statusUpdateQuery }
import { google } from 'googleapis';
import { initializeGoogleSheetsAuth, getSpreadsheetId } from '../config/credentials.js';
import { rowsToClients, clientToRow, rowToClient, rowsToWorkouts, workoutToRows, rowToWorkoutSet, workoutSetToRow } from '../utils/transform.js';
import { randomUUID } from 'crypto';

/**
 * Google Sheets API Client
 * 
 * This module provides functions to interact with Google Sheets for the Warbak Trainer app.
 * 
 * Sheet Structure:
 * 
 * **Clients Sheet:**
 * - Columns: clientId, name, email, phone, notes, createdAt
 * - Each row represents one client
 * 
 * **Workouts Sheet:**
 * - Columns: workoutId, clientId, date, exerciseName, setNumber, reps, weight, volume, notes, createdAt
 * - Each row represents one set of one exercise in one workout session
 * - Multiple rows share the same workoutId to represent a complete workout session
 * - volume = reps × weight (calculated per set)
 */

let sheetsClient = null;
let authClient = null;

/**
 * Reset cached client (for testing purposes)
 * 
 * @internal
 */
export function resetSheetsClient() {
  sheetsClient = null;
  authClient = null;
}

/**
 * Initialize Google Sheets API client
 * 
 * @returns {Promise<google.sheets_v4.Sheets>} Initialized Sheets API client
 * @throws {Error} If authentication fails
 */
export async function initializeSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    authClient = await initializeGoogleSheetsAuth();
    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    
    // Test connection by getting spreadsheet info
    const spreadsheetId = getSpreadsheetId();
    await sheetsClient.spreadsheets.get({ spreadsheetId });
    
    return sheetsClient;
  } catch (error) {
    throw new Error(`Failed to initialize Google Sheets client: ${error.message}`);
  }
}

/**
 * Get spreadsheet by ID
 * 
 * @param {string} spreadsheetId - The spreadsheet ID (optional, uses env var if not provided)
 * @returns {Promise<Object>} Spreadsheet metadata
 * @throws {Error} If spreadsheet cannot be accessed
 */
export async function getSpreadsheet(spreadsheetId = null) {
  const client = await initializeSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  
  try {
    const response = await client.spreadsheets.get({
      spreadsheetId: id,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get spreadsheet ${id}: ${error.message}`);
  }
}

/**
 * Get list of available sheet names in the spreadsheet
 * 
 * @returns {Promise<Array<string>>} Array of sheet names
 */
export async function getAvailableSheets() {
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const response = await client.spreadsheets.get({
      spreadsheetId,
    });
    
    return response.data.sheets.map(sheet => sheet.properties.title);
  } catch (error) {
    throw new Error(`Failed to get available sheets: ${error.message}`);
  }
}

/**
 * Ensure a sheet exists, creating it if it doesn't
 * 
 * @param {string} sheetName - Name of the sheet to ensure exists
 * @returns {Promise<void>}
 */
export async function ensureSheetExists(sheetName) {
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const availableSheets = await getAvailableSheets();
  
  // If sheet already exists, nothing to do
  if (availableSheets.includes(sheetName)) {
    return;
  }
  
  // Create the sheet
  try {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
    console.log(`Created sheet: ${sheetName}`);
  } catch (error) {
    throw new Error(`Failed to create sheet "${sheetName}": ${error.message}`);
  }
}

/**
 * Ensure headers exist in a sheet, adding them if missing
 * 
 * @param {string} sheetName - Name of the sheet
 * @param {Array<string>} headers - Array of header column names
 * @returns {Promise<void>}
 */
export async function ensureHeadersExist(sheetName, headers) {
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    // Get first row to check if headers exist
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });
    
    const firstRow = response.data.values?.[0] || [];
    
    // Check if headers match (case-insensitive comparison)
    const headersMatch = headers.length === firstRow.length &&
      headers.every((header, index) => 
        header.toLowerCase() === (firstRow[index] || '').toString().toLowerCase()
      );
    
    // If headers exist and match, nothing to do
    if (headersMatch) {
      return;
    }
    
    // If first row exists but doesn't match, or sheet is empty, update/insert headers
    // Calculate column range (A to last column letter, e.g., A1:F1 for 6 headers)
    // A=65, B=66, ..., F=70 for 6 columns (indices 0-5)
    const lastColIndex = headers.length - 1;
    const lastCol = String.fromCharCode(65 + lastColIndex); // A=65
    const range = `${sheetName}!A1:${lastCol}1`;
    
    if (firstRow.length > 0 && !headersMatch) {
      // Update existing first row with correct headers
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers],
        },
      });
      console.log(`Updated headers in sheet: ${sheetName}`);
    } else {
      // Insert headers as first row
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers],
        },
      });
      console.log(`Added headers to sheet: ${sheetName}`);
    }
  } catch (error) {
    // If error is about range not found, the sheet might be empty - try inserting headers
    if (error.message.includes('Unable to parse') || error.code === 400) {
      try {
        // Calculate proper column range for headers
        const lastColIndex = headers.length - 1;
        const lastCol = String.fromCharCode(65 + lastColIndex);
        const range = `${sheetName}!A1:${lastCol}1`;
        
        await client.spreadsheets.values.update({
          spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [headers],
          },
        });
        console.log(`Added headers to empty sheet: ${sheetName}`);
      } catch (insertError) {
        throw new Error(`Failed to add headers to sheet "${sheetName}": ${insertError.message}`);
      }
    } else {
      throw new Error(`Failed to check headers in sheet "${sheetName}": ${error.message}`);
    }
  }
}

/**
 * Initialize required sheets with headers if they don't exist
 * 
 * @returns {Promise<void>}
 */
export async function initializeSheets() {
  // Ensure Clients sheet exists
  await ensureSheetExists('Clients');
  await ensureHeadersExist('Clients', [
    'clientId',
    'name',
    'email',
    'phone',
    'notes',
    'createdAt'
  ]);
  
  // Ensure Workouts sheet exists
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', [
    'workoutId',
    'clientId',
    'date',
    'exerciseName',
    'setNumber',
    'reps',
    'weight',
    'volume',
    'notes',
    'createdAt'
  ]);
}

/**
 * Get all rows from a sheet
 * 
 * @param {string} sheetName - Name of the sheet (e.g., "Clients", "Workouts")
 * @param {string} range - Optional range (defaults to entire sheet)
 * @returns {Promise<Array<Array>>} Array of rows, where each row is an array of cell values
 */
export async function getSheetData(sheetName, range = null) {
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const rangeString = range || `${sheetName}!A:Z`;
  
  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: rangeString,
    });
    
    return response.data.values || [];
  } catch (error) {
    // Check if error is about sheet not existing
    if (error.message.includes('Unable to parse range') || error.message.includes('Unable to parse')) {
      try {
        const availableSheets = await getAvailableSheets();
        throw new Error(
          `Sheet "${sheetName}" not found. Available sheets: ${availableSheets.join(', ') || 'none'}. ` +
          `Please create a sheet tab named "${sheetName}" in your Google Sheet.`
        );
      } catch (listError) {
        // If we can't list sheets, throw original error with context
        throw new Error(
          `Failed to get data from sheet "${sheetName}": ${error.message}. ` +
          `The sheet tab "${sheetName}" may not exist. Please ensure it exists in your Google Sheet.`
        );
      }
    }
    throw new Error(`Failed to get data from sheet ${sheetName}: ${error.message}`);
  }
}

/**
 * Append a row to a sheet
 * 
 * @param {string} sheetName - Name of the sheet
 * @param {Array} rowData - Array of cell values for the new row
 * @returns {Promise<Object>} Append response
 */
export async function appendRow(sheetName, rowData) {
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const response = await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    });
    
    return response.data;
  } catch (error) {
    // Check if error is about sheet not existing
    if (error.message.includes('Unable to parse range') || error.message.includes('Unable to parse')) {
      try {
        const availableSheets = await getAvailableSheets();
        throw new Error(
          `Sheet "${sheetName}" not found. Available sheets: ${availableSheets.join(', ') || 'none'}. ` +
          `Please create a sheet tab named "${sheetName}" in your Google Sheet.`
        );
      } catch (listError) {
        throw new Error(
          `Failed to append row to sheet "${sheetName}": ${error.message}. ` +
          `The sheet tab "${sheetName}" may not exist. Please ensure it exists in your Google Sheet.`
        );
      }
    }
    throw new Error(`Failed to append row to sheet ${sheetName}: ${error.message}`);
  }
}

/**
 * Get all clients from the Clients sheet
 * 
 * @returns {Promise<Array<Object>>} Array of client objects
 */
export async function getAllClients() {
  // Ensure sheet exists with headers before accessing
  await ensureSheetExists('Clients');
  await ensureHeadersExist('Clients', ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt']);
  
  const rows = await getSheetData('Clients');
  return rowsToClients(rows);
}

/**
 * Create a new client in the Clients sheet
 * 
 * @param {Object} clientData - Client data (name, email, phone, notes)
 * @returns {Promise<Object>} Created client object with generated clientId and createdAt
 */
export async function createClient(clientData) {
  // Ensure sheet exists with headers before creating
  await ensureSheetExists('Clients');
  await ensureHeadersExist('Clients', ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt']);
  
  const clientId = `client-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  
  const client = {
    clientId,
    name: clientData.name || '',
    email: clientData.email || '',
    phone: clientData.phone || '',
    notes: clientData.notes || '',
    createdAt,
  };
  
  const row = clientToRow(client);
  await appendRow('Clients', row);
  
  return client;
}

/**
 * Get all workouts for a specific client
 * 
 * @param {string} clientId - Client ID to filter workouts
 * @returns {Promise<Array<Object>>} Array of workout objects for the client
 */
export async function getWorkoutsByClientId(clientId) {
  // Ensure sheet exists with headers before accessing
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', ['workoutId', 'clientId', 'date', 'exerciseName', 'setNumber', 'reps', 'weight', 'volume', 'notes', 'createdAt']);
  
  const rows = await getSheetData('Workouts');
  const allWorkouts = rowsToWorkouts(rows);
  
  // Filter by clientId
  return allWorkouts.filter(workout => workout.clientId === clientId);
}

/**
 * Create a new workout in the Workouts sheet
 * 
 * @param {Object} workoutData - Workout data (clientId, date, exercises, notes)
 * @returns {Promise<Object>} Created workout object with generated workoutId and createdAt
 */
export async function createWorkout(workoutData) {
  // Ensure sheet exists with headers before creating
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', ['workoutId', 'clientId', 'date', 'exerciseName', 'setNumber', 'reps', 'weight', 'volume', 'notes', 'createdAt']);
  
  const workoutId = `workout-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  
  const workout = {
    workoutId,
    clientId: workoutData.clientId,
    date: workoutData.date || new Date().toISOString().split('T')[0],
    exercises: workoutData.exercises || [],
    notes: workoutData.notes || '',
    createdAt,
  };
  
  // Convert workout to multiple rows (one per set)
  const rows = workoutToRows(workout);
  
  // Append all rows for this workout
  if (rows.length > 0) {
    // Use batch append for better performance
    const client = await initializeSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    await client.spreadsheets.values.append({
      spreadsheetId,
      range: 'Workouts!A:J',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: rows,
      },
    });
  }
  
  return workout;
}

/**
 * Update an existing workout in the Workouts sheet
 * 
 * @param {string} workoutId - Workout ID to update
 * @param {Object} workoutData - Updated workout data (clientId, date, exercises, notes)
 * @returns {Promise<Object>} Updated workout object
 * @throws {Error} If workout not found or update fails
 */
export async function updateWorkout(workoutId, workoutData) {
  // Ensure sheet exists with headers before updating
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', ['workoutId', 'clientId', 'date', 'exerciseName', 'setNumber', 'reps', 'weight', 'volume', 'notes', 'createdAt']);
  
  // Get all rows to find the workout sets
  const rows = await getSheetData('Workouts');
  
  // Find all row indices that match the workoutId (need to delete in reverse order to maintain indices)
  const workoutRowIndices = [];
  rows.forEach((row, index) => {
    // Skip header row (index 0)
    if (index === 0) return;
    // Skip empty rows or rows without a workoutId
    if (!row || row.length === 0 || !row[0]) return;
    if (row[0] === workoutId) {
      workoutRowIndices.push(index);
    }
  });
  
  if (workoutRowIndices.length === 0) {
    // Provide helpful error message
    const availableWorkoutIds = rows
      .slice(1) // Skip header
      .map(row => row && row[0] ? row[0] : null)
      .filter((id, index, self) => id !== null && self.indexOf(id) === index); // Unique IDs
    throw new Error(
      `Workout with ID "${workoutId}" not found. ` +
      `Available workout IDs: ${availableWorkoutIds.length > 0 ? availableWorkoutIds.slice(0, 10).join(', ') : 'none'}`
    );
  }
  
  // Get existing workout to preserve workoutId and createdAt
  const firstSet = rowToWorkoutSet(rows[workoutRowIndices[0]]);
  // Reconstruct existing workout from all sets
  const existingWorkoutRows = workoutRowIndices.map(index => rows[index]);
  const existingWorkouts = rowsToWorkouts([['header'], ...existingWorkoutRows]); // Add dummy header for rowsToWorkouts
  const existingWorkout = existingWorkouts[0] || { exercises: [] };
  
  // Merge updated data with existing data (preserve workoutId and createdAt)
  const updatedWorkout = {
    workoutId: workoutId, // Preserve workoutId
    clientId: workoutData.clientId !== undefined ? workoutData.clientId : firstSet.clientId,
    date: workoutData.date !== undefined ? workoutData.date : firstSet.date,
    exercises: workoutData.exercises !== undefined ? workoutData.exercises : existingWorkout.exercises,
    notes: workoutData.notes !== undefined ? workoutData.notes : firstSet.notes,
    createdAt: firstSet.createdAt, // Preserve createdAt
  };
  
  // Convert to multiple rows (one per set)
  const updatedRows = workoutToRows(updatedWorkout);
  
  if (updatedRows.length === 0) {
    throw new Error(`Cannot update workout ${workoutId}: No exercises/sets provided`);
  }
  
  // Delete old rows and insert new ones
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    // Get the sheet ID for the Workouts sheet
    const spreadsheet = await client.spreadsheets.get({ spreadsheetId });
    const workoutsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Workouts');
    
    if (!workoutsSheet) {
      throw new Error('Workouts sheet not found');
    }
    
    const sheetId = workoutsSheet.properties.sheetId;
    
    // Delete rows in reverse order to maintain correct indices
    workoutRowIndices.reverse();
    
    const deleteRequests = workoutRowIndices.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));
    
    // Insert new rows at the position of the first deleted row
    const insertRowIndex = Math.min(...workoutRowIndices);
    
    const insertRequest = {
      insertDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: insertRowIndex,
          endIndex: insertRowIndex + updatedRows.length,
        },
      },
    };
    
    // Execute delete and insert in batch
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [...deleteRequests, insertRequest],
      },
    });
    
    // Now update the inserted rows with new data
    const lastCol = String.fromCharCode(65 + 9); // J (10 columns: A-J)
    const range = `Workouts!A${insertRowIndex + 1}:${lastCol}${insertRowIndex + updatedRows.length}`;
    
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: updatedRows,
      },
    });
    
    return updatedWorkout;
  } catch (error) {
    // Log detailed error for debugging
    console.error(`Failed to update workout ${workoutId}:`, {
      error: error.message,
      workoutRowIndices,
      spreadsheetId,
      updatedRowsLength: updatedRows.length,
    });
    throw new Error(`Failed to update workout ${workoutId}: ${error.message}`);
  }
}

/**
 * Delete an existing workout from the Workouts sheet
 * 
 * @param {string} workoutId - Workout ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If workout not found or deletion fails
 */
export async function deleteWorkout(workoutId) {
  // Ensure sheet exists with headers before deleting
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', ['workoutId', 'clientId', 'date', 'exerciseName', 'setNumber', 'reps', 'weight', 'volume', 'notes', 'createdAt']);
  
  // Get all rows to find all workout sets
  const rows = await getSheetData('Workouts');
  
  // Find all row indices that match the workoutId (need to delete in reverse order to maintain indices)
  const workoutRowIndices = [];
  rows.forEach((row, index) => {
    // Skip header row (index 0)
    if (index === 0) return;
    // Skip empty rows or rows without a workoutId
    if (!row || row.length === 0 || !row[0]) return;
    if (row[0] === workoutId) {
      workoutRowIndices.push(index);
    }
  });
  
  if (workoutRowIndices.length === 0) {
    // Provide helpful error message
    const availableWorkoutIds = rows
      .slice(1) // Skip header
      .map(row => row && row[0] ? row[0] : null)
      .filter((id, index, self) => id !== null && self.indexOf(id) === index); // Unique IDs
    throw new Error(
      `Workout with ID "${workoutId}" not found. ` +
      `Available workout IDs: ${availableWorkoutIds.length > 0 ? availableWorkoutIds.slice(0, 10).join(', ') : 'none'}`
    );
  }
  
  // Delete rows in reverse order to maintain correct indices
  workoutRowIndices.reverse();
  
  // Delete the rows using batchUpdate with deleteDimension request
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    // Get the sheet ID for the Workouts sheet
    const spreadsheet = await client.spreadsheets.get({ spreadsheetId });
    const workoutsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Workouts');
    
    if (!workoutsSheet) {
      throw new Error('Workouts sheet not found');
    }
    
    const sheetId = workoutsSheet.properties.sheetId;
    
    // Create delete requests for all workout rows
    const deleteRequests = workoutRowIndices.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));
    
    // Execute all deletions in a single batch update
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: deleteRequests,
      },
    });
  } catch (error) {
    throw new Error(`Failed to delete workout ${workoutId}: ${error.message}`);
  }
}

/**
 * Update an existing client in the Clients sheet
 * 
 * @param {string} clientId - Client ID to update
 * @param {Object} clientData - Updated client data (name, email, phone, notes)
 * @returns {Promise<Object>} Updated client object
 * @throws {Error} If client not found or update fails
 */
export async function updateClient(clientId, clientData) {
  // Ensure sheet exists with headers before updating
  await ensureSheetExists('Clients');
  await ensureHeadersExist('Clients', ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt']);
  
  // Get all rows to find the client
  const rows = await getSheetData('Clients');
  
  // Find the row index (accounting for header row at index 0)
  // Filter out empty rows and rows without clientId
  const rowIndex = rows.findIndex((row, index) => {
    // Skip header row (index 0)
    if (index === 0) return false;
    // Skip empty rows or rows without a clientId
    if (!row || row.length === 0 || !row[0]) return false;
    return row[0] === clientId;
  });
  
  if (rowIndex === -1) {
    // Provide helpful error message
    const availableClientIds = rows
      .slice(1) // Skip header
      .map(row => row && row[0] ? row[0] : null)
      .filter(id => id !== null);
    throw new Error(
      `Client with ID "${clientId}" not found. ` +
      `Available client IDs: ${availableClientIds.length > 0 ? availableClientIds.join(', ') : 'none'}`
    );
  }
  
  // Get existing client to preserve clientId and createdAt
  const existingClient = rowToClient(rows[rowIndex]);
  
  // Merge updated data with existing data (preserve clientId and createdAt)
  const updatedClient = {
    clientId: existingClient.clientId, // Preserve clientId
    name: clientData.name !== undefined ? clientData.name : existingClient.name,
    email: clientData.email !== undefined ? clientData.email : existingClient.email,
    phone: clientData.phone !== undefined ? clientData.phone : existingClient.phone,
    notes: clientData.notes !== undefined ? clientData.notes : existingClient.notes,
    createdAt: existingClient.createdAt, // Preserve createdAt
  };
  
  // Convert to row format
  const updatedRow = clientToRow(updatedClient);
  
  // Google Sheets row numbers are 1-indexed, and we have a header row at index 0 in the array
  // Array: rows[0] = header, rows[1] = first data row, rows[2] = second data row, ...
  // Sheets: row 1 = header, row 2 = first data row, row 3 = second data row, ...
  // So if rowIndex = 1 (first data row in array), we need row 2 in Sheets (rowIndex + 1)
  const sheetRowNumber = rowIndex + 1;
  
  // Calculate column range (A to F for 6 columns: clientId, name, email, phone, notes, createdAt)
  // Ensure we have all required columns
  if (updatedRow.length !== 6) {
    throw new Error(
      `Invalid row format: expected 6 columns, got ${updatedRow.length}. ` +
      `Row data: ${JSON.stringify(updatedRow)}`
    );
  }
  const lastColIndex = updatedRow.length - 1;
  const lastCol = String.fromCharCode(65 + lastColIndex); // A=65 (index 0), F=70 (index 5)
  const range = `Clients!A${sheetRowNumber}:${lastCol}${sheetRowNumber}`;
  
  // Update the row
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [updatedRow],
      },
    });
    
    return updatedClient;
  } catch (error) {
    // Log detailed error for debugging
    console.error(`Failed to update client ${clientId}:`, {
      error: error.message,
      range,
      sheetRowNumber,
      rowIndex,
      spreadsheetId,
      updatedRowLength: updatedRow.length,
    });
    throw new Error(`Failed to update client ${clientId}: ${error.message}`);
  }
}

/**
 * Delete an existing client from the Clients sheet
 * 
 * @param {string} clientId - Client ID to delete
 * @param {boolean} deleteWorkouts - Optional: if true, also deletes all associated workouts (default: false)
 * @returns {Promise<void>}
 * @throws {Error} If client not found or deletion fails
 */
export async function deleteClient(clientId, deleteWorkouts = false) {
  // Ensure sheet exists with headers before deleting
  await ensureSheetExists('Clients');
  await ensureHeadersExist('Clients', ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt']);
  
  // Get all rows to find the client
  const rows = await getSheetData('Clients');
  
  // Find the row index (accounting for header row at index 0)
  const rowIndex = rows.findIndex((row, index) => {
    // Skip header row (index 0)
    if (index === 0) return false;
    return row[0] === clientId;
  });
  
  if (rowIndex === -1) {
    // Provide helpful error message
    const availableClientIds = rows
      .slice(1) // Skip header
      .map(row => row && row[0] ? row[0] : null)
      .filter(id => id !== null);
    throw new Error(
      `Client with ID "${clientId}" not found. ` +
      `Available client IDs: ${availableClientIds.length > 0 ? availableClientIds.join(', ') : 'none'}`
    );
  }
  
  // Delete associated workouts if requested
  if (deleteWorkouts) {
    await deleteClientWorkouts(clientId);
  }
  
  // Google Sheets row numbers are 1-indexed, and we have a header row
  // So rowIndex (0-based, excluding header) becomes rowIndex + 1 in Sheets (row 1 = headers, row 2+ = data)
  const sheetRowNumber = rowIndex + 1; // rowIndex already accounts for header, so +1 for 1-indexing
  
  // Delete the row using batchUpdate with deleteDimension request
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  
  try {
    // Get the sheet ID for the Clients sheet
    const spreadsheet = await client.spreadsheets.get({ spreadsheetId });
    const clientsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Clients');
    
    if (!clientsSheet) {
      throw new Error('Clients sheet not found');
    }
    
    const sheetId = clientsSheet.properties.sheetId;
    
    // Delete the row
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex, // 0-based index (including header row offset)
                endIndex: rowIndex + 1, // Delete one row
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    throw new Error(`Failed to delete client ${clientId}: ${error.message}`);
  }
}

/**
 * Delete all workouts for a specific client
 * 
 * @param {string} clientId - Client ID whose workouts should be deleted
 * @returns {Promise<void>}
 * @private
 */
async function deleteClientWorkouts(clientId) {
  // Ensure sheet exists with headers
  await ensureSheetExists('Workouts');
  await ensureHeadersExist('Workouts', ['workoutId', 'clientId', 'date', 'exerciseName', 'setNumber', 'reps', 'weight', 'volume', 'notes', 'createdAt']);
  
  // Get all rows to find workouts for this client
  const rows = await getSheetData('Workouts');
  
  // Find all row indices that match the clientId (need to delete in reverse order to maintain indices)
  const workoutRowIndices = [];
  rows.forEach((row, index) => {
    // Skip header row (index 0)
    if (index === 0) return;
    if (row[1] === clientId) { // clientId is in column 1 (index 1)
      workoutRowIndices.push(index);
    }
  });
  
  if (workoutRowIndices.length === 0) {
    return; // No workouts to delete
  }
  
  // Get the sheet ID for the Workouts sheet
  const client = await initializeSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const spreadsheet = await client.spreadsheets.get({ spreadsheetId });
  const workoutsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Workouts');
  
  if (!workoutsSheet) {
    throw new Error('Workouts sheet not found');
  }
  
  const sheetId = workoutsSheet.properties.sheetId;
  
  // Delete rows in reverse order to maintain correct indices
  // When deleting multiple rows, delete from bottom to top
  workoutRowIndices.reverse();
  
  try {
    // Create delete requests for all workout rows
    const deleteRequests = workoutRowIndices.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));
    
    // Execute all deletions in a single batch update
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: deleteRequests,
      },
    });
  } catch (error) {
    throw new Error(`Failed to delete workouts for client ${clientId}: ${error.message}`);
  }
}


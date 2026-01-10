/**
 * Data Transformation Utilities
 * 
 * Functions to convert between Google Sheets row format and application data models.
 */

/**
 * Convert Google Sheets row to client object
 * 
 * Expected row format: [clientId, name, email, phone, notes, createdAt]
 * 
 * @param {Array<string>} row - Google Sheets row data
 * @param {number} headerRowIndex - Index of header row (default: 0, assumes first row is headers)
 * @returns {Object} Client object with structure:
 *   {
 *     clientId: string,
 *     name: string,
 *     email: string,
 *     phone: string,
 *     notes: string,
 *     createdAt: string
 *   }
 */
export function rowToClient(row, headerRowIndex = 0) {
  // Skip header row
  if (row.length === 0) {
    return null;
  }

  return {
    clientId: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    phone: row[3] || '',
    notes: row[4] || '',
    createdAt: row[5] || '',
  };
}

/**
 * Convert client object to Google Sheets row format
 * 
 * @param {Object} client - Client object
 * @returns {Array<string>} Row data array: [clientId, name, email, phone, notes, createdAt]
 */
export function clientToRow(client) {
  return [
    client.clientId || '',
    client.name || '',
    client.email || '',
    client.phone || '',
    client.notes || '',
    client.createdAt || '',
  ];
}

/**
 * Convert Google Sheets row to workout object
 * 
 * Expected row format: [workoutId, clientId, date, exercises (JSON string), notes, createdAt]
 * 
 * @param {Array<string>} row - Google Sheets row data
 * @returns {Object} Workout object with structure:
 *   {
 *     workoutId: string,
 *     clientId: string,
 *     date: string,
 *     exercises: Array<{
 *       exerciseName: string,
 *       sets: Array<{
 *         reps: number,
 *         weight: number,
 *         notes?: string
 *       }>
 *     }>,
 *     notes: string,
 *     createdAt: string
 *   }
 */
export function rowToWorkout(row) {
  if (row.length === 0) {
    return null;
  }

  let exercises = [];
  try {
    // Parse exercises JSON string
    if (row[3]) {
      exercises = JSON.parse(row[3]);
    }
  } catch (error) {
    // If parsing fails, default to empty array
    console.warn('Failed to parse exercises JSON:', error);
    exercises = [];
  }

  return {
    workoutId: row[0] || '',
    clientId: row[1] || '',
    date: row[2] || '',
    exercises: exercises,
    notes: row[4] || '',
    createdAt: row[5] || '',
  };
}

/**
 * Convert workout object to Google Sheets row format
 * 
 * @param {Object} workout - Workout object
 * @returns {Array<string>} Row data array: [workoutId, clientId, date, exercises (JSON string), notes, createdAt]
 */
export function workoutToRow(workout) {
  // Serialize exercises array to JSON string
  const exercisesJson = JSON.stringify(workout.exercises || []);

  return [
    workout.workoutId || '',
    workout.clientId || '',
    workout.date || '',
    exercisesJson,
    workout.notes || '',
    workout.createdAt || '',
  ];
}

/**
 * Convert array of Google Sheets rows to array of client objects
 * 
 * @param {Array<Array<string>>} rows - Array of row data
 * @param {number} headerRowIndex - Index of header row (default: 0)
 * @returns {Array<Object>} Array of client objects
 */
export function rowsToClients(rows, headerRowIndex = 0) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Skip header row
  const dataRows = rows.slice(headerRowIndex + 1);
  
  return dataRows
    .map(row => rowToClient(row))
    .filter(client => client !== null && client.clientId); // Filter out empty rows
}

/**
 * Convert array of Google Sheets rows to array of workout objects
 * 
 * @param {Array<Array<string>>} rows - Array of row data
 * @param {number} headerRowIndex - Index of header row (default: 0)
 * @returns {Array<Object>} Array of workout objects
 */
export function rowsToWorkouts(rows, headerRowIndex = 0) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Skip header row
  const dataRows = rows.slice(headerRowIndex + 1);
  
  return dataRows
    .map(row => rowToWorkout(row))
    .filter(workout => workout !== null && workout.workoutId); // Filter out empty rows
}


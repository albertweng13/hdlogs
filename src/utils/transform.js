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
 * Convert Google Sheets row to workout set object (new normalized structure)
 * 
 * Expected row format: [workoutId, clientId, date, exerciseName, setNumber, reps, weight, volume, notes, createdAt]
 * 
 * @param {Array<string>} row - Google Sheets row data
 * @returns {Object} Workout set object with structure:
 *   {
 *     workoutId: string,
 *     clientId: string,
 *     date: string,
 *     exerciseName: string,
 *     setNumber: number,
 *     reps: number,
 *     weight: number,
 *     volume: number,
 *     notes: string,
 *     createdAt: string
 *   }
 */
export function rowToWorkoutSet(row) {
  if (row.length === 0) {
    return null;
  }

  return {
    workoutId: row[0] || '',
    clientId: row[1] || '',
    date: row[2] || '',
    exerciseName: row[3] || '',
    setNumber: parseInt(row[4]) || 1,
    reps: parseFloat(row[5]) || 0,
    weight: parseFloat(row[6]) || 0,
    volume: parseFloat(row[7]) || 0,
    notes: row[8] || '',
    createdAt: row[9] || '',
  };
}

/**
 * Convert workout set object to Google Sheets row format (new normalized structure)
 * 
 * @param {Object} set - Workout set object
 * @returns {Array<string>} Row data array: [workoutId, clientId, date, exerciseName, setNumber, reps, weight, volume, notes, createdAt]
 */
export function workoutSetToRow(set) {
  // Calculate volume if not provided
  const volume = set.volume !== undefined ? set.volume : (set.reps || 0) * (set.weight || 0);

  return [
    set.workoutId || '',
    set.clientId || '',
    set.date || '',
    set.exerciseName || '',
    String(set.setNumber || 1),
    String(set.reps || 0),
    String(set.weight || 0),
    String(volume),
    set.notes || '',
    set.createdAt || '',
  ];
}

/**
 * Convert array of workout set rows to workout objects (grouped by workoutId)
 * 
 * @param {Array<Array<string>>} rows - Array of row data (one row per set)
 * @param {number} headerRowIndex - Index of header row (default: 0)
 * @returns {Array<Object>} Array of workout objects with exercises grouped
 */
export function rowsToWorkouts(rows, headerRowIndex = 0) {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Skip header row
  const dataRows = rows.slice(headerRowIndex + 1);
  
  // Convert rows to set objects
  const sets = dataRows
    .map(row => rowToWorkoutSet(row))
    .filter(set => set !== null && set.workoutId); // Filter out empty rows

  // Group sets by workoutId
  const workoutsMap = new Map();
  
  for (const set of sets) {
    if (!workoutsMap.has(set.workoutId)) {
      workoutsMap.set(set.workoutId, {
        workoutId: set.workoutId,
        clientId: set.clientId,
        date: set.date,
        exercises: [],
        notes: set.notes, // Use notes from first set (or could aggregate)
        createdAt: set.createdAt,
      });
    }
    
    const workout = workoutsMap.get(set.workoutId);
    
    // Find or create exercise in workout
    let exercise = workout.exercises.find(ex => ex.exerciseName === set.exerciseName);
    if (!exercise) {
      exercise = {
        exerciseName: set.exerciseName,
        sets: [],
      };
      workout.exercises.push(exercise);
    }
    
    // Add set to exercise
    exercise.sets.push({
      reps: set.reps,
      weight: set.weight,
      notes: set.notes,
    });
  }
  
  return Array.from(workoutsMap.values());
}

/**
 * Convert workout object to array of workout set rows (one row per set)
 * 
 * @param {Object} workout - Workout object with exercises array
 * @returns {Array<Array<string>>} Array of row data arrays (one per set)
 */
export function workoutToRows(workout) {
  const rows = [];
  
  if (!workout.exercises || workout.exercises.length === 0) {
    return rows;
  }
  
  // For each exercise, create a row for each set
  workout.exercises.forEach(exercise => {
    if (!exercise.sets || exercise.sets.length === 0) {
      return;
    }
    
    exercise.sets.forEach((set, index) => {
      const setNumber = index + 1;
      const volume = (set.reps || 0) * (set.weight || 0);
      
      rows.push(workoutSetToRow({
        workoutId: workout.workoutId,
        clientId: workout.clientId,
        date: workout.date,
        exerciseName: exercise.exerciseName,
        setNumber: setNumber,
        reps: set.reps,
        weight: set.weight,
        volume: volume,
        notes: set.notes || workout.notes || '',
        createdAt: workout.createdAt,
      }));
    });
  });
  
  return rows;
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



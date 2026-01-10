import express from 'express';
import { getAllClients, createClient, updateClient, deleteClient, getWorkoutsByClientId, createWorkout, updateWorkout, deleteWorkout, getAvailableSheets, getSpreadsheet, getSheetData } from './sheets.js';
import { getSpreadsheetId } from '../config/credentials.js';

const router = express.Router();

// Task 50: Server-side validation functions
function validateClientData(clientData) {
  const errors = [];
  
  if (!clientData.name || typeof clientData.name !== 'string' || clientData.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (clientData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (clientData.email && typeof clientData.email === 'string' && clientData.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email.trim())) {
      errors.push('Invalid email format');
    }
  }
  
  if (clientData.phone && typeof clientData.phone === 'string' && clientData.phone.trim().length > 0) {
    const phoneDigits = clientData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      errors.push('Phone number must contain at least 7 digits');
    }
  }
  
  return errors;
}

function validateWorkoutData(workoutData) {
  const errors = [];
  
  if (!workoutData.date || typeof workoutData.date !== 'string' || workoutData.date.trim().length === 0) {
    errors.push('Date is required');
  } else {
    const date = new Date(workoutData.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  if (!workoutData.exercises || !Array.isArray(workoutData.exercises) || workoutData.exercises.length === 0) {
    errors.push('At least one exercise is required');
  } else {
    workoutData.exercises.forEach((exercise, index) => {
      if (!exercise.exerciseName || typeof exercise.exerciseName !== 'string' || exercise.exerciseName.trim().length === 0) {
        errors.push(`Exercise ${index + 1}: Exercise name is required`);
      }
      if (!exercise.sets || !Array.isArray(exercise.sets) || exercise.sets.length === 0) {
        errors.push(`Exercise ${index + 1}: At least one set is required`);
      } else {
        exercise.sets.forEach((set, setIndex) => {
          if (typeof set.reps !== 'number' || set.reps < 1) {
            errors.push(`Exercise ${index + 1}, Set ${setIndex + 1}: Reps must be at least 1`);
          }
          if (typeof set.weight !== 'number' || set.weight < 0) {
            errors.push(`Exercise ${index + 1}, Set ${setIndex + 1}: Weight must be 0 or greater`);
          }
        });
      }
    });
  }
  
  if (!workoutData.clientId || typeof workoutData.clientId !== 'string' || workoutData.clientId.trim().length === 0) {
    errors.push('Client ID is required');
  }
  
  return errors;
}

// GET /api/clients - List all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: error.message || 'Failed to get clients' });
  }
});

// POST /api/clients - Create new client
router.post('/clients', async (req, res) => {
  try {
    // Task 50: Server-side validation
    const validationErrors = validateClientData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    
    const client = await createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message || 'Failed to create client' });
  }
});

// GET /api/clients/:id/workouts - Get workouts for a client (must come before PUT /clients/:id)
router.get('/clients/:id/workouts', async (req, res) => {
  try {
    const workouts = await getWorkoutsByClientId(req.params.id);
    res.json(workouts);
  } catch (error) {
    console.error('Error getting workouts:', error);
    res.status(500).json({ error: error.message || 'Failed to get workouts' });
  }
});

// PUT /api/clients/:id - Update client information (must come after GET /clients/:id/workouts)
router.put('/clients/:id', async (req, res) => {
  try {
    console.log(`PUT /api/clients/${req.params.id} - Updating client`);
    
    // Task 50: Server-side validation
    const validationErrors = validateClientData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    
    const client = await updateClient(req.params.id, req.body);
    console.log(`Successfully updated client ${req.params.id}`);
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update client' });
    }
  }
});

// DELETE /api/clients/:id - Delete client (must come after PUT /clients/:id)
router.delete('/clients/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/clients/${req.params.id} - Deleting client`);
    // Check if deleteWorkouts query parameter is set
    const deleteWorkouts = req.query.deleteWorkouts === 'true';
    await deleteClient(req.params.id, deleteWorkouts);
    console.log(`Successfully deleted client ${req.params.id}`);
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    console.error('Error deleting client:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete client' });
    }
  }
});

// POST /api/workouts - Create new workout
router.post('/workouts', async (req, res) => {
  try {
    // Task 50: Server-side validation
    const validationErrors = validateWorkoutData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    
    const workout = await createWorkout(req.body);
    res.status(201).json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: error.message || 'Failed to create workout' });
  }
});

// PUT /api/workouts/:id - Update workout
router.put('/workouts/:id', async (req, res) => {
  try {
    console.log(`PUT /api/workouts/${req.params.id} - Updating workout`);
    
    // Task 50: Server-side validation (for update, allow partial - only validate provided fields)
    if (req.body.exercises !== undefined || req.body.date !== undefined || req.body.clientId !== undefined) {
      const validationErrors = validateWorkoutData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join('; ') });
      }
    }
    
    const workout = await updateWorkout(req.params.id, req.body);
    console.log(`Successfully updated workout ${req.params.id}`);
    res.json(workout);
  } catch (error) {
    console.error('Error updating workout:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update workout' });
    }
  }
});

// DELETE /api/workouts/:id - Delete workout
router.delete('/workouts/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/workouts/${req.params.id} - Deleting workout`);
    await deleteWorkout(req.params.id);
    console.log(`Successfully deleted workout ${req.params.id}`);
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    console.error('Error deleting workout:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete workout' });
    }
  }
});

// GET /api/debug/sheets - Diagnostic endpoint to check available sheets (for debugging)
router.get('/debug/sheets', async (req, res) => {
  try {
    const sheets = await getAvailableSheets();
    const spreadsheetInfo = await getSpreadsheet();
    const spreadsheetId = getSpreadsheetId();
    
    // Check if headers exist
    let clientsHeaders = [];
    let workoutsHeaders = [];
    try {
      const clientsRows = await getSheetData('Clients', 'Clients!A1:F1');
      clientsHeaders = clientsRows[0] || [];
    } catch (e) {
      // Sheet might not exist yet or be empty
    }
    
    try {
      const workoutsRows = await getSheetData('Workouts', 'Workouts!A1:F1');
      workoutsHeaders = workoutsRows[0] || [];
    } catch (e) {
      // Sheet might not exist yet or be empty
    }
    
    const expectedClientsHeaders = ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt'];
    const expectedWorkoutsHeaders = ['workoutId', 'clientId', 'date', 'exercises', 'notes', 'createdAt'];
    
    res.json({
      spreadsheetId,
      spreadsheetTitle: spreadsheetInfo.properties?.title || 'Unknown',
      availableSheets: sheets,
      expectedSheets: ['Clients', 'Workouts'],
      missingSheets: ['Clients', 'Workouts'].filter(name => !sheets.includes(name)),
      clientsSheet: {
        exists: sheets.includes('Clients'),
        hasHeaders: clientsHeaders.length > 0,
        headers: clientsHeaders,
        expectedHeaders: expectedClientsHeaders,
        headersMatch: clientsHeaders.length === expectedClientsHeaders.length &&
          expectedClientsHeaders.every((h, i) => h.toLowerCase() === (clientsHeaders[i] || '').toString().toLowerCase())
      },
      workoutsSheet: {
        exists: sheets.includes('Workouts'),
        hasHeaders: workoutsHeaders.length > 0,
        headers: workoutsHeaders,
        expectedHeaders: expectedWorkoutsHeaders,
        headersMatch: workoutsHeaders.length === expectedWorkoutsHeaders.length &&
          expectedWorkoutsHeaders.every((h, i) => h.toLowerCase() === (workoutsHeaders[i] || '').toString().toLowerCase())
      },
      status: sheets.includes('Clients') && sheets.includes('Workouts') &&
        clientsHeaders.length > 0 && workoutsHeaders.length > 0 ? 'ready' : 'auto_setup_enabled'
    });
  } catch (error) {
    console.error('Error getting sheet info:', error);
    res.status(500).json({ error: error.message || 'Failed to get sheet info' });
  }
});

export default router;


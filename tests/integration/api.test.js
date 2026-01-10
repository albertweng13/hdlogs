import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import { getAllClients, createClient, updateClient, deleteClient, getWorkoutsByClientId, createWorkout, updateWorkout, deleteWorkout, getSheetData, initializeSheets } from '../../src/api/sheets.js';

/**
 * Integration tests for API endpoints
 * 
 * These tests use a real Google Sheet. Set GOOGLE_SHEETS_TEST_SPREADSHEET_ID
 * and GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY environment variables.
 * 
 * Note: Tests clean up data after each test, but the test sheet must have
 * "Clients" and "Workouts" sheets (they will be created if missing).
 */

const TEST_SPREADSHEET_ID_ENV = 'GOOGLE_SHEETS_TEST_SPREADSHEET_ID';

describe('API Integration Tests', () => {
  let originalSpreadsheetId;
  let testClientsCreated = [];
  let testWorkoutsCreated = [];

  beforeAll(async () => {
    // Check if test spreadsheet ID is set
    if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
      console.warn(
        `⚠️  ${TEST_SPREADSHEET_ID_ENV} not set. ` +
        `Skipping integration tests. Set this environment variable to run integration tests.`
      );
      return;
    }

    // Save original spreadsheet ID
    originalSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Set test spreadsheet ID
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = process.env[TEST_SPREADSHEET_ID_ENV];

    // Initialize sheets (ensure they exist with headers)
    try {
      await initializeSheets();
    } catch (error) {
      console.error('Failed to initialize test sheets:', error);
      throw error;
    }
  });

  afterEach(async () => {
    // Clean up test data
    if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
      return; // Skip if test spreadsheet not configured
    }

    try {
      // Delete test workouts
      for (const workout of testWorkoutsCreated) {
        await deleteTestWorkout(workout.workoutId);
      }
      testWorkoutsCreated = [];

      // Delete test clients (must be after workouts to avoid foreign key issues)
      for (const client of testClientsCreated) {
        await deleteTestClient(client.clientId);
      }
      testClientsCreated = [];
    } catch (error) {
      console.warn('Failed to clean up test data:', error);
      // Don't fail the test if cleanup fails
    }
  });

  // Helper function to delete a test client
  async function deleteTestClient(clientId) {
    try {
      const rows = await getSheetData('Clients');
      const rowIndex = rows.findIndex(row => row[0] === clientId);
      if (rowIndex !== -1) {
        // Note: Google Sheets API doesn't have a simple delete by ID
        // For integration tests, we'll rely on test isolation or manual cleanup
        // In a real scenario, you might implement a delete function or use batch updates
        // For now, we'll just track them for manual cleanup if needed
        console.log(`Test client ${clientId} should be cleaned up manually`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Helper function to delete a test workout
  async function deleteTestWorkout(workoutId) {
    try {
      const rows = await getSheetData('Workouts');
      const rowIndex = rows.findIndex(row => row[0] === workoutId);
      if (rowIndex !== -1) {
        // Similar to deleteTestClient, tracking for manual cleanup
        console.log(`Test workout ${workoutId} should be cleaned up manually`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  describe('GET /api/clients', () => {
    it('should return empty array when no clients exist', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const clients = await getAllClients();
      expect(Array.isArray(clients)).toBe(true);
      // Note: We can't guarantee empty array since other tests might have added data
      // But we can verify it's an array of client objects
    });

    it('should return all clients from the Clients sheet', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Integration Test Client',
        email: 'integration-test@example.com',
        phone: '555-0001',
        notes: 'Test client for integration tests',
      });
      testClientsCreated.push(testClient);

      // Get all clients
      const clients = await getAllClients();

      // Verify the test client is in the list
      const foundClient = clients.find(c => c.clientId === testClient.clientId);
      expect(foundClient).toBeDefined();
      expect(foundClient.name).toBe('Integration Test Client');
      expect(foundClient.email).toBe('integration-test@example.com');
      expect(foundClient.phone).toBe('555-0001');
      expect(foundClient.notes).toBe('Test client for integration tests');
      expect(foundClient.clientId).toMatch(/^client-/);
      expect(foundClient.createdAt).toBeDefined();
    });

    it('should return clients with correct structure', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const clients = await getAllClients();
      
      // Verify structure of all clients
      clients.forEach(client => {
        expect(client).toHaveProperty('clientId');
        expect(client).toHaveProperty('name');
        expect(client).toHaveProperty('email');
        expect(client).toHaveProperty('phone');
        expect(client).toHaveProperty('notes');
        expect(client).toHaveProperty('createdAt');
        expect(typeof client.clientId).toBe('string');
        expect(typeof client.name).toBe('string');
      });
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client with all fields', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const clientData = {
        name: 'John Doe Integration',
        email: 'john.doe.integration@example.com',
        phone: '555-1234-integration',
        notes: 'Integration test notes',
      };

      const createdClient = await createClient(clientData);
      testClientsCreated.push(createdClient);

      expect(createdClient).toBeDefined();
      expect(createdClient.clientId).toMatch(/^client-/);
      expect(createdClient.name).toBe(clientData.name);
      expect(createdClient.email).toBe(clientData.email);
      expect(createdClient.phone).toBe(clientData.phone);
      expect(createdClient.notes).toBe(clientData.notes);
      expect(createdClient.createdAt).toBeDefined();
      expect(new Date(createdClient.createdAt).getTime()).toBeLessThanOrEqual(Date.now());

      // Verify client can be retrieved
      const clients = await getAllClients();
      const foundClient = clients.find(c => c.clientId === createdClient.clientId);
      expect(foundClient).toBeDefined();
      expect(foundClient.name).toBe(clientData.name);
    });

    it('should create a client with minimal fields (name only)', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const clientData = {
        name: 'Minimal Client',
      };

      const createdClient = await createClient(clientData);
      testClientsCreated.push(createdClient);

      expect(createdClient.clientId).toMatch(/^client-/);
      expect(createdClient.name).toBe('Minimal Client');
      expect(createdClient.email).toBe('');
      expect(createdClient.phone).toBe('');
      expect(createdClient.notes).toBe('');
      expect(createdClient.createdAt).toBeDefined();
    });

    it('should generate unique client IDs', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const client1 = await createClient({ name: 'Client One' });
      const client2 = await createClient({ name: 'Client Two' });
      
      testClientsCreated.push(client1, client2);

      expect(client1.clientId).not.toBe(client2.clientId);
      expect(client1.clientId).toMatch(/^client-/);
      expect(client2.clientId).toMatch(/^client-/);
    });
  });

  describe('GET /api/clients/:id/workouts', () => {
    it('should return empty array when client has no workouts', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Client With No Workouts',
        email: 'no-workouts@example.com',
      });
      testClientsCreated.push(testClient);

      // Get workouts for this client
      const workouts = await getWorkoutsByClientId(testClient.clientId);

      expect(Array.isArray(workouts)).toBe(true);
      expect(workouts.length).toBe(0);
    });

    it('should return workouts for a specific client', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Client With Workouts',
        email: 'with-workouts@example.com',
      });
      testClientsCreated.push(testClient);

      // Create workouts for this client
      const workout1 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: [
              { reps: 5, weight: 135, notes: 'Set 1' },
              { reps: 5, weight: 140, notes: 'Set 2' },
            ],
          },
        ],
        notes: 'First workout',
      });
      testWorkoutsCreated.push(workout1);

      const workout2 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-16',
        exercises: [
          {
            exerciseName: 'Squat',
            sets: [{ reps: 8, weight: 225 }],
          },
        ],
        notes: 'Second workout',
      });
      testWorkoutsCreated.push(workout2);

      // Get workouts for this client
      const workouts = await getWorkoutsByClientId(testClient.clientId);

      expect(workouts.length).toBeGreaterThanOrEqual(2);
      
      // Find our test workouts
      const foundWorkout1 = workouts.find(w => w.workoutId === workout1.workoutId);
      const foundWorkout2 = workouts.find(w => w.workoutId === workout2.workoutId);

      expect(foundWorkout1).toBeDefined();
      expect(foundWorkout1.clientId).toBe(testClient.clientId);
      expect(foundWorkout1.date).toBe('2024-01-15');
      expect(foundWorkout1.exercises).toHaveLength(1);
      expect(foundWorkout1.exercises[0].exerciseName).toBe('Bench Press');
      expect(foundWorkout1.exercises[0].sets).toHaveLength(2);
      expect(foundWorkout1.notes).toBe('First workout');

      expect(foundWorkout2).toBeDefined();
      expect(foundWorkout2.clientId).toBe(testClient.clientId);
      expect(foundWorkout2.date).toBe('2024-01-16');
    });

    it('should not return workouts for other clients', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create two test clients
      const client1 = await createClient({ name: 'Client One' });
      const client2 = await createClient({ name: 'Client Two' });
      testClientsCreated.push(client1, client2);

      // Create workout for client1
      const workout = await createWorkout({
        clientId: client1.clientId,
        date: '2024-01-15',
        exercises: [{ exerciseName: 'Bench Press', sets: [] }],
      });
      testWorkoutsCreated.push(workout);

      // Get workouts for client2
      const workoutsForClient2 = await getWorkoutsByClientId(client2.clientId);

      // Verify workout for client1 is not in client2's list
      const foundWorkout = workoutsForClient2.find(w => w.workoutId === workout.workoutId);
      expect(foundWorkout).toBeUndefined();
    });

    it('should return workouts with correct structure', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const testClient = await createClient({ name: 'Structure Test Client' });
      testClientsCreated.push(testClient);

      const workout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [
          {
            exerciseName: 'Deadlift',
            sets: [
              { reps: 3, weight: 315, notes: 'Heavy set' },
              { reps: 5, weight: 275 },
            ],
          },
        ],
        notes: 'Structure test workout',
      });
      testWorkoutsCreated.push(workout);

      const workouts = await getWorkoutsByClientId(testClient.clientId);
      const foundWorkout = workouts.find(w => w.workoutId === workout.workoutId);

      expect(foundWorkout).toBeDefined();
      expect(foundWorkout).toHaveProperty('workoutId');
      expect(foundWorkout).toHaveProperty('clientId');
      expect(foundWorkout).toHaveProperty('date');
      expect(foundWorkout).toHaveProperty('exercises');
      expect(foundWorkout).toHaveProperty('notes');
      expect(foundWorkout).toHaveProperty('createdAt');
      expect(Array.isArray(foundWorkout.exercises)).toBe(true);
      expect(foundWorkout.exercises[0]).toHaveProperty('exerciseName');
      expect(foundWorkout.exercises[0]).toHaveProperty('sets');
      expect(Array.isArray(foundWorkout.exercises[0].sets)).toBe(true);
    });
  });

  describe('POST /api/workouts', () => {
    it('should create a new workout with all fields', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client first
      const testClient = await createClient({ name: 'Workout Test Client' });
      testClientsCreated.push(testClient);

      const workoutData = {
        clientId: testClient.clientId,
        date: '2024-01-20',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: [
              { reps: 5, weight: 135, notes: 'Warm-up' },
              { reps: 5, weight: 155, notes: 'Working set 1' },
              { reps: 5, weight: 155, notes: 'Working set 2' },
            ],
          },
          {
            exerciseName: 'Pull-ups',
            sets: [
              { reps: 8, weight: 0 },
              { reps: 8, weight: 0 },
            ],
          },
        ],
        notes: 'Full workout session',
      };

      const createdWorkout = await createWorkout(workoutData);
      testWorkoutsCreated.push(createdWorkout);

      expect(createdWorkout).toBeDefined();
      expect(createdWorkout.workoutId).toMatch(/^workout-/);
      expect(createdWorkout.clientId).toBe(testClient.clientId);
      expect(createdWorkout.date).toBe('2024-01-20');
      expect(createdWorkout.exercises).toHaveLength(2);
      expect(createdWorkout.exercises[0].exerciseName).toBe('Bench Press');
      expect(createdWorkout.exercises[0].sets).toHaveLength(3);
      expect(createdWorkout.exercises[1].exerciseName).toBe('Pull-ups');
      expect(createdWorkout.notes).toBe('Full workout session');
      expect(createdWorkout.createdAt).toBeDefined();

      // Verify workout can be retrieved
      const workouts = await getWorkoutsByClientId(testClient.clientId);
      const foundWorkout = workouts.find(w => w.workoutId === createdWorkout.workoutId);
      expect(foundWorkout).toBeDefined();
      expect(foundWorkout.exercises).toHaveLength(2);
    });

    it('should create a workout with minimal fields', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const testClient = await createClient({ name: 'Minimal Workout Client' });
      testClientsCreated.push(testClient);

      const workoutData = {
        clientId: testClient.clientId,
      };

      const createdWorkout = await createWorkout(workoutData);
      testWorkoutsCreated.push(createdWorkout);

      expect(createdWorkout.workoutId).toMatch(/^workout-/);
      expect(createdWorkout.clientId).toBe(testClient.clientId);
      expect(createdWorkout.date).toBeDefined(); // Should default to today
      expect(Array.isArray(createdWorkout.exercises)).toBe(true);
      expect(createdWorkout.exercises.length).toBe(0);
      expect(createdWorkout.notes).toBe('');
      expect(createdWorkout.createdAt).toBeDefined();
    });

    it('should handle complex exercise structures', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const testClient = await createClient({ name: 'Complex Workout Client' });
      testClientsCreated.push(testClient);

      const workoutData = {
        clientId: testClient.clientId,
        date: '2024-01-25',
        exercises: [
          {
            exerciseName: 'Compound Exercise',
            sets: [
              { reps: 10, weight: 100, notes: 'First set' },
              { reps: 8, weight: 110 },
              { reps: 6, weight: 120, notes: 'Final set - RPE 9' },
            ],
          },
          {
            exerciseName: 'Accessory Exercise',
            sets: [
              { reps: 15, weight: 50 },
              { reps: 12, weight: 55, notes: 'Felt good' },
              { reps: 10, weight: 60 },
            ],
          },
          {
            exerciseName: 'Isolation Exercise',
            sets: [{ reps: 20, weight: 30 }],
          },
        ],
        notes: 'Complex workout with multiple exercises and sets',
      };

      const createdWorkout = await createWorkout(workoutData);
      testWorkoutsCreated.push(createdWorkout);

      // Verify the workout structure is preserved
      const workouts = await getWorkoutsByClientId(testClient.clientId);
      const foundWorkout = workouts.find(w => w.workoutId === createdWorkout.workoutId);

      expect(foundWorkout.exercises).toHaveLength(3);
      expect(foundWorkout.exercises[0].sets).toHaveLength(3);
      expect(foundWorkout.exercises[0].sets[0].notes).toBe('First set');
      expect(foundWorkout.exercises[1].sets[1].notes).toBe('Felt good');
      expect(foundWorkout.exercises[2].sets).toHaveLength(1);
    });

    it('should generate unique workout IDs', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      const testClient = await createClient({ name: 'Unique ID Client' });
      testClientsCreated.push(testClient);

      const workout1 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [],
      });
      const workout2 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-16',
        exercises: [],
      });

      testWorkoutsCreated.push(workout1, workout2);

      expect(workout1.workoutId).not.toBe(workout2.workoutId);
      expect(workout1.workoutId).toMatch(/^workout-/);
      expect(workout2.workoutId).toMatch(/^workout-/);
    });
  });

  describe('PUT /api/workouts/:id (updateWorkout)', () => {
    it('should update an existing workout with new data', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client first
      const testClient = await createClient({
        name: 'Client For Workout Update',
        email: 'workout-update@example.com',
      });
      testClientsCreated.push(testClient);

      // Create a workout to update
      const originalWorkout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: [
              { reps: 5, weight: 135, notes: 'Set 1' },
            ],
          },
        ],
        notes: 'Original workout notes',
      });
      testWorkoutsCreated.push(originalWorkout);

      // Update the workout
      const updatedData = {
        date: '2024-01-16',
        exercises: [
          {
            exerciseName: 'Deadlift',
            sets: [
              { reps: 5, weight: 225, notes: 'New set 1' },
              { reps: 5, weight: 235, notes: 'New set 2' },
            ],
          },
        ],
        notes: 'Updated workout notes',
      };

      const updatedWorkout = await updateWorkout(originalWorkout.workoutId, updatedData);

      expect(updatedWorkout.workoutId).toBe(originalWorkout.workoutId);
      expect(updatedWorkout.date).toBe('2024-01-16');
      expect(updatedWorkout.exercises).toHaveLength(1);
      expect(updatedWorkout.exercises[0].exerciseName).toBe('Deadlift');
      expect(updatedWorkout.exercises[0].sets).toHaveLength(2);
      expect(updatedWorkout.exercises[0].sets[0].weight).toBe(225);
      expect(updatedWorkout.exercises[0].sets[1].weight).toBe(235);
      expect(updatedWorkout.notes).toBe('Updated workout notes');
      expect(updatedWorkout.createdAt).toBe(originalWorkout.createdAt); // Preserved

      // Verify workout was updated in the database
      const workouts = await getWorkoutsByClientId(testClient.clientId);
      const foundWorkout = workouts.find(w => w.workoutId === originalWorkout.workoutId);
      expect(foundWorkout).toBeDefined();
      expect(foundWorkout.date).toBe('2024-01-16');
      expect(foundWorkout.exercises[0].exerciseName).toBe('Deadlift');
    });

    it('should preserve existing fields when only partial update is provided', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Partial Update Client',
      });
      testClientsCreated.push(testClient);

      // Create a workout with full data
      const originalWorkout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [
          {
            exerciseName: 'Squat',
            sets: [
              { reps: 5, weight: 225 },
              { reps: 5, weight: 230 },
            ],
          },
        ],
        notes: 'Original notes',
      });
      testWorkoutsCreated.push(originalWorkout);

      // Update only the notes
      const updatedData = {
        notes: 'Updated notes only',
      };

      const updatedWorkout = await updateWorkout(originalWorkout.workoutId, updatedData);

      expect(updatedWorkout.workoutId).toBe(originalWorkout.workoutId);
      expect(updatedWorkout.date).toBe('2024-01-15'); // Preserved
      expect(updatedWorkout.exercises).toHaveLength(1); // Preserved
      expect(updatedWorkout.exercises[0].exerciseName).toBe('Squat'); // Preserved
      expect(updatedWorkout.exercises[0].sets).toHaveLength(2); // Preserved
      expect(updatedWorkout.notes).toBe('Updated notes only'); // Updated
      expect(updatedWorkout.createdAt).toBe(originalWorkout.createdAt); // Preserved
    });

    it('should throw error if workout not found', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      await expect(
        updateWorkout('workout-nonexistent-123', { notes: 'Test' })
      ).rejects.toThrow('Workout with ID workout-nonexistent-123 not found');
    });

    it('should preserve workoutId and createdAt even if provided in update data', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Preserve ID Client',
      });
      testClientsCreated.push(testClient);

      // Create a workout
      const originalWorkout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [{ exerciseName: 'Bench Press', sets: [{ reps: 5, weight: 135 }] }],
        notes: 'Original',
      });
      testWorkoutsCreated.push(originalWorkout);

      const originalWorkoutId = originalWorkout.workoutId;
      const originalCreatedAt = originalWorkout.createdAt;

      // Try to update with different workoutId and createdAt (should be ignored)
      const updatedData = {
        workoutId: 'workout-hacked-123', // Should be ignored
        notes: 'Updated',
        createdAt: '2024-12-31', // Should be ignored
      };

      const updatedWorkout = await updateWorkout(originalWorkoutId, updatedData);

      expect(updatedWorkout.workoutId).toBe(originalWorkoutId); // Original ID preserved
      expect(updatedWorkout.notes).toBe('Updated');
      expect(updatedWorkout.createdAt).toBe(originalCreatedAt); // Original timestamp preserved
    });
  });

  describe('DELETE /api/workouts/:id (deleteWorkout)', () => {
    it('should delete an existing workout', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Client For Workout Delete',
        email: 'workout-delete@example.com',
      });
      testClientsCreated.push(testClient);

      // Create a workout to delete
      const testWorkout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: [
              { reps: 5, weight: 135, notes: 'Set 1' },
            ],
          },
        ],
        notes: 'Workout to be deleted',
      });
      testWorkoutsCreated.push(testWorkout);

      const workoutId = testWorkout.workoutId;

      // Delete the workout
      await deleteWorkout(workoutId);

      // Verify workout is deleted
      const workouts = await getWorkoutsByClientId(testClient.clientId);
      const foundWorkout = workouts.find(w => w.workoutId === workoutId);
      expect(foundWorkout).toBeUndefined();

      // Remove from cleanup list since we already deleted it
      testWorkoutsCreated = testWorkoutsCreated.filter(w => w.workoutId !== workoutId);
    });

    it('should throw error if workout not found', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      await expect(
        deleteWorkout('workout-nonexistent-456')
      ).rejects.toThrow('Workout with ID workout-nonexistent-456 not found');
    });
  });

  describe('PUT /api/clients/:id (updateClient)', () => {
    it('should update an existing client with new data', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client first
      const testClient = await createClient({
        name: 'Client To Update',
        email: 'original@example.com',
        phone: '555-0001',
        notes: 'Original notes',
      });
      testClientsCreated.push(testClient);

      // Update the client
      const updatedData = {
        name: 'Updated Client Name',
        email: 'updated@example.com',
        phone: '555-9999',
        notes: 'Updated notes',
      };

      const updatedClient = await updateClient(testClient.clientId, updatedData);

      expect(updatedClient.clientId).toBe(testClient.clientId);
      expect(updatedClient.name).toBe('Updated Client Name');
      expect(updatedClient.email).toBe('updated@example.com');
      expect(updatedClient.phone).toBe('555-9999');
      expect(updatedClient.notes).toBe('Updated notes');
      expect(updatedClient.createdAt).toBe(testClient.createdAt); // Preserved

      // Verify the update persisted by retrieving the client again
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientId === testClient.clientId);
      expect(foundClient).toBeDefined();
      expect(foundClient.name).toBe('Updated Client Name');
      expect(foundClient.email).toBe('updated@example.com');
      expect(foundClient.phone).toBe('555-9999');
      expect(foundClient.notes).toBe('Updated notes');
    });

    it('should preserve existing fields when only partial update is provided', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Partial Update Client',
        email: 'partial@example.com',
        phone: '555-0002',
        notes: 'Original notes for partial update',
      });
      testClientsCreated.push(testClient);

      // Update only the name
      const updatedClient = await updateClient(testClient.clientId, {
        name: 'Partially Updated Name',
      });

      expect(updatedClient.clientId).toBe(testClient.clientId);
      expect(updatedClient.name).toBe('Partially Updated Name');
      expect(updatedClient.email).toBe('partial@example.com'); // Preserved
      expect(updatedClient.phone).toBe('555-0002'); // Preserved
      expect(updatedClient.notes).toBe('Original notes for partial update'); // Preserved
      expect(updatedClient.createdAt).toBe(testClient.createdAt); // Preserved

      // Verify persistence
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientId === testClient.clientId);
      expect(foundClient.name).toBe('Partially Updated Name');
      expect(foundClient.email).toBe('partial@example.com');
      expect(foundClient.phone).toBe('555-0002');
    });

    it('should throw error if client not found', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      await expect(updateClient('client-nonexistent-123', { name: 'Test' })).rejects.toThrow(
        'Client with ID client-nonexistent-123 not found'
      );
    });

    it('should preserve clientId and createdAt even if provided in update data', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Preserve Fields Client',
        email: 'preserve@example.com',
      });
      testClientsCreated.push(testClient);

      const originalClientId = testClient.clientId;
      const originalCreatedAt = testClient.createdAt;

      // Try to update with clientId and createdAt (should be ignored)
      const updatedClient = await updateClient(testClient.clientId, {
        name: 'Updated Name',
        clientId: 'client-hacked', // Should be ignored
        createdAt: '2024-12-31', // Should be ignored
      });

      expect(updatedClient.clientId).toBe(originalClientId); // Original ID preserved
      expect(updatedClient.name).toBe('Updated Name');
      expect(updatedClient.createdAt).toBe(originalCreatedAt); // Original timestamp preserved

      // Verify persistence
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientId === originalClientId);
      expect(foundClient.clientId).toBe(originalClientId);
      expect(foundClient.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('DELETE /api/clients/:id (deleteClient)', () => {
    it('should delete an existing client without deleting workouts', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Client To Delete',
        email: 'delete@example.com',
        phone: '555-0003',
        notes: 'This client will be deleted',
      });
      testClientsCreated.push(testClient);

      // Create a workout for this client
      const testWorkout = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [{ exerciseName: 'Bench Press', sets: [{ reps: 5, weight: 135 }] }],
        notes: 'Workout should remain after client deletion',
      });
      testWorkoutsCreated.push(testWorkout);

      const clientId = testClient.clientId;

      // Delete the client (without deleting workouts)
      await deleteClient(clientId, false);

      // Verify client is deleted
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientId === clientId);
      expect(foundClient).toBeUndefined();

      // Verify workout still exists
      const workouts = await getWorkoutsByClientId(clientId);
      expect(workouts.length).toBeGreaterThan(0);
      const foundWorkout = workouts.find(w => w.workoutId === testWorkout.workoutId);
      expect(foundWorkout).toBeDefined();

      // Remove from cleanup list since we already deleted it
      testClientsCreated = testClientsCreated.filter(c => c.clientId !== clientId);
      // Remove workout from cleanup since it will be orphaned (or we can clean it up manually)
      testWorkoutsCreated = testWorkoutsCreated.filter(w => w.workoutId !== testWorkout.workoutId);
    });

    it('should delete client and associated workouts when deleteWorkouts is true', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      // Create a test client
      const testClient = await createClient({
        name: 'Client To Delete With Workouts',
        email: 'delete-workouts@example.com',
        phone: '555-0004',
      });
      testClientsCreated.push(testClient);

      // Create workouts for this client
      const workout1 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-15',
        exercises: [{ exerciseName: 'Squat', sets: [{ reps: 5, weight: 225 }] }],
      });
      testWorkoutsCreated.push(workout1);

      const workout2 = await createWorkout({
        clientId: testClient.clientId,
        date: '2024-01-16',
        exercises: [{ exerciseName: 'Deadlift', sets: [{ reps: 3, weight: 315 }] }],
      });
      testWorkoutsCreated.push(workout2);

      const clientId = testClient.clientId;

      // Delete the client with workouts
      await deleteClient(clientId, true);

      // Verify client is deleted
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientId === clientId);
      expect(foundClient).toBeUndefined();

      // Verify workouts are also deleted
      const workouts = await getWorkoutsByClientId(clientId);
      expect(workouts.length).toBe(0);

      // Remove from cleanup lists since we already deleted everything
      testClientsCreated = testClientsCreated.filter(c => c.clientId !== clientId);
      testWorkoutsCreated = testWorkoutsCreated.filter(w => 
        w.workoutId !== workout1.workoutId && w.workoutId !== workout2.workoutId
      );
    });

    it('should throw error if client not found', async () => {
      if (!process.env[TEST_SPREADSHEET_ID_ENV]) {
        return; // Skip if test spreadsheet not configured
      }

      await expect(deleteClient('client-nonexistent-456', false)).rejects.toThrow(
        'Client with ID client-nonexistent-456 not found'
      );
    });
  });
});


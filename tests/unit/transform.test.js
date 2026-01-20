import { describe, it, expect } from '@jest/globals';
import {
  rowToClient,
  clientToRow,
  rowsToClients,
  rowsToWorkouts,
} from '../../src/utils/transform.js';

describe('Transform Utilities', () => {
  describe('rowToClient', () => {
    it('should convert row to client object', () => {
      const row = ['client-123', 'John Doe', 'john@example.com', '555-1234', 'Test notes', '2024-01-01'];
      const client = rowToClient(row);
      
      expect(client).toEqual({
        clientId: 'client-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        notes: 'Test notes',
        createdAt: '2024-01-01',
      });
    });

    it('should handle missing fields with empty strings', () => {
      const row = ['client-123', 'John Doe'];
      const client = rowToClient(row);
      
      expect(client).toEqual({
        clientId: 'client-123',
        name: 'John Doe',
        email: '',
        phone: '',
        notes: '',
        createdAt: '',
      });
    });

    it('should return null for empty row', () => {
      const row = [];
      const client = rowToClient(row);
      
      expect(client).toBeNull();
    });
  });

  describe('clientToRow', () => {
    it('should convert client object to row', () => {
      const client = {
        clientId: 'client-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        notes: 'Test notes',
        createdAt: '2024-01-01',
      };
      const row = clientToRow(client);
      
      expect(row).toEqual([
        'client-123',
        'John Doe',
        'john@example.com',
        '555-1234',
        'Test notes',
        '2024-01-01',
      ]);
    });

    it('should handle missing fields with empty strings', () => {
      const client = {
        clientId: 'client-123',
        name: 'John Doe',
      };
      const row = clientToRow(client);
      
      expect(row).toEqual([
        'client-123',
        'John Doe',
        '',
        '',
        '',
        '',
      ]);
    });
  });

  describe('rowsToClients', () => {
    it('should convert multiple rows to client array', () => {
      const rows = [
        ['clientId', 'name', 'email', 'phone', 'notes', 'createdAt'], // Header row
        ['client-1', 'John Doe', 'john@example.com', '555-1234', 'Notes 1', '2024-01-01'],
        ['client-2', 'Jane Smith', 'jane@example.com', '555-5678', 'Notes 2', '2024-01-02'],
      ];
      const clients = rowsToClients(rows);
      
      expect(clients).toHaveLength(2);
      expect(clients[0].name).toBe('John Doe');
      expect(clients[1].name).toBe('Jane Smith');
    });

    it('should skip header row', () => {
      const rows = [
        ['clientId', 'name', 'email'],
        ['client-1', 'John Doe', 'john@example.com'],
      ];
      const clients = rowsToClients(rows);
      
      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('John Doe');
    });

    it('should filter out empty rows', () => {
      const rows = [
        ['clientId', 'name'],
        ['client-1', 'John Doe'],
        ['', ''], // Empty row
        ['client-2', 'Jane Smith'],
      ];
      const clients = rowsToClients(rows);
      
      expect(clients).toHaveLength(2);
    });

    it('should return empty array for no data', () => {
      const rows = [];
      const clients = rowsToClients(rows);
      
      expect(clients).toEqual([]);
    });
  });

  describe('rowsToWorkouts', () => {
    it('should convert multiple rows to workout array', () => {
      const exercises1 = JSON.stringify([{ exerciseName: 'Bench Press', sets: [] }]);
      const exercises2 = JSON.stringify([{ exerciseName: 'Squat', sets: [] }]);
      
      const rows = [
        ['workoutId', 'clientId', 'date', 'exercises', 'notes', 'createdAt'], // Header row
        ['workout-1', 'client-1', '2024-01-01', exercises1, 'Notes 1', '2024-01-01'],
        ['workout-2', 'client-1', '2024-01-02', exercises2, 'Notes 2', '2024-01-02'],
      ];
      const workouts = rowsToWorkouts(rows);
      
      expect(workouts).toHaveLength(2);
      expect(workouts[0].workoutId).toBe('workout-1');
      expect(workouts[1].workoutId).toBe('workout-2');
    });

    it('should skip header row', () => {
      const exercises = JSON.stringify([{ exerciseName: 'Bench Press', sets: [] }]);
      const rows = [
        ['workoutId', 'clientId', 'date'],
        ['workout-1', 'client-1', '2024-01-01', exercises],
      ];
      const workouts = rowsToWorkouts(rows);
      
      expect(workouts).toHaveLength(1);
    });

    it('should return empty array for no data', () => {
      const rows = [];
      const workouts = rowsToWorkouts(rows);
      
      expect(workouts).toEqual([]);
    });
  });
});


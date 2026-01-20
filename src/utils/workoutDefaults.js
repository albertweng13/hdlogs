/**
 * Workout Defaults Utility
 * 
 * Functions to get smart defaults for workout entries based on previous sessions.
 */

import { getWorkoutsByClientId } from '../api/sheets.js';
import { normalizeExerciseName } from './exerciseNormalize.js';

/**
 * Find the most recent workout set for a given client and exercise
 * 
 * @param {string} clientId - Client ID
 * @param {string} exerciseName - Exercise name (will be normalized for comparison)
 * @returns {Promise<Object|null>} Most recent set object with { reps, weight, date } or null if not found
 */
export async function getLastSetForExercise(clientId, exerciseName) {
  try {
    const workouts = await getWorkoutsByClientId(clientId);
    
    if (!workouts || workouts.length === 0) {
      return null;
    }
    
    // Normalize exercise name for comparison
    const normalizedExerciseName = normalizeExerciseName(exerciseName);
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = workouts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Descending order
    });
    
    // Find most recent set for this exercise
    for (const workout of sortedWorkouts) {
      if (!workout.exercises || workout.exercises.length === 0) {
        continue;
      }
      
      for (const exercise of workout.exercises) {
        const normalizedCurrentName = normalizeExerciseName(exercise.exerciseName);
        
        if (normalizedCurrentName === normalizedExerciseName && exercise.sets && exercise.sets.length > 0) {
          // Return the last set (most recent) for this exercise
          const lastSet = exercise.sets[exercise.sets.length - 1];
          return {
            reps: lastSet.reps,
            weight: lastSet.weight,
            date: workout.date,
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last set for exercise:', error);
    return null;
  }
}

/**
 * Get default reps for an exercise
 * 
 * @param {string} clientId - Client ID
 * @param {string} exerciseName - Exercise name
 * @returns {Promise<number>} Default reps (6 if new exercise, last reps if exists)
 */
export async function getDefaultReps(clientId, exerciseName) {
  const lastSet = await getLastSetForExercise(clientId, exerciseName);
  
  if (lastSet && lastSet.reps) {
    return lastSet.reps;
  }
  
  // Default to 6 reps for new exercises
  return 6;
}

/**
 * Get default weight for an exercise
 * 
 * @param {string} clientId - Client ID
 * @param {string} exerciseName - Exercise name
 * @returns {Promise<number>} Default weight (0 if new exercise, last weight if exists)
 */
export async function getDefaultWeight(clientId, exerciseName) {
  const lastSet = await getLastSetForExercise(clientId, exerciseName);
  
  if (lastSet && lastSet.weight) {
    return lastSet.weight;
  }
  
  // Default to 0 for new exercises
  return 0;
}

/**
 * Get default reps and weight for an exercise
 * 
 * @param {string} clientId - Client ID
 * @param {string} exerciseName - Exercise name
 * @returns {Promise<Object>} Object with { reps, weight }
 */
export async function getDefaultRepsAndWeight(clientId, exerciseName) {
  const reps = await getDefaultReps(clientId, exerciseName);
  const weight = await getDefaultWeight(clientId, exerciseName);
  
  return { reps, weight };
}


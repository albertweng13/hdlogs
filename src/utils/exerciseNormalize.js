/**
 * Exercise Name Normalization Utility
 * 
 * Functions to normalize exercise names for comparison and storage.
 */

/**
 * Normalize exercise name for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove extra spaces
 * 
 * @param {string} exerciseName - Exercise name to normalize
 * @returns {string} Normalized exercise name
 */
export function normalizeExerciseName(exerciseName) {
  if (!exerciseName || typeof exerciseName !== 'string') {
    return '';
  }
  
  return exerciseName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Get canonical exercise name (for storage)
 * - Trim whitespace
 * - Capitalize first letter of each word
 * - Remove extra spaces
 * 
 * @param {string} exerciseName - Exercise name to canonicalize
 * @returns {string} Canonical exercise name
 */
export function canonicalizeExerciseName(exerciseName) {
  if (!exerciseName || typeof exerciseName !== 'string') {
    return '';
  }
  
  return exerciseName
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if two exercise names match (case-insensitive, trimmed)
 * 
 * @param {string} name1 - First exercise name
 * @param {string} name2 - Second exercise name
 * @returns {boolean} True if names match (normalized)
 */
export function exerciseNamesMatch(name1, name2) {
  return normalizeExerciseName(name1) === normalizeExerciseName(name2);
}


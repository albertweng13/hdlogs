import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Initialize Google Sheets API client using Service Account authentication
 * 
 * Reads credentials from environment variable GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY
 * which should contain the path to a JSON key file, or the JSON content itself.
 * 
 * @returns {Promise<google.auth.GoogleAuth>} Authenticated Google Auth client
 * @throws {Error} If credentials are missing or invalid
 */
export async function initializeGoogleSheetsAuth() {
  let serviceAccountKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      'GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY environment variable is required. ' +
      'Set it to either a file path or JSON string of your service account key.'
    );
  }

  // Trim whitespace (handles cases where .env file has extra spaces)
  serviceAccountKey = serviceAccountKey.trim();

  let credentials;
  
  // Check if it looks like JSON content (contains JSON markers)
  const looksLikeJson = serviceAccountKey.startsWith('{') || 
                        serviceAccountKey.includes('"type"') ||
                        serviceAccountKey.includes('"service_account"') ||
                        serviceAccountKey.includes('-----BEGIN PRIVATE KEY-----');
  
  if (looksLikeJson) {
    // It's a JSON string - try to parse it
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (error) {
      // If parsing fails, it might be multi-line JSON in .env file
      // Try removing newlines and parsing again
      try {
        const cleanedJson = serviceAccountKey.replace(/\n/g, '').replace(/\\n/g, '\n');
        credentials = JSON.parse(cleanedJson);
      } catch (secondError) {
        throw new Error('Failed to parse GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY as JSON. Make sure it\'s valid JSON. Error: ' + error.message);
      }
    }
  } else {
    // It's likely a file path
    try {
      // Check if it's a reasonable file path (doesn't contain JSON-like content)
      if (serviceAccountKey.includes('{') || serviceAccountKey.length > 500) {
        throw new Error('Value looks like JSON content but wasn\'t detected. Make sure JSON starts with { or contains "type"');
      }
      
      const keyFile = fs.readFileSync(serviceAccountKey, 'utf8');
      credentials = JSON.parse(keyFile);
    } catch (error) {
      throw new Error(`Failed to read service account key file at "${serviceAccountKey.substring(0, 50)}...". ` +
                     `If you're using JSON directly, make sure it starts with { or contains "type":"service_account". ` +
                     `Error: ${error.message}`);
    }
  }

  // Initialize auth client
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

/**
 * Get the Google Sheets spreadsheet ID from environment variables
 * 
 * @returns {string} Spreadsheet ID
 * @throws {Error} If spreadsheet ID is not configured
 */
export function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    throw new Error(
      'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required. ' +
      'Set it to your Google Sheets spreadsheet ID.'
    );
  }
  
  return spreadsheetId;
}


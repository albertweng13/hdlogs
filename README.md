# hdlogs

A web application for personal gym trainers to organize and manage their clients' workout data. The app provides a clean, simple interface for non-technical trainers to input, organize, and view client information and workout sessions, with Google Sheets serving as the backend data store.

Version 1.0.1

## Features

- **Client Management**: Add and view clients with contact information
- **Workout Tracking**: Record workout sessions with exercises, sets, reps, weights, and notes
- **Workout History**: View complete workout history for each client
- **Single-Page Interface**: All functionality accessible on one page with no navigation
- **Dark Theme**: Modern, clean dark-themed UI

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Google account with Google Sheets API access
- Google Sheets API credentials (Service Account JSON key file)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and create
   - Click on the service account > "Keys" > "Add Key" > "Create new key"
   - Choose JSON format and download the key file

### 3. Create Google Sheets

1. Create a new Google Sheet (or use an existing one)
2. Share the sheet with the service account email (found in the JSON key file, e.g., `your-service-account@your-project.iam.gserviceaccount.com`)
   - Give it "Editor" permissions
3. **Automatic Setup**: The application will automatically create the required sheet tabs ("Clients" and "Workouts") and populate the headers when you first use the API. No manual setup needed!

   **Note**: If you prefer manual setup, you can create the sheets and headers yourself:
   
   **Clients Sheet:**
   - Row 1: `clientId`, `name`, `email`, `phone`, `notes`, `createdAt`

   **Workouts Sheet:**
   - Row 1: `workoutId`, `clientId`, `date`, `exercises`, `notes`, `createdAt`

### 4. Configure Environment Variables

Create a `.env` file in the root directory. You have two options for `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY`:

**Option 1: File Path** (Recommended for local development)
```env
# Path to your service account JSON key file
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=/path/to/your-service-account-key.json

# Your Google Sheets spreadsheet ID (found in the URL)
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Server port (optional, defaults to 3000)
PORT=3000
```

**Option 2: JSON String** (Useful for deployment platforms like Vercel, Heroku, etc.)
```env
# JSON content directly (must start with {)
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}

# Your Google Sheets spreadsheet ID
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Server port (optional, defaults to 3000)
PORT=3000
```

**Note:** When using JSON string directly, you may need to escape quotes or use single quotes around the entire JSON value depending on your environment. For deployment platforms, you can often paste the entire JSON as a single-line string in their environment variable settings.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
npm start
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Integration tests require a test Google Sheet. Set up `GOOGLE_SHEETS_TEST_SPREADSHEET_ID` in your `.env` file, then run:

```bash
npm run test:integration
```

## Project Structure

```
warbak-trainer/
  src/
    api/
      server.js          # Express server setup
      routes.js          # API endpoints
      sheets.js          # Google Sheets API client
    config/
      credentials.js     # Google Sheets authentication
    frontend/
      index.html         # Main HTML file
      styles.css          # Application styles
      app.js             # Frontend application logic
    utils/
      transform.js       # Data transformation utilities
  tests/
    unit/                # Unit tests
    integration/         # Integration tests
```

## API Endpoints

- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `GET /api/clients/:id/workouts` - Get workouts for a client
- `POST /api/workouts` - Create a new workout
- `GET /api/debug/sheets` - Diagnostic endpoint to check sheet setup status

## Data Model

### Client
- `clientId`: string (auto-generated)
- `name`: string
- `email`: string (optional)
- `phone`: string (optional)
- `notes`: string (optional)
- `createdAt`: string (ISO date)

### Workout
- `workoutId`: string (auto-generated)
- `clientId`: string
- `date`: string (ISO date)
- `exercises`: array of exercise objects
  - `exerciseName`: string
  - `sets`: array of set objects
    - `reps`: number
    - `weight`: number
    - `notes`: string (optional)
- `notes`: string (optional)
- `createdAt`: string (ISO date)

## License

ISC


# Development and Testing

This file describes how to develop and test this application.

## How to Run the Application

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Google account with Google Sheets API access
- Google Sheets API credentials (Service Account JSON or OAuth credentials)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Google Sheets API credentials
```

### Development Setup

1. **Create Google Sheets**:
   - Create a new Google Sheet (or use an existing one)
   - Share with service account email (if using Service Account) or configure OAuth
   - **Note**: The application automatically creates the required sheets ("Clients" and "Workouts") and headers when first accessed. Manual setup is optional.

2. **Configure API Credentials**:
   - For Service Account: Download JSON key file, set `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` in `.env`
   - For OAuth: Set `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, etc.
   - Set `GOOGLE_SHEETS_SPREADSHEET_ID` to your sheet's ID

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:3000` (or configured port)

### Build for Production

```bash
# Build for production
npm run build

# Deploy (example for Vercel/Netlify)
npm run deploy
```

## Development Workflow

1. **Read** sprint task
2. **Implement** feature
3. **Write tests**
4. **Run tests** - ensure they pass
5. **Update** sprint status
6. **Update** retro if sprint complete

## Testing Approach

This is a **Sheets-Backed App** (see `project-types/sheets-backed-app.md`). Testing should focus on:

### Unit Tests

Test business logic and utilities:

```bash
npm test
```

**What to test**:
- Data transformation utilities (`src/utils/transform.js`)
- Google Sheets API client functions (mocked)
- Data validation logic
- Exercise/set data structure handling

**Example**:
```javascript
// tests/unit/transform.test.js
describe('transformClientData', () => {
  it('converts Google Sheets row to client object', () => {
    const row = ['client-123', 'John Doe', 'john@example.com', '555-1234', 'Notes', '2024-01-01'];
    const client = transformClientData(row);
    expect(client).toEqual({
      clientId: 'client-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      notes: 'Notes',
      createdAt: '2024-01-01'
    });
  });
});
```

### Integration Tests

Test API endpoints with actual Google Sheets API (using test sheet):

```bash
npm run test:integration
```

**What to test**:
- CRUD operations for clients
- CRUD operations for workouts
- Error handling for API failures
- Rate limiting and retry logic

**Setup**:
- Use a separate test Google Sheet
- Set `GOOGLE_SHEETS_TEST_SPREADSHEET_ID` in test environment
- Clean up test data after tests

**Example**:
```javascript
// tests/integration/api.test.js
describe('API Integration', () => {
  it('creates a new client in Google Sheets', async () => {
    const client = { name: 'Test Client', email: 'test@example.com' };
    const result = await createClient(client);
    expect(result.clientId).toBeDefined();
    expect(result.name).toBe('Test Client');
  });
});
```

### Manual Testing

**Critical flows to test manually**:
- Add new client → Verify appears in client list
- Select client → Verify workout history loads
- Add workout → Verify appears in workout history
- Verify data persists in Google Sheets
- Test concurrent edits (if applicable)

## Test Requirements

- **Every feature** must have tests
- **Tests must pass** before task completion
- **Unit tests** for all business logic
- **Integration tests** for all API endpoints
- **Mock Google Sheets API** in unit tests
- **Use test Google Sheet** for integration tests

## Common Testing Patterns

See `06-TESTING-PATTERNS.md` for established testing patterns as they emerge.

## Debugging

### Common Issues

1. **Environment Variables Not Loading**:
   - **Always restart the server** after adding or modifying `.env` file
   - Environment variables are loaded at server startup via `dotenv.config()`, not on each request
   - If you add/modify `.env` while server is running, restart with `npm run dev` or `npm start`
   - Use diagnostic endpoint `/api/debug/sheets` to check if credentials are loaded correctly

2. **Google Sheets API Authentication**:
   - Verify credentials in `.env`
   - Check service account permissions
   - Verify sheet is shared with service account (if using Service Account)
   - If missing sheet error occurs, use `/api/debug/sheets` to see available sheets and get better error messages

3. **Rate Limiting**:
   - Google Sheets API has rate limits
   - Implement retry logic with exponential backoff
   - Consider caching for read operations

4. **Data Format Issues**:
   - Verify sheet column structure matches expected format
   - Check JSON parsing for exercises data
   - Validate data types (dates, numbers)

### Debugging Tools

- Browser DevTools for frontend debugging
- Node.js debugger for backend
- Google Sheets API logs
- Network tab for API calls

## Deployment

### Deployment Options

- **Vercel**: Serverless functions for API, static hosting for frontend (✅ Configured)
- **Netlify**: Similar to Vercel (requires similar configuration)
- **AWS Lambda**: Serverless functions
- **Traditional hosting**: Node.js server + static files

### Deploying to Vercel

The application is configured for Vercel deployment with:
- `vercel.json` - Vercel configuration for routing and rewrites
- `api/index.js` - Serverless function entry point that exports the Express app

**Steps to Deploy:**

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Push your code to GitHub/GitLab/Bitbucket
   - Import the repository in Vercel dashboard
   - Vercel will automatically detect the configuration

3. **Or deploy via CLI**:
   ```bash
   vercel
   ```

4. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project settings → Environment Variables
   - Add the following variables:
     - `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` - **Important**: Use the JSON string format (the entire JSON key file content as a single string)
     - `GOOGLE_SHEETS_SPREADSHEET_ID` - Your Google Sheet ID
     - `NODE_ENV=production` (optional, but recommended)

   **Note for `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY`**:
   - Since Vercel doesn't support file paths, you MUST use the JSON string format
   - Paste the entire contents of your service account JSON key file
   - Vercel will handle escaping/parsing automatically
   - Example format: `{"type":"service_account","project_id":"your-project",...}`

5. **Redeploy** after adding environment variables (Vercel will automatically redeploy, or you can trigger manually)

### Environment Variables

Set in deployment platform:
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` - **JSON string format** (not file path) for Vercel/serverless platforms
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Your Google Sheet ID
- `NODE_ENV=production` (optional, but recommended)

**Important**: When deploying to serverless platforms like Vercel:
- **Do NOT use file paths** for `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY`
- **Use JSON string format** - paste the entire JSON content as a single-line string
- The application's `credentials.js` will automatically detect and handle JSON string format

### How Vercel Configuration Works

- **API Routes** (`/api/*`): Handled by `api/index.js` serverless function
- **Static Files** (HTML, CSS, JS): Served directly from `src/frontend/` via rewrites
- **SPA Routing**: All non-API routes serve `index.html` for client-side routing
- **Build Process**: Runs `npm run build` (which validates tests) before deployment

### Testing Deployment Locally

You can test the Vercel configuration locally:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Run Vercel dev server (simulates production)
vercel dev
```

### Post-Deployment

1. Verify Google Sheets API credentials work in production
2. Test all CRUD operations (create, read, update, delete clients and workouts)
3. Monitor for rate limiting issues
4. Check error logs in Vercel dashboard
5. Verify static assets are loading correctly (CSS, JS)
6. Test API endpoints: `/api/clients`, `/api/workouts`, etc.

---

**This file will be updated as development practices are established.**


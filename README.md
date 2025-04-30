# ADP Punch Automation

Automated system for punching in/out on ADP SecurTime and generating reports.

## Features

- Automated punch-in at 10:05 AM on weekdays
- Automated punch-out at 11:58 PM on weekdays
- Daily report generation and upload to Google Drive
- Separate reports for punch-in and punch-out events
- Web dashboard for monitoring and manual control

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file from `.env.sample` and fill in your credentials.

3. Run locally:
   ```
   npm start
   ```

## Deploying to Netlify

### Method 1: Netlify UI

1. Push your code to a GitHub repository

2. Log in to Netlify and click "New site from Git"

3. Connect to your GitHub repository

4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `public`

5. Add environment variables in the Netlify UI under "Site settings" > "Environment variables":
   - Add all the variables from your `.env` file

6. Deploy the site

### Method 2: Netlify CLI

1. Install Netlify CLI globally:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize Netlify site:
   ```
   netlify init
   ```

4. Set up environment variables:
   ```
   netlify env:import .env
   ```

5. Deploy the site:
   ```
   netlify deploy --prod
   ```

### Setting Up Scheduled Functions

1. After deploying to Netlify, go to your site dashboard

2. Install the Scheduler add-on:
   - Click "Integrations" tab
   - Find "Netlify Scheduler" and install it

3. Create schedules using the Netlify dashboard:
   - Create a schedule for punch-in: `0 5 10 * * 1-5` (10:05 AM weekdays)
   - Create a schedule for punch-out: `0 58 23 * * 1-5` (11:58 PM weekdays)
   - Link them to the functions `scheduled-punch-in` and `scheduled-punch-out` respectively

4. Make sure your functions have the necessary environment variables

## Google Drive Setup

To enable report upload to Google Drive:

1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create a service account with Drive access
4. Download service account key
5. Share your Google Drive folder with the service account email
6. Base64 encode the key file contents:
   ```
   cat your-key-file.json | base64
   ```
7. Add the encoded string as `GOOGLE_CREDENTIALS_BASE64` in Netlify environment variables

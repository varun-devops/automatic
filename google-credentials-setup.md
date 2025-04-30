# Setting up Google Drive API Credentials

Follow these steps to create and configure Google Drive API credentials for this application:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Give it a name like "ADP Automation"

## 2. Enable the Google Drive API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and enable it

## 3. Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Grant the service account the role of "Editor" for Drive
5. Click "Done"

## 4. Create and Download Service Account Key

1. From the Credentials page, click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose JSON format
5. The key file will download automatically

## 5. Share Your Google Drive Folder with the Service Account

1. Open your Google Drive
2. Navigate to the folder with ID: 1ahCyMxDDJ_N4IeuDzSqKAaiauLw4AxW3
3. Right-click and select "Share"
4. Add the service account email (it looks like: something@project-id.iam.gserviceaccount.com)
5. Give it "Editor" permission
6. Click "Share"

## 6. Add the Credentials to Your Project

1. Rename the downloaded key file to `google-credentials.json`
2. Place it in the root directory of this project
3. Make sure it's listed in `.gitignore` to prevent accidentally committing it

## 7. For Netlify Deployment

For Netlify deployment, you'll need to:

1. Base64 encode the credentials file:
   ```
   cat google-credentials.json | base64
   ```
2. Add the encoded content as an environment variable in Netlify:
   - Variable name: GOOGLE_CREDENTIALS_BASE64
   - Value: (paste the base64 encoded string)

3. Then modify the authentication in your code to use:
   ```javascript
   const credentials = JSON.parse(
     Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString()
   );
   
   const auth = new google.auth.GoogleAuth({
     credentials,
     scopes: ['https://www.googleapis.com/auth/drive']
   });
   ```

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
let google;

// Try to load the googleapis module, but don't fail if it's not installed
try {
  google = require('googleapis');
} catch (error) {
  console.warn('Google API module not found. Google Drive upload will be disabled.');
  console.warn('Run "npm install googleapis" to enable this feature.');
}

require('dotenv').config();

// Global variables to store punch-in and punch-out times
let punchInTime = null;
let punchOutTime = null;

async function punchIn() {
  console.log('==============================================');
  console.log('🚀 STARTING PUNCH-IN AUTOMATION PROCESS');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('==============================================');
  
  // Only run on weekdays (Monday to Friday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('⚠️ Today is weekend. Skipping punch-in.');
    return { message: 'Today is weekend. Skipping punch-in.' };
  }
  
  console.log('✅ Today is a weekday. Proceeding with punch-in.');

  console.log('🔄 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('✅ Browser launched successfully.');

  try {
    console.log('🔄 Creating new page...');
    const page = await browser.newPage();
    console.log('✅ New page created.');
    
    // Navigate to the login page
    console.log('🔄 Navigating to ADP SecurTime login page...');
    await page.goto('https://telesyssoftware.securtime.adp.com/login?redirectUrl=%2Fwelcome', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('✅ Arrived at login page.');

    // Wait for the page to load completely - using the correct selector
    console.log('🔄 Waiting for login form to load...');
    await page.waitForSelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > st-input', 
      { timeout: 60000 });
    console.log('✅ Login form loaded.');
    
    // Fill in the login credentials with correct selectors
    console.log('🔄 Entering login credentials...');
    
    // Using evaluate to set the username value - this works better for custom elements
    await page.evaluate(() => {
      const usernameInput = document.querySelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > st-input input');
      if (usernameInput) {
        usernameInput.value = 'varun.singh@telesys.com';
        // Trigger input event for reactive frameworks
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    // Using evaluate to set the password value
    await page.evaluate(() => {
      const passwordInput = document.querySelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > div:nth-child(4) > st-input input');
      if (passwordInput) {
        passwordInput.value = 'Varun@12345';
        // Trigger input event for reactive frameworks
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    console.log('✅ Credentials entered.');
    
    // Click the sign-in button - find the correct selector
    console.log('🔄 Clicking sign-in button...');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    console.log('✅ Sign-in button clicked.');
    
    // Wait for navigation to complete after login
    console.log('🔄 Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Navigation after login completed.');
    
    // Skip the refresh to avoid potential issues with the page state
    console.log('🔄 Looking for Punch In button before refreshing...');
    try {
      // Try to find the button without refreshing first
      await page.waitForSelector('.punch-btns button:contains("Punch In")', { timeout: 10000 });
      console.log('✅ Punch In button found without refreshing.');
    } catch (error) {
      // If button not found, then try refreshing
      console.log('⚠️ Punch In button not found initially, refreshing the page...');
      await page.reload({ waitUntil: 'networkidle2' });
      console.log('✅ Page refreshed successfully.');
      
      // Look for punch in button again after refresh
      console.log('🔄 Looking for Punch In button after refresh...');
      await page.waitForSelector('.punch-btns button:contains("Punch In")', { timeout: 60000 });
      console.log('✅ Punch In button found after refreshing.');
    }
    
    // Wait for the Punch In button to be visible and click it
    console.log('🔄 Clicking Punch In button...');
    await page.click('.punch-btns button:contains("Punch In")');
    console.log('✅ Punch In button clicked.');
    
    // Wait for the success message
    console.log('🔄 Waiting for punch-in confirmation message...');
    await page.waitForSelector('.modal-body:contains("Punch IN submission successfully...")');
    console.log('✅ Punch IN confirmation received!');
    
    // Store the punch-in time
    punchInTime = new Date();
    console.log(`📌 Recorded punch-in time: ${punchInTime.toLocaleString()}`);
    
    // Click the close button
    console.log('🔄 Closing the confirmation dialog...');
    await page.waitForSelector('.new-btn-style.float-right.glyphicon.glyphicon-remove');
    await page.click('.new-btn-style.float-right.glyphicon.glyphicon-remove');
    console.log('✅ Confirmation dialog closed.');
    
    // Wait a moment to ensure the modal closes
    console.log('🔄 Waiting for dialog to fully close...');
    await page.waitForTimeout(2000);
    console.log('✅ Dialog fully closed.');
    
    // Generate and upload a punch-in report
    console.log('🔄 Generating punch-in report...');
    const inReportResult = await generateAndUploadReport('punch-in');
    console.log('✅ Punch-in report generated:', inReportResult);
    
    console.log('==============================================');
    console.log(`🟢 PUNCH IN SUCCESSFUL at ${new Date().toLocaleTimeString()}`);
    console.log('==============================================');
    return { 
      success: true, 
      message: 'Punch-in completed successfully', 
      time: punchInTime,
      reportResult: inReportResult
    };
  } catch (error) {
    console.log('==============================================');
    console.log('❌ ERROR DURING PUNCH-IN PROCESS:');
    console.error(error);
    console.log('==============================================');
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    console.log('🔄 Closing browser...');
    await browser.close();
    console.log('✅ Browser closed.');
  }
}

async function punchOut() {
  console.log('==============================================');
  console.log('🚀 STARTING PUNCH-OUT AUTOMATION PROCESS');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('==============================================');
  
  // Only run on weekdays (Monday to Friday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('⚠️ Today is weekend. Skipping punch-out.');
    return { message: 'Today is weekend. Skipping punch-out.' };
  }
  
  console.log('✅ Today is a weekday. Proceeding with punch-out.');

  console.log('🔄 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('✅ Browser launched successfully.');

  try {
    console.log('🔄 Creating new page...');
    const page = await browser.newPage();
    console.log('✅ New page created.');
    
    // Navigate to the login page
    console.log('🔄 Navigating to ADP SecurTime login page...');
    await page.goto('https://telesyssoftware.securtime.adp.com/login?redirectUrl=%2Fwelcome', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('✅ Arrived at login page.');

    // Wait for the page to load completely - using the correct selector
    console.log('🔄 Waiting for login form to load...');
    await page.waitForSelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > st-input', 
      { timeout: 60000 });
    console.log('✅ Login form loaded.');
    
    // Fill in the login credentials with correct selectors
    console.log('🔄 Entering login credentials...');
    
    // Using evaluate to set the username value - this works better for custom elements
    await page.evaluate(() => {
      const usernameInput = document.querySelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > st-input input');
      if (usernameInput) {
        usernameInput.value = 'varun.singh@telesys.com';
        // Trigger input event for reactive frameworks
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    // Using evaluate to set the password value
    await page.evaluate(() => {
      const passwordInput = document.querySelector('#appContentContainer > div > app-login > div > div > div > div.col-xs-12.login-card.no-padding-left.no-padding-right.margin-bottom-25px > div:nth-child(3) > form > div:nth-child(4) > st-input input');
      if (passwordInput) {
        passwordInput.value = 'Varun@12345';
        // Trigger input event for reactive frameworks
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    console.log('✅ Credentials entered.');
    
    // Click the sign-in button - find the correct selector
    console.log('🔄 Clicking sign-in button...');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    console.log('✅ Sign-in button clicked.');
    
    // Wait for navigation to complete after login
    console.log('🔄 Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Navigation after login completed.');
    
    // Skip the refresh to avoid potential issues with the page state
    console.log('🔄 Looking for Punch Out button before refreshing...');
    try {
      // Try to find the button without refreshing first
      await page.waitForSelector('.punch-btns button:contains("Punch Out"), .punch-btns div:contains("Punch Out")', { timeout: 10000 });
      console.log('✅ Punch Out button found without refreshing.');
    } catch (error) {
      // If button not found, then try refreshing
      console.log('⚠️ Punch Out button not found initially, refreshing the page...');
      await page.reload({ waitUntil: 'networkidle2' });
      console.log('✅ Page refreshed successfully.');
      
      // Look for punch out button again after refresh
      console.log('🔄 Looking for Punch Out button after refresh...');
      await page.waitForSelector('.punch-btns button:contains("Punch Out"), .punch-btns div:contains("Punch Out")', { timeout: 60000 });
      console.log('✅ Punch Out button found after refreshing.');
    }
    
    // Take a screenshot to help debugging
    await page.screenshot({ path: 'punch-out-screen.png' });
    console.log('📸 Screenshot taken for debugging');
    
    // Try alternative selectors for the Punch Out button
    console.log('🔄 Trying to identify and click Punch Out button...');
    
    // Try different strategies to find the button
    const punchOutButton = await page.evaluate(() => {
      // Strategy 1: Look for a button with text content containing "Punch Out"
      let btn = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent.includes('Punch Out')
      );
      if (btn) return { selector: 'textContent', found: true };
      
      // Strategy 2: Look for a div in the punch-btns class that contains "Punch Out"
      btn = document.querySelector('.punch-btns div:nth-child(2)');
      if (btn && btn.textContent.includes('Punch Out')) return { selector: 'punch-btns-div-2', found: true };
      
      // Strategy 3: Look for any element with class that might be for punch out
      btn = document.querySelector('[class*="punch-out"], [id*="punch-out"]');
      if (btn) return { selector: 'class-or-id', found: true };
      
      // If none found, grab all possible candidates for manual review
      const allButtons = Array.from(document.querySelectorAll('button, .btn, [role="button"], div[onclick]'))
        .map(el => ({
          text: el.textContent.trim(),
          classes: el.className,
          id: el.id,
          path: getElementPath(el)
        }));
      
      function getElementPath(element) {
        if (!element) return '';
        let path = '';
        while (element && element !== document.body) {
          let selector = element.tagName.toLowerCase();
          if (element.id) {
            selector += '#' + element.id;
            return path ? selector + ' > ' + path : selector;
          } else {
            let siblings = Array.from(element.parentNode.children);
            if (siblings.length > 1) {
              let index = siblings.indexOf(element) + 1;
              selector += ':nth-child(' + index + ')';
            }
          }
          path = path ? selector + ' > ' + path : selector;
          element = element.parentNode;
        }
        return path;
      }
      
      return { 
        selector: 'none', 
        found: false, 
        candidates: allButtons
      };
    });
    
    console.log('Button search result:', punchOutButton);
    
    // Based on the result, click the appropriate element
    if (punchOutButton.found) {
      if (punchOutButton.selector === 'textContent') {
        await page.click('button:contains("Punch Out")');
      } else if (punchOutButton.selector === 'punch-btns-div-2') {
        await page.click('.punch-btns div:nth-child(2)');
      } else if (punchOutButton.selector === 'class-or-id') {
        await page.click('[class*="punch-out"], [id*="punch-out"]');
      }
      console.log('✅ Punch Out button clicked using selector:', punchOutButton.selector);
    } else {
      console.log('⚠️ Could not find Punch Out button directly. Attempting to use candidates...');
      
      // If we have candidate buttons, try clicking the most likely one
      if (punchOutButton.candidates && punchOutButton.candidates.length > 0) {
        const likelyPunchOutBtn = punchOutButton.candidates.find(btn => 
          btn.text.toLowerCase().includes('punch out') || 
          btn.text.toLowerCase().includes('punch-out') || 
          btn.text.toLowerCase().includes('out')
        );
        
        if (likelyPunchOutBtn) {
          console.log('🔄 Trying to click candidate button:', likelyPunchOutBtn);
          await page.click(likelyPunchOutBtn.path);
          console.log('✅ Candidate button clicked');
        } else {
          throw new Error('Could not find any button that might be for punch out');
        }
      } else {
        throw new Error('No punch out button candidates found');
      }
    }
    
    // Wait for the success message
    console.log('🔄 Waiting for punch-out confirmation message...');
    await page.waitForSelector('.modal-body:contains("Punch OUT submission successfully..."), .modal-body:contains("successful"), .alert:contains("success")', 
      { timeout: 20000 });
    console.log('✅ Punch OUT confirmation received!');
    
    // Store the punch-out time (fixed to 23:59 for consistency)
    punchOutTime = new Date();
    punchOutTime.setHours(23, 59, 0);
    console.log(`📌 Recorded punch-out time: ${punchOutTime.toLocaleString()}`);
    
    // Click the close button
    console.log('🔄 Closing the confirmation dialog...');
    await page.waitForSelector('.new-btn-style.float-right.glyphicon.glyphicon-remove');
    await page.click('.new-btn-style.float-right.glyphicon.glyphicon-remove');
    console.log('✅ Confirmation dialog closed.');
    
    // Wait a moment to ensure the modal closes
    console.log('🔄 Waiting for dialog to fully close...');
    await page.waitForTimeout(2000);
    console.log('✅ Dialog fully closed.');
    
    // Generate and upload a punch-out report
    console.log('🔄 Generating punch-out report...');
    const outReportResult = await generateAndUploadReport('punch-out');
    console.log('✅ Punch-out report generated:', outReportResult);
    
    console.log('==============================================');
    console.log(`🟢 PUNCH OUT SUCCESSFUL at ${new Date().toLocaleTimeString()}`);
    console.log('==============================================');
    return { 
      success: true, 
      message: 'Punch-out completed successfully', 
      time: punchOutTime,
      reportResult: outReportResult
    };
  } catch (error) {
    console.log('==============================================');
    console.log('❌ ERROR DURING PUNCH-OUT PROCESS:');
    console.error(error);
    console.log('==============================================');
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    console.log('🔄 Closing browser...');
    await browser.close();
    console.log('✅ Browser closed.');
  }
}

async function generateAndUploadReport(reportType = 'daily') {
  console.log('==============================================');
  console.log(`📊 GENERATING ${reportType.toUpperCase()} REPORT`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('==============================================');
  
  // If we don't have both punch-in and punch-out times, try to retrieve them from the web portal
  if ((!punchInTime && reportType === 'daily') || (!punchOutTime && reportType === 'daily')) {
    console.log('Missing punch time data, attempting to retrieve from portal...');
    try {
      await retrievePunchTimesFromPortal();
    } catch (error) {
      console.error('Error retrieving punch times from portal:', error);
      if (reportType === 'daily') {
        return { success: false, error: 'Could not retrieve complete punch time data' };
      }
      // For punch-in or punch-out reports, continue even if we can't get both times
    }
  }
  
  try {
    // Create report content
    const reportDate = new Date().toLocaleDateString();
    let reportFilename;
    let reportContent;
    
    if (reportType === 'punch-in') {
      // Punch-in specific report
      const punchInTimeStr = punchInTime ? punchInTime.toLocaleTimeString() : 'Unknown';
      reportContent = `
Punch-In Report for ${reportDate}
================================
Employee: ${process.env.ADP_USERNAME}
Punch-In Time: ${punchInTimeStr}
================================
Report generated automatically at ${new Date().toLocaleString()}
`;
      reportFilename = `punch_in_report_${reportDate.replace(/\//g, '-')}.txt`;
    } 
    else if (reportType === 'punch-out') {
      // Punch-out specific report
      const punchOutTimeStr = punchOutTime ? punchOutTime.toLocaleTimeString() : 'Unknown';
      
      // Calculate hours worked if we have both times
      let hoursWorked = 'Unknown';
      if (punchInTime && punchOutTime) {
        const timeDiffMs = punchOutTime - punchInTime;
        const hoursDecimal = timeDiffMs / (1000 * 60 * 60);
        const hours = Math.floor(hoursDecimal);
        const minutes = Math.floor((hoursDecimal - hours) * 60);
        hoursWorked = `${hours}h ${minutes}m`;
      }
      
      reportContent = `
Punch-Out Report for ${reportDate}
================================
Employee: ${process.env.ADP_USERNAME}
Punch-Out Time: ${punchOutTimeStr}
Total Hours Worked: ${hoursWorked}
================================
Report generated automatically at ${new Date().toLocaleString()}
`;
      reportFilename = `punch_out_report_${reportDate.replace(/\//g, '-')}.txt`;
    }
    else {
      // Regular daily report with both punch-in and punch-out
      const punchInTimeStr = punchInTime ? punchInTime.toLocaleTimeString() : 'Unknown';
      const punchOutTimeStr = punchOutTime ? punchOutTime.toLocaleTimeString() : 'Unknown';
      
      // Calculate hours worked
      let hoursWorked = 'Unknown';
      if (punchInTime && punchOutTime) {
        const timeDiffMs = punchOutTime - punchInTime;
        const hoursDecimal = timeDiffMs / (1000 * 60 * 60);
        const hours = Math.floor(hoursDecimal);
        const minutes = Math.floor((hoursDecimal - hours) * 60);
        hoursWorked = `${hours}h ${minutes}m`;
      }
      
      reportContent = `
Daily Time Report for ${reportDate}
================================
Employee: ${process.env.ADP_USERNAME}
Punch In Time: ${punchInTimeStr}
Punch Out Time: ${punchOutTimeStr}
Hours Worked: ${hoursWorked}
================================
Report generated automatically at ${new Date().toLocaleString()}
`;
      reportFilename = `time_report_${reportDate.replace(/\//g, '-')}.txt`;
    }

    // Ensure the reports directory exists
    const reportsDirPath = path.join(__dirname, '..', 'reports');
    await fs.mkdir(reportsDirPath, { recursive: true });
    
    const localFilePath = path.join(reportsDirPath, reportFilename);
    
    // Write the report to a local file
    await fs.writeFile(localFilePath, reportContent);
    console.log(`Report saved locally at: ${localFilePath}`);
    
    // Try to upload to Google Drive if the APIs are available
    let uploadResult = { success: false, message: 'Google Drive API not available' };
    if (google) {
      try {
        uploadResult = await uploadToGoogleDrive(localFilePath, reportFilename);
        console.log('Upload result:', uploadResult);
        console.log('==============================================');
        console.log(`🟢 REPORT SUCCESSFULLY UPLOADED TO GOOGLE DRIVE`);
        console.log(`📄 File: ${reportFilename}`);
        console.log(`🔗 Link: ${uploadResult.webViewLink || 'Not available'}`);
        console.log('==============================================');
        return { 
          success: true, 
          message: `${reportType} report generated and uploaded successfully`,
          reportFile: reportFilename,
          localPath: localFilePath,
          driveLink: uploadResult.webViewLink || 'Not available'
        };
      } catch (uploadError) {
        console.error('Error uploading to Google Drive:', uploadError);
        return { 
          success: true, 
          message: `${reportType} report generated successfully but upload failed`,
          reportFile: reportFilename,
          localPath: localFilePath,
          uploadError: uploadError.message
        };
      }
    } else {
      return { 
        success: true, 
        message: `${reportType} report generated successfully (Google Drive upload not available)`,
        reportFile: reportFilename,
        localPath: localFilePath
      };
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
}

async function uploadToGoogleDrive(filePath, fileName) {
  if (!google) {
    throw new Error('Google API module not available. Run "npm install googleapis" to enable this feature.');
  }
  
  try {
    console.log(`Uploading ${fileName} to Google Drive...`);
    
    // Check if credentials are available
    let auth;
    
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      // For Netlify deployment - decode base64 encoded credentials
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString()
      );
      
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Using credentials file
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else {
      throw new Error('No Google API credentials found. Set up GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_BASE64.');
    }
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Target folder ID from Google Drive URL
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1ahCyMxDDJ_N4IeuDzSqKAaiauLw4AxW3';
    
    // File metadata
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    // Read the file
    const fileContent = await fs.readFile(filePath);
    
    // Media object for file upload
    const media = {
      mimeType: 'text/plain',
      body: fileContent
    };
    
    // Upload the file
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink'
    });
    
    console.log(`File uploaded successfully. File ID: ${response.data.id}`);
    console.log(`Web View Link: ${response.data.webViewLink}`);
    return response.data;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

async function retrievePunchTimesFromPortal() {
  console.log('Attempting to retrieve punch times from ADP portal...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the login page
    await page.goto('https://telesyssoftware.securtime.adp.com/login?redirectUrl=%2Fwelcome', {
      waitUntil: 'networkidle2'
    });

    // Login process
    await page.type('input[name="username"]', process.env.ADP_USERNAME);
    await page.type('input[name="password"]', process.env.ADP_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Navigate to the time report page (adjust this based on actual ADP portal structure)
    await page.goto('https://telesyssoftware.securtime.adp.com/timesheet', {
      waitUntil: 'networkidle2'
    });
    
    // Extract today's punch times from the page (adjust selectors based on actual page structure)
    const todayPunches = await page.evaluate(() => {
      const today = new Date().toLocaleDateString();
      // This is a placeholder - you'll need to adapt this to match ADP's actual page structure
      const punchesRow = Array.from(document.querySelectorAll('.timesheet-row'))
        .find(row => row.querySelector('.date-cell').textContent.includes(today));
        
      if (!punchesRow) return null;
      
      const punchInCell = punchesRow.querySelector('.punch-in-cell');
      const punchOutCell = punchesRow.querySelector('.punch-out-cell');
      
      return {
        punchIn: punchInCell ? punchInCell.textContent.trim() : null,
        punchOut: punchOutCell ? punchOutCell.textContent.trim() : null
      };
    });
    
    if (todayPunches) {
      if (todayPunches.punchIn) {
        punchInTime = new Date(`${new Date().toLocaleDateString()} ${todayPunches.punchIn}`);
      }
      
      if (todayPunches.punchOut) {
        punchOutTime = new Date(`${new Date().toLocaleDateString()} ${todayPunches.punchOut}`);
      }
      
      console.log(`Retrieved punch times - In: ${punchInTime?.toLocaleString()}, Out: ${punchOutTime?.toLocaleString()}`);
    } else {
      console.log('Could not find today\'s punch data in the portal');
    }
  } catch (error) {
    console.error('Error retrieving punch times from portal:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { punchIn, punchOut, generateAndUploadReport };

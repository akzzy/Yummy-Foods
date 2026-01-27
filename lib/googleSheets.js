import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function addRow(sheetTitle, rowData) {
  try {
    // Initialize auth - this is the "service account" approach
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

    // Load Document Info
    await doc.loadInfo();

    // Get the sheet by title (e.g., "Sales", "Expenses")
    // If not found, try to create it or fallback to index 0
    let sheet = doc.sheetsByTitle[sheetTitle];

    if (!sheet) {
      // Try to create the sheet if it doesn't exist
      try {
        sheet = await doc.addSheet({ title: sheetTitle });
      } catch (e) {
        console.warn(`Could not create sheet '${sheetTitle}', falling back to first sheet.`);
        sheet = doc.sheetsByIndex[0];
      }
    }

    // Ensure headers are set
    try {
      await sheet.loadHeaderRow();
    } catch (e) {
      // Headers likely missing, set them based on sheet title
      if (sheetTitle === "Sales") {
        await sheet.setHeaderRow(['Date', 'Customer', 'Quantity', 'Unit Price', 'Total Amount', 'Timestamp']);
      } else if (sheetTitle === "Expenses") {
        await sheet.setHeaderRow(['Date', 'Category', 'Description', 'Amount', 'Timestamp']);
      } else {
        // Fallback
        await sheet.setHeaderRow(['Date', 'Amount', 'Timestamp']);
      }
    }

    // Append the row
    await sheet.addRow({
      ...rowData,
      Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
    });

    return { success: true };
  } catch (error) {
    console.error('Google Sheets Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getRows(sheetTitle) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Ensure Timezone is IST - Removed as per user request
    // if (doc.timeZone !== 'Asia/Kolkata') {
    //   await doc.updateProperties({ timeZone: 'Asia/Kolkata' });
    // }

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return [];

    const rows = await sheet.getRows();
    return rows.map(row => row.toObject());
  } catch (error) {
    console.error('Error fetching rows:', error);
    return [];
  }
}



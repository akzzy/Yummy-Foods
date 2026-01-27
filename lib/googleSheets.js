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

export async function ensureReportSheets() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Ensure Timezone is IST - Removed as per user request
    // if (doc.timeZone !== 'Asia/Kolkata') {
    //   await doc.updateProperties({ timeZone: 'Asia/Kolkata' });
    // }

    // 1. Sales Report
    if (!doc.sheetsByTitle["Sales Report"]) {
      const sheet = await doc.addSheet({ title: "Sales Report" });
      // Query: Group by Month (Col A) and Sum Total (Col E)
      // Note: We use Col A for month label. Assuming A is Date.
      await sheet.loadCells('A1');
      const a1 = sheet.getCell(0, 0);
      a1.formula = `=QUERY(Sales!A:E, "SELECT MIN(A), SUM(E) WHERE A IS NOT NULL GROUP BY MONTH(A), YEAR(A) LABEL MIN(A) 'Month', SUM(E) 'Total Sales' FORMAT MIN(A) 'mmm-yyyy'")`;
      await sheet.saveUpdatedCells();
    }

    // 2. Expense Report
    if (!doc.sheetsByTitle["Expense Report"]) {
      const sheet = await doc.addSheet({ title: "Expense Report" });
      // Query: Group by Month (Col A), Category (Col B), Sum Amount (Col D)
      await sheet.loadCells('A1');
      const a1 = sheet.getCell(0, 0);
      a1.formula = `=QUERY(Expenses!A:D, "SELECT MIN(A), B, SUM(D) WHERE A IS NOT NULL GROUP BY MONTH(A), YEAR(A), B LABEL MIN(A) 'Month', B 'Category', SUM(D) 'Amount' FORMAT MIN(A) 'mmm-yyyy'")`;
      await sheet.saveUpdatedCells();
    }

    return true;
  } catch (error) {
    console.error("Error creating report sheets:", error);
    return false;
  }
}

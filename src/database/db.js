import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'AayushMitra.sqlite' });

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// SQLite rows ko normal JavaScript array me convert karna
const rowsToArray = (rows) => {
  if (!rows) return [];

  // Some SQLite versions
  if (rows._array) {
    return rows._array;
  }

  // Direct array
  if (Array.isArray(rows)) {
    return rows;
  }

  // SQLite iterator
  const items = [];
  if (rows.length !== undefined) {
    for (let i = 0; i < rows.length; i++) {
      items.push(rows.item ? rows.item(i) : rows[i]);
    }
  }

  return items;
};

// Helper: Local Date (Example: 2026-08-19)
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Local Time (Example: 03:25 PM)
const getLocalTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// =====================================================
// 1. DATABASE INITIALIZATION & MIGRATIONS
// =====================================================

export const initDatabase = async () => {
  try {
    // 1. Medicines Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_uri TEXT,
        total_stock INTEGER,
        remaining_stock INTEGER,
        course_days INTEGER,
        meal_type TEXT,
        alarm_time TEXT,
        doses TEXT
      );
    `);

    // Migration: doses column (agar pehle se nahi hai)
    try {
      await db.execute(`
        ALTER TABLE medicines ADD COLUMN doses TEXT;
      `);
    } catch (e) {
      // Column already exists
    }

    // 2. Medicine History Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS medicine_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER,
        medicine_name TEXT,
        status TEXT,
        dose_time TEXT,
        action_time TEXT,
        date TEXT
      );
    `);

    // 3. Patient Reports Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS patient_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_type TEXT NOT NULL,
        test_date TEXT NOT NULL,
        next_test_date TEXT,
        image_uri TEXT,
        notes TEXT,
        created_at TEXT
      );
    `);

    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.log('[DB INIT ERROR]:', error);
  }
};

// =====================================================
// 2. MEDICINE CRUD OPERATIONS
// =====================================================

// Insert Medicine
export const insertMedicine = async (med) => {
  try {
    const totalStock = Number(med.totalStock) || 30;
    const courseDays = Number(med.courseDays) || 30;

    const query = `
      INSERT INTO medicines
      (
        name,
        image_uri,
        total_stock,
        remaining_stock,
        course_days,
        meal_type,
        alarm_time,
        doses
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const params = [
      med.name,
      med.imageUri || '',
      totalStock,
      totalStock,
      courseDays,
      med.mealType || '',
      med.alarmTime || '08:00',
      JSON.stringify(med.doses || [med.alarmTime || '08:00']),
    ];

    const result = await db.execute(query, params);
    let insertedId = result?.insertId;

    // Fallback for getting last insert ID
    if (!insertedId) {
      const lastIdRes = await db.execute(`
        SELECT last_insert_rowid() AS id;
      `);

      const rows = rowsToArray(lastIdRes?.rows);
      if (rows.length > 0) {
        insertedId = rows[0].id;
      }
    }

    console.log('[DB] Medicine inserted. ID:', insertedId);

    return {
      success: true,
      insertId: insertedId,
    };
  } catch (error) {
    console.log('[DB INSERT ERROR]:', error);
    return {
      success: false,
      insertId: null,
    };
  }
};

// Get All Medicines
export const getAllMedicines = async () => {
  try {
    const result = await db.execute(`
      SELECT *
      FROM medicines
      ORDER BY id DESC;
    `);

    return rowsToArray(result?.rows);
  } catch (error) {
    console.log('[DB FETCH MEDICINES ERROR]:', error);
    return [];
  }
};

// Get Single Medicine By ID
export const getMedicineById = async (id) => {
  try {
    const result = await db.execute(
      `
      SELECT *
      FROM medicines
      WHERE id = ?
      LIMIT 1;
      `,
      [id]
    );

    const rows = rowsToArray(result?.rows);
    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.log('[DB GET MEDICINE ERROR]:', error);
    return null;
  }
};

// Edit / Update Medicine
export const updateMedicine = async (med) => {
  try {
    // 1. Existing medicine fetch karo
    const existingResult = await db.execute(
      `SELECT total_stock, remaining_stock
       FROM medicines
       WHERE id = ?;`,
      [med.id]
    );

    if (
      !existingResult ||
      !existingResult.rows ||
      existingResult.rows.length === 0
    ) {
      console.log('[DB UPDATE] Medicine not found:', med.id);
      return null;
    }

    const existingMedicine = existingResult.rows.item
      ? existingResult.rows.item(0)
      : existingResult.rows[0];

    // 2. Old values
    const oldTotalStock = Number(existingMedicine.total_stock) || 0;
    const oldRemainingStock = Number(existingMedicine.remaining_stock) || 0;

    // 3. New Total Stock
    const newTotalStock = Number(med.totalStock) || oldTotalStock;

    // 4. Calculate already consumed tablets
    const consumedStock = Math.max(0, oldTotalStock - oldRemainingStock);

    // 5. Calculate new Remaining Stock
    let newRemainingStock = newTotalStock - consumedStock;

    // Stock negative nahi hone dena
    if (newRemainingStock < 0) {
      newRemainingStock = 0;
    }

    console.log('[DB UPDATE] Old Total:', oldTotalStock);
    console.log('[DB UPDATE] Old Remaining:', oldRemainingStock);
    console.log('[DB UPDATE] Consumed:', consumedStock);
    console.log('[DB UPDATE] New Total:', newTotalStock);
    console.log('[DB UPDATE] New Remaining:', newRemainingStock);

    // 6. Update medicine
    const query = `
      UPDATE medicines
      SET
        name = ?,
        image_uri = ?,
        total_stock = ?,
        remaining_stock = ?,
        course_days = ?,
        meal_type = ?,
        alarm_time = ?,
        doses = ?
      WHERE id = ?;
    `;

    const params = [
      med.name,
      med.imageUri || '',
      newTotalStock,
      newRemainingStock,
      Number(med.courseDays) || 0,
      med.mealType,
      med.alarmTime || '08:00',
      JSON.stringify(med.doses || [med.alarmTime || '08:00']),
      med.id,
    ];

    const result = await db.execute(query, params);

    console.log('[DB UPDATE] Medicine updated successfully:', med.id);
    return result;
  } catch (err) {
    console.log('[DB UPDATE ERROR]', err);
    return null;
  }
};

// Manual Stock Update / Refill
export const addMedicineStock = async (medicineId, quantity) => {
  try {
    const amount = Number(quantity);

    if (!medicineId || !Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    await db.execute(
      `
      UPDATE medicines
      SET
        total_stock = total_stock + ?,
        remaining_stock = remaining_stock + ?
      WHERE id = ?;
      `,
      [amount, amount, medicineId]
    );

    console.log(`[DB] Stock added: Medicine ${medicineId}, +${amount}`);
    return true;
  } catch (error) {
    console.log('[DB ADD STOCK ERROR]:', error);
    return false;
  }
};

// Delete Medicine
export const deleteMedicine = async (id) => {
  try {
    const medicineId = Number(id);

    if (!Number.isInteger(medicineId)) {
      console.log('[DELETE] Invalid medicine ID:', id);
      return false;
    }

    console.log('[DELETE] Starting delete:', medicineId);

    // 1. Pehle database se medicine delete karo
    const result = await db.execute(
      `DELETE FROM medicines WHERE id = ?;`,
      [medicineId]
    );

    console.log('[DELETE] Database delete completed:', result);

    // 2. History ko intentionally DELETE nahi karna
    console.log('[DELETE] Medicine history preserved');

    // 3. Notifications cancel karo
    try {
      await cancelAllNotificationsForMedicine(medicineId);
      console.log('[DELETE] Notifications cancelled:', medicineId);
    } catch (notificationError) {
      console.log('[DELETE] Notification cancellation failed:', notificationError);
    }

    return true;
  } catch (error) {
    console.log('[DELETE MEDICINE ERROR]', error);
    return false;
  }
};

// =====================================================
// 3. MEDICINE ACTIONS & HISTORY
// =====================================================

// Record Medicine Action (TAKEN / MISSED)
export const recordMedicineAction = async (
  medicineId,
  medicineName,
  doseTime,
  status
) => {
  try {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    console.log('[HISTORY] Recording action:', {
      medicineId,
      medicineName,
      doseTime,
      status,
      date: dateStr,
      actionTime: timeStr,
    });

    // Every dose = separate history record
    await db.execute(
      `
      INSERT INTO medicine_history
      (
        medicine_id,
        medicine_name,
        status,
        dose_time,
        action_time,
        date
      )
      VALUES (?, ?, ?, ?, ?, ?);
      `,
      [
        medicineId,
        medicineName,
        status,
        doseTime || '',
        timeStr,
        dateStr,
      ]
    );

    // Stock sirf TAKEN par reduce hoga
    if (status === 'TAKEN') {
      await db.execute(
        `
        UPDATE medicines
        SET remaining_stock =
          CASE
            WHEN remaining_stock > 0
            THEN remaining_stock - 1
            ELSE 0
          END
        WHERE id = ?;
        `,
        [medicineId]
      );
    }

    // Latest remaining stock check
    const checkRes = await db.execute(
      `
      SELECT remaining_stock
      FROM medicines
      WHERE id = ?;
      `,
      [medicineId]
    );

    let remaining = 0;
    if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
      const item = checkRes.rows.item
        ? checkRes.rows.item(0)
        : checkRes.rows[0];
      remaining = Number(item.remaining_stock) || 0;
    }

    console.log('[HISTORY] Action saved successfully');
    console.log('[HISTORY] Remaining stock:', remaining);

    return {
      success: true,
      remainingStock: remaining,
      name: medicineName,
    };
  } catch (err) {
    console.log('[HISTORY ERROR]', err);
    return {
      success: false,
    };
  }
};

// Simple Take Medicine Helper
export const reduceStockAndTakeMedicine = async (id) => {
  const medicine = await getMedicineById(id);

  if (!medicine) {
    return {
      success: false,
      deleted: true,
    };
  }

  return await recordMedicineAction(
    id,
    medicine.name,
    medicine.alarm_time || '',
    'TAKEN'
  );
};

// Get All Medicine History
export const getMedicineHistory = async () => {
  try {
    const result = await db.execute(`
      SELECT *
      FROM medicine_history
      ORDER BY date DESC, id DESC;
    `);

    const history = rowsToArray(result?.rows);
    console.log('[DB HISTORY] Records:', history.length);
    return history;
  } catch (error) {
    console.log('[DB FETCH HISTORY ERROR]:', error);
    return [];
  }
};

// Get History Grouped By Date
export const getMedicineHistoryGroupedByDate = async () => {
  try {
    const res = await db.execute(
      `
      SELECT *
      FROM medicine_history
      ORDER BY date DESC, id DESC;
      `
    );

    const list = rowsToArray(res?.rows);

    // Date ke according grouping
    const groups = {};
    list.forEach((item) => {
      const date = item.date || 'UNKNOWN';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    // Object -> Array
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        records: groups[date],
      }));
  } catch (error) {
    console.log('[GROUPED HISTORY ERROR]', error);
    return [];
  }
};

// =====================================================
// 4. PATIENT REPORTS
// =====================================================

// Insert Patient Report
export const insertPatientReport = async (report) => {
  try {
    const now = new Date();
    const createdAt = now.toISOString();

    const result = await db.execute(
      `
      INSERT INTO patient_reports
      (
        report_type,
        test_date,
        next_test_date,
        image_uri,
        notes,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?);
      `,
      [
        report.reportType,
        report.testDate,
        report.nextTestDate || '',
        report.imageUri || '',
        report.notes || '',
        createdAt,
      ]
    );

    console.log('[REPORT] Saved successfully:', result?.insertId);

    return {
      success: true,
      insertId: result?.insertId,
    };
  } catch (error) {
    console.log('[REPORT INSERT ERROR]', error);
    return {
      success: false,
    };
  }
};

// Get All Patient Reports
export const getAllPatientReports = async () => {
  try {
    const result = await db.execute(
      `
      SELECT *
      FROM patient_reports
      ORDER BY id DESC;
      `
    );

    return rowsToArray(result?.rows);
  } catch (error) {
    console.log('[REPORT FETCH ERROR]', error);
    return [];
  }
};

// =====================================================
// Delete Patient Report
// =====================================================

export const deletePatientReport = async (id) => {
  try {
    const reportId = Number(id);

    if (!Number.isInteger(reportId)) {
      console.log('[REPORT DELETE] Invalid ID:', id);
      return false;
    }

    await db.execute(
      `DELETE FROM patient_reports WHERE id = ?;`,
      [reportId]
    );

    console.log(
      '[REPORT DELETE] Deleted report:',
      reportId
    );

    return true;

  } catch (error) {
    console.log(
      '[REPORT DELETE ERROR]',
      error
    );

    return false;
  }
};
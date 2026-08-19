
import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'AayushMitra.sqlite' });


// =====================================================
// Helper: SQLite rows ko normal JavaScript array me convert
// =====================================================
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


// =====================================================
// Helper: Local Date
// Example: 2026-08-19
// =====================================================
const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


// =====================================================
// Helper: Local Time
// Example: 03:25 PM
// =====================================================
const getLocalTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};


// =====================================================
// 1. DATABASE INITIALIZATION
// =====================================================
export const initDatabase = async () => {
  try {
    // -------------------------------------------------
    // Medicines Table
    // -------------------------------------------------
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


    // -------------------------------------------------
    // Migration: doses column
    // -------------------------------------------------
    try {
      await db.execute(`
        ALTER TABLE medicines ADD COLUMN doses TEXT;
      `);
    } catch (e) {
      // Column already exists
    }


    // -------------------------------------------------
    // Medicine History Table
    // -------------------------------------------------
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


    console.log('[DB] Database initialized successfully');

  } catch (error) {
    console.log('[DB INIT ERROR]:', error);
  }
};


// =====================================================
// 2. INSERT MEDICINE
// =====================================================
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
      JSON.stringify(
        med.doses || [med.alarmTime || '08:00']
      ),
    ];

    const result = await db.execute(query, params);

    let insertedId = result?.insertId;

    // Fallback
    if (!insertedId) {
      const lastIdRes = await db.execute(`
        SELECT last_insert_rowid() AS id;
      `);

      const rows = rowsToArray(lastIdRes?.rows);

      if (rows.length > 0) {
        insertedId = rows[0].id;
      }
    }

    console.log(
      '[DB] Medicine inserted. ID:',
      insertedId
    );

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


// =====================================================
// 3. GET ALL MEDICINES
// =====================================================
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


// =====================================================
// 4. GET SINGLE MEDICINE
// =====================================================
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


// =====================================================
// 5. UPDATE MEDICINE
// IMPORTANT:
// Remaining stock intentionally preserve kiya gaya hai.
// Edit karne se stock reset nahi hoga.
// =====================================================
export const updateMedicine = async (med) => {
  try {
    if (!med?.id) {
      console.log('[DB UPDATE] Medicine ID missing');
      return false;
    }

    const existingMedicine = await getMedicineById(med.id);

    if (!existingMedicine) {
      console.log(
        '[DB UPDATE] Medicine not found:',
        med.id
      );

      return false;
    }

    const query = `
      UPDATE medicines
      SET
        name = ?,
        image_uri = ?,
        total_stock = ?,
        course_days = ?,
        meal_type = ?,
        alarm_time = ?,
        doses = ?
      WHERE id = ?;
    `;

    const params = [
      med.name,
      med.imageUri ?? existingMedicine.image_uri ?? '',
      Number(med.totalStock) || existingMedicine.total_stock || 0,
      Number(med.courseDays) || existingMedicine.course_days || 0,
      med.mealType ?? existingMedicine.meal_type ?? '',
      med.alarmTime ?? existingMedicine.alarm_time ?? '08:00',
      JSON.stringify(
        med.doses ||
        existingMedicine.doses ||
        [med.alarmTime || existingMedicine.alarm_time || '08:00']
      ),
      med.id,
    ];

    await db.execute(query, params);

    console.log(
      '[DB] Medicine updated:',
      med.id
    );

    return true;

  } catch (error) {
    console.log('[DB UPDATE ERROR]:', error);

    return false;
  }
};


// =====================================================
// 6. MANUAL STOCK UPDATE
// Iska use stock add/refill ke liye karenge.
// =====================================================
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

    console.log(
      `[DB] Stock added: Medicine ${medicineId}, +${amount}`
    );

    return true;

  } catch (error) {
    console.log('[DB ADD STOCK ERROR]:', error);

    return false;
  }
};


// =====================================================
// 7. DELETE MEDICINE
// IMPORTANT:
// History DELETE nahi hogi.
// Sirf medicine + future notifications remove honge.
// =====================================================
export const deleteMedicine = async (id) => {
  try {
    if (!id) {
      return false;
    }

    // -------------------------------------------------
    // NotificationService ko dynamic import kar rahe hain
    // taaki circular dependency ka risk na ho.
    // -------------------------------------------------
    try {
      const {
        cancelAllNotificationsForMedicine,
      } = await import(
        '../services/NotificationService'
      );

      if (cancelAllNotificationsForMedicine) {
        await cancelAllNotificationsForMedicine(id);
      }

    } catch (notificationError) {
      console.log(
        '[DELETE] Notification cancel error:',
        notificationError
      );
    }


    // -------------------------------------------------
    // Medicine delete
    // -------------------------------------------------
    await db.execute(
      `
      DELETE FROM medicines
      WHERE id = ?;
      `,
      [id]
    );


    // -------------------------------------------------
    // IMPORTANT:
    // medicine_history ko DELETE nahi karna.
    // Purani history future me bhi dikhni chahiye.
    // -------------------------------------------------

    console.log(
      '[DB] Medicine deleted:',
      id
    );

    return true;

  } catch (error) {
    console.log(
      '[DB DELETE MEDICINE ERROR]:',
      error
    );

    return false;
  }
};


// =====================================================
// 8. RECORD TAKEN / MISSED ACTION
//
// TAKEN:
//   History INSERT
//   Stock -1
//
// MISSED:
//   History INSERT
//   Stock unchanged
// =====================================================
export const recordMedicineAction = async (
  medicineId,
  medicineName,
  doseTime,
  status
) => {
  try {

    if (!medicineId) {
      console.log(
        '[ACTION] Medicine ID missing'
      );

      return {
        success: false,
      };
    }


    // -------------------------------------------------
    // Only valid statuses
    // -------------------------------------------------
    if (status !== 'TAKEN' && status !== 'MISSED') {
      console.log(
        '[ACTION] Invalid status:',
        status
      );

      return {
        success: false,
      };
    }


    // -------------------------------------------------
    // First verify medicine still exists.
    //
    // Agar medicine delete ho chuki hai aur koi old
    // notification press ho gaya, to history/stock
    // update nahi hona chahiye.
    // -------------------------------------------------
    const medicine = await getMedicineById(
      medicineId
    );

    if (!medicine) {
      console.log(
        '[ACTION] Medicine no longer exists:',
        medicineId
      );

      return {
        success: false,
        deleted: true,
      };
    }


    const finalMedicineName =
      medicine.name ||
      medicineName ||
      'Medicine';


    // -------------------------------------------------
    // Current local date/time
    // -------------------------------------------------
    const dateStr = getLocalDate();

    const timeStr = getLocalTime();


    // -------------------------------------------------
    // History INSERT
    // -------------------------------------------------
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
        finalMedicineName,
        status,
        doseTime || '',
        timeStr,
        dateStr,
      ]
    );


    console.log(
      `[DB HISTORY] ${finalMedicineName} → ${status}`
    );


    // -------------------------------------------------
    // TAKEN → Stock -1
    // -------------------------------------------------
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

      console.log(
        `[DB STOCK] ${finalMedicineName} stock decreased by 1`
      );
    }


    // -------------------------------------------------
    // Get updated stock
    // -------------------------------------------------
    const updatedMedicine =
      await getMedicineById(medicineId);


    const remainingStock =
      updatedMedicine?.remaining_stock ?? 0;


    console.log(
      `[DB STOCK] Remaining: ${remainingStock}`
    );


    return {
      success: true,
      medicineId: medicineId,
      name: finalMedicineName,
      status: status,
      remainingStock: remainingStock,
      date: dateStr,
      actionTime: timeStr,
    };


  } catch (error) {

    console.log(
      '[DB RECORD ACTION ERROR]:',
      error
    );

    return {
      success: false,
    };
  }
};


// =====================================================
// 9. SIMPLE TAKE MEDICINE HELPER
// =====================================================
export const reduceStockAndTakeMedicine = async (
  id
) => {

  const medicine =
    await getMedicineById(id);

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


// =====================================================
// 10. GET MEDICINE HISTORY
//
// Latest history first.
// Deleted medicine ki old history bhi yahan milegi.
// =====================================================
export const getMedicineHistory = async () => {
  try {

    const result = await db.execute(`
      SELECT *
      FROM medicine_history
      ORDER BY date DESC, id DESC;
    `);

    const history =
      rowsToArray(result?.rows);

    console.log(
      '[DB HISTORY] Records:',
      history.length
    );

    return history;

  } catch (error) {

    console.log(
      '[DB FETCH HISTORY ERROR]:',
      error
    );

    return [];
  }
};


// =====================================================
// 11. GET HISTORY BY DATE
// Example:
// getMedicineHistoryByDate('2026-08-19')
// =====================================================
export const getMedicineHistoryByDate = async (
  date
) => {
  try {

    const result = await db.execute(
      `
      SELECT *
      FROM medicine_history
      WHERE date = ?
      ORDER BY id DESC;
      `,
      [date]
    );

    return rowsToArray(result?.rows);

  } catch (error) {

    console.log(
      '[DB HISTORY DATE ERROR]:',
      error
    );

    return [];
  }
};

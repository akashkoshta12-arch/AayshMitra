import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'AayushMitra.sqlite' });

export const initDatabase = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_uri TEXT,
        total_stock INTEGER,
        remaining_stock INTEGER,
        course_days INTEGER,
        meal_type TEXT,
        alarm_time TEXT
      );
    `);
    console.log('Database Initialized');
  } catch (e) {
    console.log('DB Init Error:', e);
  }
};

export const insertMedicine = async (med) => {
  try {
    const query = `
      INSERT INTO medicines 
      (name, image_uri, total_stock, remaining_stock, course_days, meal_type, alarm_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      med.name,
      med.imageUri || '',
      Number(med.totalStock) || 30,
      Number(med.totalStock) || 30,
      Number(med.courseDays) || 30,
      med.mealType,
      med.alarmTime,
    ];
    const res = await db.execute(query, params);
    return res;
  } catch (e) {
    console.log('DB Insert Error:', e);
    return null;
  }
};

export const getAllMedicines = async () => {
  try {
    const result = await db.execute('SELECT * FROM medicines ORDER BY id DESC;');
    if (!result || !result.rows) return [];
    
    // Normalize format
    if (Array.isArray(result.rows)) return result.rows;
    if (result.rows._array) return result.rows._array;
    
    const items = [];
    if (result.rows.length) {
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item ? result.rows.item(i) : result.rows[i]);
      }
    }
    return items;
  } catch (err) {
    console.log('Error fetching medicines:', err);
    return [];
  }
};

export const deleteMedicine = async (id) => {
  try {
    await db.execute('DELETE FROM medicines WHERE id = ?;', [id]);
    console.log(`Medicine ${id} deleted successfully`);
    return true;
  } catch (err) {
    console.log('Error deleting medicine:', err);
    return false;
  }
};
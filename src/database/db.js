import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'AayushMitra.sqlite' });

export const initDatabase = () => {
  db.execute(`
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
};

export const insertMedicine = (med) => {
  const query = `
    INSERT INTO medicines 
    (name, image_uri, total_stock, remaining_stock, course_days, meal_type, alarm_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const params = [
    med.name,
    med.imageUri,
    med.totalStock,
    med.totalStock,
    med.courseDays,
    med.mealType,
    med.alarmTime,
  ];
  return db.execute(query, params);
};

export const getAllMedicines = () => {
  const result = db.execute('SELECT * FROM medicines ORDER BY id DESC;');
  return result.rows?._array || [];
};

export const reduceStockAndTakeMedicine = (id) => {
  db.execute('UPDATE medicines SET remaining_stock = remaining_stock - 1 WHERE id = ? AND remaining_stock > 0;', [id]);
};
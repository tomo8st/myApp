// データベース操作関連の関数をまとめたモジュール
const fs = require('fs').promises;
const stream = require('stream');

let db; // データベース接続を保持する変数

// データベース接続を設定する関数
function setDatabase(database) {
  db = database;
}

// テスト用のデータ取得関数
async function testIpc() {
  console.log(`testIpc() start.`);
  // テキストファイルを読み込んで中身を返す。
  let filePath = '/Users/tomo/Documents/Angular/myApp/data.json';
  let data = await fs.readFile(filePath, 'utf8');
  return { data };
}

// 指定された日付のアイテムを取得する関数
async function getItems(date) {
  console.log('getItems called with date:', date);
  try {
    const stmt = db.prepare(`
      SELECT 
        id, 
        date, 
        displayOrder, 
        CAST(category AS INTEGER) AS category,
        meeting, 
        item, 
        begintime, 
        endtime, 
        plantime, 
        actualtime, 
        diffefent, 
        planbegintime, 
        etc 
      FROM todos 
      WHERE date = ?
    `);
    const items = stmt.all(date);

    console.log('取得したアイテム:', items); // デバッグ用
    return items;
  } catch (error) {
    console.error('アイテム取得エラー:', error);
    throw error;
  }
}

// 配列をJSONファイルに書き込む関数
async function writeArrayToJson(data) {
  try {
    console.log('受け取ったデータ:', JSON.stringify(data)); // デバッグ用

    let filePath = '/Users/tomo/Documents/Angular/myApp/data.json';
    console.log('保存先パス:', filePath); // デバッグ用

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('ファイル書き込み成功'); // デバッグ用

    return { success: true, message: 'データが正常に保存されしまた' };
  } catch (error) {
    console.error('ファイル書き込み中にエラーが発生しました:', error);
    return { success: false, message: `データの保存に失敗しました: ${error.message}` };
  }
}

// データを挿入する関数
async function insertItem(item) {
  const stmt = db.prepare(`
    INSERT INTO todos (
      date, displayOrder, category, meeting, item, begintime, endtime, 
      plantime, actualtime, diffefent, planbegintime, etc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    item.date, item.displayOrder, item.category, item.meeting, item.item, 
    item.begintime, item.endtime, item.plantime, item.actualtime, 
    item.diffefent, item.planbegintime, item.etc
  );
  return { id: info.lastInsertRowid };
}

// データを更新する関数
async function updateItem(item) {
  console.log('Updating item:', item); // デバッグ用ログ
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item data');
  }
  const stmt = db.prepare(`
    UPDATE todos SET
      id = ?, date = ?, displayOrder = ?, category = ?, 
      meeting = ?, item = ?, begintime = ?, 
      endtime = ?, plantime = ?, actualtime = ?, diffefent = ?, 
      planbegintime = ?, etc = ?
    WHERE id = ?
  `);
  const info = stmt.run(
    item.id, item.date, item.displayOrder, item.category, 
    item.meeting, item.item, item.begintime, 
    item.endtime, item.plantime, item.actualtime, item.diffefent, 
    item.planbegintime, item.etc, item.id
  );
  console.log('更新結果:', info.changes); // デバッグ用
  return { changes: info.changes };
}

// データを削除する関数
async function deleteItem(item) {
  const stmt = db.prepare(`
    DELETE FROM todos WHERE id = ?
  `);
  const info = stmt.run(item.id);
  return { changes: info.changes };
}

// テーブルを削除する関数
async function deleteTable() {
  const stmt = db.prepare(`
    DROP TABLE IF EXISTS todos;
  `);
  const info = stmt.run();
  return { changes: info.changes };
}

// テーブルを削除して再作成する関数
async function deleteAndRecreateTable() {
  try {
    db.prepare('DROP TABLE IF EXISTS todos').run();
    db.prepare(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        displayOrder INTEGER,
        category TEXT,
        meeting TEXT,
        item TEXT,
        begintime TEXT,
        endtime TEXT,
        plantime TEXT,
        actualtime TEXT,
        diffefent TEXT,
        planbegintime TEXT,
        etc TEXT
      )
    `).run();
    console.log('Table deleted and recreated successfully');
    return { success: true, message: 'テーブルが正常に削除され、再作成されました。' };
  } catch (error) {
    console.error('Error deleting and recreating table:', error);
    return { success: false, message: error.message };
  }
}

// 全データを削除する関数
async function deleteAllTodos() {
  try {
    await db.prepare('DELETE FROM todos').run();
    return { success: true };
  } catch (error) {
    console.error('Error deleting all todos:', error);
    throw error;
  }
}

// カテゴリテーブル作成
async function createCategoryTable() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `).run();
    return { success: true, message: 'カテゴリテーブルが作成されました' };
  } catch (error) {
    console.error('カテゴリテーブル作成エラー:', error);
    return { success: false, message: error.message };
  }
}

// 初期カテゴリの挿入
async function insertInitialCategories() {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO categories (name) VALUES (?)
    `);
    const initialCategories = ['仕事', '個人', 'その他'];
    initialCategories.forEach(category => stmt.run(category));
    return { success: true, message: '初期カテゴリが挿入されました' };
  } catch (error) {
    console.error('初期カテゴリ挿入エラー:', error);
    return { success: false, message: error.message };
  }
}

// カテゴリの取得
async function getCategories() {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    return { success: true, categories };
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    return { success: false, message: error.message };
  }
}

// カテゴリの追加
async function addCategory(name) {
  try {
    const stmt = db.prepare(`
      INSERT INTO categories (name) VALUES (?)
    `);
    const info = stmt.run(name);
    return { success: true, id: info.lastInsertRowid, name: name };
  } catch (error) {
    console.error('カテゴリ追加エラー:', error);
    return { success: false, message: 'カテゴリの追加中にエラーが発生しました。' };
  }
}

// カテゴリの更新
async function updateCategory(category) {
  console.log('カテゴリを更新中:', category);
  if (!category || typeof category !== 'object') {
    throw new Error('無効なカテゴリデータです');
  }
  const stmt = db.prepare(`
    UPDATE categories SET
      name = ?
    WHERE id = ?
  `);
  const info = stmt.run(category.name, category.id);
  console.log('更新結果:', info.changes);
  return { changes: info.changes };
}

// カテゴリの削除
async function deleteCategory(categoryId) {
  try {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const info = stmt.run(categoryId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('カテゴリ削除エラー:', error);
    return { success: false, message: error.message };
  }
}

// 全アイテムの取得
async function getAllItems() {
  try {
    const items = db.prepare('SELECT * FROM todos').all();
    return { success: true, items };
  } catch (error) {
    console.error('全アイテム取得エラー:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  setDatabase,
  getItems,
  testIpc,
  writeArrayToJson,
  insertItem,
  updateItem,
  deleteItem,
  deleteTable,
  deleteAndRecreateTable,
  deleteAllTodos,
  createCategoryTable,
  insertInitialCategories,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getAllItems
};

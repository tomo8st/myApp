const fs = require('fs').promises;
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const url = require('url');
const Database = require('better-sqlite3');

let win;
let db;

function createWindow() {

  // ウインドウの作成
  win = new BrowserWindow({
    width: 1800
    , height: 1000
    , webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // ウインドウに表示する内容
  // win.loadFile('dist/my-app/browser/index.html');

  // 開発モードの場合は localhost:4200 を読み込む
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);

  // デバッグ画面表示
  win.webContents.openDevTools();

  // このウインドウが閉じられたときの処理
  win.on('closed', () => {
    win = null;
  })
}

// アプリが初期化されたとき（起動されたとき）
app.whenReady().then(() => {
  createWindow();

  // データベースファイルのパスを指定
  const dbPath = path.join(app.getPath('userData'), 'todoDatabase.sqlite');

  // データベース接続
  db = new Database(dbPath);

  // テーブル作成（必要に応じて）
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
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
  `);
})

// 全ウインドウが閉じられたとき
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

// アクティブになったとき（MacだとDockがクリックされたとき）
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
})

// testIpcイベントの定義 
ipcMain.handle('testIpc', async (event, arg) => {
   console.log(`testIpc() start.`);
  // テキストファイルを読み込んで中身を返す。
  let filePath = '/Users/tomo/Documents/Angular/myApp/data.json';
  let data = await fs.readFile(filePath, 'utf8');
  return { data };

});
// 配列をJSONファイルに書き込むイベントを追加
ipcMain.handle('writeArrayToJson', async (event, data) => {
  try {
    console.log('受け取ったデータ:', JSON.stringify(data)); // デバッグ用

    // const filePath = path.join(app.getPath('userData'), 'data.json');
    let filePath = '/Users/tomo/Documents/Angular/myApp/data.json';
    console.log('保存先パス:', filePath); // デバッグ用

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('ファイル書き込み成功'); // デバッグ用

    return { success: true, message: 'データが正常に保存されしまた' };
  } catch (error) {
    console.error('ファイル書き込み中にエラーが発生しました:', error);
    return { success: false, message: `データの保存に失敗しました: ${error.message}` };
  }
});

// データ取得のイベントハンドラ
ipcMain.handle('getItems', async (event, argDate) => {
  console.log(`getItems() start. argDate = ${argDate}`);
  const items = db.prepare(`
    SELECT id, date, category, meeting, item, begintime, endtime, 
           plantime, actualtime, diffefent, planbegintime, etc 
    FROM todos
    WHERE date = ?
  `).all(argDate);
  return items;
});

// データ挿入のイベントハンドラ
ipcMain.handle('insertItem', async (event, item) => {
  const stmt = db.prepare(`
    INSERT INTO todos (
      date, category, meeting, item, begintime, endtime, 
      plantime, actualtime, diffefent, planbegintime, etc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    item.date, item.category, item.meeting, item.item, 
    item.begintime, item.endtime, item.plantime, item.actualtime, 
    item.diffefent, item.planbegintime, item.etc
  );
  return { id: info.lastInsertRowid };
});

// データ更新のイベントハンドラ
ipcMain.handle('updateItem', async (event, item) => {
  const stmt = db.prepare(`
    UPDATE todos SET
      id = ?, date = ?, category = ?, meeting = ?, item = ?, begintime = ?, 
      endtime = ?, plantime = ?, actualtime = ?, diffefent = ?, 
      planbegintime = ?, etc = ?
    WHERE id = ?
  `);
  const info = stmt.run(
    item.id, item.date, item.category, item.meeting, item.item, 
    item.begintime, item.endtime, item.plantime, item.actualtime, 
    item.diffefent, item.planbegintime, item.etc, item.id
  );
  return { changes: info.changes };
});

// データ削除のイベントハンドラ
ipcMain.handle('deleteItem', async (event, item) => {
  const stmt = db.prepare(`
    DELETE FROM todos WHERE id = ?
  `);
  const info = stmt.run(item.id);
  return { changes: info.changes };
});

// テーブル削除のイベントハンドラ
ipcMain.handle('deleteTable', async (event, item) => {
  const stmt = db.prepare(`
    DROP TABLE IF EXISTS todos;
  `);
  const info = stmt.run();
  return { changes: info.changes };
});

// テーブル削除＆再作成のイベントハンドラ
ipcMain.handle('deleteAndRecreateTable', async () => {
  try {
    db.prepare('DROP TABLE IF EXISTS todos').run();
    db.prepare(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
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
});

// データ削除のイベントハンドラ
app.on('will-quit', () => {
  // アプリ終了時にDBを閉じる
  if (db) db.close();
});
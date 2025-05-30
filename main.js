const fs = require('fs').promises;
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const url = require('url');
const Database = require('better-sqlite3');
const csv = require('csv-parser');
const stream = require('stream');
const dbAccess = require('./main_lib/db-access');

let win;  // ウインドウ
let db;  // データベース

// ウインドウを作成する関数
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

  // ウインドウにURLを読み込む
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

  // データベースの初期化
  db = dbAccess.initializeDatabase(app, Database);
  dbAccess.setDatabase(db);
})

// 全ウインドウが閉じられたとき
// 
// このコードは：
// macOS以外（WindowsやLinux）の場合：すべてのウィンドウが閉じられたときにアプリケーションを完全に終了（app.quit()）
// macOSの場合：ウィンドウが閉じられてもアプリケーションは終了せず、Dockに残る
// という、各OSのユーザー体験の慣習に従った動作を実現しています。
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
  return await dbAccess.testIpc();
});

// 配列をJSONファイルに書き込むイベントを追加
ipcMain.handle('writeArrayToJson', async (event, data) => {
  return await dbAccess.writeArrayToJson(data);
});

// データ取得のイベントハンドラ
ipcMain.handle('getItems', async (event, date) => {
  return await dbAccess.getItems(date);
});

// データ挿入のイベントハンドラ
ipcMain.handle('insertItem', async (event, item) => {
  return await dbAccess.insertItem(item);
});

// データ更新のイベントハンドラ
ipcMain.handle('updateItem', async (event, item) => {
  return await dbAccess.updateItem(item);
});

// データ削除のイベントハンドラ
ipcMain.handle('deleteItem', async (event, item) => {
  return await dbAccess.deleteItem(item);
});

// テーブル削除のイベントハンドラ
ipcMain.handle('deleteTable', async (event, item) => {
  return await dbAccess.deleteTable();
});

// テーブル削除＆再作成のイベントハンドラ
ipcMain.handle('deleteAndRecreateTable', async () => {
  return await dbAccess.deleteAndRecreateTable();
});

// 全データ削除のイベントハンドラ
ipcMain.handle('deleteAllTodos', async () => {
  return await dbAccess.deleteAllTodos();
});

// -----------------------------------------------------------
// カテゴリテーブルのイベントハンドラ
// -----------------------------------------------------------

// カテゴリテーブル作成のイベントハンドラ
ipcMain.handle('createCategoryTable', async () => {
  return await dbAccess.createCategoryTable();
});

// 初期テゴリ挿入のイベントハンドラ
ipcMain.handle('insertInitialCategories', async () => {
  return await dbAccess.insertInitialCategories();
});

// カテゴリ取得のイベントハンドラ
ipcMain.handle('getCategories', async () => {
  return await dbAccess.getCategories();
});

// データ削除のイベントハンドラ
app.on('will-quit', () => {
  // アプリ終了時にDBを閉じる
  if (db) db.close();
});

// addCategoryイベントハンドラの修正
ipcMain.handle('addCategory', async (event, name) => {
  return await dbAccess.addCategory(name);
});

// updateCategoryイベントハンドラの修正
ipcMain.handle('updateCategory', async (event, category) => {
  return await dbAccess.updateCategory(category);
});

// deleteCategoryイベントハンドラの修正
ipcMain.handle('deleteCategory', async (event, categoryId) => {
  return await dbAccess.deleteCategory(categoryId);
});

// 全データ取得のイベントハンドラ
ipcMain.handle('getAllItems', async () => {
  return await dbAccess.getAllItems();
});

// CSVデータをインポートするイベントハンドラ
// /Users/tomo/Library/Application Support/my-app
ipcMain.handle('importCsvData', async (event, csvData) => {
  console.log('CSVデータのインポートを開始します');
  
  try {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(csvData));

    let isFirstRow = true; // 1行目をスキップするためのフラグ

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => {
          if (isFirstRow) {
            isFirstRow = false; // 1行目をスキップ
          } else {
            results.push(data);
          }
        })
        .on('end', () => {
          console.log('CSVの解析が完了しました');
          resolve();
        })
        .on('error', (error) => {
          console.error('CSVの解析中にエラーが発生しました:', error);
          reject(error);
        });
    });

    const stmt = db.prepare(`
      INSERT INTO todos (
        date, displayOrder, category, meeting, item, begintime, endtime, 
        plantime, actualtime, diffefent, planbegintime, etc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    console.log('インポートされたデータの内容:');
    results.forEach((item, index) => {
      console.log(`アイテム ${index + 1}:`, JSON.stringify(item, null, 2));
    });

    // トランザクションを明示的に開始
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        try {
          stmt.run(
            item.date, item.displayOrder, item.category, item.meeting, item.item, 
            item.begintime, item.endtime, item.plantime, item.actualtime, 
            item.diffefent, item.planbegintime, item.etc
          );
        } catch (error) {
          console.error('レコード挿入中にエラーが発生しました:', error);
          console.error('問題のあるデータ:', item);
          throw error; // トランザクションをロールバックするためにエラーを再スロー
        }
      }
    });

    // トランザクションを実行
    insertMany(results);

    // 挿入されたレコード数を確認
    const count = db.prepare('SELECT COUNT(*) as count FROM todos').get();
    console.log(`現在のtodosテーブルのレコード数: ${count.count}`);

    console.log(`${results.length}件のデータをインポートしました`);
    return { success: true, message: `${results.length}件のデータをインポートしました` };
  } catch (error) {
    console.error('CSVデータのインポート中にエラーが発生しました:', error);
    return { success: false, message: error.message };
  }
});
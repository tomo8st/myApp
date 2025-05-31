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

// データベース操作のイベントハンドラを一括登録
const dbOperations = {
  // 基本的なTodo操作
  'testIpc': { handler: 'testIpc' },
  'writeArrayToJson': { handler: 'writeArrayToJson', hasArg: true },
  'getItems': { handler: 'getItems', hasArg: true },
  'insertItem': { handler: 'insertItem', hasArg: true },
  'updateItem': { handler: 'updateItem', hasArg: true },
  'deleteItem': { handler: 'deleteItem', hasArg: true },
  'deleteTable': { handler: 'deleteTable' },
  'deleteAndRecreateTable': { handler: 'deleteAndRecreateTable' },
  'deleteAllTodos': { handler: 'deleteAllTodos' },
  'getAllItems': { handler: 'getAllItems' },

  // カテゴリ操作
  'createCategoryTable': { handler: 'createCategoryTable' },
  'insertInitialCategories': { handler: 'insertInitialCategories' },
  'getCategories': { handler: 'getCategories' },
  'addCategory': { handler: 'addCategory', hasArg: true },
  'updateCategory': { handler: 'updateCategory', hasArg: true },
  'deleteCategory': { handler: 'deleteCategory', hasArg: true },

  // CSVインポート
  'importCsvData': { handler: 'importCsvData', hasArg: true }
};

// イベントハンドラを一括登録
Object.entries(dbOperations).forEach(([channel, { handler, hasArg }]) => {
  ipcMain.handle(channel, async (event, arg) => {
    return hasArg ? await dbAccess[handler](arg) : await dbAccess[handler]();
  });
});

// アプリ終了時のイベントハンドラ
app.on('will-quit', () => {
  // アプリ終了時にDBを閉じる
  if (db) db.close();
});

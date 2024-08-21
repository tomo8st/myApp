// const fs = require('fs');
const fs = require('fs').promises;
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');

// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const path = require('path');
// const fs = require('fs').promises;

let win;

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
  win.loadFile('dist/my-app/browser/index.html');

  // win.webContents.on('did-fail-load', () => {
  //   win.webContents.send('testIpc', 'wwwwwwww');
  // });

  // デバッグ画面表示
  win.webContents.openDevTools();

  // このウインドウが閉じられたときの処理
  win.on('closed', () => {
    win = null;
  })
}

// アプリが初期化されたとき（起動されたとき）
// app.on('ready', () => {
  
//   createWindow();
// })
app.whenReady().then(() => {
  // ipcMain.on('testIpc', (event, arg) => {
  //   console.log('IPCのテスト[' + arg + ']');
  //   // event.sender.send('testIpc2', 'pong');
  // });
  createWindow();
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

    return { success: true, message: 'データが正常に保存されました' };
  } catch (error) {
    console.error('ファイル書き込み中にエラーが発生しました:', error);
    return { success: false, message: `データの保存に失敗しました: ${error.message}` };
  }
});

// ホットリロード
// https://qiita.com/ganyariya/items/982803466e22dc53eaeb

//
// 試行錯誤用
// testIpcイベントの定義 
// ipcMain.handle('testIpc', async (event, arg) => {
   
  // テキストファイルを読み込んで中身を返す。
  // let filePath = '/Users/tomo/Documents/Angular/myApp/data.json';
  // let data = fs.readFileSync(filePath, 'utf8');
  // return { data };

  //
  // ファイル選択ダイアログを表示してファイルを選択させる方法
  //
  // const { canceled, filePaths } = await dialog.showOpenDialog({
  //   filters: [
  //     { name: 'Documents', extensions: ['txt'] }
  //   ]
  // })
  // console.log(`filePaths = ${filePaths}`);
  // const data = filePaths.map((filePath) =>
  //   fs.readFileSync(filePath, { encoding: 'utf8' })
  // )

  
  // テスト用
  // console.log('IPCのテスト[' + arg + ']');
  // return(`返す。「${arg}」`);


// });
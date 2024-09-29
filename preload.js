const { contextBridge, ipcRenderer } = require('electron')

// メインプロセスとレンダラープロセスの橋渡しをするコード
//
//  testIPCイベントを'myapi'として公開する
//
contextBridge.exposeInMainWorld('electron', {
  // getItems: (item) => ipcRenderer.invoke('getItems', item),
  // insertItem: (item) => ipcRenderer.invoke('insertItem', item),
  updateItem: (item) => ipcRenderer.invoke('updateItem', item),
  // deleteItem: (item) => ipcRenderer.invoke('deleteItem', item),
  // deleteAndRecreateTable: () => ipcRenderer.invoke('deleteAndRecreateTable'),
  // testIpc: () => ipcRenderer.invoke('testIpc'),
  // writeArrayToJson: (data) => ipcRenderer.invoke('writeArrayToJson', data),
  // createCategoryTable: () => ipcRenderer.invoke('createCategoryTable'),
  // insertInitialCategories: () => ipcRenderer.invoke('insertInitialCategories'),
  // getCategories: () => ipcRenderer.invoke('getCategories') 


  invoke: (channel, data) => {
    const validChannels = [
      'createCategoryTable',
      'getCategories',
      'getItems', 
      'insertItem', 
      // 'updateItem',
      'deleteItem',
      'deleteAndRecreateTable',
      'testIpc',
      'writeArrayToJson',
      'insertInitialCategories',
      // 新しいチャンネルを追加
      'addCategory',
      'updateCategory',
      'deleteCategory'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Unauthorized invoke request for channel: ${channel}`);
  }
});

// デバッグ用
contextBridge.exposeInMainWorld('electronDebug', {
  ping: () => 'pong'
});
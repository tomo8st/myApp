const { contextBridge, ipcRenderer } = require('electron')

// メインプロセスとレンダラープロセスの橋渡しをするコード
//
//  testIPCイベントを'myapi'として公開する
//
contextBridge.exposeInMainWorld('electronAPI', {
  getItems: (item) => ipcRenderer.invoke('getItems', item),
  insertItem: (item) => ipcRenderer.invoke('insertItem', item),
  updateItem: (item) => ipcRenderer.invoke('updateItem', item),
  deleteItem: (item) => ipcRenderer.invoke('deleteItem', item),
  deleteTable: () => ipcRenderer.invoke('deleteTable'),
  deleteAndRecreateTable: () => ipcRenderer.invoke('deleteAndRecreateTable'),
  testIpc: () => ipcRenderer.invoke('testIpc'),
  writeArrayToJson: (data) => ipcRenderer.invoke('writeArrayToJson', data)
})
const { contextBridge, ipcRenderer } = require('electron')

// メインプロセスとレンダラープロセスの橋渡しをするコード
//
//  testIPCイベントを'myapi'として公開する
//
contextBridge.exposeInMainWorld('myapi', {
  send: async (title) => await ipcRenderer.invoke('testIpc', title)
})
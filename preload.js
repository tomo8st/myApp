const { contextBridge, ipcRenderer } = require('electron')

// メインプロセスとレンダラープロセスの橋渡しをするコード
//
//  testIPCイベントを'myapi'として公開する
//
contextBridge.exposeInMainWorld('myapi', {
  send: (channel, data) => {
    // 許可されたチャンネルのリストを定義
    let validChannels = ['writeArrayToJson', 'testIpc'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  }
})
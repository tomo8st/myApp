import { Component /*, OnInit */ } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { IpcRenderer } from 'electron';
import { ipcRenderer } from 'electron';

export interface Item {
  name: string;
  value: string;
}
/**
 * 
 * 変数：camelCase
 * クラス：PascalCase
 * クラスメソッド：camelCase
 * インターフェース：PascalCase
 * 
 * ※snake_caseは使用しない
 */

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatToolbarModule, MatIconModule, 
            MatTableModule, MatFormFieldModule, MatInputModule, MatDatepickerModule ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css'
})
export class TodoListComponent /* implements OnInit */ {
  username = 'Test Name';
  dataSource: any;
  tblFontsize = '9pt';
  displayedColumns: string[] =[
                               'command',           // 操作
                               'date',              // 日付
                               'category',          // カテゴリ
                               'meeting',           // MTG
                               'item',              // ToDo項目
                               'begintime',         // 開始時刻
                               'endtime',           // 終了時刻
                               'plantime',          // 計画時間
                               'actualtime',        // 実績時間
                               'diffefent',         // 差異
                               'planbegintime',     // 計画時刻
                               'etc',               // 備考
                              ];
  //dpic_width = 100;
  //dpic_fontsize = 10;
  defaultDate: any;
  targetDate = '2023/11/25';

  editableIndex: number | null = null;

  private ipc: IpcRenderer | undefined;

  constructor() {}

  toggleEdit(index: number) {
    if (this.editableIndex !== index) {
      this.editableIndex = index;  // 他の行をクリックした場合のみ編集モードを変更
    }
  }
  
  /**
   * データ表示ボタン押下イベント
   * 
   *   ボタンクリックで ipc の指定イベント呼び出し
   */
  public onClickIpcTestBtn() {
    
    // if (this.ipc === undefined) {
    //   console.log('IPCのテスト-NG');
    //   return;
    // }
    // this.ipc.send('testIpc');
    // window.electronAIP.send("test");
    // ipcRenderer.send('testIpc');



    // 下記のページでやっと正常実行した。
    // https://blog.katsubemakito.net/nodejs/electron/ipc-for-contextbridge

    // windowの認識がTypeScriptでは少し異なるとのこと
    // https://blog.tanebox.com/archives/1757/
    
    // myapiイベントを引数を渡しながら呼び出す
    //   同時にイベントからの戻り値を受け取る
    (async () => {
      // const message = await (window as any).myapi.send('yes')
      const message = await (window as any).myapi.send('testIpc');
      console.log(message);
      this.dataSource = JSON.parse(message.data);
    })();

  }

  /**
   * クリアボタン押下イベント
   */
  public onClickClearButton() {
    this.dataSource = [{}];
  }

  /**
   * プラスボタン押下イベント
   */
  public onClickPlusButton() {

    console.log("onClickPlusButton()");
    var addData = {"date":"2023/12/01", "category":"CAT-1", "meeting":"◯", "item":"運動-1", "begintime":"11:20", 
                  "endtime":"11:50", "plantime":"10:00", "actualtime":"15:00", "diffefent":"5:00", "planbegintime":"11:40"};
    
    this.dataSource.push(addData);
    var wkData = JSON.stringify(this.dataSource);
    console.log(`wkData = ${wkData}`);
    this.dataSource = JSON.parse(wkData);

  }
  
  public onClickLink(date: string){

  }

  public onChangeDate(event: MatDatepickerInputEvent<Date>) {

  }
 
  public onKeyupEnterSearch() {
    console.log(`onKeyupEnterSearch()`);
  }

  /**
   * データ保存のIPCイベントを呼び出す
   */
  async onClickSaveButton() {
    console.log('保存ボタンがクリックされました');
    const dataToSave = JSON.parse(JSON.stringify(this.dataSource));
    console.log('保存するデータ:', JSON.stringify(dataToSave));
    
    try {
      const result = await (window as any).myapi.send('writeArrayToJson', dataToSave);
      console.log('保存結果:', JSON.stringify(result));
      if (result.success) {
        console.log('データが正常に保存されました');
        // 保存成功時の処理（例：ユーザーへの通知など）
      } else {
        console.error('データの保存に失敗しました:', result.message);
        // 失敗時の処理
      }
    } catch (error) {
      console.error('保存中にエラーが発生しました:', error);
      // エラー時の処理
    }
  }

  onClickArrayDisplayButton() {
    console.log('配列表示ボタンがクリックされました');
    var wkData = JSON.stringify(this.dataSource);
    console.log(`wkData = ${wkData}`);
  }

}
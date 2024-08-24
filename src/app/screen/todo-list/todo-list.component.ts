import { Component, OnInit } from '@angular/core';
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
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';

export interface Item {
  name: string;
  value: string;
}

// Datepickerの月間表示の日付に"日"が表示されないようにする
@Injectable()
class MyDateAdapter extends NativeDateAdapter {
  override getDateNames(): string[] {
    const dateNames: string[] = [];
    for (let i = 0; i < 31; i++) {
      dateNames[i] = String(i + 1);
    }
    return dateNames;
  }
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
  styleUrl: './todo-list.component.css',
  providers: [
    // Datepickerの月間表示の日付に"日"が表示されないようにする
    { provide: DateAdapter, useClass: MyDateAdapter }   
  ]
})
export class TodoListComponent implements OnInit {
  username = 'Test Name';
  dataSource: any;
  displayedColumns: string[] =[
                               'edit',              // 編集ボタン列を追加
                               'moveRow',           // 行の移動ボタン列を追加
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
                               'delete'             // 削除ボタン列を追加
                              ];
  defaultDate: any;
  targetDate = new Date();

  editableIndex: number | null = null;

  private ipc: IpcRenderer | undefined;

  constructor() {}                             

  /**
   * 画面初期化イベント
   */
  ngOnInit() {
    this.loadData();
  }
  
  /**
   * データ表示ボタン押下イベント
   * 
   *   ボタンクリックで ipc の指定イベント呼び出し
   */
  public onClickIpcTestBtn() {
    // myapiイベントを引数を渡しながら呼び出す
    //   同時にイベントからの戻り値を受け取る
    this.loadData();
  }

  /**
   * データ読み込み
   */
  private loadData() {
    (async () => {
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
  
  /**
   * リンクボタン押下イベント
   * @param date 
   */
  public onClickLink(date: string){

  }
   
  /**
   * エンターキー押下イベント
   */  
  public onKeyupEnterSearch() {
    console.log(`onKeyupEnterSearch()`);
  }

  /**
   * 配列表示ボタン押下イベント
   */
  onClickArrayDisplayButton() {
    console.log('配列表示ボタンがクリックされました');
    var wkData = JSON.stringify(this.dataSource);
    console.log(`wkData = ${wkData}`);
  }

  

  /**
   * 指定された行を上に移動する
   * @param index 移動する行のインデックス
   */
  moveRowUp(index: number) {
    if (index > 0) {
      const item = this.dataSource.splice(index, 1)[0];
      this.dataSource.splice(index - 1, 0, item);
      this.dataSource = [...this.dataSource];
    }
  }

  /**
   * 指定された行を下に移動する
   * @param index 移動する行のインデックス
   */
  moveRowDown(index: number) {
    if (index < this.dataSource.length - 1) {
      const item = this.dataSource.splice(index, 1)[0];
      this.dataSource.splice(index + 1, 0, item);
      this.dataSource = [...this.dataSource];
    }
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    // 日付が変更されたときの処理をここに記述
    console.log('選択された日付:', event.value);
    // 必要に応じて、ここで検索処理などを呼び出す
  }

  /**
   * エディットボタン押下イベント
   * @param index 
   */
  toggleEdit(index: number) {
    if (this.editableIndex === index) {
      this.editableIndex = null;  // 同じ行をクリックした場合、編集モードを終了
    } else {
      this.editableIndex = index;  // 他の行をクリックした場合、編集モードを変更
    }
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

  /**
   * 指定されたインデックスの行を削除する
   * @param index 削除する行のインデックス
   */
  public deleteRow(index: number) {
    if (index >= 0 && index < this.dataSource.length) {
      this.dataSource.splice(index, 1);
      // データソースの更新をトリガーするために新しい配列を作成
      this.dataSource = [...this.dataSource];
    }
  }

}
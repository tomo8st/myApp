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

/**
 * Datepickerの月間表示の日付に"日"が表示されないようにする
 */
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
  username = 'Test Name';                 // ユーザー名
  dataSource: any;                        // データソース
  displayedColumns: string[] =[
    'edit',                               // 編集ボタン列を追加
    'moveRow',                            // 行の移動ボタン列を追加
    'id',                                 // id 
    'date',                               // 日付
    'category',                           // カテゴリ
    'meeting',                            // MTG
    'item',                               // ToDo項目
    'begintime',                          // 開始時刻
    'endtime',                            // 終了時刻
    'plantime',                           // 計画時間
    'actualtime',                         // 実績時間
    'diffefent',                          // 差異
    'planbegintime',                      // 計画時刻
    'etc',                                // 備考
    'delete'                              // 削除ボタン列を追加
  ];
  defaultDate: any;                       // デフォルトの日付
  targetDate: Date | null = null;         // 日付フィルターの日付    
  editableIndex: number | null = null;    // 編集可能な行のインデックス
  private ipc: IpcRenderer | undefined;   // IPC通信インターフェース
  selectedDate: Date | null = null;       // 選択された日付

  constructor() {}                             

  /**
   * 画面初期化イベント
   */
  ngOnInit() {    
    // 日付を設定する
    this.targetDate = new Date();

    // データを読み込む
    this.db2loadData();
  }
  
  // ------------------------------------------------------------
  //
  // イベント群
  //
  // ------------------------------------------------------------

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
   * DB保存ボタン押下イベント
   */
  public onClickDbSaveButton() {
    this.saveData2db();
  } 

  /**
   * DB検索ボタン押下イベント
   */  
  public onClickDbSearchButton() {
    this.db2loadData();
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
    this.addRow();
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
  public onClickArrayDisplayButton() {
    console.log('配列表示ボタンがクリックされました');
    var wkData = JSON.stringify(this.dataSource);
    console.log(`wkData = ${wkData}`);
  }

  /**
   * 指定された行を上に移動する
   * @param index 移動する行のインデックス
   */
  public onClickMoveRowUpButton(index: number) {
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
  public onClickMoveRowDownButton(index: number) {
    if (index < this.dataSource.length - 1) {
      const item = this.dataSource.splice(index, 1)[0];
      this.dataSource.splice(index + 1, 0, item);
      this.dataSource = [...this.dataSource];
    }
  }

  /**
   * 日付変更イベント
   * @param event 
   */
  public onDateChange(event: MatDatepickerInputEvent<Date>) {
    // 日付が変更されたときの処理をここに記述
    console.log('選択された日付:', event.value);
    this.targetDate = event.value;
    
    // 日付フィルターを適用する
    this.db2loadData();
  }

  /**
   * 削除ボタン押下イベント
   * @param index 
   */
  public onClickDeleteButton(index: number) {
    this.deleteRow(index);
  }

  public onClickEditButton(index: number) {
    this.toggleEdit(index);
  }
  /**
   * データ保存のIPCイベントを呼び出す
   */
  public async onClickSaveButton() {
    console.log('保存ボタンがクリックされました');
    const dataToSave = JSON.parse(JSON.stringify(this.dataSource));
    console.log('保存するデータ:', JSON.stringify(dataToSave));
    
    try {
      const result = await (window as any).electronAPI.writeArrayToJson(dataToSave);
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

  public async onClickTableDeleteButton() {
    this.deleteTable();
  }
  

  // ------------------------------------------------------------
  //
  // ロジック群
  //
  // ------------------------------------------------------------

  /**
   * テーブル削除ボタン押下イベント
   */
  private async deleteTable() {
    try {
      const result = await (window as any).electronAPI.deleteAndRecreateTable();
      console.log(result.message);
      if (result.success) {
        this.dataSource = [];
        console.log('テーブルが正常に削除され、再作成されました。データソースをクリアしました。');
      } else {
        console.error('テーブルの削除と再作成に失敗しました:', result.message);
      }
    } catch (error) {
      console.error('テーブル削除と再作成中にエラーが発生しました:', error);
    }
  }
  /**
   * ファイルからデータを読み込み
   */
  private async loadData() {
    try {
      const message = await (window as any).electronAPI.testIpc();
      console.log('読み込んだデータ:', message);
      this.dataSource = JSON.parse(message.data);
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }
  
  /**
   * データベースからデータを読み込む
   */
  private async db2loadData() {
    try {
      const formatedDate = this.targetDate ? this.formatDate(this.targetDate) : null;
      if (formatedDate === null) {
        console.error('無効な日付です');
        return;
      }
      console.log(`formatedDate = ${formatedDate}`);
      const message = await (window as any).electronAPI.getItems(formatedDate);
      console.log('読み込んだデータ:', message);
      if (Array.isArray(message)) {
        this.dataSource = message;
      } else {
        console.error('予期しないデータ形式:', message);
        this.dataSource = [];
      }
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      this.dataSource = [];
    }
  }
    
  /**
   * 指定されたインデクスの行を削除する
   * @param index 削除する行のインデッス
   */
  private async deleteRow(index: number) {
    if (index >= 0 && index < this.dataSource.length) {
      // DBから行を削除
      const itemToDelete = this.dataSource[index];
      try {
        const result = await (window as any).electronAPI.deleteItem(itemToDelete);
        console.log('削除結果:', result);
        if (result.changes > 0) {
          console.log('行が正常に削除されました');
        } else {
          console.warn('削除対象の行が見つかりませんでした');
        }
      } catch (error) {
        console.error('行の削除中にエラーが発生しました:', error);
        // エラー処理（例：ユーザーへの通知）
        return; // 削除に失敗した場合、以降の処理を中止
      }

      // データソースから行を削除
      this.dataSource.splice(index, 1);
      // データソースの更新をトリガーするために新しい配列を作成
      this.dataSource = [...this.dataSource];
    }
  }

  private async addRow() {
    const formatedDate = this.targetDate ? this.formatDate(this.targetDate) : null;
    console.log(`formatedDate = ${formatedDate}`);
    if (formatedDate === null) {
      console.error('無効な日付です');
      return;
    }
    const addData = {
      id: null,
      date: formatedDate,
      category: "CAT-1",
      meeting: "◯",
      item: "運動-1",
      begintime: "11:20",
      endtime: "11:50",
      plantime: "10:00",
      actualtime: "15:00",
      diffefent: "5:00",
      planbegintime: "11:40",
      etc: "etc"
    };
    
    try {
      // データベースに新しい行を挿入
      const result = await (window as any).electronAPI.insertItem(addData);
      console.log('挿入結果:', result);

      // 挿入されたデータのIDを取得し、addDataに追加
      addData.id = result.id;

      // データソースに新しい行を追加
      this.dataSource.push(addData);
      this.dataSource = [...this.dataSource];

      console.log('新しい行が正常に追加されました');
    } catch (error) {
      console.error('新しい行の追加中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * データベースにデータを保存する
   */
  private async saveData2db() {
    try {
      for (const item of this.dataSource) {
        const saveItem = {
          id: item.id, // idフィールドを追加
          date: item.date || '',
          category: item.category || '',
          meeting: item.meeting || '',
          item: item.item || '',
          begintime: item.begintime || '',
          endtime: item.endtime || '',
          plantime: item.plantime || '',
          actualtime: item.actualtime || '',
          diffefent: item.diffefent || '',
          planbegintime: item.planbegintime || '',
          etc: item.etc || ''
        };

        let result;
        if (saveItem.id) {
          // 既存のデータの場合は更新
          result = await (window as any).electronAPI.updateItem(saveItem);
          console.log('更新結果:', result);
        } else {
          // 新しいデータの場合は挿入
          result = await (window as any).electronAPI.insertItem(saveItem);
          console.log('挿入結果:', result);
        }
      }
      console.log('全てのデータが正常に保存されました');
      // 保存成功時の処理（例：ユーザーへの通知など）
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * 表示データに日付フィルターを適用する
   */
  private async applyFilter() {
    // まず、ファイルからデータを読み込む
    await this.loadData();

    if (this.targetDate) {
      const dateString = this.formatDate(this.targetDate);
      console.log(`フィルター適用日: ${dateString}`);
      // 読み込んだ全データに対してフィルターを適用
      this.dataSource = this.dataSource.filter((item: any) => item.date === dateString);
    }
    // 日付が選択されていない場合は、loadData()で読み込んだ全データがそのまま表示される
  }
  
  /**
   * エディットボタン押下イベント
   * @param index 
   */
  private toggleEdit(index: number) {
    if (this.editableIndex === index) {
      this.editableIndex = null;  // 同じ行をクリックした場合、編集モードを終了
    } else {
      this.editableIndex = index;  // 他の行をクリックした場合、編集モードを変更
    }
  }

  // ------------------------------------------------------------
  //
  // ユーティリティ群
  //
  // ------------------------------------------------------------

  /**
   * 日付を文字列(YYYY/MM/DD)に変換する
   * @param date 
   * @returns 
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}
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
import { MatSelectModule } from '@angular/material/select';
import { CategoryService } from '../../service/category.service';
import { catchError, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CsvImportDialogComponent } from './csv-import-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
// import { ElectronService } from 'ngx-electron';


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
            MatTableModule, MatFormFieldModule, MatInputModule, MatDatepickerModule,
            MatSelectModule, MatDialogModule],
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
    'displayOrder',                       // 表示順
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
  exportColumns: string[] = [
    'id',                                 // id 
    'date',                               // 日付
    'displayOrder',                       // 表示順
    'category',                           // カゴリ
    'meeting',                            // MTG
    'item',                               // ToDo項目
    'begintime',                          // 開始時刻
    'endtime',                            // 終了時刻
    'plantime',                           // 計画時間
    'actualtime',                         // 実績時間
    'diffefent',                          // 差異
    'planbegintime',                      // 計画時刻
    'etc',                                // 備考    
  ];
  defaultDate: any;                       // デフォルトの日付
  targetDate: Date | null = null;         // 日付フィルターの日付    
  editableIndex: number | null = null;    // 編集可能な行のインデックス
  private ipc: IpcRenderer | undefined;   // IPC通信インターフェース
  selectedDate: Date | null = null;       // 選択された日付

  categories: any[] = [];

  constructor(
    private categoryService: CategoryService, 
    private router: Router, 
    private dialog: MatDialog, 
    // private electronService: ElectronService
  ) {}

  /**
   * 画面初期化イベント
   */
  async ngOnInit() {    
    console.log('Electron object:', (window as any).electron);

    // 日付を設定する
    this.targetDate = new Date();

    await this.initializeCategoryTable();

    // データを読み込む
    await this.loadCategories();
    await this.db2loadData();

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
    this.updatePlanBeginTimes();
    this.updateBeginTimes();
    this.calculateActualTimeAndDifference(); // この行を追加
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
    this.moveRowUp(index);
  }

  /**
   * 指定された行を下に移動する
   * @param index 移動する行のインデックス
   */
  public onClickMoveRowDownButton(index: number) {
    this.moveRowDown(index);
  }

  /**
   * 日付変更イベント
   * @param event 
   */
  public onDateChange(event: MatDatepickerInputEvent<Date>) {
    // 日付が変更されたときの処理をこに記述
    console.log('選択された日付:', event.value);
    this.targetDate = event.value;
    
    // 日付フィルタを適用する
    this.db2loadData();
  }

  /**
   * 削除ボタン押下イベント
   * @param index 
   */
  public onClickDeleteButton(index: number) {
    this.deleteRow(index);
  }

  /**
   * 編集ボタン押下イベント
   * @param index 
   */
  public onClickEditButton(index: number) {
    this.toggleEdit(index);
  }
  /**
   * データ保存のIPCイベントを呼び出す
   */
  public async onClickSaveButton() {
    console.log('保存ボタンがクリックされまし');
    const dataToSave = JSON.parse(JSON.stringify(this.dataSource));
    console.log('保存するデータ:', JSON.stringify(dataToSave));
    
    try {
      const result = await (window as any).electron.writeArrayToJson(dataToSave);
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
   * テーブル削除&再作成ボタン押下イト
   */
  public async onClickTableDeleteAndRecreateButton() {
    this.deleteAndRecreateTable();
  }
  
  /**
   * カテゴリテーブル作成ボタン押下イベント
   */
  public async onClickCreateCategoryTableButton() {
    try {
      await firstValueFrom(this.categoryService.createCategoryTable().pipe(
        catchError((error: any) => {
          console.error('カテゴリテーブルの作成中にエラーが発生しました:', error);
          throw error;
        })
      ));
      console.log('カテゴリテーブルが作成されました');
      await this.insertInitialCategories();
    } catch (error) {
      // エラーメッセージをユーザーに表示するロジックをここに追加
    }
  }

  /**
   * カテゴリ名を取得する
   * @param categoryId 
   * @returns 
   */
  public getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  /**
   * カテゴリーメンテナンス画面へ遷移する
   */
  navigateToCategoryManagement() {
    this.router.navigate(['/category']);
  }

  /**
   * CSVエクスポートボタン押下イベント
   */
  public onClickCsvExportButton() {
    this.exportToCsv();
  }

  /**
   * CSVインポートボタン押下イベント
   */
  public onClickCsvImportButton() {
    const dialogRef = this.dialog.open(CsvImportDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.importCsvData(result);
      }
    });
  }

  onClickDeleteAllTodosButton() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '確認',
        message: '本当にすべてのToDoを削除しますか？この操作は取り消せません。'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteAllTodos();
      }
    });
  }

  // ------------------------------------------------------------
  //
  // ロジック群
  //
  // ------------------------------------------------------------

  /**
   * テーブル削除＆再作成ボタン押下イベント
   */
  private async deleteAndRecreateTable() {
    try {
      const result = await (window as any).electron.deleteAndRecreateTable();
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
      const message = await (window as any).electron.testIpc();
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
  
      console.log('Electron object:', (window as any).electron);
      console.log('Electron debug:', (window as any).electronDebug);
  
      if (!(window as any).electron || typeof (window as any).electron.invoke !== 'function') {
        throw new Error('electron.invoke is not available');
      }
  
      console.log('Invoking getItems...');
      const result = await (window as any).electron.invoke('getItems', formatedDate);
      console.log('getItems result:', result);
  
      if (Array.isArray(result)) {
        // this.dataSource = await this.convertCategoryIdsToNames(result);
        this.dataSource = result;
        console.log('this.dataSource:', this.dataSource);
        this.updatePlanBeginTimes();
        this.calculateActualTimeAndDifference();
        this.updateBeginTimes(); // この行を追加
      } else {
        console.error('予期しないデータ形式:', result);
        this.dataSource = [];
      }
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      this.dataSource = [];
    }
  }
    
  /**
   * 指定されたインデクスの行を削す
   * @param index 削除する行のインデックス
   */
  private async deleteRow(index: number) {
    if (index >= 0 && index < this.dataSource.length) {
      // DBから行を削除
      const itemToDelete = this.dataSource[index];
      try {
        const result = await (window as any).electron.deleteItem(itemToDelete);
        console.log('削除結果:', result);
        if (result.changes > 0) {
          console.log('行が正常に削除れました');
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

  /**
   * 新しい行を追加する
   * @returns 
   */
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
      displayOrder: this.dataSource.length + 1,
      category: "0",
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
      const result = await (window as any).electron.insertItem(addData);
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
          id: item.id,
          date: item.date || '',
          displayOrder: item.displayOrder || '',
          category: this.getCategoryId(item.category),
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

        // カテゴリIDを整数に変換（未定義の場合は0を使用）
        saveItem.category = parseInt(saveItem.category?.toString() ?? '0', 10);

        let result;
        if (saveItem.id) {
          // 既存のデータの場合は更新
          result = await (window as any).electron.updateItem(saveItem);
          console.log('更新結果:', result);
        } else {
          // 新しいデータの場合は挿入
          result = await (window as any).electron.insertItem(saveItem);
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
  private async toggleEdit(index: number) {
    if (this.editableIndex === index) {
      this.editableIndex = null;
      const editedItem = this.dataSource[index];
      try {
        let result;
        if (editedItem.id) {
          console.log('更新用データ:', editedItem);
          // 既存のデータの場合は更新
          result = await (window as any).electron.updateItem(editedItem);
          console.log('更新結果:', result);
        } else {
          // 新しいデータの場合は挿入
          result = await (window as any).electron.insertItem(editedItem);
          console.log('挿入結果:', result);
          // 新しく挿入されたデータのIDを設定
          if (result && result.id) {
            editedItem.id = result.id;
          }
        }
        console.log('データが正常に保存されました');
        this.calculateActualTimeAndDifference(); // この行を変更
        this.updateBeginTimes();
        // 保存成功時の処理（例：ユーザーへの通知など）
      } catch (error) {
        console.error('データの保存中にエラーが発生しました:', error);
        // エラー処理（例：ユーザーへの通知）
      }
    } else {
      this.editableIndex = index;
    }
  }

  /**
   * 指定された行を上に移動する
   * @param index 移動する行のインデックス
   */
  private async moveRowUp(index: number) {
    if (index > 0) {
      const item = this.dataSource.splice(index, 1)[0];
      this.dataSource.splice(index - 1, 0, item);
      this.dataSource = [...this.dataSource];
      this.renumberDisplayOrder();
    }
  }

  /**
   * 指定された行を下に移動する
   * @param index 移動する行のインデックス
   */
  private async moveRowDown(index: number) {
    if (index < this.dataSource.length - 1) {
      const item = this.dataSource.splice(index, 1)[0];
      this.dataSource.splice(index + 1, 0, item);
      this.dataSource = [...this.dataSource];
      this.renumberDisplayOrder();
    }
  }

  /**
   * displayOrderの値を再採番する
   */
  private async renumberDisplayOrder() {
    this.dataSource.forEach((item: { displayOrder: any; }, idx: number) => {
      item.displayOrder = idx + 1;
    });
    this.dataSource = [...this.dataSource];
    this.saveData2db();
  }

  /**
   * カテゴリテーブルを初期化する
   */
  private async initializeCategoryTable() {
    try {
      await firstValueFrom(this.categoryService.createCategoryTable());
      console.log('カテゴリテーブルが作成されました');
      await this.insertInitialCategories();
    } catch (error) {
      console.error('カテゴリテーブルの作成中にエラーが発生しました:', error);
    }
  }

  /**
   * 初期カテゴリを挿入する
   */
  private async insertInitialCategories() {
    try {
      await firstValueFrom(this.categoryService.insertInitialCategories());
      console.log('初期カテゴリが挿入されました');
    } catch (error) {
      console.error('初期カテゴリの挿入中にエラーが発生しました:', error);
    }
  }

  /**
   * 計画時刻を計算して更新する
   */
  private updatePlanBeginTimes() {
    if (this.dataSource && this.dataSource.length > 0) {
      let currentTime = this.parseTime(this.dataSource[0].begintime);
      
      this.dataSource.forEach((task: any, index: number) => {
        if (index === 0) {
          task.planbegintime = task.begintime;
        } else {
          task.planbegintime = this.formatTime(currentTime);
        }
        
        const planTime = this.parseTime(task.plantime);
        currentTime = this.addMinutes(currentTime, planTime);
      });

      // データソースを更新してビューを再描画
      this.dataSource = [...this.dataSource];
    }
  }

  /**
   * 時間文字列をDate型に変換する
   */
  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
  }

  /**
   * Date型を時間文列に変換する
   */
  /**
   * Date型を時間文字列に変換する
   */
  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 指定された分数を時間に加算する
   */
  private addMinutes(date: Date, timeToAdd: Date): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + timeToAdd.getHours() * 60 + timeToAdd.getMinutes());
    return result;
  }
  
  /**
   * データをCSV形式でエクスポートする
   */
  private async exportToCsv() {
    try {
      // todoテーブルのすべてのデータを取得
      const allData = await (window as any).electron.getAllItems();

      if (!allData || allData.length === 0) {
        console.warn('エクスポートするデータがありません。');
        return;
      }
      // 表示列名を取得
      const headers = this.exportColumns.map(column => this.getColumnDisplayName(column));
      // CSVデータを作成
      const csvContent = [
        headers.join(','),
        ...allData.map((row: any) => 
          this.exportColumns.map(column => this.escapeCSV(row[column])).join(',')
        )
      ].join('\n');
      // CSVデータファイルに保存
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `todo_list_all_${this.formatDate(new Date())}.csv`;
      saveAs(blob, filename);

      console.log('CSVエクスポートが完了しました。');
    } catch (error) {
      console.error('CSVエクスポート中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * 列名を表示用の名前に変換する
   */
  private getColumnDisplayName(column: string): string {
    const displayNames: { [key: string]: string } = {
      // 'edit': '編集',
      // 'moveRow': '移動',
      'id': 'ID',
      'date': '日付',
      'displayOrder': '表示順',
      'category': 'カテゴリ',
      'meeting': 'MTG',
      'item': 'ToDo項目',
      'begintime': '開始時刻',
      'endtime': '終了時刻',
      'plantime': '計画時間',
      'actualtime': '実績時間',
      'diffefent': '差異',
      'planbegintime': '計画時刻',
      'etc': '備考',
      // 'delete': '削除'
    };
    return displayNames[column] || column;
  }

  /**
   * CSV用にデータをエスケープする
   */
  private escapeCSV(data: any): string {
    if (data == null) return '';
    if (typeof data === 'string') {
      return `"${data.replace(/"/g, '""')}"`;
    }
    return data.toString();
  }
  
  /**
   * CSVデータをインポートする
   */
  private async importCsvData(csvData: string) {
    try {
      const result = await (window as any).electron.importCsvData(csvData);
      console.log('CSVインポート結果:', result);
      if (result.success) {
        console.log('CSVデータが正常にインポートされました');
        // データを再読み込み
        await this.db2loadData();
      } else {
        console.error('CSVデータのインポートに失敗しました:', result.message);
      }
    } catch (error) {
      console.error('CSVインポート中にエラーが発生しました:', error);
    }
  }

  private async deleteAllTodos() {
    try {
      const result = await (window as any).electron.invoke('deleteAllTodos');
      console.log('全ToDo削除結果:', result);
      if (result.success) {
        console.log('全てのToDoが正常に削除されました');
        // データソースをクリア
        this.dataSource = [];
        // ビューを更新
        this.dataSource = [...this.dataSource];
      } else {
        console.error('全ToDoの削除に失敗しました:', result.message);
      }
    } catch (error) {
      console.error('全ToDo削除中にエラーが発生しました:', error);
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

  /**
   * カテゴリを読み込む
   */
  private async loadCategories() {
    try {
      this.categories = await firstValueFrom(this.categoryService.getCategories());
      console.log('カテゴリが読み込まれました:', this.categories);
    } catch (error) {
      console.error('カテゴリの読み込み中にエラーが発生しました:', error);
    }
  }

  /**
   * カテゴリIDをカテゴリ名に変換する
   * @param data 
   * @returns 
   */
  private async convertCategoryIdsToNames(data: any[]): Promise<any[]> {
    return Promise.all(data.map(async (item) => {
      console.log('item:', item);
      const categories = this.categoryService.getCategoryName(item.category);
      console.log('categories:', categories);
      const categoryName = await firstValueFrom(categories);
      return { ...item, category: categoryName };
    }));
  }

  /**
   * カテゴリ名をカテゴリIDに変換する
   * @param categoryName 
   * @returns 
   */
  private getCategoryId(categoryName: string): number | undefined {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category.id : undefined;
  }

  /**
   * 実績時間を計算し、差異を算出する
   */
  private calculateActualTimeAndDifference() {
    this.dataSource.forEach((task: any) => {
      if (task.begintime && task.endtime) {
        const beginTime = this.parseTime(task.begintime);
        const endTime = this.parseTime(task.endtime);
        const diffMinutes = (endTime.getTime() - beginTime.getTime()) / (1000 * 60);
        const hours = Math.floor(diffMinutes / 60);
        const minutes = Math.floor(diffMinutes % 60);
        task.actualtime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // 計画時間と実績時間の差異を計算
        const planTime = this.parseTime(task.plantime);
        const actualTime = this.parseTime(task.actualtime);
        
        // 実績時間から計画時間を減算
        const diffMilliseconds = actualTime.getTime() - planTime.getTime();
        const isNegative = diffMilliseconds < 0;
        
        // 絶対値を取得
        const absDiffTime = new Date(Math.abs(diffMilliseconds));
        const diffHours = absDiffTime.getUTCHours();
        const diffMins = absDiffTime.getUTCMinutes();
        
        // マイナスの場合は先頭に「-」を付ける
        const sign = isNegative ? '-' : '';
        task.diffefent = `${sign}${diffHours.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`;
      } else {
        task.actualtime = '';
        task.diffefent = '';
      }
    });
    this.dataSource = [...this.dataSource];
  }

  /**
   * 前の行の終了時刻を次の行の開始時刻に設定する
   */
  private updateBeginTimes() {
    if (this.dataSource && this.dataSource.length > 1) {
      for (let i = 1; i < this.dataSource.length; i++) {
        const previousTask = this.dataSource[i - 1];
        const currentTask = this.dataSource[i];
        
        if (!previousTask.endtime || previousTask.endtime.trim() === '') {
          // 前のタスクの終了時刻が空白の場合、現在のタスクの開始時刻も空白にする
          currentTask.begintime = '';
        } else {
          currentTask.begintime = previousTask.endtime;
        }
      }
      
      // データソースを更新してビューを再描画
      this.dataSource = [...this.dataSource];
    }
  }

}
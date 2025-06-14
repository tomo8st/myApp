import { Component, OnInit, ChangeDetectorRef, AfterViewInit, HostListener } from '@angular/core';
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
import { TodoService } from '../../service/todo.service';
import { UtilService } from '../../service/util.service';
import { catchError, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CsvImportDialogComponent } from './csv-import-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatSelectChange } from '@angular/material/select';
import { JapaneseWeekdayPipe } from './japanese-weekday.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
            MatSelectModule, MatDialogModule, MatSnackBarModule, MatTooltipModule,
            JapaneseWeekdayPipe],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
  providers: [
    // Datepickerの月間表示の日付に"日"が表示されないようにする
    { provide: DateAdapter, useClass: MyDateAdapter }   
  ]
})
export class TodoListComponent implements OnInit, AfterViewInit {
  username = 'Test Name';                 // ユーザー名
  dataSource: any;                        // データソース
  displayedColumns: string[] =[
    // 'edit',                               // 編集ボタン列を追加 -> セルダブルクリックで編集するためコメントアウト
    // 'moveRow',                            // 行の移動ボタン列を追加
    // 'id',                                 // id -> 使用上は不要なので非表示化
    'displayOrder',                       // 表示順
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
    'etc'                                 // 備考
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
  private ipc: IpcRenderer | undefined;   // IPC通信インターフース
  selectedDate: Date | null = null;       // 選択された日付

  categories: any[] = [];                 // カテゴリ 

  selectedCell: { rowIndex: number | null, columnName: string | null } = { rowIndex: null, columnName: null };

  editingCell: { rowIndex: number | null, columnName: string | null } = { rowIndex: null, columnName: null };

  selectedRow: number = 0;
  selectedCol: number = 0;

  // selectedIndex: number = 0;
  // todos: any[] = []; // または適切な型を使用してください

  private pendingInput: string | null = null;
  private originalValue: string | null = null;

  private isComposing: boolean = false;  // IME入力中かどうかを示すフラグ

  // 選択されたセルの行と列のインデックス
  selectedRowIndex: number = 0;
  selectedColumnIndex: number = 0;

  private isEditing: boolean = false;

  // コピーした行のデータを保持
  private copiedRow: any = null;

  /**
   * コンストラクタ
   * @param categoryService カテゴリサービス
   * @param todoService Todoサービス
   * @param utilService Utilサービス
   * @param router ルーター
   * @param dialog ダイアログ
   * @param snackBar スナックバー
   */
  constructor(
    private categoryService: CategoryService,
    private todoService: TodoService,
    private utilService: UtilService,
    private router: Router, 
    private dialog: MatDialog,  
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  /**
   * 画面初期化イベント
   */
  async ngOnInit() {    
    console.log('Electron object:', (window as any).electron);

    // 日付を設定する
    this.targetDate = new Date();

    // カテゴリテーブルを初期化する
    try {
      await firstValueFrom(this.categoryService.createCategoryTable());
      console.log('カテゴリテーブルが作成されました');
      await firstValueFrom(this.categoryService.insertInitialCategories());
      console.log('初期カテゴリが挿入されました');
    } catch (error) {
      console.error('カテゴリテーブルの初期化中にエラーが発生しました:', error);
    }

    // カテゴリを読み込む
    try {
      this.categories = await firstValueFrom(this.categoryService.getCategories());
      console.log('カテゴリが読み込まれました:', this.categories);
    } catch (error) {
      console.error('カテゴリの読み込み中にエラーが発生しました:', error);
    }

    // データを読み込む
    try {
      this.dataSource = await firstValueFrom(this.todoService.loadData(this.targetDate));
      this.dataSource = this.utilService.updatePlanBeginTimes(this.dataSource);
      this.dataSource = this.utilService.updateBeginTimes(this.dataSource);
      this.dataSource = this.utilService.calculateActualTimeAndDifference(this.dataSource);
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      this.dataSource = [];
    }
  }

  ngAfterViewInit() {
    // 初期選択を設定
    this.updateSelectedCell();
  }
  
  // ------------------------------------------------------------
  //
  // イベント群
  //
  // ------------------------------------------------------------

  /**
   * データ表示ボタン押下イベント
   * 
   *   ボタンクリックで ipc の指定イベト呼び出し
   */
  public async onClickIpcTestBtn() {
    try {
      this.dataSource = await this.todoService.loadDataFromFile();
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * DB保存ボタン押下イベント
   */
  public async onClickDbSaveButton() {
    try {
      await this.todoService.saveData2db(this.dataSource);
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * DB検索ボタン押下イベント
   */  
  public async onClickDbSearchButton() {
    try {
      // データを読み込む
      this.dataSource = await firstValueFrom(this.todoService.loadData(this.targetDate));
      this.dataSource = this.utilService.updatePlanBeginTimes(this.dataSource);
      this.dataSource = this.utilService.updateBeginTimes(this.dataSource);
      this.dataSource = this.utilService.calculateActualTimeAndDifference(this.dataSource);
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      this.dataSource = [];
    }
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
  public async onClickPlusButton() {
    try {
      const newRow = await this.todoService.addRow(this.targetDate, this.dataSource.length);
      this.dataSource.push(newRow);
      this.dataSource = [...this.dataSource];
      console.log('新しい行が正常に追加されました');
    } catch (error) {
      console.error('新しい行の追加中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
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
  public async onClickMoveRowUpButton(index: number) {
    this.dataSource = this.utilService.moveRowUp(this.dataSource, index);
    this.dataSource = this.utilService.renumberDisplayOrder(this.dataSource);
    try {
      await this.todoService.saveData2db(this.dataSource);
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * 指定された行を下に移動する
   * @param index 移動する行のインデックス
   */
  public async onClickMoveRowDownButton(index: number) {
    this.dataSource = this.utilService.moveRowDown(this.dataSource, index);
    this.dataSource = this.utilService.renumberDisplayOrder(this.dataSource);
    try {
      await this.todoService.saveData2db(this.dataSource);
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
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
    this.onClickDbSearchButton();
  }

  /**
   * 削除ボタン押下イベント
   * @param index 削除する行のインデックス
   */
  public async onClickDeleteButton(index: number) {
    try {
      this.dataSource = await this.todoService.deleteRow(this.dataSource, index);
    } catch (error) {
      console.error('行の削除中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }

  /**
   * 編集ボタン押下イベント
   * @param index 編集する行のインデックス
   */
  public async onClickEditButton(index: number) {
    try {
      const newEditableIndex = this.utilService.toggleEdit(this.editableIndex, index);
      
      // 編集モードが終了する場合（nullが返された場合）
      if (newEditableIndex === null && this.editableIndex !== null) {
        await this.todoService.saveData2db(this.dataSource);
        this.dataSource = this.utilService.updateBeginTimes(this.dataSource);
      }
      
      this.editableIndex = newEditableIndex;
    } catch (error) {
      console.error('編集モードの切り替え中にエラーが発生しました:', error);
    }
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
   * テーブル削除＆再作成ボタン押下イベント
   */
  public async onClickTableDeleteAndRecreateButton() {
    try {
      await this.todoService.deleteAndRecreateTable();
      this.dataSource = [];
      console.log('テーブルが正常に削除され、再作成されました。データソースをクリアしました。');
    } catch (error) {
      console.error('テーブル削除と再作成中にエラーが発生しました:', error);
      // エラー処理（例：ユーザーへの通知）
    }
  }
  
  /**
   * カテゴリテーブル作成ボタン押下イベント
   */
  public async onClickCreateCategoryTableButton() {
    try {
      await firstValueFrom(this.categoryService.createCategoryTable());
      console.log('カテゴリテーブルが作成されました');
      await firstValueFrom(this.categoryService.insertInitialCategories());
      console.log('初期カテゴリが挿入されました');
    } catch (error) {
      console.error('カテゴリテーブルの作成中にエラーが発生しました:', error);
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
  public async onClickCsvExportButton() {
    try {
      await this.todoService.exportToCsv();
    } catch (error) {
      console.error('CSVエクスポート中にエラーが発生しました:', error);
    }
  }

  /**
   * CSVインポートボタン押下イベント
   */
  public async onClickCsvImportButton() {
    const dialogRef = this.dialog.open(CsvImportDialogComponent);
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          // CSVデータをインポート
          const importResult = await this.todoService.importCsvData(result);
          // インポートが成功した場合はデータを再読み込み
          if (importResult.success) {
            console.log('CSVデータが正常にインポートされました');
            // データを再読み込み
            await this.onClickDbSearchButton();
          } else {
            console.error('CSVデータのインポートに失敗しました:', importResult.message);
          }
        } catch (error) {
          console.error('CSVインポート中にエラーが発生しました:', error);
        }
      }
    });
  }

  /**
   * 全ToDo削除ボタン押下イベント
   */
  public onClickDeleteAllTodosButton() {
    // 確認ダイアログを表示
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '確認',
        message: '本当にすべてのToDoを削除しますか？この操作は取り消せません。'
      }
    });
    // ダイアログが閉じた後の処理
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          // 全ToDoを削除
          const deleteResult = await this.todoService.deleteAllTodos();
          // 削除が成功した場合はデータを再読み込み
          if (deleteResult.success) {
            console.log('全てのToDoが正常に削除されました');
            // データソースをクリア
            this.dataSource = [];
            // ビューを更新
            this.dataSource = [...this.dataSource];
          } else {
            console.error('全ToDoの削除に失敗しました:', deleteResult.message);
          }
        } catch (error) {
          console.error('全ToDo削除中にエラーが発生しました:', error);
        }
      }
    });
  }

  /**
   * セルクリックイベント
   * @param event 
   * @param rowIndex 
   * @param columnName 
   */
  public onCellClick(event: MouseEvent, rowIndex: number, columnName: string) {
    event.stopPropagation();
    this.selectedRowIndex = rowIndex;
    this.selectedColumnIndex = this.displayedColumns.indexOf(columnName);
    this.selectedCell = { rowIndex, columnName };
    this.updateSelectedCell();
  }

  /**
   * セルダブルクリックイベント
   * @param event 
   * @param rowIndex 
   * @param columnName 
   */
  /**
   * セルダブルクリックイベント
   * @param event 
   * @param rowIndex 
   * @param columnName 
   */
  public onCellDoubleClick(event: MouseEvent, rowIndex: number, columnName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.editingCell = { rowIndex, columnName };
    // this.isEditing = true;
    // 非同期で入力フィールドにフォーカスを当てる
    // setTimeout(() => this.focusInput(rowIndex, columnName), 0);
    this.pendingInput = null;
    this.startEditing(rowIndex, columnName, false);
  }

  /**
   * 入力フィールドにフォーカスを当て、カーソルを最後尾に移動する
   * @param rowIndex 
   * @param columnName 
   */
  private focusInput(rowIndex: number, columnName: string) {
    const inputElement = document.querySelector(`input[data-row="${rowIndex}"][data-column="${columnName}"]`) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
      inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
    }
  }

  /**
   * セル編集完了イベント
   * @param event 
   */
  public async onCellEditComplete(newValue: any, rowIndex: number, columnName: string) {
    // 編集されたデータを保存
    const updatedData = {
      ...this.dataSource[rowIndex],
      [columnName]: newValue
    };

    // 編集されたデータを保存
    if (rowIndex !== null && columnName !== null) {
      this.dataSource[rowIndex] = updatedData;
      this.editingCell = { rowIndex: null, columnName: null };
      try {
        await this.todoService.saveData2db(this.dataSource);
        this.dataSource = this.utilService.calculateActualTimeAndDifference(this.dataSource);    // 実績時間を計算
        this.dataSource = this.utilService.updateBeginTimes(this.dataSource);                    // 開始時刻を更新
      } catch (error) {
        console.error('データの保存中にエラーが発生しました:', error);
        // エラー処理（例：ユーザーへの通知）
      }
      
      // 変更検出を強制的に実行
      this.changeDetectorRef.detectChanges();
    }
    // 編集されたデータを保存
    if (rowIndex !== null && columnName !== null) {
      console.log('dataSource:', this.dataSource);
      console.log('rowIndex:', rowIndex);
      console.log('columnName:', columnName);

      if (this.dataSource[rowIndex]) {
        const updatedValue = this.dataSource[rowIndex][columnName];
        console.log('updatedValue:', updatedValue);
        
        if (updatedValue !== undefined) {
          console.log('Updated category:', updatedValue);
        } else {
          console.log('カテゴリの値が未定義です');
          console.log('該当行のデータ:', this.dataSource[rowIndex]);
        }
      } else {
        console.log('指定された行が存在しません');
      }
    }
    this.endEditing();
  }

  /**
   * セルが編集可能かどうかを判定する
   * @param rowIndex 
   * @param columnName 
   * @returns 
   */
  public isCellEditable(rowIndex: number, columnName: string): boolean {
    return this.editingCell.rowIndex === rowIndex && this.editingCell.columnName === columnName;
  }

  /**
   * キーボードイベントハンドラ
   * @param event 
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log('event.key:', event.key);
    // 編集モード中の処理
    if (this.isEditing) {
      if (event.key === 'Escape') {
        // エスケープキーが押された場合は編集をキャンセルして表示モードに切り替え
        this.cancelEditing();
        event.preventDefault();
      } else if (event.key === 'Enter' && !this.isComposing) {
        // エンターキーが押された場合は値を保存し編集を終了して表示モードに切り替えて次の行に移動
        if (this.editingCell.rowIndex !== null && this.editingCell.columnName !== null) {
          const { rowIndex, columnName } = this.editingCell;
          const newValue = this.utilService.finishEditing(rowIndex, columnName);
          if (newValue !== null) {
            this.onCellEditComplete(newValue, rowIndex, columnName);
          }
        }
        if (this.selectedRowIndex < this.dataSource.length - 1) {
          this.selectedRowIndex++;
          this.updateSelectedCell();
        }
        event.preventDefault();
      } else if (event.key === 'F2') {
         // F2キーが押された場合は値を保存し編集を終了して表示モードに切り替え
         if (this.editingCell.rowIndex !== null && this.editingCell.columnName !== null) {
          const { rowIndex, columnName } = this.editingCell;
          const newValue = this.utilService.finishEditing(rowIndex, columnName);
          if (newValue !== null) {
            this.onCellEditComplete(newValue, rowIndex, columnName);
          }
        }
         event.preventDefault();
      }
      return;
    }

    // 表示モード中の処理
    switch(event.key) {
      case 'Enter':
        if (this.selectedRowIndex < this.dataSource.length - 1) {
          this.selectedRowIndex++;
          this.updateSelectedCell();
        }
        break;
      case 'ArrowUp':
        if (this.selectedRowIndex > 0) {
          this.selectedRowIndex--;
          this.updateSelectedCell();
        }
        break;
      case 'ArrowDown':
        if (this.selectedRowIndex < this.dataSource.length - 1) {
          this.selectedRowIndex++;
          this.updateSelectedCell();
        }
        break;
      case 'ArrowLeft':
        if (this.selectedColumnIndex > 0) {
          this.selectedColumnIndex--;
          this.updateSelectedCell();
        }
        break;
      case 'ArrowRight':
        if (this.selectedColumnIndex < this.displayedColumns.length - 1) {
          this.selectedColumnIndex++;
          this.updateSelectedCell();
        }
        break;
      case 'Delete':
        if (this.selectedCell.rowIndex !== null) {
          this.deleteSelectedRow();
          event.preventDefault();
        }
        break;
      case 'F2':
        if (this.selectedCell.rowIndex !== null && this.selectedCell.columnName !== null) {
          this.pendingInput = '';
          this.startEditing(this.selectedCell.rowIndex, this.selectedCell.columnName, false);
          event.preventDefault();
          return;
        }
        break;
      case 'c':
        if ((event.ctrlKey || event.metaKey) && this.selectedCell.rowIndex !== null) {
          this.onClickCopyButton();
          event.preventDefault();
        }
        break;
      case 'v':
        if ((event.ctrlKey || event.metaKey) && this.selectedCell.rowIndex !== null) {
          this.onClickPasteButton();
          event.preventDefault();
        }
        break;
      default:
        if (this.isEditableKey(event) 
                    && this.selectedCell.rowIndex !== null 
                    && this.selectedCell.columnName !== null) {
          this.pendingInput = event.key;
          this.startEditing(this.selectedCell.rowIndex, this.selectedCell.columnName, true);
          event.preventDefault();
          return;
        }
    }
    event.preventDefault();     // デフォルトの動作をキャンセル
  }

  /**
   * IME入力開始時のイベントハンドラ
   */
  @HostListener('compositionstart')
  onCompositionStart() {
    this.isComposing = true;
  }

  /**
   * IME入力終了時のイベントハンドラ
   */
  @HostListener('compositionend')
  onCompositionEnd() {
    this.isComposing = false;
  }

  /**
   * 編集可能なキーかどうかを判定する
   * @param event 
   * @returns 
   */
  private isEditableKey(event: KeyboardEvent): boolean {
    // 制御キーやファンクションキーを除外
    return event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey;
  }

  /**
   * 編集モードを開始する
   * @param rowIndex 
   * @param columnName 
   */
  private startEditing(rowIndex: number, columnName: string, doClear: boolean) {
    this.editingCell = { rowIndex, columnName };
    this.originalValue = this.dataSource[rowIndex][columnName];
    this.isEditing = true;
    if (doClear) {
      this.temporarilyClearCellValue(rowIndex, columnName);
    }
    
    setTimeout(() => {
      const inputElement = document.querySelector(`input[data-row="${rowIndex}"][data-column="${columnName}"]`) as HTMLInputElement;
      if (inputElement) {
        const currentValue = inputElement.value;
        inputElement.focus();
        if (this.pendingInput) {
          inputElement.value = currentValue + this.pendingInput;
          inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        } else {
          inputElement.setSelectionRange(currentValue.length, currentValue.length);
        }
        this.pendingInput = null;
      }
    }, 0);
  }  

  /**
   * 編集をキャンセルする
   */
  public cancelEditing() {
    if (this.editingCell.rowIndex !== null && this.editingCell.columnName !== null) {
      const { rowIndex, columnName } = this.editingCell;
      this.dataSource[rowIndex][columnName] = this.originalValue;
      this.endEditing();
      this.changeDetectorRef.detectChanges(); // 変更検出を強制的に実行
    }
  }

  /**
   * 編集モードを終了する
   */
  private endEditing() {
    this.isEditing = false;
    this.editingCell = { rowIndex: null, columnName: null };
    this.originalValue = null;
  }

  /**
   * 選択されたセルを更新する
   */
  private updateSelectedCell() {
    // 以前の選択を削除
    const prevSelected = document.querySelector('.selected-cell');
    if (prevSelected) {
      prevSelected.classList.remove('selected-cell');
    }

    // 新しい選択を適用
    const newSelected = document.querySelector(`table tr:nth-child(${this.selectedRowIndex + 1}) td:nth-child(${this.selectedColumnIndex + 1})`);
    if (newSelected) {
      newSelected.classList.add('selected-cell');
    }

    // this.selectedCell も更新
    this.selectedCell = {
      rowIndex: this.selectedRowIndex,
      columnName: this.displayedColumns[this.selectedColumnIndex]
    };
    console.log('this.selectedCell:', this.selectedCell);
  }

  /**
   * セルの値をクリアする
   * @param rowIndex 
   * @param columnName 
   */
  private async clearCellValue(rowIndex: number, columnName: string) {
    if (this.dataSource[rowIndex]) {
      this.dataSource[rowIndex][columnName] = '';
      this.dataSource = [...this.dataSource];
      try {
        await this.todoService.saveData2db(this.dataSource);
        this.dataSource = this.utilService.calculateActualTimeAndDifference(this.dataSource);
        this.dataSource = this.utilService.updateBeginTimes(this.dataSource);
      } catch (error) {
        console.error('データの保存中にエラーが発生しました:', error);
        // エラー処理（例：ユーザーへの通知）
      }
    }
  }

  /**
   * セルの値を一時的にクリアする
   * @param rowIndex 
   * @param columnName 
   */
  private temporarilyClearCellValue(rowIndex: number, columnName: string) {
    if (this.dataSource[rowIndex]) {
      // 元の値を保存
      this.originalValue = this.dataSource[rowIndex][columnName];
      // 値を一時的にクリア
      this.dataSource[rowIndex][columnName] = '';
      // ビューを更新
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * 行を複製する
   */
  public async onClickDuplicateButton() {
    if (this.selectedCell.rowIndex !== null) {
      try {
        // 選択された行のデータをコピー
        const sourceRow = { ...this.dataSource[this.selectedCell.rowIndex] };
        
        // IDと表示順以外の項目をコピー
        const newRow = {
          ...sourceRow,
          id: null,  // 新しい行のIDはnullに設定（DBが自動採番）
          displayOrder: this.dataSource.length + 1  // 表示順は最後に追加
        };

        // 新しい行を追加
        this.dataSource.push(newRow);
        this.dataSource = [...this.dataSource];
        
        // 表示順を振り直し
        this.dataSource = this.utilService.renumberDisplayOrder(this.dataSource);
        
        // DBに保存
        await this.todoService.saveData2db(this.dataSource);
        
        console.log('行が正常に複製されました');
      } catch (error) {
        console.error('行の複製中にエラーが発生しました:', error);
      }
    }
  }

  /**
   * 行をコピーする
   */
  public onClickCopyButton() {
    if (this.selectedCell.rowIndex !== null) {
      this.copiedRow = { ...this.dataSource[this.selectedCell.rowIndex] };
      // スナックバーでメッセージを表示
      this.snackBar.open('行がコピーされました', '閉じる', {
        duration: 2000,
      });
    }
  }

  /**
   * コピーした行をペーストする
   */
  public async onClickPasteButton() {
    if (this.selectedCell.rowIndex !== null && this.copiedRow) {
      try {
        // 新しい行を作成（IDと表示順以外の項目をコピー）
        const newRow = {
          ...this.copiedRow,
          id: null,  // 新しい行のIDはnullに設定（DBが自動採番）
          displayOrder: this.selectedCell.rowIndex + 1  // 選択行の上に挿入するため、選択行の表示順を使用
        };

        // 選択行の上に新しい行を挿入
        this.dataSource.splice(this.selectedCell.rowIndex, 0, newRow);
        this.dataSource = [...this.dataSource];
        
        // 表示順を振り直し
        this.dataSource = this.utilService.renumberDisplayOrder(this.dataSource);
        
        // DBに保存
        await this.todoService.saveData2db(this.dataSource);
        
        console.log('行が正常にペーストされました');
      } catch (error) {
        console.error('行のペースト中にエラーが発生しました:', error);
      }
    }
  }

  /**
   * 選択された行を削除する
   */
  private async deleteSelectedRow() {
    if (this.selectedCell.rowIndex !== null) {
      try {
        // 確認ダイアログを表示
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: '確認',
            message: '選択された行を削除しますか？'
          }
        });

        // ダイアログが閉じた後の処理
        dialogRef.afterClosed().subscribe(async result => {
          if (result && this.selectedCell.rowIndex !== null) {
            const rowIndex = this.selectedCell.rowIndex;
            this.dataSource = await this.todoService.deleteRow(this.dataSource, rowIndex);
            // 表示順を振り直し
            this.dataSource = this.utilService.renumberDisplayOrder(this.dataSource);
            // 選択位置を調整
            if (this.selectedRowIndex >= this.dataSource.length) {
              this.selectedRowIndex = this.dataSource.length - 1;
            }
            this.updateSelectedCell();
          }
        });
      } catch (error) {
        console.error('行の削除中にエラーが発生しました:', error);
        this.snackBar.open('行の削除中にエラーが発生しました', '閉じる', {
          duration: 3000,
        });
      }
    }
  }

  /**
   * 行クリックイベント
   * @param event マウスイベント
   * @param rowIndex 行インデックス
   */
  public onRowClick(event: MouseEvent, rowIndex: number) {
    this.selectedRowIndex = rowIndex;
    this.selectedColumnIndex = 0;
    this.updateSelectedCell();
  }

}
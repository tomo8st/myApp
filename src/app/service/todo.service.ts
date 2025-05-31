import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { UtilService } from './util.service';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  // エクスポート用の列定義
  private exportColumns: string[] = [
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

  constructor(private utilService: UtilService) {}

  /**
   * データベースからデータを読み込む
   * @param targetDate 対象日付
   * @returns データの配列
   */
  public loadData(targetDate: Date | null): Observable<any[]> {
    return from(this.db2loadData(targetDate));
  }

  /**
   * ファイルからデータを読み込む
   * @returns データの配列
   */
  public async loadDataFromFile(): Promise<any[]> {
    try {
      // ファイルからデータを読み込む
      const message = await (window as any).electron.testIpc();
      console.log('読み込んだデータ:', message);
      return JSON.parse(message.data);
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * データベースにデータを保存する
   * @param dataSource データソース
   */
  public async saveData2db(dataSource: any[]): Promise<void> {
    try {
      // データベースにデータを保存する
      for (const item of dataSource) {
        const saveItem = {
          id: item.id,
          date: item.date || '',
          displayOrder: item.displayOrder || '',
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

        console.log('item.category:', item.category);
        console.log('saveItem.category:', saveItem.category);

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
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 新しい行を追加する
   * @param targetDate 対象日付
   * @param currentLength 現在のデータ長
   * @returns 追加されたデータ
   */
  public async addRow(targetDate: Date | null, currentLength: number): Promise<any> {
    // 日付をフォーマットする
    const formatedDate = targetDate ? this.utilService.formatDate(targetDate) : null;
    if (formatedDate === null) {
      throw new Error('無効な日付です');
    }

    // 新しい行を追加する
    const addData = {
      id: null,
      date: formatedDate,
      displayOrder: currentLength + 1,
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
      return addData;
    } catch (error) {
      console.error('新しい行の追加中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 指定されたインデックスの行を削除する
   * @param dataSource データソース
   * @param index 削除する行のインデックス
   * @returns 更新されたデータソース
   */
  public async deleteRow(dataSource: any[], index: number): Promise<any[]> {
    if (index >= 0 && index < dataSource.length) {
      // DBから行を削除
      const itemToDelete = dataSource[index];
      try {
        const result = await (window as any).electron.deleteItem(itemToDelete);
        console.log('削除結果:', result);
        if (result.changes > 0) {
          console.log('行が正常に削除されました');
          // データソースから行を削除
          dataSource.splice(index, 1);
          return [...dataSource];
        } else {
          console.warn('削除対象の行が見つかりませんでした');
          return dataSource;
        }
      } catch (error) {
        console.error('行の削除中にエラーが発生しました:', error);
        throw error;
      }
    }
    return dataSource;
  }

  /**
   * データベースからデータを読み込む（内部実装）
   * @param targetDate 対象日付
   * @returns データの配列
   */
  private async db2loadData(targetDate: Date | null): Promise<any[]> {
    try {
      // 日付をフォーマットする
      const formatedDate = targetDate ? this.utilService.formatDate(targetDate) : null;
      if (formatedDate === null) {
        console.error('無効な日付です');
        return [];
      }
      console.log(`formatedDate = ${formatedDate}`);

      if (!(window as any).electron || typeof (window as any).electron.invoke !== 'function') {
        throw new Error('electron.invoke is not available');
      }

      // データベースからデータを読み込む
      const result = await (window as any).electron.invoke('getItems', formatedDate);
      console.log('getItems result:', result);

      if (Array.isArray(result)) {
        return result;
      } else {
        console.error('予期しないデータ形式:', result);
        return [];
      }
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      return [];
    }
  }

  /**
   * テーブルを削除して再作成する
   * @returns 処理結果
   */
  public async deleteAndRecreateTable(): Promise<void> {
    try {
      const result = await (window as any).electron.deleteAndRecreateTable();
      console.log(result.message);
      if (!result.success) {
        throw new Error('テーブルの削除と再作成に失敗しました: ' + result.message);
      }
      console.log('テーブルが正常に削除され、再作成されました。');
    } catch (error) {
      console.error('テーブル削除と再作成中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * CSVデータをインポートする
   * @param csvData CSVデータ
   * @returns インポート結果
   */
  public async importCsvData(csvData: string): Promise<any> {
    try {
      // CSVデータをインポート
      const result = await (window as any).electron.importCsvData(csvData);
      console.log('CSVインポート結果:', result);
      return result;
    } catch (error) {
      console.error('CSVインポート中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 全ToDoを削除する
   * @returns 削除結果
   */
  public async deleteAllTodos(): Promise<any> {
    try {
      // 全ToDoを削除
      const result = await (window as any).electron.invoke('deleteAllTodos');
      console.log('全ToDo削除結果:', result);
      return result;
    } catch (error) {
      console.error('全ToDo削除中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * データをCSV形式でエクスポートする
   */
  public async exportToCsv(): Promise<void> {
    try {
      // todoテーブルのすべてのデータを取得
      const allData = await (window as any).electron.getAllItems();

      // エクスポートするデータがない場合は処理を終了
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
      const filename = `todo_list_all_${this.utilService.formatDate(new Date())}.csv`;
      saveAs(blob, filename);

      console.log('CSVエクスポートが完了しました。');
    } catch (error) {
      console.error('CSVエクスポート中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * 列名を表示用の名前に変換する
   */
  private getColumnDisplayName(column: string): string {
    // 表示名を設定
    const displayNames: { [key: string]: string } = {
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
      'etc': '備考'
    };
    return displayNames[column] || column;
  }

  /**
   * CSV用にデータをエスケープする
   */
  private escapeCSV(data: any): string {
    // データがnullの場合は空文字を返す
    if (data == null) return '';
    // データが文字列の場合はエスケープする
    if (typeof data === 'string') {
      return `"${data.replace(/"/g, '""')}"`;
    }
    // データが文字列でない場合はそのまま返す
    return data.toString();
  }
}

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { UtilService } from './util.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
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
}

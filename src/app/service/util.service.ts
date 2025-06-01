import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  constructor() {}

  /**
   * 日付を文字列(YYYY/MM/DD)に変換する
   * @param date 日付
   * @returns 日付文字列
   */
  public formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * 編集モードを切り替える
   * @param editableIndex 編集可能な行のインデックス
   * @param index 新しい編集対象のインデックス
   * @returns 更新された編集可能な行のインデックス
   */
  public toggleEdit(editableIndex: number | null, index: number): number | null {
    // 編集中の行が同じ場合は編集を終了
    if (editableIndex === index) {
      return null;
    } else {
      // 編集モードに移行
      return index;
    }
  }

  /**
   * 指定された行を上に移動する
   * @param dataSource データソース
   * @param index 移動する行のインデックス
   * @returns 更新されたデータソース
   */
  public moveRowUp<T>(dataSource: T[], index: number): T[] {
    if (index > 0) {
      const item = dataSource.splice(index, 1)[0];
      dataSource.splice(index - 1, 0, item);
      return [...dataSource];
    }
    return dataSource;
  }

  /**
   * 指定された行を下に移動する
   * @param dataSource データソース
   * @param index 移動する行のインデックス
   * @returns 更新されたデータソース
   */
  public moveRowDown<T>(dataSource: T[], index: number): T[] {
    if (index < dataSource.length - 1) {
      const item = dataSource.splice(index, 1)[0];
      dataSource.splice(index + 1, 0, item);
      return [...dataSource];
    }
    return dataSource;
  }
} 
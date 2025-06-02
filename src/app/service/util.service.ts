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

  /**
   * 計画時刻を計算して更新する
   * @param dataSource データソース
   * @returns 更新されたデータソース
   */
  public updatePlanBeginTimes(dataSource: any[]): any[] {
    if (!dataSource || dataSource.length === 0) {
      return dataSource;
    }

    let currentTime = this.parseTime(dataSource[0].begintime);
    
    dataSource.forEach((task: any, index: number) => {
      if (index === 0) {
        task.planbegintime = task.begintime;
      } else {
        task.planbegintime = this.formatTime(currentTime);
      }
      
      const planTime = this.parseTime(task.plantime);
      currentTime = this.addMinutes(currentTime, planTime);
    });

    return [...dataSource];
  }

  /**
   * 実績時間を計算し、差異を算出する
   * @param dataSource データソース
   * @returns 更新されたデータソース
   */
  public calculateActualTimeAndDifference(dataSource: any[]): any[] {
    dataSource.forEach((task: any) => {
      if (task.begintime && task.endtime) {
        // 開始時刻と終了時刻を解析
        const beginTime = this.parseTime(task.begintime);
        const endTime = this.parseTime(task.endtime);
        
        // 実績時間を計算
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
        // 開始時刻と終了時刻がない場合は空白にする
        task.actualtime = '';
        task.diffefent = '';
      }
    });

    return [...dataSource];
  }

  /**
   * 時間文字列をDate型に変換する
   * @param timeString 時間文字列（HH:mm形式）
   * @returns Date型の時間
   */
  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
  }

  /**
   * Date型を時間文字列に変換する
   * @param date Date型の時間
   * @returns 時間文字列（HH:mm形式）
   */
  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 指定された分数を時間に加算する
   * @param date 基準となる時間
   * @param timeToAdd 加算する時間
   * @returns 加算後の時間
   */
  private addMinutes(date: Date, timeToAdd: Date): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + timeToAdd.getHours() * 60 + timeToAdd.getMinutes());
    return result;
  }
} 
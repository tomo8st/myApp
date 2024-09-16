import { Injectable } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<{ id: number, name: string }[]>([]);
  categories$ = this.categoriesSubject.asObservable();
  private electron: any;

  constructor() {
    this.initializeCategories();
  }

  /**
   * カテゴリを初期化する
   */
  private initializeCategories() {
    this.getCategories().subscribe(
      categories => this.categoriesSubject.next(categories),
      error => console.error('カテゴリの初期化中にエラーが発生しました:', error)
    );
  }

  /**
   * カテゴリを初期化する
   */
  private invokeElectron(channel: string, data?: any): Observable<any> {
    if (!(window as any).electron) {
      console.error('Electron object is not available');
      return throwError(() => new Error('Electron is not available'));
    }
    if (typeof (window as any).electron.invoke !== 'function') {
      console.error(`Electron invoke method is not available`);
      return throwError(() => new Error('Electron invoke method is not available'));
    }
    return from((window as any).electron.invoke(channel, data)).pipe(
      catchError(error => {
        console.error(`Error invoking ${channel}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * カテゴリテーブルを作成する
   */
  createCategoryTable(): Observable<void> {
    return this.invokeElectron('createCategoryTable').pipe(
      map((result: any) => {
        if (!result.success) {
          throw new Error(result.message);
        }
      })
    );
  }

  /**
   * 初期カテゴリを挿入する
   */
  insertInitialCategories(): Observable<void> {
    return this.invokeElectron('insertInitialCategories').pipe(
      map((result: any) => {
        if (!result.success) {
          throw new Error(result.message);
        }
      })
    );
  }

  /**
   * カテゴリを取得する
   */
  getCategories(): Observable<{ id: number, name: string }[]> {
    return this.invokeElectron('getCategories').pipe(
      map((result: any) => {
        if (!result.success) {
          throw new Error(result.message);
        }
        return result.categories.map((category: { id: string; name: any; }) => ({
          id: parseInt(category.id, 10),
          name: category.name
        }));
      }),
      tap(categories => {
        console.log('取得したカテゴリ:', categories); // デバッグ用
        this.categoriesSubject.next(categories);
      }),
      catchError(error => {
        console.error('カテゴリ取得エラー:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * カテゴリ名を取得する
   * @param id カテゴリID
   * @returns カテゴリ名
   */
  getCategoryName(id: number): Observable<string> {
    return this.categories$.pipe(
      map(categories => {
        console.log('検索するカテゴリID:', id); // デバッグ用
        console.log('現在のカテゴリリスト:', categories); // デバッグ用
        // idを整数に変換
        const intId = Math.round(id);
        console.log('整数に変換したカテゴリID:', intId); // デバッグ用
        const category = categories.find(c => c.id === intId);
        const result = category ? category.name : '不明なカテゴリ';
        console.log('見つかったカテゴリ名:', result); // デバッグ用
        return result;
      })
    );
  }

  /**
   * アイテムを取得する
   * @param date 日付
   * @returns アイテム
   */  
  getItems(date: string): Observable<any[]> {
    return this.invokeElectron('getItems', date);
  }
}
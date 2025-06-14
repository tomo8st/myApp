import { Component, Inject, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

// 確認ダイアログ
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">キャンセル</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>確認</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent {
  /**
   * コンストラクタ
   * @param dialogRef ダイアログ参照
   * @param data ダイアログデータ
   */
  constructor(
    // ダイアログ参照
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    // ダイアログデータ
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  /**
   * キーボードイベントハンドラ
   * @param event キーボードイベント
   */
  @HostListener('window:keydown.enter')
  onEnterKey() {
    this.dialogRef.close(true);
  }
}
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>アプリケーションについて</h2>
    <mat-dialog-content>
      <div class="about-content">
        <h3>ToDo管理アプリケーション v1.0.0</h3>
        <p>このアプリケーションは、日々のタスク管理を効率的に行うためのツールです。</p>
        <p>主な機能：</p>
        <ul>
          <li>ToDo項目の作成・編集・削除</li>
          <li>カテゴリ別のタスク管理</li>
          <li>時間管理（計画時間・実績時間）</li>
          <li>CSVインポート・エクスポート</li>
          <li>データベース保存</li>
        </ul>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>閉じる</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .about-content {
      padding: 16px 0;
    }
    .about-content h3 {
      margin-top: 0;
      color: #1976d2;
    }
    .about-content ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    .about-content li {
      margin: 8px 0;
    }
  `]
})
export class AboutDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
} 
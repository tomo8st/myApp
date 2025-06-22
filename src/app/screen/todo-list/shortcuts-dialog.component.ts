import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>キーボードショートカット</h2>
    <mat-dialog-content>
      <div class="shortcuts-content">
        <div class="shortcuts-grid">
          <div class="shortcut-section">
            <h3>ナビゲーション</h3>
            <div class="shortcut-item">
              <span class="key">Enter</span>
              <span class="description">次の行に移動</span>
            </div>
            <div class="shortcut-item">
              <span class="key">↑</span>
              <span class="description">行を上に移動</span>
            </div>
            <div class="shortcut-item">
              <span class="key">↓</span>
              <span class="description">行を下に移動</span>
            </div>
            <div class="shortcut-item">
              <span class="key">←</span>
              <span class="description">列を左に移動</span>
            </div>
            <div class="shortcut-item">
              <span class="key">→</span>
              <span class="description">列を右に移動</span>
            </div>
          </div>

          <div class="shortcut-section">
            <h3>編集</h3>
            <div class="shortcut-item">
              <span class="key">F2</span>
              <span class="description">セル編集</span>
            </div>
            <div class="shortcut-item">
              <span class="key">Delete</span>
              <span class="description">行削除</span>
            </div>
          </div>

          <div class="shortcut-section">
            <h3>コピー・ペースト</h3>
            <div class="shortcut-item">
              <span class="key">Ctrl+C</span>
              <span class="description">行コピー</span>
            </div>
            <div class="shortcut-item">
              <span class="key">Ctrl+V</span>
              <span class="description">行ペースト</span>
            </div>
          </div>

          <div class="shortcut-section">
            <h3>行移動</h3>
            <div class="shortcut-item">
              <span class="key">Command+↑</span>
              <span class="description">選択行を上に移動</span>
            </div>
            <div class="shortcut-item">
              <span class="key">Command+↓</span>
              <span class="description">選択行を下に移動</span>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>閉じる</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .shortcuts-content {
      padding: 16px 0;
    }
    .shortcuts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .shortcut-section {
      margin-bottom: 0;
    }
    .shortcut-section h3 {
      margin: 0 0 12px 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
    }
    .shortcut-item {
      display: flex;
      align-items: center;
      margin: 8px 0;
      padding: 8px 0;
    }
    .key {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      min-width: 80px;
      text-align: center;
      margin-right: 16px;
    }
    .description {
      flex: 1;
    }
  `]
})
export class ShortcutsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ShortcutsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
} 
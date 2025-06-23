import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { JapaneseWeekdayPipe } from './japanese-weekday.pipe';

@Component({
  selector: 'app-duplicate-day-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    JapaneseWeekdayPipe
  ],
  template: `
    <h2 mat-dialog-title>1日分のToDoを複製</h2>
    <mat-dialog-content>
      <div class="duplicate-content">
        <p>現在表示されている1日分のToDoを指定した日付に複製します。</p>
        <p><strong>コピー元日付:</strong> {{data.sourceDate | date:'yyyy/MM/dd'}} ({{data.sourceDate | japaneseWeekday}})</p>
        <p><strong>ToDo件数:</strong> {{data.todoCount}}件</p>
        
        <mat-form-field class="date-field">
          <mat-label>コピー先日付</mat-label>
          <input matInput [matDatepicker]="picker" placeholder="日付を選択"
                 [(ngModel)]="targetDate" required>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">キャンセル</button>
      <button mat-raised-button color="primary" 
              [disabled]="!targetDate"
              (click)="onDuplicate()">複製</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .duplicate-content {
      padding: 16px 0;
    }
    .duplicate-content p {
      margin: 8px 0;
    }
    .date-field {
      width: 100%;
      margin-top: 16px;
    }
  `]
})
export class DuplicateDayDialogComponent {
  targetDate: Date | null = null;

  constructor(
    public dialogRef: MatDialogRef<DuplicateDayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      sourceDate: Date;
      todoCount: number;
    }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onDuplicate(): void {
    if (this.targetDate) {
      this.dialogRef.close(this.targetDate);
    }
  }
} 
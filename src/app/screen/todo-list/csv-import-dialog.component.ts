import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-csv-import-dialog',
  template: `
    <h2 mat-dialog-title>CSVファイルをインポート</h2>
    <mat-dialog-content>
      <input type="file" (change)="onFileSelected($event)" accept=".csv">
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancelClick()">キャンセル</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule],
})
export class CsvImportDialogComponent {
  constructor(public dialogRef: MatDialogRef<CsvImportDialogComponent>) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csvData = e.target.result;
        this.dialogRef.close(csvData);
      };
      reader.readAsText(file);
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

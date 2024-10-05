import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../service/category.service';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router'; // Routerをインポート

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatTableModule, MatIconModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit {
  categories: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  newCategoryName: string = '';
  editingCategory: any = null;

  constructor(private categoryService: CategoryService, private router: Router) { }

  /**
   * 初期化
   */
  ngOnInit() {
    this.loadCategories();
  }

  /**
   * カテゴリを読み込む
   */
  loadCategories() {
    this.categoryService.getCategories().subscribe(
      (data) => {
        this.categories.data = data;
      },
      (error) => {
        console.error('カテゴリの読み込み中にエラーが発生しました:', error);
      }
    );
  }

  /**
   * カテゴリを追加する
   */
  addCategory() {
    if (this.newCategoryName.trim()) {
      this.categoryService.addCategory(this.newCategoryName).subscribe(
        () => {
          this.loadCategories();
          this.newCategoryName = '';
        },
        (error) => {
          console.error('カテゴリの追加中にエラーが発生しました:', error);
        }
      );
    }
  }

  /**
   * カテゴリを編集する
   * @param category カテゴリ
   */
  editCategory(category: any) {
    if (this.editingCategory === category) {
      this.categoryService.updateCategory(category.id, category.name).subscribe(
        () => {
          this.editingCategory = null;
          this.loadCategories();
        },
        (error) => {
          console.error('カテゴリの更新中にエラーが発生しました:', error);
        }
      );
    } else {
      this.editingCategory = category;
    }
  }

  /**
   * カテゴリを削除する
   * @param category カテゴリ
   */
  deleteCategory(category: any) {
    if (confirm(`カテゴリ "${category.name}" を削除してもよろしいですか？`)) {
      this.categoryService.deleteCategory(category.id).subscribe(
        () => {
          this.loadCategories();
        },
        (error) => {
          console.error('カテゴリの削除中にエラーが発生しました:', error);
        }
      );
    }
  }

  // ToDoリスト画面へ遷移する関数を追加
  navigateToTodoList() {
    this.router.navigate(['/todo-list']); // ToDoリスト画面のルートパスを指定
  }
}

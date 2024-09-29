import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TodoListComponent } from './screen/todo-list/todo-list.component';
import { CategoryManagementComponent } from './screen/category-management/category-management.component';

export const routes: Routes = [
    { path: 'todo-list', component: TodoListComponent },
    { path: '', component: TodoListComponent },
    { path: 'category', component: CategoryManagementComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
export class AppRoutingModule { }
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TodoListComponent } from './screen/todo-list/todo-list.component';

export const routes: Routes = [
    { path: 'todolist', component: TodoListComponent },
    { path: '', component: TodoListComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
export class AppRoutingModule { }
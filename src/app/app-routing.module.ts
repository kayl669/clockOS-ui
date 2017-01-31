import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';

const appRoutes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        data: { preload: true }
    },
    { path: '**',   redirectTo: '/home' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
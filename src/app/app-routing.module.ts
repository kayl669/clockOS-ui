import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';

const appRoutes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        data: { preload: true }
    },
    {
        path: 'menu',
        component: MenuComponent,
        data: { preload: true }
    },
    { path: '**',   redirectTo: '/home' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { useHash: true }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
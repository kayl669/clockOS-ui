import { NgModule }             from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { SplashComponent } from './splash/splash.component';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';

const appRoutes: Routes = [
    {
        path: '',
        component: SplashComponent
    },
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
      { useHash: true,
      preloadingStrategy: PreloadAllModules }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
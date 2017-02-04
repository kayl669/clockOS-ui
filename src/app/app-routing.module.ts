import { NgModule }             from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { SplashComponent } from './splash/splash.component';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';
import { SettingsComponent } from './settings/settings.component';

const appRoutes: Routes = [
    {
        path: 'splash_screen',
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
    {
        path: 'settings',
        component: SettingsComponent,
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
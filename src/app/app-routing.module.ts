import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {MenuComponent} from './menu/menu.component';
import {SettingsComponent} from './settings/settings.component';
import {AlarmComponent} from './alarm/alarm.component';
import {WeatherComponent} from './weather/weather.component';
import {DeezerPlaylistComponent} from "./deezer-playlist/deezer-playlist.component";
import {RadioComponent} from "./radio/radio.component";

const appRoutes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        data: {preload: false}
    },
    {
        path: 'alarm',
        component: AlarmComponent,
        data: {preload: true}
    },
    {
        path: 'menu',
        component: MenuComponent,
        data: {preload: true}
    },
    {
        path: 'weather',
        component: WeatherComponent,
        data: {preload: true}
    },
    {
        path: 'playlists',
        component: DeezerPlaylistComponent,
        data: {preload: true}
    },
    {
        path: 'radios',
        component: RadioComponent,
        data: {preload: true}
    },
    {
        path: 'settings',
        component: SettingsComponent,
        data: {preload: true}
    },
    {path: '**', redirectTo: '/home'},
];

@NgModule({
    imports: [
        RouterModule.forRoot(
            appRoutes,
            {
                useHash: true,
                preloadingStrategy: PreloadAllModules
            }
        )
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {
}

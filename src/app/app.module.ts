/// <reference types="@types/deezer-sdk"/>
import {BrowserModule} from '@angular/platform-browser';
import {LOCALE_ID, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import localeFr from '@angular/common/locales/fr';
import localeFrExtra from '@angular/common/locales/extra/fr';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';

import {HomeComponent} from './home/home.component';
import {MenuComponent} from './menu/menu.component';
import {StatusBarComponent} from './status-bar/status-bar.component';
import {SettingsComponent} from './settings/settings.component';
import {registerLocaleData} from '@angular/common';
import {WebsocketService} from './web-socket.service';
import {
    IgxAvatarModule,
    IgxButtonModule,
    IgxCardModule,
    IgxCarouselModule,
    IgxGridModule,
    IgxIconModule,
    IgxInputGroupModule,
    IgxLayoutModule,
    IgxListModule,
    IgxNavbarModule,
    IgxNavigationDrawerModule,
    IgxRadioModule,
    IgxRippleModule,
    IgxSelectModule,
    IgxSliderModule,
    IgxSwitchModule,
    IgxTimePickerModule,
    IgxToggleModule
} from 'igniteui-angular';
import {WeatherService} from './weather.service';
import {HttpClientModule} from '@angular/common/http';
import {AlarmComponent} from './alarm/alarm.component';
import {WeatherComponent} from './weather/weather.component';
import {DeezerComponent} from './deezer/deezer.component';
import {ScriptLoaderModule} from 'ngx-script-loader';
import {DeezerPlaylistComponent} from './deezer-playlist/deezer-playlist.component';
import {DeezerMainService} from './deezer-main.service';
import {RadioComponent} from './radio/radio.component';
import {AudioService} from './audio.service';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        MenuComponent,
        StatusBarComponent,
        SettingsComponent,
        AlarmComponent,
        WeatherComponent,
        DeezerComponent,
        DeezerPlaylistComponent,
        RadioComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        IgxButtonModule,
        IgxIconModule,
        IgxLayoutModule,
        IgxNavigationDrawerModule,
        IgxRadioModule,
        IgxRippleModule,
        IgxSwitchModule,
        IgxToggleModule,
        IgxTimePickerModule,
        IgxInputGroupModule,
        IgxListModule,
        IgxSliderModule,
        IgxNavbarModule,
        ScriptLoaderModule,
        IgxCardModule,
        IgxAvatarModule,
        IgxGridModule,
        IgxSelectModule,
        IgxCarouselModule
    ],
    providers: [WebsocketService, WeatherService, DeezerMainService, AudioService, {provide: LOCALE_ID, useValue: 'fr-FR'}],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {
        registerLocaleData(localeFr, 'fr', localeFrExtra);
    }
}

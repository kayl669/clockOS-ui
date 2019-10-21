import {BrowserModule} from '@angular/platform-browser';
import {LOCALE_ID, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import localeFr from '@angular/common/locales/fr';
import localeFrExtra from '@angular/common/locales/extra/fr';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';

import {ClockComponent} from './clock/clock.component';
import {HomeComponent} from './home/home.component';
import {MenuComponent} from './menu/menu.component';
import {StatusBarComponent} from './status-bar/status-bar.component';
import {SettingsComponent} from './settings/settings.component';
import {SplashComponent} from './splash/splash.component';
import {registerLocaleData} from '@angular/common';
import {WebsocketService} from './web-socket.service';
import {
  IgxButtonModule,
  IgxIconModule,
  IgxInputGroupModule,
  IgxLayoutModule,
  IgxListModule,
  IgxNavbarModule,
  IgxNavigationDrawerModule,
  IgxRadioModule,
  IgxRippleModule,
  IgxSliderModule,
  IgxSwitchModule,
  IgxTimePickerModule,
  IgxToggleModule
} from 'igniteui-angular';
import {WeatherService} from './weather.service';
import {HttpClientModule} from '@angular/common/http';
import {AlarmComponent} from './alarm/alarm.component';
import {WeatherComponent} from './weather/weather.component';

@NgModule({
  declarations: [
    AppComponent,
    ClockComponent,
    HomeComponent,
    MenuComponent,
    StatusBarComponent,
    SettingsComponent,
    SplashComponent,
    AlarmComponent,
    WeatherComponent
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
    IgxNavbarModule
  ],
  providers: [WebsocketService, WeatherService, {provide: LOCALE_ID, useValue: 'fr-FR'}],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    registerLocaleData(localeFr, 'fr', localeFrExtra);
  }
}

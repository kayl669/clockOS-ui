import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Router } from '@angular/router';
import { MdListModule, MdToolbarModule, MdIconModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { ClockComponent } from './clock/clock.component';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { SettingsComponent } from './settings/settings.component';
import { SplashComponent } from './splash/splash.component';

@NgModule({
  declarations: [
    AppComponent,
    ClockComponent,
    HomeComponent,
    MenuComponent,
    StatusBarComponent,
    SettingsComponent,
    SplashComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MdListModule,
    MdToolbarModule,
    MdIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

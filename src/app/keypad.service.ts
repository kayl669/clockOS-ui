import * as io from 'socket.io-client';
import {EventEmitter, HostListener, Injectable, Output} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {IConfig} from "./interfaces";

@Injectable({
  providedIn: 'root'
})
export class KeypadService {
  server;
  keypadSocket;
  @Output() rightEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() downEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() upEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() snoozeEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() stopEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() leftEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() oKEvent: EventEmitter<any> = new EventEmitter(true);

  constructor(private httpClient: HttpClient) {
    this.httpClient.get<IConfig>('/config').toPromise().then(((data) => {
      this.server = data.server;
      this.keypadSocket = io.connect(this.server, {rejectUnauthorized: false});
      this.keypadSocket
          .on('connected', (data, identification) => {
            identification('keypad');
            console.log('Connected as keypad');
          })
          .on('RIGHT', (() => {
            this.rightEvent.emit();
          }).bind(this))
          .on('DOWN', (() => {
            this.downEvent.emit();
          }).bind(this))
          .on('UP', (() => {
            this.upEvent.emit();
          }).bind(this))
          .on('SNOOZE', (() => {
            this.snoozeEvent.emit();
          }).bind(this))
          .on('STOP', (() => {
            this.stopEvent.emit();
          }).bind(this))
          .on('LEFT', (() => {
            this.leftEvent.emit();
          }).bind(this))
          .on('OK', (() => {
            this.oKEvent.emit();
          }).bind(this));
    }).bind(this));
  }

    handleKeyboardEvent(event: KeyboardEvent) {
        console.log(event.keyCode);
        switch (event.keyCode) {
            case 37:
                // Left key
                this.leftEvent.emit();
                break;
            case 39:
                // Right key
                this.rightEvent.emit();
                break;
            case 38:
                // Up key
                this.upEvent.emit();
                break;
            case 40:
                // Down key
                this.downEvent.emit();
                break;
            case 35:
                // End key
                this.stopEvent.emit();
                break;
            case 36:
                // Home key
                this.snoozeEvent.emit();
                break;
            case 34:
                // Page down key
                this.oKEvent.emit();
                break;
            default:
            // any other key was pressed
        }
    }
}

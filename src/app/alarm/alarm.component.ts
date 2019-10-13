import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {IgxInputDirective, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {WebsocketService} from '../web-socket.service';
import {AlarmService} from '../alarm.service';
import {IAlarm} from '../interfaces';

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.scss']
})
export class AlarmComponent implements AfterViewInit {
  public mode: InteractionMode = InteractionMode.DropDown;
  activate;
  volume;
  volumeIncreaseDuration;
  snoozeAfter;
  selected = 'enableToggle';
  alarm: IAlarm;

  @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
  @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;

  constructor(public router: Router, private webSocket: WebsocketService, private alarmService: AlarmService) {
  }

  ngAfterViewInit() {
    this.alarmService.getAlarm().subscribe(
      result => {
        this.alarm = result;
        this.activate = this.alarm.activate;
        const d = new Date();
        this.timePicker.value = new Date(d.getFullYear(), d.getMonth(), d.getDay(), this.alarm.hour, this.alarm.minute, 0, 0);
        this.volume = this.alarm.volume;
        this.volumeIncreaseDuration = this.alarm.volumeIncreaseDuration;
        this.snoozeAfter = this.alarm.snoozeAfter;
        this.timePicker.nextHour();

        return this.alarm;
      },
      error => console.log('Oups', error));

    this.webSocket.connect(environment.api).subscribe((msg) => {
      console.log('Response from websocket: ' + msg.data);
      switch (msg.data) {
        case 'LEFT':  // Left button pressed
          this.navigateLeft();
          break;
        case 'RIGHT':  // Right button pressed
          this.navigateRight();
          break;
        case 'UP':  // Up button pressed
          this.navigateUp();
          break;
        case 'DOWN':  // Down button pressed
          this.navigateDown();
          break;
        case 'OK':  // OK button pressed
          this.navigateOK();
          break;
        case 'SNOOZE':  // Snooze button pressed
          console.log('SNOOZE');
          break;
        case 'STOP':  // Stop button pressed
          this.navigateStop();
          break;
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 37:
        // Left key
        this.navigateLeft();
        break;
      case 39:
        // Right key
        this.navigateRight();
        break;
      case 38:
        // Up key
        this.navigateUp();
        break;
      case 40:
        // Down key
        this.navigateDown();
        break;
      case 17:
        // Right ctrl key
        this.navigateStop();
        break;
      case 13:
        // Return key
        this.navigateOK();
        break;
      default:
      // any other key was pressed
    }
  }

  private navigateUp() {
    switch (this.selected) {
      case 'snoozeAfter':
        this.selected = 'volumeIncreaseDuration';
        break;
      case 'volumeIncreaseDuration':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'volume';
        break;
      case 'volume':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'minutes';
        break;
      case 'minutes':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'hours';
        break;
      case 'hours':
        this.selected = 'enableToggle';
        break;
      case 'enableToggle':
        this.selected = 'snoozeAfter';
        break;
    }
    console.log(this.selected);
  }

  private navigateDown() {
    switch (this.selected) {
      case 'enableToggle':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'hours';
        break;
      case 'hours':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'minutes';
        break;
      case 'minutes':
        this.selected = 'volume';
        break;
      case 'volume':
        this.selected = 'volumeIncreaseDuration';
        break;
      case 'volumeIncreaseDuration':
        this.selected = 'snoozeAfter';
        break;
      case 'snoozeAfter':
        this.selected = 'enableToggle';
        break;
    }
    console.log(this.selected);
  }

  private navigateRight() {
    switch (this.selected) {
      case 'enableToggle':
        this.activate = !this.activate;
        break;
      case 'hours':
        this.timePicker.scrollHourIntoView('' + (this.timePicker.value.getHours() + 1));
        this.timePicker.okButtonClick();
        break;
      case 'minutes':
        this.timePicker.scrollMinuteIntoView('' + (this.timePicker.value.getMinutes() + 1));
        this.timePicker.okButtonClick();
        break;
      case 'volume':
        this.volume = this.volume + 10;
        break;
      case 'volumeIncreaseDuration':
        this.volumeIncreaseDuration++;
        break;
      case 'snoozeAfter':
        this.snoozeAfter = this.snoozeAfter + 5;
        break;
    }
  }

  private navigateLeft() {
    switch (this.selected) {
      case 'enableToggle':
        this.activate = !this.activate;
        break;
      case 'hours':
        this.timePicker.scrollHourIntoView('' + (this.timePicker.value.getHours() - 1));
        this.timePicker.okButtonClick();
        break;
      case 'minutes':
        this.timePicker.scrollMinuteIntoView('' + (this.timePicker.value.getMinutes() - 1));
        this.timePicker.okButtonClick();
        break;
      case 'volume':
        this.volume = this.volume - 10;
        break;
      case 'volumeIncreaseDuration':
        this.volumeIncreaseDuration--;
        break;
      case 'snoozeAfter':
        this.snoozeAfter = this.snoozeAfter - 5;
        break;
    }
  }

  private navigateOK() {
    this.alarm.activate = this.activate;
    this.alarm.hour = this.timePicker.value.getHours();
    this.alarm.minute = this.timePicker.value.getMinutes();
    this.alarm.volume = this.volume;
    this.alarm.volumeIncreaseDuration = this.volumeIncreaseDuration;
    this.alarm.snoozeAfter = this.snoozeAfter;
    this.alarmService.setAlarm(this.alarm);
    this.router.navigate(['/']);
  }

  private navigateStop() {
    this.router.navigate(['/']);
  }

  public getHours(displayTime: string) {
    return displayTime.split(':')[0];
  }

  public getMinutes(displayTime: string) {
    return displayTime.split(':')[1];
  }
}

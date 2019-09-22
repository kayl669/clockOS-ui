import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {MatSlideToggle} from '@angular/material';
import {IgxInputDirective, IgxSliderComponent, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {WebsocketService} from '../web-socket.service';

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.scss']
})
export class AlarmComponent implements AfterViewInit {
  public mode: InteractionMode = InteractionMode.DropDown;
  enable = false;
  time = new Date(0);
  stopAfter = 1;
  selected = 'enableToggle';

  @ViewChild('enableToggle', {static: true}) enableToggle: MatSlideToggle;
  @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
  @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;
  @ViewChild('stopAfter', {static: false}) stopAfterValue: IgxSliderComponent;


  constructor(public router: Router, private webSocket: WebsocketService) {
  }

  ngAfterViewInit() {
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
          console.log('STOP');
          break;
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log(event.keyCode);
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
      case 13:
        // Return key
        this.navigateOK();
        break;
      default:
      // any other key was pressed
    }
  }

  private navigateLeft() {
    switch (this.selected) {
      case 'stopAfter':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'minutes';
        break;
      case 'minutes':
        this.timePickerValue.nativeElement.focus();
        this.selected = 'hours';
        break;
      case 'hours':
        this.enableToggle.focus();
        this.selected = 'enableToggle';
        break;
      case 'enableToggle':
        this.selected = 'stopAfter';
        break;
    }
    console.log(this.selected);
  }

  private navigateRight() {
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
        this.selected = 'stopAfter';
        break;
      case 'stopAfter':
        this.enableToggle.focus();
        this.selected = 'enableToggle';
        break;
    }
    console.log(this.selected);
  }

  private navigateUp() {
    switch (this.selected) {
      case 'enableToggle':
        this.enableToggle.toggle();
        break;
      case 'hours':
        this.timePicker.nextHour();
        this.timePicker.okButtonClick();
        break;
      case 'minutes':
        this.timePicker.nextMinute();
        this.timePicker.okButtonClick();
        break;
      case 'stopAfter':
        this.stopAfter++;
        break;
    }
  }

  private navigateDown() {
    switch (this.selected) {
      case 'enableToggle':
        this.enableToggle.toggle();
        break;
      case 'hours':
        this.timePicker.prevHour();
        this.timePicker.okButtonClick();
        break;
      case 'minutes':
        this.timePicker.prevMinute();
        this.timePicker.okButtonClick();
        break;
      case 'stopAfter':
        this.stopAfter--;
        break;
    }
  }

  private navigateOK() {
    this.router.navigate(['/']);
  }

  public getHours(displayTime: string) {
    return displayTime.split(':')[0];
  }

  public getMinutes(displayTime: string) {
    return displayTime.split(':')[1];
  }
}

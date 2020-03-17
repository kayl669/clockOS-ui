import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {IgxInputDirective, IgxSwitchComponent, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {AlarmService} from '../alarm.service';
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'app-alarm',
    templateUrl: './alarm.component.html',
    styleUrls: ['./alarm.component.scss']
})
export class AlarmComponent implements AfterViewInit, OnInit {
    public mode: InteractionMode = InteractionMode.DropDown;
    volume;
    volumeIncreaseDuration;
    snoozeAfter;
    selected = 'enableToggle';
    @ViewChild('activate', {static: true}) activate: IgxSwitchComponent;
    @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
    @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;

    constructor(public router: Router, private webSocket: WebsocketService, private alarmService: AlarmService, private httpClient: HttpClient) {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        this.alarmService.getAlarm().subscribe(
            result => {
                this.activate.checked = result.activate;
                const d = new Date();
                this.timePicker.value = new Date(d.getFullYear(), d.getMonth(), d.getDay(), result.hour, result.minute, 0, 0);
                this.volume = result.volume;
                this.volumeIncreaseDuration = result.volumeIncreaseDuration;
                this.snoozeAfter = result.snoozeAfter;
            },
            error => console.log('Oups', error));

        this.webSocket.connect().subscribe((msg) => {
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
                this.activate.checked = !this.activate.checked;
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
                this.activate.checked = !this.activate.checked;
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
        this.alarmService.setAlarm({
            activate: this.activate.checked,
            hour: this.timePicker.value.getHours(),
            minute: this.timePicker.value.getMinutes(),
            volume: this.volume,
            volumeIncreaseDuration: this.volumeIncreaseDuration,
            snoozeAfter: this.snoozeAfter
        });
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

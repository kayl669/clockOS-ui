import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {IgxCarouselComponent, IgxInputDirective, IgxSwitchComponent, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {AlarmService} from '../alarm.service';
import {DeezerMainService} from "../deezer-main.service";
import DZ = DeezerSdk.DZ;

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
    playlistCurrentIndex: number;
    public playlists: Array<{ id: number, picture: string, title: string }> = [];
    selected = 'enableToggle';
    @ViewChild('activate', {static: true}) activate: IgxSwitchComponent;
    @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
    @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;
    @ViewChild("playlistSelect", {static: false}) public playlistSelect: IgxCarouselComponent;

    constructor(public router: Router, private webSocket: WebsocketService, private alarmService: AlarmService, private deezerMainService: DeezerMainService) {
    }

    ngOnInit(): void {
        this.alarmService.getAlarm().subscribe(
            (result => {
                this.activate.checked = result.activate;
                const d = new Date();
                this.timePicker.value = new Date(d.getFullYear(), d.getMonth(), d.getDay(), result.hour, result.minute, 0, 0);
                this.volume = result.volume;
                this.volumeIncreaseDuration = result.volumeIncreaseDuration;
                this.snoozeAfter = result.snoozeAfter;
                // @ts-ignore
                this.deezerMainService.ensureConnected(((msg, socket) => {
                    console.log(msg);
                    DZ.api('/user/me/playlists', (response) => {
                        this.playlists = [];
                        this.playlistCurrentIndex = 0;
                        console.log(result.playlist);
                        for (let i = 0; i < response.data.length; i++) {
                            let item = {id: response.data[i].id, picture: response.data[i].picture_small, title: response.data[i].title};
                            this.playlists.push(item);
                            if (result.playlist == response.data[i].id) {
                                this.playlistCurrentIndex = i;
                            }
                        }
                    });
                }).bind(this));

            }).bind(this));
    }

    ngAfterViewInit() {
        this.webSocket.connect().subscribe((msg) => {
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
            case 35:
                // End key
                this.navigateStop();
                break;
            case 34:
                // Page down key
                this.navigateOK();
                break;
            default:
            // any other key was pressed
        }
    }

    private navigateUp() {
        switch (this.selected) {
            case 'playlist':
                this.selected = 'snoozeAfter';
                break;
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
                this.selected = 'playlist';
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
                this.selected = 'playlist';
                break;
            case 'playlist':
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
            case 'playlist':
                this.playlistSelect.get(this.playlistCurrentIndex).active = false;
                this.playlistCurrentIndex = (this.playlistCurrentIndex + 1) % this.playlists.length;
                this.playlistSelect.get(this.playlistCurrentIndex).active = true;
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
            case 'playlist':
                this.playlistSelect.get(this.playlistCurrentIndex).active = false;
                this.playlistCurrentIndex = (this.playlists.length + this.playlistCurrentIndex - 1) % this.playlists.length;
                this.playlistSelect.get(this.playlistCurrentIndex).active = true;
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
            snoozeAfter: this.snoozeAfter,
            playlist: this.playlists[this.playlistCurrentIndex].id,
        }).then(()=>{
            this.router.navigate(['/']);
        });
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

    onSlideAdded() {
        this.playlistSelect.get(this.playlistSelect.slides.length - 1).active = this.playlistSelect.slides.length - 1 == this.playlistCurrentIndex;
    }
}

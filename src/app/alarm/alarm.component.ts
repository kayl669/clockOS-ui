import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {IgxButtonGroupComponent, IgxCarouselComponent, IgxInputDirective, IgxSwitchComponent, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {AlarmService} from '../alarm.service';
import {DeezerMainService} from "../deezer-main.service";
import {IRadio} from "../interfaces";
import {HttpClient} from "@angular/common/http";
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
    radioCurrentIndex: number;
    public playlists: Array<{ id: number, picture: string, title: string }> = [];
    public radios: Array<{ id: string, picture: string, title: string }> = [];
    selected = 'enableToggle';
    dayOfWeekFocus: number;
    @ViewChild('activate', {static: true}) activate: IgxSwitchComponent;
    @ViewChild('dayOfWeek', {static: true}) dayOfWeekButtonGroup: IgxButtonGroupComponent;
    @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
    @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;
    @ViewChild('enableDeezer', {static: true}) enableDeezer: IgxSwitchComponent;
    @ViewChild("playlistSelect", {static: false}) public playlistSelect: IgxCarouselComponent;
    @ViewChild("radioSelect", {static: false}) public radioSelect: IgxCarouselComponent;

    constructor(public router: Router, private webSocket: WebsocketService, private alarmService: AlarmService, private deezerMainService: DeezerMainService, private httpClient: HttpClient) {
    }

    ngOnInit(): void {
        this.alarmService.getAlarm().subscribe(
            (result => {
                this.activate.checked = result.activate;
                const d = new Date()
                for (let i = 0; i < result.dayOfWeek.length; i++) {
                    this.dayOfWeekButtonGroup.selectButton(result.dayOfWeek[i]);
                }
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
                                this.enableDeezer.checked = true;
                                this.playlistCurrentIndex = i;
                            }
                        }
                    });
                }).bind(this));
                this.httpClient.get<IRadio[]>("https://de1.api.radio-browser.info/json/stations/search?countrycode=FR&language=fr&limit=30&order=clickcount&reverse=true").subscribe(data => {
                    console.log(data);
                    this.radios = [];
                    this.radioCurrentIndex = 0;
                    for (let i = 0; i < data.length; i++) {
                        let item = {id: data[i].stationuuid, picture: data[i].favicon, title: data[i].name};
                        this.radios.push(item);
                        if (result.stationuuid == data[i].stationuuid) {
                            this.enableDeezer.checked = false;
                            this.radioCurrentIndex = i;
                        }
                    }
                });
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
            case 'radios':
                this.selected = 'enableDeezer';
                break;
            case 'enableDeezer':
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
                this.selected = 'dayOfWeek';
                this.dayOfWeekFocus = 6;
                break;
            case 'dayOfWeek':
                if (this.dayOfWeekFocus > 0)
                    this.dayOfWeekFocus = this.dayOfWeekFocus - 1;
                else
                    this.selected = 'enableToggle';
                break;
            case 'enableToggle':
                this.selected = this.enableDeezer.checked ? 'playlist' : 'radios';
                break;
        }
        console.log(this.selected);
    }

    private navigateDown() {
        switch (this.selected) {
            case 'enableToggle':
                this.timePickerValue.nativeElement.focus();
                this.selected = 'dayOfWeek';
                this.dayOfWeekFocus = 0;
                break;
            case 'dayOfWeek':
                if (this.dayOfWeekFocus < 6)
                    this.dayOfWeekFocus = this.dayOfWeekFocus + 1;
                else
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
                this.selected = 'enableDeezer';
                break;
            case 'enableDeezer':
                this.selected = this.enableDeezer.checked ? 'playlist' : 'radios';
                break;
            case 'playlist':
            case 'radios':
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
            case 'dayOfWeek':
                if (!this.dayOfWeekButtonGroup.buttons[this.dayOfWeekFocus].selected)
                    this.dayOfWeekButtonGroup.selectButton(this.dayOfWeekFocus);
                else
                    this.dayOfWeekButtonGroup.deselectButton(this.dayOfWeekFocus);
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
            case 'enableDeezer':
                this.enableDeezer.checked = !this.enableDeezer.checked;
                break;
            case 'playlist':
                this.playlistSelect.get(this.playlistCurrentIndex).active = false;
                this.playlistCurrentIndex = (this.playlistCurrentIndex + 1) % this.playlists.length;
                this.playlistSelect.get(this.playlistCurrentIndex).active = true;
                break;
            case 'radios':
                this.radioSelect.get(this.radioCurrentIndex).active = false;
                this.radioCurrentIndex = (this.radioCurrentIndex + 1) % this.radios.length;
                this.radioSelect.get(this.radioCurrentIndex).active = true;
                break;
        }
        console.log(this.selected);
    }

    private navigateLeft() {
        switch (this.selected) {
            case 'enableToggle':
                this.activate.checked = !this.activate.checked;
                break;
            case 'dayOfWeek':
                if (!this.dayOfWeekButtonGroup.buttons[this.dayOfWeekFocus].selected)
                    this.dayOfWeekButtonGroup.selectButton(this.dayOfWeekFocus);
                else
                    this.dayOfWeekButtonGroup.deselectButton(this.dayOfWeekFocus);
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
            case 'enableDeezer':
                this.enableDeezer.checked = !this.enableDeezer.checked;
                break;
            case 'playlist':
                this.playlistSelect.get(this.playlistCurrentIndex).active = false;
                this.playlistCurrentIndex = (this.playlists.length + this.playlistCurrentIndex - 1) % this.playlists.length;
                this.playlistSelect.get(this.playlistCurrentIndex).active = true;
                break;
            case 'radios':
                this.radioSelect.get(this.radioCurrentIndex).active = false;
                this.radioCurrentIndex = (this.radios.length + this.radioCurrentIndex - 1) % this.radios.length;
                this.radioSelect.get(this.radioCurrentIndex).active = true;
                break;
        }
        console.log(this.selected);
    }

    private navigateOK() {
        var dOfWeek = [];
        for (let i = 0; i < 7; i++) {
            if (this.dayOfWeekButtonGroup.buttons[i].selected) {
                dOfWeek.push(i);
            }
        }
        console.log(dOfWeek);
        this.alarmService.setAlarm({
            activate: this.activate.checked,
            dayOfWeek: dOfWeek,
            hour: this.timePicker.value.getHours(),
            minute: this.timePicker.value.getMinutes(),
            volume: this.volume,
            volumeIncreaseDuration: this.volumeIncreaseDuration,
            snoozeAfter: this.snoozeAfter,
            type: this.enableDeezer.checked ? 'Deezer' : 'Radio',
            playlist: this.enableDeezer.checked ? this.playlists[this.playlistCurrentIndex].id : 0,
            stationuuid: this.enableDeezer.checked ? '' : this.radios[this.radioCurrentIndex].id
        }).then(() => {
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

    onPlaylistAdded() {
        this.playlistSelect.get(this.playlistSelect.slides.length - 1).active = this.playlistSelect.slides.length - 1 == this.playlistCurrentIndex;
    }

    onRadioAdded() {
        this.radioSelect.get(this.radioSelect.slides.length - 1).active = this.radioSelect.slides.length - 1 == this.radioCurrentIndex;
    }
}

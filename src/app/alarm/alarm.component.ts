import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {IgxButtonGroupComponent, IgxCarouselComponent, IgxInputDirective, IgxSwitchComponent, IgxTimePickerComponent, InteractionMode} from 'igniteui-angular';
import {Router} from '@angular/router';
import {AlarmService} from '../alarm.service';
import {PlayerMainService} from "../player-main.service";
import {IRadio} from "../interfaces";
import {HttpClient} from "@angular/common/http";
import {KeypadService} from "../keypad.service";

@Component({
    selector: 'app-alarm',
    templateUrl: './alarm.component.html',
    styleUrls: ['./alarm.component.scss']
})
export class AlarmComponent implements OnInit, AfterViewInit {
    muted: boolean = true;
    public mode: InteractionMode = InteractionMode.DropDown;
    volume;
    volumeIncreaseDuration;
    snoozeAfter;
    playlistCurrentIndex: number;
    radioCurrentIndex: number;
    public playlists: Array<{ id: number, picture: string, title: string }> = [];
    public radios: Array<{ id: string, picture: string, title: string }> = [];
    public types: Array<string> = ["radio", "youtube", "mp3"];
    public selectedType: string = this.types[1];
    selected = 'enableToggle';
    dayOfWeekFocus: number;
    @ViewChild('activate', {static: true}) activate: IgxSwitchComponent;
    @ViewChild('dayOfWeek', {static: true}) dayOfWeekButtonGroup: IgxButtonGroupComponent;
    @ViewChild('timePicker', {static: true}) timePicker: IgxTimePickerComponent;
    @ViewChild('timePickerValue', {static: false}) timePickerValue: IgxInputDirective;
    @ViewChild("playlistSelect", {static: false}) public playlistSelect: IgxCarouselComponent;
    @ViewChild("radioSelect", {static: false}) public radioSelect: IgxCarouselComponent;

    constructor(public router: Router, private alarmService: AlarmService, private playerMainService: PlayerMainService, private httpClient: HttpClient, private keypadService: KeypadService) {
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
                this.selectedType = result.type;
                this.playerMainService.searchPlayLists().then(((response) => {
                    this.playlists = [];
                    this.playlistCurrentIndex = 0;
                    console.log(result.playlist);
                    for (let i = 0; i < response.length; i++) {
                        let item = {id: response[i].id, picture: response[i].details.picture, title: response[i].details.title};
                        this.playlists.push(item);
                        if (result.playlist == response[i].id) {
                            this.playlistCurrentIndex = i;
                        }
                    }
                }).bind(this));
                this.httpClient.get<IRadio[]>("https://de1.api.radio-browser.info/json/stations/search?countrycode=FR&language=fr&limit=30&order=clickcount&reverse=true").subscribe(data => {
                    console.log(data);
                    this.radios = [];
                    this.radioCurrentIndex = 0;
                    for (let i = 0; i < data.length; i++) {
                        let item = {id: data[i].stationuuid, picture: data[i].favicon, title: data[i].name};
                        this.radios.push(item);
                        if (result.stationuuid == data[i].stationuuid) {
                            this.radioCurrentIndex = i;
                        }
                    }
                });
            }).bind(this));
        this.keypadService.rightEvent.subscribe((() => {
            if (!this.muted) this.navigateRight();
        }).bind(this));
        this.keypadService.downEvent.subscribe((() => {
            if (!this.muted) this.navigateDown();
        }).bind(this));
        this.keypadService.upEvent.subscribe((() => {
            if (!this.muted) this.navigateUp();
        }).bind(this));
        this.keypadService.stopEvent.subscribe((() => {
            if (!this.muted) this.navigateStop();
        }).bind(this));
        this.keypadService.leftEvent.subscribe((() => {
            if (!this.muted) this.navigateLeft();
        }).bind(this));
        this.keypadService.oKEvent.subscribe((() => {
            if (!this.muted) this.navigateOK();
        }).bind(this));
    }

    ngAfterViewInit() {
        this.muted = false;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        this.keypadService.handleKeyboardEvent(event);
    }

    private navigateUp() {
        switch (this.selected) {
            case 'playlist':
            case 'radios':
                this.selected = 'type';
                break;
            case 'type':
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
                if (this.selectedType == this.types[0]) {
                    this.selected = 'radios';
                } else if (this.selectedType == this.types[1]) {
                    this.selected = 'playlist';
                } else {
                    this.selected = 'type';
                }
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
                this.selected = 'type';
                break;
            case 'type':
                if (this.selectedType == this.types[0]) {
                    this.selected = 'radios';
                } else if (this.selectedType == this.types[1]) {
                    this.selected = 'playlist';
                } else {
                    this.selected = 'enableToggle';
                }
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
            case 'type':
                for (let i = 0; i < this.types.length; i++) {
                    if (this.types[i] == this.selectedType) {
                        this.selectedType = this.types[(i + 1) % this.types.length];
                        break;
                    }
                }
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
            case 'type':
                for (let i = 0; i < this.types.length; i++) {
                    if (this.types[i] == this.selectedType) {
                        this.selectedType = this.types[(this.types.length + i - 1) % this.types.length];
                        break;
                    }
                }
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
            type: this.selectedType,
            playlist: this.selectedType == this.types[1] ? this.playlists[this.playlistCurrentIndex].id : 0,
            stationuuid: this.selectedType == this.types[0] ? this.radios[this.radioCurrentIndex].id : ''

        }).then(() => {
            this.muted = true;
            this.router.navigate(['/']);
        });
    }

    private navigateStop() {
        this.muted = true;
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

import {AfterViewInit, Component, HostBinding, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {WeatherService} from '../weather.service';
import {ICurrentWeather} from '../interfaces';
import {AlarmService} from '../alarm.service';
import moment from 'moment';
import {PlayerMainService} from "../player-main.service";
import * as io from 'socket.io-client';

declare var $: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit, AfterViewInit {
    keypadSocket;
    current: ICurrentWeather;
    private tickInterval: number = 1000; // ms
    enableAlarm: boolean = false;
    timeAlarmDaysOfWeek: string = "";
    timeAlarm: string = "";

    constructor(
        public router: Router,
        private alarmService: AlarmService,
        private weatherService: WeatherService,
        public playerMainService: PlayerMainService) {
    }

    @HostBinding('style.display') display = 'block';
    @HostBinding('style.position') position = 'absolute';

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
            case 35:
                // End key
                this.navigateStop();
                break;
            case 36:
                // Home key
                this.navigateSnooze();
                break;
            case 34:
                // Page down key
                this.navigateOK();
                break;
            default:
            // any other key was pressed
        }
    }

    ngOnInit() {
        moment.locale('fr');
        this.weatherService.currentWeather.subscribe(data => (this.current = data));
        setInterval(() => {
            this.weatherService.getCity().subscribe(data => {
                return (this.weatherService.updateCurrentWeather(data.city));
            });
        }, 60000);
        this.tick();
    }

    ngAfterViewInit() {
        this.alarmService.getAlarm().subscribe(result => {
            this.enableAlarm = result.activate;
            const d = new Date();
            this.timeAlarmDaysOfWeek = "  ";
            var days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
            for (let i = 0; i < 7; i++) {
                var day = '  ';
                for (let j = 0; j < result.dayOfWeek.length; j++) {
                    if (i == result.dayOfWeek[j]) {
                        day = days[i] + ' ';
                        break;
                    }
                }
                this.timeAlarmDaysOfWeek += day;
            }
            this.timeAlarm = " " + moment(new Date(d.getFullYear(), d.getMonth(), d.getDay(), result.hour, result.minute, 0, 0)).format("HH:mm");
        })
        this.keypadSocket = io.connect("/", {rejectUnauthorized: false});
        this.keypadSocket
            .on('connected', (data, identification) => {
                identification('keypad');
                console.log('Connected as keypad');
            })
            .on('RIGHT', (() => {
                this.navigateRight();
            }).bind(this))
            .on('DOWN', (() => {
                this.navigateDown();
            }).bind(this))
            .on('UP', (() => {
                this.navigateUp();
            }).bind(this))
            .on('SNOOZE', (() => {
                this.navigateSnooze();
            }).bind(this))
            .on('STOP', (() => {
                this.navigateStop();
            }).bind(this))
            .on('LEFT', (() => {
                this.navigateLeft();
            }).bind(this))
            .on('OK', (() => {
                this.navigateOK();
            }).bind(this));
    }

    private navigateLeft() {
        console.log('LEFT');
    }

    public navigateRight() {
        console.log('RIGHT');
        this.keypadSocket.disconnect();
        this.router.navigate(['/menu']);
    }

    private navigateUp() {
        console.log('UP');
        if (this.playerMainService.isPlaying()) {
            var volume = this.playerMainService.getVolume() + 10;
            if (volume > 100)
                volume = 100;
            this.playerMainService.setVolume(volume);
        }
    }

    private navigateDown() {
        console.log('DOWN');
        if (this.playerMainService.isPlaying()) {
            var volume = this.playerMainService.getVolume() - 10;
            if (volume < 0)
                volume = 0;
            this.playerMainService.setVolume(volume);
        }
    }

    private navigateOK() {
        console.log('OK');
    }

    private navigateStop() {
        console.log('STOP');
        if (this.playerMainService.isPlaying()) {
            this.playerMainService.stop();
        }
        this.alarmService.stopAlarm();
    }

    private navigateSnooze() {
        console.log('SNOOZE');
        this.alarmService.snoozeAlarm();
    }

    /*
  Inspired by https://dribbble.com/shots/2004657-Alarm-Clock-concept
   */
    private polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians;
        angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    };

    private describeArc(x, y, radius, startAngle, endAngle) {
        var arcSweep, end, start;
        start = this.polarToCartesian(x, y, radius, endAngle);
        end = this.polarToCartesian(x, y, radius, startAngle);
        arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
        return ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');
    };

    private setCaptions() {
        $('#day').text(moment().format('dddd'));

        $('#date').text(moment().format('D MMMM'));
        var dot, hour, hourArc, minArc, minute, now, pos;
        now = new Date();
        hour = now.getHours() % 12;
        minute = now.getMinutes();
        hourArc = (hour * 60 + minute) / (12 * 60) * 360;
        minArc = minute / 60 * 360;
        $('.clockArc.hour').attr('d', this.describeArc(500, 240, 150, 0, hourArc));
        $('.clockArc.minute').attr('d', this.describeArc(500, 240, 170, 0, minArc));
        $('.clockDot.hour').attr('d', this.describeArc(500, 240, 150, hourArc - 3, hourArc));
        $('.clockDot.minute').attr('d', this.describeArc(500, 240, 170, minArc - 1, minArc));
        dot = $(".clockDot.hour");
        pos = this.polarToCartesian(500, 240, 150, hourArc);
        dot.attr("cx", pos.x);
        dot.attr("cy", pos.y);
        dot = $(".clockDot.minute");
        pos = this.polarToCartesian(500, 240, 170, minArc);
        dot.attr("cx", pos.x);
        dot.attr("cy", pos.y);
        return $('#time').text(moment().format('H:mm'));
    };

    private tick() {
        this.setCaptions();
        setTimeout(() => this.tick(), this.tickInterval); // reset the timer
    }

    disconnect() {
        this.playerMainService.disconnect()
    }

    reconnect() {
        this.playerMainService.ensurePlayerConnected(() => {
            console.log("Reconnected");
        })
    }
}

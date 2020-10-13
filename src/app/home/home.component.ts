import {AfterViewInit, Component, HostBinding, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {WeatherService} from '../weather.service';
import {ICurrentWeather} from '../interfaces';
import {AlarmService} from '../alarm.service';
import moment from 'moment';
import {PlayerMainService} from "../player-main.service";
import {KeypadService} from "../keypad.service";

declare var $: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit, AfterViewInit {
    muted: boolean = true;
    current: ICurrentWeather;
    private tickInterval: number = 1000; // ms
    enableAlarm: boolean = false;
    timeAlarmDaysOfWeek: string = "";
    timeAlarm: string = "";

    constructor(private route: ActivatedRoute,
                private router: Router,
                private alarmService: AlarmService,
                private weatherService: WeatherService,
                public playerMainService: PlayerMainService,
                private keypadService: KeypadService) {
    }

    @HostBinding('style.display') display = 'block';
    @HostBinding('style.position') position = 'absolute';

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        this.keypadService.handleKeyboardEvent(event);
    }

    ngOnInit() {
        moment.locale('fr');
        this.weatherService.currentWeather.subscribe(data => (this.current = data));
        setInterval(() => {
            this.weatherService.getCity().subscribe(data => {
                return (this.weatherService.updateCurrentWeather(data.city));
            });
            this.updateAlarm();
            this.playerMainService.ensurePlayerConnected().then((() => {
                if (!this.playerMainService.isPlayerConnected()) {
                    this.reconnect();
                }
            }).bind(this));
            }, 60000);
        this.tick();
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
        this.keypadService.snoozeEvent.subscribe((() => {
            if (!this.muted) this.navigateSnooze();
        }).bind(this));
    }

    ngAfterViewInit() {
        this.route.params.subscribe((params: Params) => {
            if (params['command'] == 'connect') {
                this.reconnect();
            } else if (params['command'] == 'disconnect') {
                this.disconnect();
            }
        });
        this.muted = false;
    }

    private updateAlarm() {
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
    }

    private navigateLeft() {
        console.log('LEFT');
        if (this.playerMainService.isPlaying()) {
            this.playerMainService.prevTrack();
        }
    }

    public navigateRight() {
        console.log('RIGHT', this.playerMainService.isPlaying());
        if (this.playerMainService.isPlaying()) {
            this.playerMainService.nextTrack();
        } else {
            this.muted = true;
            this.router.navigate(['/menu']);
        }
    }

    private navigateUp() {
        console.log('UP');
        if (this.playerMainService.isPlaying()) {
            this.playerMainService.setVolume(+10);
        }
    }

    private navigateDown() {
        console.log('DOWN');
        if (this.playerMainService.isPlaying()) {
            this.playerMainService.setVolume(-10);
        }
    }

    private navigateOK() {
        console.log('OK');
        if (!this.playerMainService.isPlaying()) {
            this.playerMainService.play();
        }
    }

    private navigateStop() {
        console.log('STOP');
        this.alarmService.isAlarmPlaying().subscribe((isPlaying) => {
            if (isPlaying)
                this.alarmService.stopAlarm();
            else
                this.playerMainService.stop();
        });
    }

    private navigateSnooze() {
        console.log('SNOOZE');
        this.alarmService.isAlarmPlaying().subscribe((isPlaying) => {
            if (isPlaying)
                this.alarmService.snoozeAlarm();
            else
                this.playerMainService.pause();
        });
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
        this.playerMainService.disconnect();
    }

    reconnect() {
        location.href = "/auth";
    }
}

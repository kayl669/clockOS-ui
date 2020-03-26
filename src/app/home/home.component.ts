import {AfterViewInit, Component, HostBinding, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {WeatherService} from '../weather.service';
import {ICurrentWeather} from '../interfaces';
import {AlarmService} from '../alarm.service';
import moment from 'moment';

declare var $: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit, AfterViewInit {

    current: ICurrentWeather;
    private tickInterval: number = 1000; // ms
    enableAlarm: boolean = false;
    timeAlarm: string = "";

    constructor(
        public router: Router,
        private webSocket: WebsocketService,
        private alarmService: AlarmService,
        private weatherService: WeatherService) {
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
        this.alarmService.getAlarm().subscribe(result => {
            this.enableAlarm = result.activate;
            const d = new Date();
            this.timeAlarm = moment(new Date(d.getFullYear(), d.getMonth(), d.getDay(), result.hour, result.minute, 0, 0)).format("HH:mm");
        })
    }

    ngAfterViewInit() {
        this.webSocket.connect().subscribe((msg) => {
            console.log('Response from websocket: ' + msg.data);
            switch (msg.data) {
                case 'RIGHT':  // Right button pressed
                    this.navigateRight();
                    break;
                case 'DOWN':  // Down button pressed
                    this.navigateDown();
                    break;
                case 'UP':  // Up button pressed
                    this.navigateUp();
                    break;
                case 'SNOOZE':  // Snooze button pressed
                    this.navigateSnooze();
                    break;
                case 'STOP':  // Stop button pressed
                    this.navigateStop();
                    break;
                case 'LEFT':  // Left button pressed
                    this.navigateLeft();
                    break;
                case 'OK':  // OK button pressed
                    this.navigateOK();
                    break;
            }
        });
    }

    private navigateLeft() {
    }

    private navigateRight() {
        this.router.navigate(['/menu']);
    }

    private navigateUp() {
    }

    private navigateDown() {
    }

    private navigateOK() {
    }

    private navigateStop() {
        console.log('STOP');
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

}

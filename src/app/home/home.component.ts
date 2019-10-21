import {AfterViewInit, Component, HostBinding, HostListener, OnInit, Renderer2} from '@angular/core';
import {Router} from '@angular/router';
import {fadeInZoom} from '../animations';
import {environment} from '../../environments/environment';
import {WebsocketService} from '../web-socket.service';
import {WeatherService} from '../weather.service';
import {ICurrentWeather} from '../interfaces';
import {AlarmService} from '../alarm.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeInZoom]
})

export class HomeComponent implements OnInit, AfterViewInit {

  current: ICurrentWeather;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private webSocket: WebsocketService,
    private alarmService: AlarmService,
    private weatherService: WeatherService) {
  }

  @HostBinding('@routeAnimation') routeAnimation = true;
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
      case 17:
        // Right ctrl key
        this.navigateStop();
        break;
      case 16:
        // Right shift key
        this.navigateSnooze();
        break;
      case 13:
        // Return key
        this.navigateOK();
        break;
      default:
      // any other key was pressed
    }
  }

  ngOnInit() {
    this.weatherService.currentWeather.subscribe(data => (this.current = data));
    setInterval(() => {
      this.weatherService.getCity().subscribe(data => {
        return (this.weatherService.updateCurrentWeather(data.city));
      });
    }, 60000);
  }

  ngAfterViewInit() {
    this.webSocket.connect(environment.api).subscribe((msg) => {
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
}

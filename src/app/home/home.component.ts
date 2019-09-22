import {AfterViewInit, Component, HostBinding, HostListener, OnInit, Renderer2} from '@angular/core';
import {Router} from '@angular/router';
import {fadeInZoom} from '../animations';
import {environment} from '../../environments/environment';
import {WebsocketService} from '../web-socket.service';
import {WeatherService} from '../weather.service';
import {ICurrentWeather} from '../interfaces';

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
    private weatherService: WeatherService) {
  }

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.position') position = 'absolute';

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log(event.keyCode);
    switch (event.keyCode) {
      case 39:
        // Right key
        this.router.navigate(['/menu']);
        break;
      case 37:
        // Left key
        break;
      case 38:
        // Up key
        break;
      case 40:
        // Down key
        break;
      default:
      // any other key was pressed
    }
  }

  ngOnInit() {
    this.weatherService.currentWeather.subscribe(data => (this.current = data));
    this.weatherService.updateCurrentWeather(environment.city);
  }

  ngAfterViewInit() {
    this.webSocket.connect(environment.api).subscribe((msg) => {
      console.log('Response from websocket: ' + msg.data);
      switch (msg.data) {
        case 'RIGHT':  // Right button pressed
          console.log('RIGHT');
          this.router.navigate(['/menu']);
          break;
        case 'DOWN':  // Down button pressed
          console.log('DOWN');
          break;
        case 'UP':  // Up button pressed
          console.log('UP');
          break;
        case 'SNOOZE':  // Snooze button pressed
          console.log('SNOOZE');
          break;
        case 'STOP':  // Stop button pressed
          console.log('STOP');
          break;
        case 'LEFT':  // Left button pressed
          console.log('LEFT');
          break;
        case 'OK':  // OK button pressed
          console.log('OK');
          break;
      }
    });
  }
}

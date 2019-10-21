import {AfterViewInit, Component, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements AfterViewInit {
  public navigationItems: { icon: string; name: string; routerLink: string }[] = [
    {
      name: 'Settings',
      icon: 'settings',
      routerLink: '/settings',
    },
    {
      name: 'Weather',
      icon: 'wb_sunny',
      routerLink: '/weather',
    },
    {
      name: 'Alarms',
      icon: 'alarm',
      routerLink: '/alarm',
    },
    {
      name: 'Shutdown',
      icon: 'power_settings_new',
      routerLink: '',
    },
  ];
  public selected = 1;

  constructor(public router: Router,
              private webSocket: WebsocketService) {
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
    this.navigate('/');
  }

  private navigateRight() {
    this.navigateOK();
  }

  private navigateUp() {
    this.selected = (this.navigationItems.length + this.selected - 1) % this.navigationItems.length;
  }

  private navigateDown() {
    this.selected = (this.selected + 1) % this.navigationItems.length;
  }

  private navigateOK() {
    this.navigate(this.navigationItems[this.selected].routerLink);
  }

  navigate(routerLink) {
    this.router.navigate([routerLink]);
  }
}

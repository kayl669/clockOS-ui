import {AfterViewInit, Component, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements AfterViewInit {
    public navigationItems: { icon: string; name: string; routerLink: string }[] = [
        {
            name: 'Alarme',
            icon: 'alarm',
            routerLink: '/alarm',
        },
        {
            name: 'Météo',
            icon: 'wb_sunny',
            routerLink: '/weather',
        },
        {
            name: 'Playlists',
            icon: 'queue_music',
            routerLink: '/playlists',
        },
        {
            name: 'Configuration Wifi',
            icon: 'settings',
            routerLink: '/settings',
        },
    ];
    public selected = 0;

    constructor(public router: Router, private webSocket: WebsocketService) {
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

    private navigateStop() {
        this.router.navigate(['/']);
    }

    navigate(routerLink) {
        this.router.navigate([routerLink]);
    }
}

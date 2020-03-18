import {AfterViewInit, Component, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements AfterViewInit {
    constructor(public router: Router, private webSocket: WebsocketService) {
    }

    ngAfterViewInit() {
        this.webSocket.connect().subscribe((msg) => {
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
                default:
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
            case 17:
                // Right ctrl key
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

    }

    private navigateRight() {

    }

    private navigateUp() {

    }

    private navigateDown() {

    }

    private navigateOK() {
        this.router.navigate(['/']);
    }
}

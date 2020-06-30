import {AfterViewInit, Component, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import * as io from 'socket.io-client';
import {HttpClient} from "@angular/common/http";
import {IConfig} from "../interfaces";

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements AfterViewInit {
    keyPadSocket;
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
            name: 'Radios',
            icon: 'radio',
            routerLink: '/radios',
        },
        {
            name: 'Configuration Wifi',
            icon: 'settings',
            routerLink: '/settings',
        },
    ];
    public selected = 0;

    constructor(public router: Router, private httpClient: HttpClient) {
    }

    ngAfterViewInit() {
        this.httpClient.get<IConfig>('/config').subscribe(data => {
            console.log('Connecting to ' + data.ws);
            this.keyPadSocket = io.connect(data.ws, {rejectUnauthorized: false});
            this.keyPadSocket
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
                .on('STOP', (() => {
                    this.navigateStop();
                }).bind(this))
                .on('LEFT', (() => {
                    this.navigateLeft();
                }).bind(this))
                .on('OK', (() => {
                    this.navigateOK();
                }).bind(this));
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
        this.keyPadSocket.disconnect();
        this.router.navigate(['/']);
    }

    navigate(routerLink) {
        this.keyPadSocket.disconnect();
        this.router.navigate([routerLink]);
    }
}

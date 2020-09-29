import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeypadService} from "../keypad.service";

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, AfterViewInit {
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
    muted: boolean = true;

    constructor(private router: Router, private keypadService: KeypadService) {
    }

    ngOnInit(): void {
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
        this.muted = true;
        this.router.navigate(['/']);
    }

    navigate(routerLink) {
        this.muted = true;
        this.router.navigate([routerLink]);
    }
}

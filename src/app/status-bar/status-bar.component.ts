import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";

@Component({
    selector: 'app-status-bar',
    templateUrl: './status-bar.component.html',
    styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {

    constructor(public router: Router) {
    }

    title: string;
    clock: number;

    private tickInterval: number = 1000; // ms
    private tick() {
        this.clock = Date.now(); // get the current time
        setTimeout(() => this.tick(), this.tickInterval); // reset the timer
    }

    ngOnInit() {
        this.tick();
        setTimeout(() => this.tick(), this.tickInterval);
    }
}

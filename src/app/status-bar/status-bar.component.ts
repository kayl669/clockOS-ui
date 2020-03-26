import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-status-bar',
    templateUrl: './status-bar.component.html',
    styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements OnInit {

    constructor() {
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

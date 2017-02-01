import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'clock-widget',
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.scss']
})
export class ClockComponent implements OnInit {

  @Input() size: string;
  @Input() format: string;
  @Input() extraClass: string;

  // constructor() { }

  clock: Number;

  private tickInterval: number = 1000; // ms
  private tick() {
    this.clock = Date.now() // get the current time
    setTimeout(() => this.tick(), this.tickInterval); // reset the timer
  }
  ngOnInit() {
    setTimeout(() => this.tick(), this.tickInterval);
  }

}

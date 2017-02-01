import { Component, OnInit, HostBinding } from '@angular/core';
import { fadeInZoom } from '../animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeInZoom]
})
export class HomeComponent implements OnInit {

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display')   display = 'block';
  @HostBinding('style.position')  position = 'relative';

  constructor() { }

  ngOnInit() {
  }

}

import { Component, HostBinding, OnInit } from '@angular/core';
import { MdList } from '@angular/material'

import { rightInAnimation } from '../animations';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  animations: [ rightInAnimation ]
})
export class MenuComponent implements OnInit {

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display')   display = 'block';
  @HostBinding('style.position')  position = 'relative';

  constructor() { }

  ngOnInit() {
  }

}

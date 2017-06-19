import { Component, HostBinding, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MdList } from '@angular/material'

import { rightInAnimation } from '../animations';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  animations: [ rightInAnimation ]
})
export class MenuComponent implements OnInit {

  constructor(private router: Router) { }

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display')   display = 'block';
  @HostBinding('style.position')  position = 'absolute';

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    // console.log(event.keyCode);
    switch (event.keyCode) {
      case 39:
        // Right key
        break;
      case 37:
        // Left key
        this.router.navigate(['/']);
        break;
      case 38:
        // Up key
        break;
      case 40:
        // Down key
        break;
      default:
        // any other key was pressed
    }
  }

  ngOnInit() {
  }

}

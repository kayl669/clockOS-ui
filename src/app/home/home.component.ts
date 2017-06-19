import { Component, AfterViewInit, HostBinding, ViewChild, ElementRef, Renderer, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInZoom } from '../animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeInZoom]
})

export class HomeComponent implements AfterViewInit {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    console.log(event.keyCode);
    switch (event.keyCode) {
      case 39:
        // Right key
        this.router.navigate(['/menu']);
        break;
      case 37:
        // Left key
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

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display')   display = 'block';
  @HostBinding('style.position')  position = 'absolute';


  constructor(
    private renderer: Renderer,
    private router: Router
    ) { }

  /*buttonBlur() {
    this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }*/

  ngAfterViewInit() {
    // this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }

}

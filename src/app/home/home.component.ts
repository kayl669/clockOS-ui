import { Component, AfterViewInit, HostBinding, ViewChild, ElementRef, Renderer } from '@angular/core';
import {Router} from '@angular/router';
import { fadeInZoom } from '../animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeInZoom]
})
export class HomeComponent implements AfterViewInit {

  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display')   display = 'block';
  @HostBinding('style.position')  position = 'relative';

  @ViewChild('mainButton') enterButton: ElementRef;

  constructor(
    private renderer: Renderer,
    private router: Router
    ) { }

  parentRouter;

  onEnter() {
    this.router.navigate(['/menu']);
    console.log("Enter Pressed");
  }

  buttonBlur() {
    this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }

  ngAfterViewInit() {
    this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }

}

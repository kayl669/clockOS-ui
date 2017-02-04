import { Component, AfterViewInit, HostBinding, ViewChild, ElementRef, Renderer } from '@angular/core';
import { Router } from '@angular/router';
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
  @HostBinding('style.position')  position = 'absolute';

  @ViewChild('mainButton') enterButton: ElementRef;

  constructor(
    private renderer: Renderer,
    private router: Router
    ) { }

  onEnter() {
    this.router.navigate(['/menu']);
  }

  buttonBlur() {
    this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }

  ngAfterViewInit() {
    this.renderer.invokeElementMethod(this.enterButton.nativeElement,'focus');
  }

}

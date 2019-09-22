import {AfterViewInit, Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss']
})
export class SplashComponent implements AfterViewInit {

  constructor(private router: Router) {
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngAfterViewInit() {
    setTimeout(() => this.goHome(), 6000);
  }

}

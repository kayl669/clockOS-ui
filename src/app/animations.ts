import {animate, state, style, transition, trigger} from '@angular/animations';

export const fadeInZoom =
  trigger('routeAnimation', [
    state('*',
      style({
        opacity: 1,
        transform: 'scale(1)',
        zIndex: 2
      })
    ),
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'scale(0.95)',
        zIndex: 3
      }),
      animate('0.1s ease-in',
        style({
          opacity: 1,
          transform: 'scale(1)',
          zIndex: 3
        }))
    ]),
    transition(':leave', [
      style({
        zIndex: 0
      }),
      animate('0s',
        style({
          zIndex: 0
        }))
    ])
  ]);

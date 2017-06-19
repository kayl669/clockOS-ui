import { animate,  state, style, transition, trigger } from '@angular/animations';

// Component transition animations
export const rightInAnimation =
  trigger('routeAnimation', [
    state('*',
      style({
        transform: 'translateX(0)',
        zIndex: 2
      })
    ),
    transition(':enter', [
      style({
        transform: 'translateX(100%)',
        zIndex: 4
      }),
      animate('0.1s ease-in',
              style ({
                transform: 'translateX(0)',
                zIndex: 4
              }))
    ]),
    transition(':leave', [
      style({
        zIndex: 4,
        opacity: 1,
        transform: 'scale(1,1)',
      }),
      animate('0.15s ease-in',
              style ({
                transform: ' scale(0.1,0.1)',
                opacity: 0,
                zIndex: 4
              }))
    ])
  ]);

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
              style ({
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
              style ({
                zIndex: 0
              }))
    ])
  ]);
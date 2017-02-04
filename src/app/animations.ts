import { animate, AnimationEntryMetadata, state, style, transition, trigger } from '@angular/core';

// Component transition animations
export const rightInAnimation: AnimationEntryMetadata =
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
      animate('0.1s 0.05s ease-in',
              style ({
                transform: 'translateX(0)',
                zIndex: 4
              }))
    ]),
    transition(':leave', [
      style({
        zIndex: 0
      }),
      animate('3s',
              style ({
                zIndex: 0
              }))
    ])
  ]);

  export const fadeInZoom: AnimationEntryMetadata =
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
        zIndex: 4
      }),
      animate('0.1s 2s ease-in',
              style ({
                opacity: 1,
                transform: 'scale(1)',
                zIndex: 4
              }))
    ]),
    transition(':leave', [
      style({
        zIndex: 0
      }),
      animate('3s',
              style ({
                zIndex: 0
              }))
    ])
  ]);
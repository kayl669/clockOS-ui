import { animate, AnimationEntryMetadata, state, style, transition, trigger } from '@angular/core';

// Component transition animations
export const rightInAnimation: AnimationEntryMetadata =
  trigger('routeAnimation', [
    state('*',
      style({
        transform: 'translateX(0)'
      })
    ),
    transition(':enter', [
      style({
        transform: 'translateX(100%)'
      }),
      animate('0.1s 0.05s ease-in')
    ]),
  ]);

  export const fadeInZoom: AnimationEntryMetadata =
  trigger('routeAnimation', [
    state('*',
      style({
        opacity: 1,
        transform: 'scale(1)'
      })
    ),
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'scale(0.95)'
      }),
      animate('0.1s 0.5s ease-in')
    ])
  ]);
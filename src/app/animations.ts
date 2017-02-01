import { animate, AnimationEntryMetadata, state, style, transition, trigger } from '@angular/core';

// Component transition animations
export const slideInDownAnimation: AnimationEntryMetadata =
  trigger('routeAnimation', [
    state('*',
      style({
        opacity: 1,
        transform: 'translateX(0)'
      })
    ),
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'translateX(-100%)'
      }),
      animate('0.2s ease-in')
    ]),
    transition(':leave', [
      animate('0.5s ease-out', style({
        opacity: 0,
        transform: 'translateY(100%)'
      }))
    ])
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
      animate('0.1s 2s ease-in')
    ]),
    transition(':leave', [
      animate('0.1s ease-out', style({
        opacity: 0,
        transform: 'scale(0.95)'
      }))
    ])
  ]);
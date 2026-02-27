import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations'

const DURATION = '0.35s'
const EASING = 'ease'

/** Entrée: fade + léger blur (style pageFadeIn) */
export const pageFadeIn = trigger('pageFadeIn', [
  transition(':enter', [
    style({ opacity: 0, filter: 'blur(4px)' }),
    animate(`${DURATION} ${EASING}`, style({ opacity: 1, filter: 'blur(0)' }))
  ])
])

/** Entrée: slide depuis le haut (style slideDown) */
export const slideDown = trigger('slideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate(`${DURATION} ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ])
])

/** Entrée: montée depuis le bas (style fadeUp) */
export const fadeUp = trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate(`${DURATION} ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('0.2s ease', style({ opacity: 0, transform: 'translateY(-6px)' }))
  ])
])

/** Entrée: montée douce (style fadeUpSoft) */
export const fadeUpSoft = trigger('fadeUpSoft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(6px)' }),
    animate(`0.28s ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ])
])

/** Entrée: panneau qui se révèle (style panelReveal) */
export const panelReveal = trigger('panelReveal', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-8px) scaleY(0.98)' }),
    animate(`0.28s ${EASING}`, style({ opacity: 1, transform: 'translateY(0) scaleY(1)' }))
  ])
])

/** Entrée: carte (style cardIn) */
export const cardIn = trigger('cardIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(14px) scale(0.995)' }),
    animate(`0.32s ${EASING}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
])

/** Entrée: topbar slide down */
export const topbarSlide = trigger('topbarSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-100%)' }),
    animate(`0.3s ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('0.2s ease', style({ opacity: 0, transform: 'translateY(-100%)' }))
  ])
])

/** Liste avec stagger (entrée des enfants) */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        stagger('0.04s', [
          animate(`0.3s ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ],
      { optional: true }
    )
  ])
])

/** Alert / message (entrée et sortie) */
export const alertFade = trigger('alertFade', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-6px)' }),
    animate(`0.25s ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('0.2s ease', style({ opacity: 0, transform: 'translateY(-4px)' }))
  ])
])

/** Combinaison pour page complète: host + contenu */
export const pageAnimations = [pageFadeIn]

export const slideDownAnimations = [slideDown]

export const fadeUpAnimations = [fadeUp]

export const topbarAnimations = [topbarSlide]

export const alertAnimations = [alertFade]

export const listStaggerAnimations = [listStagger]

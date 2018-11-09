import { animationFrameScheduler, EMPTY, fromEvent, interval, Observable } from 'rxjs'
import { filter, map, pairwise, startWith, switchMap } from 'rxjs/operators'
import { ControlConfig } from '../types'

export function togglePauseStatus(controlConfig: ControlConfig) {
  return fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(e => e.key === controlConfig.pause),
  )
}

const rawDelta$ = interval(0, animationFrameScheduler).pipe(
  startWith(performance.now()),
  map(() => performance.now()),
  pairwise(),
  map(([prev, cnt]) => cnt - prev),
)

export function getDeltaFromPaused(paused$: Observable<boolean>) {
  return paused$.pipe(switchMap(paused => (paused ? EMPTY : rawDelta$)))
}

import { MonoTypeOperatorFunction, Observable } from 'rxjs'
import { filter, map, withLatestFrom } from 'rxjs/operators'

export function when<T>(check: Observable<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      withLatestFrom(check),
      filter(([_, checkVal]) => checkVal),
      map(([val]) => val),
    )
}

export function whenNot<T>(check: Observable<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.pipe(when(check.pipe(map(x => !x))))
}

import { List } from 'immutable'
import { combineLatest, merge, Observable, of, Subject } from 'rxjs'
import {
  delay,
  endWith,
  filter,
  map,
  mapTo,
  sample,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  switchMapTo,
  takeUntil,
  takeWhile,
  withLatestFrom,
} from 'rxjs/operators'
import {
  BEAN_SCORE,
  CONTROL_CONFIG,
  POWER_BEAN_EFFECT_TIMEOUT,
  POWER_BEAN_SCORE,
  RESET_POSITIONS_DELAY,
} from '../constant'
import { LevelConfig } from '../levels'
import Ghost, { GhostColor } from '../sprites/ghosts'
import Pacman from '../sprites/Pacman'
import { MapItem, Pos } from '../types'
import getDesiredDir from '../utils/getDesiredDir'
import getInitMapItems from '../utils/getInitConfig'
import { getDeltaFromPaused, getPaused } from '../utils/paused-and-delta'
import { isCollided, posUtilsFactory } from '../utils/pos-utils'
import PacmanLogic from './PacmanLogic'
import PinkGhostLogic from './PinkGhostLogic'

export interface GameLevelSink {
  pacman: Pacman
  score: number
  mapItems: List<MapItem>
  paused: boolean
  powerBeanCountdown: number
  ghostList: List<Ghost>
  routeList: Array<{
    color: GhostColor
    path: Pos[]
  }>
}

export default function GameLevel(levelConfig: LevelConfig): Observable<GameLevelSink> {
  const posUtils = posUtilsFactory(levelConfig)
  const { getMapItemIndex } = posUtils

  const paused$ = getPaused(CONTROL_CONFIG).pipe(shareReplay(1))
  const delta$ = getDeltaFromPaused(paused$).pipe(share())
  const gameStart$ = of<'game-start'>('game-start')

  const nextMapItemsProxy$ = new Subject<List<MapItem>>()
  const mapItems$ = nextMapItemsProxy$.pipe(
    startWith(getInitMapItems(levelConfig)),
    shareReplay(1),
  )

  const roundEnd$ = new Subject<any>()
  const roundStart$ = merge(gameStart$, roundEnd$.pipe(delay(RESET_POSITIONS_DELAY)))

  const pinkGhost$ = roundStart$.pipe(
    switchMap(() => {
      const innerNextGhost$ = new Subject<Ghost>()
      const innerPinkGhost$ = innerNextGhost$.pipe(
        startWith(new Ghost({ color: GhostColor.pink })),
        shareReplay(1),
      )
      const logic = PinkGhostLogic(posUtils, {
        ghost: innerPinkGhost$,
        delta: delta$,
        mapItems: mapItems$,
        pacman: pacman$,
      })
      logic.nextGhost.subscribe(innerNextGhost$)
      return innerPinkGhost$.pipe(
        takeUntil(roundEnd$),
        endWith(new Ghost({ color: GhostColor.pink })), // 待在原地不动
      )
    }),
    shareReplay(1),
  )

  // todo green ghost

  const ghostList$ = combineLatest(pinkGhost$ /* greenGhost */).pipe(
    map(arr => List(arr)),
    // debug('ghost-list'),
  )

  // const pinkRoute$ = pinkGhostLogicSinks.path

  const routeList$: Observable<Array<{ color: GhostColor; path: Pos[] }>> = of([]).pipe()
  // pinkRoute$.pipe(map(path => ({ color: GhostColor.pink, path }))),
  /* greenRoute$ */

  const nextScoreProxy$ = new Subject<number>()
  const score$ = nextScoreProxy$.pipe(
    startWith(0),
    shareReplay(1),
  )

  const pacman$ = merge(gameStart$, roundStart$).pipe(
    switchMap(() => {
      const innerNextPacman$ = new Subject<Pacman>()
      const innerPacman$ = innerNextPacman$.pipe(
        startWith(new Pacman()),
        shareReplay(1),
      )
      const pacmanLogic = PacmanLogic(posUtils, {
        delta: delta$,
        mapItems: mapItems$,
        desiredDir: getDesiredDir(CONTROL_CONFIG),
        pacman: innerPacman$,
      })
      pacmanLogic.nextPacman.subscribe(innerNextPacman$)

      return innerPacman$.pipe(
        takeUntil(roundEnd$),
        endWith(null),
      )
    }),
  )

  const eatBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    // todo
    filter(([mapItems, pacman]) => Boolean(pacman)),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.bean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const eatPowerBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    filter(([mapItems, pacman]) => Boolean(pacman)),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.powerBean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const powerBeanCountdown$ = eatPowerBean$.pipe(
    switchMapTo(
      delta$.pipe(
        scan((countdown, delta) => countdown - delta, POWER_BEAN_EFFECT_TIMEOUT),
        startWith(POWER_BEAN_EFFECT_TIMEOUT),
        takeWhile(countdown => countdown > 0),
        endWith(0),
      ),
    ),
    startWith(0),
  )

  // 与 pacman 碰在一起的 ghost，可能为 null/undefined
  const collidedGhost$ = combineLatest(ghostList$, pacman$).pipe(
    map(([ghostList, pacman]) => pacman && ghostList.find(ghost => isCollided(ghost, pacman))),
  )

  const hurtByGhost$ = combineLatest(collidedGhost$, powerBeanCountdown$).pipe(
    sample(delta$),
    filter(([collidedGhost, cd]) => Boolean(collidedGhost) && cd === 0),
  )

  hurtByGhost$.pipe(mapTo<any, 'reset-start'>('reset-start')).subscribe(roundEnd$)

  const nextMapItems$ = merge(eatBean$, eatPowerBean$).pipe(
    withLatestFrom(mapItems$),
    map(([t, mapItems]) => mapItems.set(t, MapItem.empty)),
  )

  const nextScore$ = merge(
    eatBean$.pipe(mapTo(BEAN_SCORE)),
    eatPowerBean$.pipe(mapTo(POWER_BEAN_SCORE)),
  ).pipe(
    withLatestFrom(score$),
    map(([score, add]) => score + add),
  )

  nextMapItems$.subscribe(nextMapItemsProxy$)
  nextScore$.subscribe(nextScoreProxy$)

  const hud$ = combineLatest(score$, paused$, powerBeanCountdown$).pipe(
    map(([score, paused, powerBeanCountdown]) => ({ score, paused, powerBeanCountdown })),
  )

  const entities$ = combineLatest(pacman$, ghostList$, mapItems$).pipe(
    map(([pacman, ghostList, mapItems]) => ({ pacman, ghostList, mapItems })),
  )

  const testings$ = combineLatest(routeList$).pipe(map(([routeList]) => ({ routeList })))

  const sink = combineLatest(hud$, entities$, testings$).pipe(
    map(([hud, entities, testings]) => ({ ...hud, ...entities, ...testings })),
  )

  return sink
}

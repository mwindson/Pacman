import { List } from 'immutable'
import { BehaviorSubject, combineLatest, concat, merge, Observable, of, Subject } from 'rxjs'
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
import { debug } from '../utils/common-utils'
import getDesiredDir from '../utils/getDesiredDir'
import getInitMapItems from '../utils/getInitConfig'
import { when, whenNot } from '../utils/my-operators'
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
  pathInfoList: Array<{
    color: GhostColor
    path: Pos[]
  }>
}

export default function GameLevel(levelConfig: LevelConfig): Observable<GameLevelSink> {
  const posUtils = posUtilsFactory(levelConfig)
  const { getMapItemIndex } = posUtils

  const pacman$ = new BehaviorSubject<Pacman>(null)
  const pinkGhost$ = new BehaviorSubject<Ghost>(null)
  const pinkPath$ = new BehaviorSubject<Pos[]>([])
  const mapItems$ = new BehaviorSubject(getInitMapItems(levelConfig))
  const score$ = new BehaviorSubject(0)

  const paused$ = getPaused(CONTROL_CONFIG).pipe(
    debug('paused'),
    shareReplay(1),
  )
  const delta$ = getDeltaFromPaused(paused$).pipe(share())
  const levelStart$ = of<'game-start'>('game-start')

  const roundEnd$ = new Subject<any>()
  const roundStart$ = merge(levelStart$, roundEnd$.pipe(delay(RESET_POSITIONS_DELAY)))
  const inRound$ = merge(roundStart$.pipe(mapTo(true)), roundEnd$.pipe(mapTo(false))).pipe(
    shareReplay(1),
  )

  roundStart$.pipe(mapTo(new Ghost({ color: GhostColor.pink }))).subscribe(pinkGhost$)
  roundStart$.pipe(mapTo(new Pacman())).subscribe(pacman$)

  const pinkGhostLogicSink = roundStart$.pipe(
    map(() => {
      const logic = PinkGhostLogic(posUtils, {
        ghost: pinkGhost$,
        delta: delta$,
        mapItems: mapItems$,
        pacman: pacman$,
      })
      return {
        nextPinkGhost: logic.nextGhost.pipe(
          takeUntil(roundEnd$),
          endWith(new Ghost({ color: GhostColor.pink })),
        ),
        pinkPath: logic.path.pipe(
          takeUntil(roundEnd$),
          endWith([]),
        ),
      }
    }),
  )

  const nextPinkGhost$ = pinkGhostLogicSink.pipe(
    switchMap(({ nextPinkGhost: nextPinkGhost$ }) => nextPinkGhost$),
  )
  nextPinkGhost$.subscribe(pinkGhost$)

  const nextPinkPath$ = pinkGhostLogicSink.pipe(switchMap(({ pinkPath: pinkPath$ }) => pinkPath$))
  nextPinkPath$.subscribe(pinkPath$)

  // todo green ghost

  const ghostList$ = combineLatest(pinkGhost$ /* greenGhost */).pipe(
    map(arr => List(arr)),
    shareReplay(1),
  )

  const pathInfoList$: Observable<Array<{ color: GhostColor; path: Pos[] }>> = combineLatest(
    pinkPath$.pipe(map(path => ({ color: GhostColor.pink, path }))),
    /* greenRoute$ */
  )

  const nextPacman$ = merge(levelStart$, roundStart$).pipe(
    switchMap(() => {
      const logic = PacmanLogic(posUtils, {
        delta: delta$,
        mapItems: mapItems$,
        desiredDir: getDesiredDir(CONTROL_CONFIG),
        pacman: pacman$,
      })
      return logic.nextPacman.pipe(
        takeUntil(roundEnd$),
        endWith(null),
      )
    }),
  )
  nextPacman$.subscribe(pacman$)

  const eatBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    when(inRound$),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.bean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const eatPowerBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    when(inRound$),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.powerBean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  // 能量豆子的持续时间
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
    shareReplay(1),
  )

  // pacman 当前是否拥有能量豆子效果
  const inPowerBeanMode$ = powerBeanCountdown$.pipe(
    map(cd => cd > 0),
    shareReplay(1),
  )

  // pacman 与 ghost 发生碰撞
  const collision$ = combineLatest(ghostList$, pacman$).pipe(
    sample(delta$),
    when(inRound$),
    map(([ghostList, pacman]) => ghostList.find(ghost => isCollided(ghost, pacman))),
    filter(ghost => Boolean(ghost)),
  )

  const hurtByGhost$ = collision$.pipe(whenNot(inPowerBeanMode$))

  // 每次 pacman 碰到 ghost 受到伤害时，当前回合就结束了
  hurtByGhost$.subscribe(roundEnd$)

  // TODO
  const killGhost$ = collision$.pipe(when(inPowerBeanMode$))

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

  nextMapItems$.subscribe(mapItems$)
  nextScore$.subscribe(score$)

  const hud$ = combineLatest(score$, paused$, powerBeanCountdown$).pipe(
    map(([score, paused, powerBeanCountdown]) => ({ score, paused, powerBeanCountdown })),
  )
  const entities$ = combineLatest(pacman$, ghostList$, mapItems$).pipe(
    map(([pacman, ghostList, mapItems]) => ({ pacman, ghostList, mapItems })),
  )
  const testings$ = combineLatest(pathInfoList$).pipe(map(([pathInfoList]) => ({ pathInfoList })))
  const sink = combineLatest(hud$, entities$, testings$).pipe(
    map(([hud, entities, testings]) => ({ ...hud, ...entities, ...testings })),
  )
  return sink
}

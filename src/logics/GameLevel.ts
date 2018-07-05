import { List } from 'immutable'
import { combineLatest, merge, Observable, Subject } from 'rxjs'
import {
  endWith,
  filter,
  map,
  mapTo,
  sample,
  scan,
  share,
  shareReplay,
  startWith,
  switchMapTo,
  takeWhile,
  withLatestFrom,
} from 'rxjs/operators'
import { BEAN_SCORE, CONTROL_CONFIG, POWER_BEAN_EFFECT_TIMEOUT, POWER_BEAN_SCORE, TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import Ghost from '../sprites/Ghost'
import Pacman from '../sprites/Pacman'
import { MapItem, Pos } from '../types'
import { debug } from '../utils/common-utils'
import getDesiredDir from '../utils/getDesiredDir'
import getInitMapItems from '../utils/getInitConfig'
import { getDeltaFromPaused, getPaused } from '../utils/paused-and-delta'
import { isCollided, posUtilsFactory } from '../utils/pos-utils'
import GhostLogic from './GhostLogic'
import PacmanLogic from './PacmanLogic'

export interface GameLevelSink {
  pacman: Pacman
  score: number
  mapItems: List<MapItem>
  paused: boolean
  powerBeanCountdown: number
  ghostList: List<Ghost>
  route: Pos[]
}

export default function GameLevel(levelConfig: LevelConfig): Observable<GameLevelSink> {
  const posUtils = posUtilsFactory(levelConfig)
  const { getMapItemIndex } = posUtils

  const paused$ = getPaused(CONTROL_CONFIG).pipe(shareReplay(1))
  const delta$ = getDeltaFromPaused(paused$).pipe(share())

  const nextMapItemsProxy$ = new Subject<List<MapItem>>()
  const mapItems$ = nextMapItemsProxy$.pipe(
    startWith(getInitMapItems(levelConfig)),
    shareReplay(1),
  )

  const nextPacmanProxy$ = new Subject<Pacman>()
  const pacman$ = nextPacmanProxy$.pipe(
    startWith(new Pacman()),
    shareReplay(1),
  )

  const nextGhostListProxy$ = new Subject<List<Ghost>>()
  const ghostList$ = nextGhostListProxy$.pipe(
    startWith(List.of(new Ghost())),
    shareReplay(1),
    // tap(x => console.log('ghostList$', String(x))),
  )

  // TODO 这里暂时只考虑 pink 的 ghost
  const pinkGhost$ = ghostList$.pipe(
    map(ghosts => ghosts.find(g => g.color === 'pink')),
    // debug('pink-ghost'),
  )
  const { nextGhost: nextPinkGhost$, route: route$ } = GhostLogic(posUtils, {
    ghost: pinkGhost$,
    mapItems: mapItems$,
    delta: delta$,
    pacman: pacman$,
  })

  const nextGhostList$ = nextPinkGhost$.pipe(map(g => List.of(g)))
  nextGhostList$.subscribe(nextGhostListProxy$)

  const nextScoreProxy$ = new Subject<number>()
  const score$ = nextScoreProxy$.pipe(
    startWith(0),
    shareReplay(1),
  )

  const { nextPacman: nextPacman$ } = PacmanLogic(posUtils, {
    delta: delta$,
    mapItems: mapItems$,
    desiredDir: getDesiredDir(CONTROL_CONFIG),
    pacman: pacman$,
  })

  const eatBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.bean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const eatPowerBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
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

  const nextMapItems$ = merge(eatBean$, eatPowerBean$).pipe(
    withLatestFrom(mapItems$),
    map(([t, mapItems]) => mapItems.set(t, MapItem.empty)),
  )

  const nextScore$ = merge(eatBean$.pipe(mapTo(BEAN_SCORE)), eatPowerBean$.pipe(mapTo(POWER_BEAN_SCORE))).pipe(
    withLatestFrom(score$),
    map(([score, add]) => score + add),
  )

  nextPacman$.subscribe(nextPacmanProxy$)
  nextMapItems$.subscribe(nextMapItemsProxy$)
  nextScore$.subscribe(nextScoreProxy$)

  // pacman collide with ghost
  const collision$ = combineLatest(ghostList$, pacman$).pipe(
    sample(delta$),
    filter(([ghostList, pacman]) => ghostList.some(ghost => isCollided(ghost, pacman))),
    debug('collision!'),
  )
  collision$.subscribe()

  const part1$ = combineLatest(pacman$, mapItems$, score$, paused$, powerBeanCountdown$, ghostList$).pipe(
    map(([pacman, mapItems, score, paused, powerBeanCountdown, ghostList]) => ({
      pacman,
      mapItems,
      score,
      paused,
      powerBeanCountdown,
      ghostList,
    })),
  )

  return combineLatest(part1$, route$).pipe(map(([part1, route]) => ({ ...part1, route })))
}

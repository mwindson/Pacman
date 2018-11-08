import { OrderedSet } from 'immutable'
import { fromEvent, merge } from 'rxjs'
import { distinctUntilChanged, map, scan, startWith } from 'rxjs/operators'
import { ControlConfig, Direction } from '../types'

function mapKeyboardEventToDirection(controlConfig: ControlConfig) {
  return map<KeyboardEvent, Direction>(e => {
    if (e.key === controlConfig.up) {
      return 'up'
    } else if (e.key === controlConfig.left) {
      return 'left'
    } else if (e.key === controlConfig.down) {
      return 'down'
    } else if (e.key === controlConfig.right) {
      return 'right'
    } else {
      return 'idle'
    }
  })
}

const keyup$ = fromEvent<KeyboardEvent>(document, 'keydown')
const keydown$ = fromEvent<KeyboardEvent>(document, 'keyup')

interface UpDown {
  type: 'down' | 'up'
  dir: Direction
}

export default function getDesiredDir(controlConfig: ControlConfig) {
  return merge(
    keyup$.pipe(
      mapKeyboardEventToDirection(controlConfig),
      map<Direction, UpDown>(downDir => ({ type: 'down', dir: downDir })),
    ),
    keydown$.pipe(
      mapKeyboardEventToDirection(controlConfig),
      map<Direction, UpDown>(upDir => ({ type: 'up', dir: upDir })),
    ),
  ).pipe(
    scan<UpDown, OrderedSet<Direction>>(
      (set, { type, dir }) => (type === 'down' ? set.add(dir) : set.remove(dir)),
      OrderedSet(),
    ),
    startWith(OrderedSet()),
    map<OrderedSet<Direction>, Direction>(set => (set.isEmpty() ? 'idle' : set.last())),
    distinctUntilChanged(),
  )
}

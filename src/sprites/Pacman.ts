import { Record } from 'immutable'
import { PACMAN_SPEED, TILE_SIZE } from '../constant'
import { Direction, Speed } from '../types'

export default class Pacman extends Record({
  x: 13 * TILE_SIZE,
  y: 17 * TILE_SIZE,
  dir: 'idle' as Direction,
  life: 3,
  isMoving: false,
  movedDistance: 0,
}) {
  getSpeed(): Speed {
    if (this.dir === 'left') {
      return { vx: -PACMAN_SPEED, vy: 0 }
    } else if (this.dir === 'right') {
      return { vx: +PACMAN_SPEED, vy: 0 }
    } else if (this.dir === 'up') {
      return { vx: 0, vy: -PACMAN_SPEED }
    } else if (this.dir === 'down') {
      return { vx: 0, vy: +PACMAN_SPEED }
    } else {
      return { vx: 0, vy: 0 }
    }
  }
}

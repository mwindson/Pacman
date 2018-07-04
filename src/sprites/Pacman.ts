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

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, dir, movedDistance, isMoving } = this
    const frameIndex = isMoving ? (movedDistance % 30 < 15 ? 1 : 0) : 0
    ctx.save()
    ctx.fillStyle = 'yellow'
    ctx.beginPath()
    if (frameIndex === 0) {
      switch (dir) {
        case 'left':
          ctx.arc(x, y, 15, 1.1 * Math.PI, 2.9 * Math.PI)
          break
        case 'right':
          ctx.arc(x, y, 15, 0.1 * Math.PI, 1.9 * Math.PI)
          break
        case 'up':
          ctx.arc(x, y, 15, 1.6 * Math.PI, 3.4 * Math.PI)
          break
        case 'down':
          ctx.arc(x, y, 15, 0.6 * Math.PI, 2.4 * Math.PI)
          break
        default:
          ctx.arc(x, y, 15, 1.1 * Math.PI, 2.9 * Math.PI)
          break
      }
    } else {
      ctx.arc(x, y, 15, 0, 2 * Math.PI)
    }
    ctx.lineTo(x, y)
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }
}

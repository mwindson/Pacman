import { Record } from 'immutable'
import { TILE_WIDTH, TILE_HEIGHT, PACMAN_SPEED } from 'constant'
import { Direction } from 'types'
import { coordinate2Pos } from 'utils'

type State = 'idle' | 'moving' | 'dying'
export type SpriteType = 'player' | 'enemy'
const PacmanRecord = Record({
  type: 'player' as SpriteType,
  state: 'idle',
  col: 13,
  row: 17,
  dir: 'idle' as Direction,
  life: 3,
  remain: 0.2,
  isMoving: true,
  frameIndex: 0
})

export class Pacman extends PacmanRecord {
  getSpeed() {
    // TODO 根据type和state来返回玩家和敌人的速度
    let vx = 0
    let vy = 0
    if (this.dir === 'left' || this.dir === 'right') {
      vx = this.dir === 'left' ? -PACMAN_SPEED : PACMAN_SPEED
    } else if (this.dir === 'up' || this.dir === 'down') {
      vy = this.dir === 'up' ? -PACMAN_SPEED : PACMAN_SPEED
    }
    return { vx, vy }
  }
  draw(ctx: CanvasRenderingContext2D) {
    const { col, row, frameIndex, dir } = this
    const { x, y } = coordinate2Pos(row, col)
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
  }
}

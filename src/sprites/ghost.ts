import { Record, List, fromJS } from 'immutable'
import { Direction, SpriteType } from 'utils/types'
import { coordinate2Pos, findNearestTile } from 'utils'
import { GHOST_SPEED, TILE_SIZE } from 'constant'
import PacmanSprite from './PacmanSprite'

const targetTile = fromJS({
  col: 0,
  row: 0,
  dir: 'up',
})
const GhostRecord = Record({
  type: 'enemy' as SpriteType,
  state: 'idle',
  col: 15,
  row: 14,
  dir: 'up' as Direction,
  life: 1,
  remain: 0.2,
  frameIndex: 0,
  color: 'pink',
  fearMode: false,
  fearRemain: 3,
  dying: false,
  path: [List(), 0] as [List<TilePos>, number],
  targetTile: null as typeof targetTile,
  width: 30,
  height: 30
})

interface TilePos {
  col: number
  row: number
}

export class Ghost extends GhostRecord {
  setStartPos(row: number, col: number) {
    return this.set('col', col).set('row', row)
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { col, row, frameIndex, color } = this
    const { x, y } = coordinate2Pos(row, col)
    ctx.fillStyle = color
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(x, y, this.width * 0.5, 0, Math.PI, true)
    switch (this.frameIndex) {
      case 0:
        ctx.lineTo(x - this.width * 0.5, y + this.height * 0.4)
        ctx.quadraticCurveTo(x - this.width * 0.4, y + this.height * 0.5, x - this.width * 0.2, y + this.height * 0.3)
        ctx.quadraticCurveTo(x, y + this.height * 0.5, x + this.width * 0.2, y + this.height * 0.3)
        ctx.quadraticCurveTo(x + this.width * 0.4, y + this.height * 0.5, x + this.width * 0.5, y + this.height * 0.4)
        break
      case 1:
        ctx.lineTo(x - this.width * 0.5, y + this.height * 0.3)
        ctx.quadraticCurveTo(x - this.width * 0.25, y + this.height * 0.5, x, y + this.height * 0.3)
        ctx.quadraticCurveTo(x + this.width * 0.25, y + this.height * 0.5, x + this.width * 0.5, y + this.height * 0.3)
        break
    }
    ctx.fill()
    ctx.closePath()
  }

  getSpeed() {
    // TODO 根据type和state来返回玩家和敌人的速度
    let vx = 0
    let vy = 0
    if (this.dir === 'left' || this.dir === 'right') {
      vx = this.dir === 'left' ? -GHOST_SPEED : GHOST_SPEED
    } else if (this.dir === 'up' || this.dir === 'down') {
      vy = this.dir === 'up' ? -GHOST_SPEED : GHOST_SPEED
    }
    return { vx, vy }
  }

  beFearing(pacmanEatPowerBean: Boolean) {
    if (!this.fearMode) {
      this.set('fearMode', true).set('fearRemain', 3)
    }
  }

  move(pacman: PacmanSprite, deltaTime: number, map: List<List<string>>, cannvas: HTMLCanvasElement) {
    const { row, col, dir } = this
    const startPos = findNearestTile(col, row, dir)
    let nextDir = dir
    // if (Math.abs(startPos.row - row) < 0.1 && Math.abs(startPos.col - col) < 0.1) {
    const endPos = findNearestTile(pacman.col, pacman.row, pacman.dir)
    const queue = [] as { point: TilePos; path: TilePos[] }[]
    queue.push({ point: startPos, path: [] })
    let shortestPath: TilePos[] = []
    while (queue.length > 0) {
      const { point, path } = queue.shift()
      if (point.col === endPos.col && point.row === endPos.row) {
        shortestPath = path.concat([point])
        break
      }
      const surround = [[-1, 0], [1, 0], [0, 1], [0, -1]]
      for (let sur of surround) {
        const nextPoint = { col: point.col + sur[0], row: point.row + sur[1] }
        if (!path.find(({ col, row }) => col === nextPoint.col && row === nextPoint.row)) {
          if (map.get(nextPoint.row).get(nextPoint.col) !== 'X') {
            queue.push({ point: nextPoint, path: path.concat([point]) })
          }
        }
      }
    }
    const nextTile = shortestPath[0]
    const ctx = cannvas.getContext('2d')
    ctx.beginPath()
    ctx.fillStyle = 'brown'
    for (let p of shortestPath) {
      const { x, y } = coordinate2Pos(p.row, p.col)
      ctx.rect(x, y, TILE_SIZE, TILE_SIZE)
    }
    ctx.fill()
    ctx.closePath()
    // console.log(shortestPath)
    if (nextTile.row - startPos.row === -1) {
      nextDir = 'up'
    } else if (nextTile.row - startPos.row === 1) {
      nextDir = 'down'
    } else if (nextTile.col - startPos.col === -1) {
      nextDir = 'left'
    } else {
      nextDir = 'right'
    }
    // }
    const nextState = this.set('dir', nextDir)
    const { vx, vy } = nextState.getSpeed()
    const nc = col + vx * deltaTime
    const nr = row + vy * deltaTime
    return nextState.set('col', col).set('row', row)
  }
}

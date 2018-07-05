import { Record } from 'immutable'
import { GHOST_SPEED, TILE_SIZE } from '../constant'
import { Direction, Speed } from '../types'

export default class Ghost extends Record({
  x: 15 * TILE_SIZE,
  y: 14 * TILE_SIZE,
  dir: 'up' as Direction,
  frameIndex: 0,
  color: 'pink',
}) {
  getSpeed(): Speed {
    if (this.dir === 'left') {
      return { vx: -GHOST_SPEED, vy: 0 }
    } else if (this.dir === 'right') {
      return { vx: +GHOST_SPEED, vy: 0 }
    } else if (this.dir === 'up') {
      return { vx: 0, vy: -GHOST_SPEED }
    } else {
      return { vx: 0, vy: +GHOST_SPEED }
    }
  }
}

class GhostTest {
  // beFearing(pacmanEatPowerBean: Boolean) {
  //   if (!this.fearMode) {
  //     this.set('fearMode', true).set('fearRemain', 3)
  //   }
  // }
  // move(pacman: Pacman, deltaTime: number, map: List<List<string>>) {
  //   const { row, col, dir } = this
  //   const startPos = findNearestTile(col, row, dir)
  //   let nextDir = dir
  //   // if (Math.abs(startPos.row - row) < 0.1 && Math.abs(startPos.col - col) < 0.1) {
  //   const endPos = findNearestTile(pacman.col, pacman.row, pacman.dir)
  //   const queue = [] as { point: TilePos; path: TilePos[] }[]
  //   queue.push({ point: startPos, path: [] })
  //   let shortestPath: TilePos[] = []
  //   let loopCount = 0
  //   while (queue.length > 0) {
  //     if (loopCount++ > 100) {
  //       break
  //     }
  //     // console.log('looping...')
  //     const { point, path } = queue.shift()
  //     if (point.col === endPos.col && point.row === endPos.row) {
  //       shortestPath = path.concat([point])
  //       break
  //     }
  //     const surround = [[-1, 0], [1, 0], [0, 1], [0, -1]]
  //     for (let sur of surround) {
  //       const nextPoint = { col: point.col + sur[0], row: point.row + sur[1] }
  //       // TODO find 性能太烂了
  //       if (!path.find(({ col, row }) => col === nextPoint.col && row === nextPoint.row)) {
  //         if (map.get(nextPoint.row).get(nextPoint.col) !== 'X') {
  //           queue.push({ point: nextPoint, path: path.concat([point]) })
  //         }
  //       }
  //     }
  //   }
  //   // const nextTile = shortestPath[0]
  //   // const ctx = canvas.getContext('2d')
  //   // ctx.beginPath()
  //   // ctx.fillStyle = 'brown'
  //   // for (let p of shortestPath) {
  //   //   const { x, y } = coordinate2Pos(p.row, p.col)
  //   //   ctx.rect(x, y, TILE_SIZE, TILE_SIZE)
  //   // }
  //   // ctx.fill()
  //   // ctx.closePath()
  //   // console.log(shortestPath)
  //   // if (nextTile.row - startPos.row === -1) {
  //   //   nextDir = 'up'
  //   // } else if (nextTile.row - startPos.row === 1) {
  //   //   nextDir = 'down'
  //   // } else if (nextTile.col - startPos.col === -1) {
  //   //   nextDir = 'left'
  //   // } else {
  //   //   nextDir = 'right'
  //   // }
  //   // // }
  //   // const nextState = this.set('dir', nextDir)
  //   // const { vx, vy } = nextState.getSpeed()
  //   // const nc = col + vx * deltaTime
  //   // const nr = row + vy * deltaTime
  //   // return nextState.set('col', col).set('row', row)
  // }
}

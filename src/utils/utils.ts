import { map, tap } from 'rxjs/operators'
import { TILE_SIZE } from '../constant'
import Ghost from '../sprites/Ghost'
import Pacman from '../sprites/Pacman'
import { Direction, Pos } from '../types'

// export function calPathRouting(ghost: Ghost, pacman: Pacman, map: string[][]) {
//   const { row, col, dir } = ghost
//   const startPos = findNearestTile(col, row, dir)
//   const endPos = findNearestTile(pacman.col, pacman.row, pacman.dir)
//   const queue: Array<{ point: Pos; path: Pos[] }> = []
//   queue.push({ point: startPos, path: [] })
//   let shortestPath: Pos[] = []
//   while (queue.length > 0) {
//     const { point, path } = queue.shift()
//     if (point.col === endPos.col && point.row === endPos.row) {
//       shortestPath = path.concat([point])
//       break
//     }
//     const surround = [[-1, 0], [1, 0], [0, 1], [0, -1]]
//     for (const sur of surround) {
//       const nextPoint = { col: point.col + sur[0], row: point.row + sur[1] }
//       if (!path.find(({ col, row }) => col === nextPoint.col && row === nextPoint.row)) {
//         if (map[nextPoint.row][nextPoint.col] !== 'X') {
//           queue.push({ point: nextPoint, path: path.concat([point]) })
//         }
//       }
//     }
//   }
//
//   const path: Pos[] = []
//   path.push(shortestPath[0])
//
//   for (let i = 1; i < shortestPath.length - 1; i += 1) {
//     const { row: pr, col: pc } = shortestPath[i - 1]
//     const { row: r, col: c } = shortestPath[i]
//     const { row: nr, col: nc } = shortestPath[i + 1]
//     if ((pr + nr) / 2 !== r || (pc + nc) / 2 !== r) {
//       path.push(shortestPath[i])
//     }
//   }
//   path.push(shortestPath[shortestPath.length - 1])
//
//   return { path, index: 0 }
// }

export const not = (a: boolean) => !a
export const add = (a: number) => (b: number) => a + b

// x 处于 TILE_SIZE 的小数部分是否处于 [min, max] 之间
export const between = (x: number, min: number, max: number, debug = false) => {
  if (debug) {
    debugger
  }
  const mod = (x % TILE_SIZE) / TILE_SIZE
  return (min <= mod && mod <= max) || (min - 1 <= mod && mod <= max - 1) || (min + 1 <= mod && mod <= max + 1)
}

export const debug = <T>(label: string) => tap((value: T) => console.log(`${label}:`, value))

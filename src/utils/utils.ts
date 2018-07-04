import { map } from 'rxjs/operators'
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

export const mapKeyboardEventToDirection = map<KeyboardEvent, Direction>(e => {
  if (e.key === 'w') {
    return 'up'
  } else if (e.key === 'a') {
    return 'left'
  } else if (e.key === 's') {
    return 'down'
  } else if (e.key === 'd') {
    return 'right'
  } else {
    return null
  }
})

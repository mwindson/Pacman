import { Direction } from 'utils/types'
import { List } from 'immutable'
import { Ghost } from 'sprites/ghost'
import { TILE_SIZE } from './constant'
import PacmanSprite from './sprites/PacmanSprite'

export function getOppsiteDirection(x: Direction) {
  switch (x) {
    case 'up':
      return 'down'
    case 'down':
      return 'up'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return 'idle'
  }
}

export function getNextPos(s: Ghost | Pacman, deltaTime: number) {
  const { row, col } = s
  const { vx, vy } = s.getSpeed()
  const nc = col + deltaTime * vx
  const nr = row + deltaTime * vy
  return { nr, nc }
}

export function pos2Coordinate(x: number, y: number) {
  return { x: round(x / TILE_SIZE - 0.5), y: round(y / TILE_SIZE - 2.5) }
}

export function coordinate2Pos(i: number, j: number) {
  return { x: (j + 0.5) * TILE_SIZE, y: (i + 2.5) * TILE_SIZE }
}

export function isOnValidPath(map: List<List<string>>, x: number, y: number, dir: Direction) {
  const { row, col } = findNearestTile(x, y, dir)
  // 左右移动时，判断
  if (map.get(row).get(col) === 'X') {
    return false
  }
  return true
}

export function findNearestTile(col: number, row: number, dir: Direction) {
  let c = Math.round(col)
  let r = Math.round(row)
  switch (dir) {
    case 'up':
      r = Math.floor(row)
      break
    case 'down':
      r = Math.ceil(row)
      break
    case 'left':
      c = Math.floor(col)
      break
    case 'right':
      c = Math.ceil(col)
      break
    default:
      break
  }
  return { col: c, row: r }
}

export function round(x: number, n = 2) {
  return Math.round(x * Math.pow(10, n)) / Math.pow(10, n)
}

export interface TilePos {
  col: number
  row: number
}

export function calPathRouting(ghost: Ghost, pacman: PacmanSprite, map: List<List<string>>) {
  const { row, col, dir } = ghost
  const startPos = findNearestTile(col, row, dir)
  let nextDir = dir
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
  let path: List<TilePos> = List()
  path = path.push(shortestPath[0])
  for (let i = 1; i < shortestPath.length - 1; i += 1) {
    const { row: pr, col: pc } = shortestPath[i - 1]
    const { row: r, col: c } = shortestPath[i]
    const { row: nr, col: nc } = shortestPath[i + 1]
    if ((pr + nr) / 2 !== r || (pc + nc) / 2 !== r) {
      path = path.push(shortestPath[i])
    }
  }
  path = path.push(shortestPath[shortestPath.length - 1])
  return { path, index: 0 }
}

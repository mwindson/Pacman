import { List } from 'immutable'
import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { Direction, MapItem, Point, Pos } from '../types'

export function getOppositeDir(x: Direction) {
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
      throw new Error('No opposite dir')
  }
}

export function isOppositeDir(dir1: Direction, dir2: Direction) {
  return getOppositeDir(dir1) === dir2
}

export function isSamePos(a: Pos, b: Pos) {
  return a.row === b.row && a.col === b.col
}

export function isCollided(p1: Point, p2: Point) {
  return Math.abs(p1.x - p2.x) <= 0.2 * TILE_SIZE && Math.abs(p1.y - p2.y) <= 0.2 * TILE_SIZE
}

export function posUtilsFactory({ M, N }: LevelConfig) {
  function canMove(mapItems: List<MapItem>, pos: Pos) {
    if (pos == null) {
      return false
    }
    const item = mapItems.get(pos.row * N + pos.col)
    return item !== MapItem.obstacle
  }

  function getAroundInfo(mapItems: List<MapItem>, pos: Pos) {
    return {
      left: canMove(mapItems, left(pos)),
      right: canMove(mapItems, right(pos)),
      up: canMove(mapItems, up(pos)),
      down: canMove(mapItems, down(pos)),
    }
  }

  function left(pos: Pos): Pos {
    if (pos.col > 0) {
      return { row: pos.row, col: pos.col - 1 }
    } else {
      return null
    }
  }

  function right(pos: Pos): Pos {
    if (pos.col < N - 1) {
      return { row: pos.row, col: pos.col + 1 }
    } else {
      return null
    }
  }

  function up(pos: Pos): Pos {
    if (pos.row > 0) {
      return { row: pos.row - 1, col: pos.col }
    } else {
      return null
    }
  }

  function down(pos: Pos): Pos {
    if (pos.row < M - 1) {
      return { row: pos.row + 1, col: pos.col }
    }
  }

  function getMapItemIndex(point: Point) {
    const row = Math.round(point.y / TILE_SIZE)
    const col = Math.round(point.x / TILE_SIZE)
    return row * N + col
  }

  function toIndex(p: Pos) {
    return p.row * N + p.col
  }

  function toPos(i: number): Pos {
    return { row: Math.floor(i / N), col: i % N }
  }

  return { canMove, getAroundInfo, left, right, up, down, getMapItemIndex, toPos, toIndex }
}

export type PosUtils = ReturnType<typeof posUtilsFactory>

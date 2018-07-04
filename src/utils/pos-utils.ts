import { Direction, Pos } from '../types'

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

function isSamePos(a: Pos, b: Pos) {
  return a.row === b.row && a.col === b.col
}

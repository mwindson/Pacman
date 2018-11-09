import { tap } from 'rxjs/operators'
import { TILE_SIZE } from '../constant'
import { Point, Pos } from '../types'

export const not = (a: boolean) => !a
export const add = (a: number) => (b: number) => a + b

// x 处于 TILE_SIZE 的小数部分是否处于 [min, max] 之间
export const between = (x: number, min: number, max: number) => {
  const mod = (x % TILE_SIZE) / TILE_SIZE
  return (
    (min <= mod && mod <= max) ||
    (min - 1 <= mod && mod <= max - 1) ||
    (min + 1 <= mod && mod <= max + 1)
  )
}

export const debug = <T>(label: string) => tap((value: T) => console.log(`${label}:`, value))

export function pointToPos(point: Point): Pos {
  return {
    row: Math.round(point.y / TILE_SIZE),
    col: Math.round(point.x / TILE_SIZE),
  }
}

export function posToPoint(pos: Pos): Point {
  return {
    x: pos.col * TILE_SIZE,
    y: pos.row * TILE_SIZE,
  }
}

export function randint(bound: number) {
  return Math.floor(Math.random() * bound)
}

export function shuffle<T>(array: T[]): T[] {
  const result: T[] = []
  for (let i = 0; i < array.length; i++) {
    const r = randint(i + 1)
    result.push(result[r])
    result[r] = array[i]
  }

  return result
}

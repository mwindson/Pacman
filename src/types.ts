export type Direction = 'left' | 'right' | 'up' | 'down' | 'idle'

export interface Point {
  x: number
  y: number
}

export interface Pos {
  row: number
  col: number
}

export interface Speed {
  vx: number
  vy: number
}

export enum MapItem {
  bean,
  powerBean,
  empty,
  obstacle,
  door,
}

export interface ControlConfig {
  left: string
  right: string
  up: string
  down: string
  pause: string
}

import { List } from 'immutable'
import Pacman from './sprites/Pacman'

export type Direction = 'left' | 'right' | 'up' | 'down' | 'idle'
export type SpriteType = 'player' | 'enemy'

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

export interface Sink {
  pacman: Pacman
  score: number
  mapItems: List<MapItem>
  paused: boolean
}

import { List, Record } from 'immutable'
import { Pacman } from './Sprite'
import { Ghost } from './sprites/ghost'

export type Direction = 'left' | 'right' | 'up' | 'down' | 'idle'
export type SpriteType = 'player' | 'enemy'

export class Game extends Record({
  map: null as List<List<string>>,
  pacman: null as Pacman,
  ghosts: null as List<Ghost>,
  powerBeans: null as List<List<number>>,
  score: 0,
}) {}

export interface LevelConfig {
  map: string[]
  wall_color: string
  power_beans: Array<[number, number]>
}

export interface Point {
  x: number
  y: number
}

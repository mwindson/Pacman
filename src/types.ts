import { LevelConfig } from './level'
import { Ghost } from './sprites/ghost'
import Pacman from './sprites/Pacman'

export type Direction = 'left' | 'right' | 'up' | 'down' | 'idle'
export type SpriteType = 'player' | 'enemy'

export interface Pos {
  row: number
  col: number
}

export type Reducer<T> = (t: T) => T

type char = string

export class Game {
  map: char[][]
  pacman: Pacman
  ghosts: Ghost[]
  powerBeans: Pos[]
  score: number

  constructor(readonly levelConfig: LevelConfig) {
    this.map = levelConfig.map.map(s => Array.from(s))
    this.pacman = new Pacman()
    this.ghosts = [new Ghost()]
    this.powerBeans = levelConfig.powerBeans // TODO need a shallow-copy
    this.score = 0
  }
}

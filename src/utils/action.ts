import { List } from 'immutable'
import PacmanSprite from '../sprites/PacmanSprite'
import { Ghost } from '../sprites/ghost'
import { Direction } from './types'

export type Action = StartGame | UpdatePacman | UpdateMap | UpdatePowerBeans | UpdateScore | UpdateGhosts | TickAction | UpdatePacmanDirection

export interface StartGame {
  type: 'START_GAME'
}

export interface UpdateMap {
  type: 'UPDATE_MAP'
  map: List<List<string>>
}

export interface TickAction {
  type: 'TICK'
  delta: number
}

export interface UpdatePacman {
  type: 'UPDATE_PACMAN'
  pacman: PacmanSprite
}

export interface UpdatePacmanDirection {
  type: 'UPDATE_PACMAN_DIRECTION'
  dir: Direction
}

export interface KeyPressAction {
  type: 'KEY_PRESS',
  dir: Direction
}

interface UpdatePowerBeans {
  type: 'update-power-beans'
  powerBeans: List<List<number>>
}

interface UpdateScore {
  type: 'update-score'
  score: number
}

export interface UpdateGhosts {
  type: 'UPDATE_GHOSTS'
  ghosts: List<Ghost>
}
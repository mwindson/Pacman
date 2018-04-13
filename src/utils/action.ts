import { List } from 'immutable'
import { PacmanSprite } from '../sprites/PacmanSprite'
import { Ghost } from '../sprites/ghost'

export type Action = StartGame | UpdatePacman | UpdateMap | UpdatePowerBeans | UpdateScore | UpdateGhosts

export interface StartGame {
  type: 'START_GAME'
}

export interface UpdateMap {
  type: 'UPDATE_MAP'
  map: List<List<string>>
}

interface UpdatePacman {
  type: 'update-pacman'
  pacman: Pacman
}

interface UpdatePowerBeans {
  type: 'update-power-beans'
  powerBeans: List<List<number>>
}

interface UpdateScore {
  type: 'update-score'
  score: number
}

interface UpdateGhosts {
  type: 'update-ghosts'
  ghosts: List<Ghost>
}
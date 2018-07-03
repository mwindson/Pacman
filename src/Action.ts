import { List } from 'immutable'
import { Pacman } from './Sprite'
import { Ghost } from './sprites/ghost'

type Action = UpdatePacman | UpdateMap | UpdatePowerBeans | UpdateScore | UpdateGhosts

export interface UpdatePacman {
  type: 'update-pacman'
  pacman: Pacman
}
export interface UpdateMap {
  type: 'update-map'
  map: List<List<string>>
}
export interface UpdatePowerBeans {
  type: 'update-power-beans'
  powerBeans: List<List<number>>
}
export interface UpdateScore {
  type: 'update-score'
  score: number
}
export interface UpdateGhosts {
  type: 'update-ghosts'
  ghosts: List<Ghost>
}

export default Action

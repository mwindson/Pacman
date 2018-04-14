import { combineReducers } from 'redux'
import { Game, game } from 'reducers/game'
import pacman from './pacman'
import PacmanSprite from '../sprites/PacmanSprite'

export interface State {
  game: Game
  pacman: PacmanSprite
}

export default combineReducers({ game, pacman })

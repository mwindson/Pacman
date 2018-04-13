import { combineReducers } from 'redux'
import { Game, game } from 'reducers/game'

export interface State {
  game: Game
}
export default combineReducers({ game })

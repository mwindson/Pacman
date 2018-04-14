import PacmanSprite from '../sprites/PacmanSprite'
import { Action } from '../utils/action'

const pacmanState = new PacmanSprite()

export default function pacman(state = pacmanState, action: Action) {
  if (action.type === 'UPDATE_PACMAN_DIRECTION') {
    return state.set('dir', action.dir)
  }
  return state
}
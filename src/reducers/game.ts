import { List, Record } from 'immutable'
import { Action } from 'utils/action'
import PacmanSprite from '../sprites/PacmanSprite'
import { Ghost } from '../sprites/ghost'

type GameStatus = 'idle' | 'on' | 'game_over'
const levelData = require('../assets/level-1.json')
const ghostData = [{ color: 'pink', pos: { x: 0, y: 0 } }]
const GameRecord = Record(
  {
    status: 'idle' as GameStatus,
    map: List<List<string>>(),
    pacman: new PacmanSprite(),
    ghostData,
    ghosts: List(ghostData.map(d => new Ghost())),
    powerBeans: levelData.power_beans
  }
)

export class Game extends GameRecord {
}

export function game(state = new Game(), action: Action) {
  if (action.type === 'START_GAME') {
    return state.set('status', 'on')
  } else if (action.type === 'UPDATE_MAP') {
    const { map } = action
    return state.set('map', map)
  } else if (action.type === 'UPDATE_PACMAN') {
    const { pacman } = action
    return state.set('pacman', pacman)
  }
  return state
}

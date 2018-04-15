import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'reducers'
import { Game } from 'reducers/game'
import { Dispatch } from 'redux'
import { TILE_SIZE } from '../constant'
import PacmanSprite from '../sprites/PacmanSprite'
import Pacman from './Pacman'
import { KeyPressAction } from '../utils/action'
import Ghost from './Ghost'

export interface GameSceneProps {
  game: Game
  pacman: PacmanSprite
  dispatch: Dispatch<State>
}

export interface GameSceneState {
}

class GameScene extends React.Component<GameSceneProps, GameSceneState> {
  componentDidMount() {
    document.addEventListener('keydown', this.keyInput)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyInput)
  }

  keyInput = (event: KeyboardEvent) => {
    const { dispatch } = this.props
    switch (event.key) {
      case "a":
        dispatch<KeyPressAction>({ type: 'KEY_PRESS', dir: 'left' })
        break
      case "w":
        dispatch<KeyPressAction>({ type: 'KEY_PRESS', dir: 'up' })
        break
      case "d":
        dispatch<KeyPressAction>({ type: 'KEY_PRESS', dir: 'right' })
        break
      case "s":
        dispatch<KeyPressAction>({ type: 'KEY_PRESS', dir: 'down' })
        break
      default:
        break;
    }
  }

  render() {
    const { game: { map, pacman, ghosts } } = this.props
    return <g className="game-scene">
      {map.map((row, i) => (
        <g key={`row-${i}`} className="game-scene-row">
          {row.map((col, j) => (
            <rect key={j}
                  x={j * TILE_SIZE}
                  y={i * TILE_SIZE}
                  fill={col === 'X' ? 'skyblue' : 'gray'}
                  width={TILE_SIZE}
                  height={TILE_SIZE} />
          ))}
        </g>
      ))}
      <Pacman x={pacman.col * TILE_SIZE} y={pacman.row * TILE_SIZE} />
      {ghosts.map((g, i) => (<Ghost key={`ghost-${i}`} x={g.col * TILE_SIZE} y={g.row * TILE_SIZE} target={g.targetTile} />))}
    </g>
  }
}

function mapStateToProps(state: State) {
  return { game: state.game, pacman: state.pacman }
}

export default connect(mapStateToProps)(GameScene)

import * as React from 'react'
import { connect } from 'react-redux'
import { List } from 'immutable'
import { State } from '../reducers'
import { Dispatch } from 'redux'
import PacmanSprite from 'sprites/PacmanSprite'
import Pacman from 'components/Pacman'
import { TILE_SIZE } from '../constant'

export interface GameSceneProps {
  pacman: PacmanSprite
  map: List<List<string>>
  dispatch: Dispatch<State>
}

export interface GameSceneState {
}

class GameScene extends React.Component<GameSceneProps, GameSceneState> {
  render() {
    const { map, pacman } = this.props
    return <g className="game-scene">
      {map.map((row, i) => (
        <g className="game-scene-row">
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
    </g>
  }
}

function mapStateToProps(state: State) {
  return state.game.toObject() as any
}

export default connect(mapStateToProps)(GameScene)

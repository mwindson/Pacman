import React from 'react'
import { hot } from 'react-hot-loader'
import { SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE } from 'constant'
import Pacman from 'components/Pacman'
import GameScene from 'components/Gamescene'

class App extends React.Component<{}, {}> {
  componentDidMount() {
  }

  render() {
    const width = SCREEN_WIDTH * TILE_SIZE
    const height = SCREEN_HEIGHT * TILE_SIZE
    return (
      <svg width={width} height={height}>
        <GameScene />
      </svg>
    )
  }
}

export default hot(module)(App)

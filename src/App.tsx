import React from 'react'
import { hot } from 'react-hot-loader'
import { SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE } from 'constant'
import GameScene from 'components/Gamescene'

class App extends React.Component<{}, {}> {

  render() {
    const width = SCREEN_WIDTH * TILE_SIZE + TILE_SIZE
    const height = SCREEN_HEIGHT * TILE_SIZE + TILE_SIZE
    return (
      <svg width={width} height={height}>
        <GameScene />
      </svg>
    )
  }
}

export default hot(module)(App)

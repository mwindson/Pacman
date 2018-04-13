import React from 'react'
import { TILE_SIZE } from 'constant'

export interface PacmanProps {
  x: number
  y: number
}

export interface PacmanState {
}

export default class Pacman extends React.Component<PacmanProps, PacmanState> {
  render() {
    const { x, y } = this.props
    return (
      <g className="pacman">
        <rect width={TILE_SIZE} height={TILE_SIZE} x={x} y={y} fill="green" />
      </g>
    )
  }
}

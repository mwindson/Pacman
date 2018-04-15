import React from 'react'
import { TILE_SIZE } from 'constant'

export interface GhostProps {
  x: number
  y: number
  target: any
}

export interface GhostState {
}

export default class Ghost extends React.Component<GhostProps, GhostState> {
  render() {
    const { x, y, target } = this.props
    return (
      <g className="ghost">
        <rect width={TILE_SIZE} height={TILE_SIZE} x={x} y={y} fill="pink" />
        {target ? <rect width={TILE_SIZE}
                        height={TILE_SIZE}
                        x={target.get('col') * TILE_SIZE}
                        y={target.get('row') * TILE_SIZE}
                        stroke="pink" /> : null}
      </g>
    )
  }
}

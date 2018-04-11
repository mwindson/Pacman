import './preloaded'
import { Observable } from 'rxjs'
import { drawMap, game } from 'game'
import { fromJS } from 'immutable'
function main(canvas: HTMLCanvasElement) {
  const getLevel$ = Observable.fromPromise(fetch('src/level.json')).map(res => res.json())
  getLevel$.subscribe(p => p.then(data => game(fromJS(data).toObject(), canvas)))
}
const canvas = document.getElementById('screen') as HTMLCanvasElement
main(canvas)

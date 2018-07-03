import { of } from 'rxjs'
import game from './game'

const level = require('./level.json')

const canvas = document.getElementById('screen') as HTMLCanvasElement

const level$ = of(level)
level$.subscribe(level => game(level as any, canvas))

import xs, { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import sampleCombine from 'xstream/extra/sampleCombine'

declare global {
  interface Event {
    ownerTarget: HTMLElement
  }
}

Stream.prototype.sampleCombine = function(...args: any[]) {
  return this.compose(sampleCombine(...args))
}
Stream.prototype.dropRepeats = function(isEqual) {
  return this.compose(dropRepeats(isEqual))
}

interface InlineCombineSignature<T> {
  (): Stream<[T]>
  <T1>(s1: Stream<T1>): Stream<[T, T1]>
  <T1, T2>(s1: Stream<T1>, s2: Stream<T2>): Stream<[T, T1, T2]>
  <T1, T2, T3>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>): Stream<[T, T1, T2, T3]>
  <T1, T2, T3, T4>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>): Stream<[T, T1, T2, T3, T4]>
  <T1, T2, T3, T4, T5>(s1: Stream<T1>, s2: Stream<T2>, s3: Stream<T3>, s4: Stream<T4>, s5: Stream<T5>): Stream<
    [T, T1, T2, T3, T4, T5]
  >
}

declare module 'xstream' {
  interface Stream<T> {
    sampleCombine: InlineCombineSignature<T>
    dropRepeats(isEqual?: ((x: T, y: T) => boolean)): Stream<T>
  }
}

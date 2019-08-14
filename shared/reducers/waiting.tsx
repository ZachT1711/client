import {RPCError} from '../util/errors'
import * as Types from '../constants/types/waiting'
import * as Container from '../util/container'
import * as Waiting from '../actions/waiting-gen'

// set to true to see helpful debug info
const debugWaiting = false && __DEV__

const changeHelper = (
  draftState: Container.Draft<Types.State>,
  keys: string | Array<string>,
  diff: 1 | -1,
  error?: RPCError
) => {
  draftState.counts = new Map(draftState.counts)
  draftState.errors = new Map(draftState.errors)

  getKeys(keys).forEach(k => {
    const oldCount = draftState.counts.get(k) || 0
    // going from 0 => 1, clear errors
    if (oldCount === 0 && diff === 1) {
      draftState.errors.delete(k)
    } else {
      if (error) {
        draftState.errors.set(k, error)
      }
    }
    const newCount = oldCount + diff
    if (newCount === 0) {
      draftState.counts.delete(k)
    } else {
      draftState.counts.set(k, newCount)
    }
  })

  debugWaiting && console.log('DebugWaiting:', keys, draftState)
}

const initialState: Types.State = {
  counts: new Map<string, number>(),
  errors: new Map<string, RPCError>(),
}

const getKeys = (k: string | Array<string>) => {
  if (typeof k === 'string') return [k]
  return k
}

export default (state: Types.State = initialState, action: Waiting.Actions): Types.State =>
  Container.produce(state, (draftState: Container.Draft<Types.State>) => {
    switch (action.type) {
      case 'common:resetStore':
        // Keep the old values else the keys will be all off and confusing
        debugWaiting && console.log('DebugWaiting:', '*resetStore*', draftState)
        break
      case Waiting.decrementWaiting:
        changeHelper(draftState, action.payload.key, -1, action.payload.error)
        break
      case Waiting.incrementWaiting:
        changeHelper(draftState, action.payload.key, 1)
        break
      case Waiting.clearWaiting:
        draftState.counts = new Map(draftState.counts)
        draftState.errors = new Map(draftState.errors)
        getKeys(action.payload.key).forEach(key => {
          draftState.counts.delete(key)
          draftState.errors.delete(key)
        })
        break
      case Waiting.batchChangeWaiting:
        action.payload.changes.forEach(({key, increment, error}) => {
          changeHelper(draftState, key, increment ? 1 : -1, error)
        })
        break
    }
  })

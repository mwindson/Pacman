import { createStore, applyMiddleware } from 'redux'
import createSgaMiddleware from 'redux-saga'
import reducer from 'reducers/index'
import rootSaga from 'sagas/index'
import { composeWithDevTools } from 'redux-devtools-extension'

const sagaMiddleware = createSgaMiddleware()

export default createStore(reducer, composeWithDevTools(applyMiddleware(sagaMiddleware)))

sagaMiddleware.run(rootSaga)
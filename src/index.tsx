import ReactDom from 'react-dom'
import React from 'react'
import { Provider } from 'react-redux'
import App from 'App'
import store from 'store'
import 'normalize.css'

ReactDom.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('container'),
)

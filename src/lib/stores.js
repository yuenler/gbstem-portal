import { writable } from 'svelte/store'
import { getErrorMessage } from '$lib/forms'

function createAlert() {
  const alert = writable({
    type: '',
    message: ''
  })
  function trigger(type, message) {
    if (type === 'customError') {
      alert.set({
        type: 'error',
        message: message
      })
    } else if (type === 'error') {
      alert.set({
        type,
        message: getErrorMessage(message)
      })
    } else {
      alert.set({
        type,
        message
      })
    }
  }
  function reset() {
    alert.set({
      type: '',
      message: ''
    })
  }
  return { subscribe: alert.subscribe, trigger, reset }
}

export const alert = createAlert()

import { writable } from 'svelte/store'
import { getErrorMessage } from '$lib/forms'

function createAlert() {
  const alert = writable({
    type: '',
    message: ''
  })
  function trigger(type, message) {
    if (type === 'error') {
      alert.set({
        type,
        message: getErrorMessage(message)
      })
    }
    alert.set({
      type,
      message
    })
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

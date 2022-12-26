import { writable } from 'svelte/store'

function createAlert() {
  const alert = writable({
    type: '',
    message: ''
  })
  function trigger(type, message) {
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

<script>
  import { classNames } from '$lib/utils'
  import { isUndefined } from 'lodash'
  import { createEventDispatcher } from 'svelte'

  export let className = ''
  export { className as class }

  const dispatch = createEventDispatcher()
  let self

  function handleSubmit(e) {
    const state = [
      ...Array.from(self.querySelectorAll('input')),
      ...Array.from(self.querySelectorAll('textarea'))
    ].find(el => !el.checkValidity())
    dispatch('submit', {
      submit: e,
      error: isUndefined(state)
        ? {
            state: false,
            message: ''
          }
        : {
            state: true,
            message: state.validationMessage
          }
    })
  }
</script>

<form
  class={classNames('w-full', className)}
  novalidate
  bind:this={self}
  on:submit|preventDefault={handleSubmit}
  {...$$restProps}
>
  <slot />
</form>

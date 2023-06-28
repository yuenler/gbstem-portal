<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase } from 'lodash'

  let className = ''
  export { className as class }

  export let self = undefined
  export let id = uniqueId('textarea-')
  export let value
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let required = false
  export let rows = 5
  const calcHeight = 1.5 + 1.5 * rows

  function handleInput(e) {
    value = e.target.value
  }
</script>

<div class="mt-2">
  <label for={id}>
    <span>
      {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
    </span>
  </label>
  <textarea
    class={classNames(
      'mt-2 block h-min w-full appearance-none rounded-md border border-gray-300 p-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
      className
    )}
    style={`min-height:${calcHeight}rem;height:${calcHeight}rem`}
    bind:this={self}
    on:input={handleInput}
    {id}
    {value}
    {name}
    {required}
    {...$$restProps}
  />
</div>

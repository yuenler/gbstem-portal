<script>
  import { classNames } from '$lib/utils.js'
  import { uniqueId } from 'lodash'
  import { imask } from '@imask/svelte'

  export let type = 'text'
  export let value = ''
  export let error = false
  export let placeholder = ''
  export let floating = false
  let className = ''
  export { className as class }

  $: options =
    type === 'tel'
      ? {
          mask: '+{1}(000) 000-000',
          lazy: false
        }
      : { mask: /[^]*/ }

  const id = uniqueId('input-')
  const name = placeholder.toLowerCase().split(' ').join('-')
  function handleInput(e) {
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value
  }
</script>

<div class={classNames(className)}>
  {#if floating}
    <div class="relative mt-2">
      <input
        class={classNames(
          'block px-3 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border appearance-none focus:outline-none  peer',
          error ? 'border-red-300 focus:border-red-600' : 'border-gray-300 focus:border-gray-600'
        )}
        {type}
        {id}
        {value}
        {name}
        on:input={handleInput}
        use:imask={options}
        placeholder=" "
        {...$$restProps}
      />
      <label
        class="absolute hover:cursor-text text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[20%_0%] bg-white px-2 peer-focus:text-gray-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
        for={id}
      >
        {placeholder}
      </label>
    </div>
  {:else}
    <input
      class={classNames(
        'block mt-2 px-3 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 appearance-none focus:outline-none focus:border-gray-600 placeholder:text-gray-500',
        error ? 'border-red-300 focus:border-red-600' : 'border-gray-300 focus:border-gray-600'
      )}
      {type}
      {id}
      {value}
      {name}
      on:input={handleInput}
      use:imask={options}
      placeholder={placeholder ? placeholder : ' '}
      {...$$restProps}
    />
  {/if}
</div>

<script>
  import { classNames } from '$lib/utils.js'
  import { uniqueId } from 'lodash'

  export let type = 'text'
  export let value = ''
  export let error = ''
  export let placeholder = ''
  export let floating = false
  let className = ''
  export { className as class }

  const id = uniqueId('input-')
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
          error === ''
            ? 'border-gray-300 focus:border-gray-600'
            : 'border-red-300 focus:border-red-600'
        )}
        {type}
        {id}
        {value}
        on:input={handleInput}
        placeholder=" "
      />
      <label
        class="absolute text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[20%_0%] bg-white px-2 peer-focus:text-gray-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
        for={id}
      >
        {placeholder}
      </label>
    </div>
  {:else}
    <input
      class={classNames(
        'block mt-2 px-3 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 appearance-none focus:outline-none focus:border-gray-600 placeholder:text-gray-500',
        error === ''
          ? 'border-gray-300 focus:border-gray-600'
          : 'border-red-300 focus:border-red-600'
      )}
      {type}
      {id}
      {value}
      on:input={handleInput}
      placeholder={placeholder ? placeholder : ' '}
    />
  {/if}
  {#if error !== ''}
    <div class="text-sm text-red-600 h-5">
      {error}
    </div>
  {/if}
</div>

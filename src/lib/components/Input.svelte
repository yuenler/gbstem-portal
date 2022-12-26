<script>
  import { classNames } from '$lib/utils.js'
  import { uniqueId } from 'lodash'
  import { imask } from '@imask/svelte'

  export let self
  export let type = 'text'
  export let field = {
    value: '',
    error: false
  }
  export let placeholder = ''
  export let floating = false
  export let checked = false
  let className = ''
  export { className as class }
  export let maskOptions = { mask: /[^]*/ }

  const id = uniqueId('input-')
  const name = placeholder.toLowerCase().split(' ').join('-')
  function handleInput(e) {
    field.value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value
  }
</script>

<div class="mt-2">
  {#if type === 'checkbox'}
    <div class="flex mt-2">
      <input
        class={classNames(
          'mt-0.5 shrink-0 appearance-none w-5 h-5 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 checked:bg-gray-600 checked:border-gray-600',
          className
        )}
        type="checkbox"
        {id}
        {checked}
        bind:this={self}
      />
      <label for={id} class="ml-3 text-gray-900">
        {placeholder}
      </label>
    </div>
  {:else if floating}
    <div class="relative">
      <input
        class={classNames(
          'appearance-none block px-3 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border focus:outline-none peer',
          field.error
            ? 'border-red-300 focus:border-red-600'
            : 'border-gray-300 focus:border-gray-600',
          className
        )}
        {type}
        {id}
        {name}
        value={field.value}
        bind:this={self}
        on:input={handleInput}
        use:imask={maskOptions}
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
        'appearance-none block px-3 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 placeholder:text-gray-500',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      {type}
      {id}
      {name}
      value={field.value}
      bind:this={self}
      on:input={handleInput}
      use:imask={maskOptions}
      placeholder={placeholder ? placeholder : ' '}
      {...$$restProps}
    />
  {/if}
</div>

<style>
  input:checked {
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
  }
</style>

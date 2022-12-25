<script>
  import { classNames } from '$lib/utils.js'
  import { uniqueId, debounce } from 'lodash'
  import { fade } from 'svelte/transition'

  export let value = ''
  export let error = false
  export let placeholder = ''
  export let floating = false
  export let sourceJson = []
  let className = ''
  export { className as class }
  let open = false
  let selectedIndex = 0
  let source = []

  const throttledSourceFilter = debounce(() => {
    const lowerCaseValue = value.toLowerCase()
    source = sourceJson.filter(item => {
      return item.name.toLowerCase().indexOf(lowerCaseValue) !== -1
    })
  }, 150)
  $: throttledSourceFilter(value)

  const id = uniqueId('input-')
  const name = placeholder.toLowerCase().split(' ').join('-')
  function handleInput(e) {
    if (!open) {
      open = true
    }
    selectedIndex = 0
    value = e.target.value
  }
  function handleKeyDown(e) {
    switch (e.code) {
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        open = false
        value = source[selectedIndex].name
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedIndex !== 0) {
          --selectedIndex
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (selectedIndex !== source.length - 1) {
          ++selectedIndex
        }
        break
    }
  }
</script>

<div class={classNames('relative', className)}>
  {#if floating}
    <div class="relative mt-2">
      <input
        class={classNames(
          'block pl-3 pr-9 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border appearance-none focus:outline-none  peer',
          error ? 'border-red-300 focus:border-red-600' : 'border-gray-300 focus:border-gray-600'
        )}
        type="text"
        {id}
        {value}
        {name}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        placeholder=" "
        {...$$restProps}
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
        'block mt-2 pl-3 pr-9 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 appearance-none focus:outline-none focus:border-gray-600 placeholder:text-gray-500',
        error ? 'border-red-300 focus:border-red-600' : 'border-gray-300 focus:border-gray-600'
      )}
      type="text"
      {id}
      {value}
      {name}
      on:input={handleInput}
      on:keydown={handleKeyDown}
      placeholder={placeholder ? placeholder : ' '}
      {...$$restProps}
    />
  {/if}
  <button
    class="absolute top-5 right-2"
    type="button"
    on:click={() => {
      open = !open
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
      />
    </svg>
  </button>
  {#if open}
    <div
      class="absolute top-16 left-0 w-full bg-white rounded-md border border-gray-200 shadow-sm py-1 max-h-60 overflow-y-auto overflow-hidden z-20"
      transition:fade={{ duration: 150 }}
    >
      {#if source.length === 0}
        <div class="text-left py-2 px-6 w-full">Nothing found.</div>
      {:else if source.length === 1}
        <button
          class="text-left py-2 px-6 w-full transition-colors duration-300 bg-gray-100"
          type="button"
          on:click={() => {
            value = source[0].name
          }}
        >
          {source[0].name}
        </button>
      {:else}
        {#each source as item, index}
          <button
            class={classNames(
              'text-left py-2 px-6 w-full transition-colors duration-300',
              index === selectedIndex && 'bg-gray-100'
            )}
            type="button"
            on:click={() => {
              value = item.name
            }}
            on:mouseenter={() => {
              selectedIndex = index
            }}
            >{item.name}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

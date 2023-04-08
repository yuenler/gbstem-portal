<script context="module">
  let current
</script>

<script>
  import { classNames, clickOutside } from '$lib/utils'
  import { uniqueId, debounce, kebabCase } from 'lodash'
  import { fade } from 'svelte/transition'

  let self
  export let field = {
    value: '',
    error: false
  }
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let floating = false
  export let sourceJson = []
  export let required = false
  let className = ''
  export { className as class }
  let open = false
  let selectedIndex = 0
  const sourceNames = sourceJson.map(item => item.name)
  let filteredSourceNames = []

  const filterSourceNames = debounce(givenValue => {
    const lowerCaseValue = givenValue.toLowerCase()
    filteredSourceNames = sourceNames.filter(
      name => name.toLowerCase().indexOf(lowerCaseValue) !== -1
    )
  }, 150)
  $: onOpen(open)
  $: onField(field)

  const id = uniqueId('select-')
  filterSourceNames(field.value)
  function handleInput(e) {
    if (!open) {
      open = true
    }
    selectedIndex = 0
    field.value = e.target.value
    filterSourceNames(field.value)
  }
  function handleKeyDown(e) {
    switch (e.code) {
      case 'Enter':
        e.preventDefault()
        open = false
        field.value = filteredSourceNames[selectedIndex]
        break
      case 'Tab':
        if (open) {
          e.preventDefault()
          open = false
          field.value = filteredSourceNames[selectedIndex]
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedIndex !== 0) {
          --selectedIndex
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (selectedIndex !== filteredSourceNames.length - 1) {
          ++selectedIndex
        }
        break
    }
  }
  function handleClick() {
    open = true
  }
  function catchCurrent() {
    if (current && current.id !== id) {
      current.setOpen(false)
    }
    current = {
      id,
      setOpen: value => {
        open = value
      }
    }
  }
  function onOpen() {
    if (open) {
      catchCurrent()
    } else {
      const givenValue = field.value
      if (sourceNames.includes(givenValue)) {
        filteredSourceNames = [givenValue, ...sourceNames.filter(name => name !== givenValue)]
        selectedIndex = 0
      } else {
        field.value = ''
        filterSourceNames(field.value)
      }
    }
  }
  function onField() {
    if (sourceNames.includes(field.value)) {
      if (self) self.setCustomValidity('')
    } else {
      if (self) self.setCustomValidity(' ')
    }
  }
</script>

<div
  class={classNames('relative mt-2', className)}
  use:clickOutside
  on:outclick={() => {
    open = false
  }}
>
  {#if floating}
    <div class="relative">
      <input
        class={classNames(
          'peer block h-12 w-full appearance-none rounded-md border pl-3 pr-9 pt-1 text-gray-900 transition-colors focus:outline-none disabled:bg-white disabled:text-gray-400',
          field.error
            ? 'border-red-300 focus:border-red-600'
            : 'border-gray-300 focus:border-gray-600',
          className
        )}
        type="text"
        placeholder=" "
        value={field.value}
        bind:this={self}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        on:click={handleClick}
        {id}
        {name}
        {required}
        {...$$restProps}
      />
      <label
        class="absolute top-[0.65rem] left-1 z-10 origin-[0%_0%] -translate-y-4 transform cursor-text bg-white px-2 text-[0.8rem] leading-none text-gray-500 duration-150 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-focus:top-[0.65rem] peer-focus:left-1 peer-focus:-translate-y-4 peer-focus:text-[0.8rem] peer-focus:leading-none"
        for={id}
      >
        <span>
          {placeholder}<span class="text-red-500">*</span>
        </span>
      </label>
    </div>
  {:else}
    <label for={id}>
      <span>
        {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
      </span>
    </label>
    <input
      class={classNames(
        'block h-12 w-full appearance-none rounded-md border border-gray-300 pl-3 pr-9 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      type="text"
      value={field.value}
      bind:this={self}
      on:input={handleInput}
      on:keydown={handleKeyDown}
      on:click={handleClick}
      {id}
      {name}
      {placeholder}
      {required}
      {...$$restProps}
    />
  {/if}
  <div class="absolute top-0 right-0 flex h-12 items-center pr-2">
    <button
      type="button"
      on:click={() => {
        open = !open
        if (open) {
          self.focus()
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="h-6 w-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
        />
      </svg>
    </button>
  </div>
  {#if open}
    <div
      class="absolute top-14 left-0 z-20 max-h-60 w-full overflow-hidden overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-sm"
      transition:fade={{ duration: 100 }}
    >
      {#if filteredSourceNames.length === 0}
        <div class="w-full py-2 px-6 text-left">Nothing found.</div>
      {:else if filteredSourceNames.length === 1}
        <button
          class="w-full bg-gray-100 py-2 px-6 text-left transition-colors duration-300"
          type="button"
          on:click={() => {
            field.value = filteredSourceNames[0]
            open = false
          }}
        >
          {filteredSourceNames[0]}
        </button>
      {:else}
        {#each filteredSourceNames as name, index}
          <button
            class={classNames(
              'w-full py-2 px-6 text-left transition-colors duration-300',
              index === selectedIndex && 'bg-gray-100'
            )}
            type="button"
            on:click={() => {
              field.value = name
              open = false
            }}
            on:mouseenter={() => {
              selectedIndex = index
            }}
          >
            {name}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  input:not(:required) + label > span > span {
    display: none;
  }
  input:required:disabled + label > span > span {
    color: #fca5a5;
  }
</style>

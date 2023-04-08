<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase } from 'lodash'
  import { fieldsJson } from '$lib/data'
  import { alert } from '$lib/stores'

  export let self
  export let type = 'text'
  export let field = fieldsJson[type]
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let floating = false
  export let group = null
  export let maxSize = 0
  export let accept = []
  export let required = false
  let className = ''
  export { className as class }

  const id = uniqueId('input-')
  function handleInput(e) {
    if (type === 'checkbox') {
      if (group) {
        if (e.target.checked) {
          group.value = [name, ...group.value]
        } else {
          group.value = group.value.filter(item => item !== name)
        }
      } else {
        field.checked = e.target.checked
      }
    } else if (type === 'number' || type === 'range') {
      field.value = +e.target.value
    } else if (type === 'file') {
      field.value = e.target.files[0]
      if (field.value?.size > maxSize) {
        self.setCustomValidity(' ')
        alert.trigger('error', 'File exceeds maximum size.', false)
      } else {
        self.setCustomValidity('')
      }
    } else {
      field.value = e.target.value
    }
  }
</script>

<div class="mt-2">
  {#if type === 'checkbox'}
    {#if group}
      <div class="mt-2 flex">
        <input
          class={classNames(
            'peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-gray-600 checked:bg-gray-600 focus:border-gray-600 focus:outline-none disabled:cursor-default disabled:checked:border-gray-400 disabled:checked:bg-gray-400',
            field.error
              ? 'border-red-300 focus:border-red-600'
              : 'border-gray-300 focus:border-gray-600',
            className
          )}
          type="checkbox"
          checked={group.value.includes(name)}
          bind:this={self}
          on:input={handleInput}
          {id}
          {name}
          {required}
          {...$$restProps}
        />
        <label
          for={id}
          class="ml-3 cursor-pointer text-gray-900 peer-disabled:cursor-default peer-disabled:text-gray-400"
        >
          <span>
            {placeholder}<span class="text-red-500">*</span>
          </span>
        </label>
      </div>
    {:else}
      <div class="mt-2 flex">
        <input
          class={classNames(
            'peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-gray-600 checked:bg-gray-600 focus:border-gray-600 focus:outline-none disabled:cursor-default disabled:checked:border-gray-400 disabled:checked:bg-gray-400',
            field.error
              ? 'border-red-300 focus:border-red-600'
              : 'border-gray-300 focus:border-gray-600',
            className
          )}
          type="checkbox"
          checked={field.checked}
          bind:this={self}
          on:input={handleInput}
          {id}
          {name}
          {required}
          {...$$restProps}
        />
        <label
          for={id}
          class="ml-3 cursor-pointer text-gray-900 peer-disabled:cursor-default peer-disabled:text-gray-400"
        >
          <span>
            {placeholder}<span class="text-red-500">*</span>
          </span>
        </label>
      </div>
    {/if}
  {:else if type === 'file'}
    <label for={id}>
      <span>
        {placeholder}<span class="text-red-500">*</span>
      </span>
    </label>
    <input
      class={classNames(
        'mt-2 block h-12 w-full cursor-pointer appearance-none rounded-md border border-gray-300 text-gray-900 transition-colors file:mr-4 file:h-full file:cursor-pointer file:border-none file:bg-gray-700 file:px-4 file:text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      type="file"
      accept={accept.join(',')}
      bind:this={self}
      on:input={handleInput}
      {id}
      {name}
      {required}
      {...$$restProps}
    />
  {:else if floating}
    <div class="relative">
      <input
        class={classNames(
          'peer block h-12 w-full appearance-none rounded-md border px-3 pt-1 text-gray-900 transition-colors focus:outline-none disabled:bg-white disabled:text-gray-400',
          field.error
            ? 'border-red-300 focus:border-red-600'
            : 'border-gray-300 focus:border-gray-600',
          className
        )}
        placeholder=" "
        value={field.value}
        bind:this={self}
        on:input={handleInput}
        {type}
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
        'block h-12 w-full appearance-none rounded-md border border-gray-300 px-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      value={field.value}
      bind:this={self}
      on:input={handleInput}
      {type}
      {id}
      {name}
      {placeholder}
      {required}
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
  input:not(:required) + label > span > span {
    display: none;
  }
  input:required:disabled + label > span > span {
    color: #fca5a5;
  }
</style>

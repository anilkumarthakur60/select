<script lang="ts" generics="T extends OptionLike = OptionLike">
  import { createSelectAdapter, toSvelteProps } from '@anil-labs/select-svelte'
  import type { OptionLike, NormalizedOption, SelectMachineConfig } from '@anil-labs/select-svelte'
  import { onMount, type Snippet } from 'svelte'

  type Props = SelectMachineConfig<T> & {
    renderOption?: Snippet<[NormalizedOption<T>, boolean, boolean]>
    renderValue?: Snippet<[NormalizedOption<T>]>
    class?: string
  }

  let { renderOption, renderValue, class: className, ...config }: Props = $props()

  const adapter = createSelectAdapter<T>(config as SelectMachineConfig<T>)

  // Manual reactivity bridge: every machine notify bumps `tick`, which is
  // the single $state cell every $derived in this component reads to know
  // it needs to recompute. Without this Svelte 5 has no way to see the
  // machine's internal mutations.
  let tick = $state(0)
  onMount(() => adapter.subscribe(() => (tick += 1)))

  // Re-push prop changes into the machine on every effect run.
  $effect(() => {
    adapter.machine.update(config as SelectMachineConfig<T>)
  })

  // $derived.by re-runs whenever any reactive read inside changes 
  // `void tick` is the explicit (lint-friendly) way to register that
  // dependency without producing an "unused expression" warning.
  const state = $derived.by(() => {
    void tick
    return adapter.machine.getState()
  })
  const filtered = $derived.by(() => {
    void tick
    return adapter.machine.getFilteredOptions()
  })
  const selected = $derived.by(() => {
    void tick
    return adapter.machine.getSelectedOptions()
  })
  const isMulti = $derived.by(() => {
    void tick
    return adapter.machine.isMulti()
  })
  const hasSelection = $derived.by(() => {
    void tick
    return adapter.machine.hasSelection()
  })

  let rootEl: HTMLDivElement | undefined = $state()
  let menuEl: HTMLDivElement | undefined = $state()
  let searchEl: HTMLInputElement | undefined = $state()

  $effect(() => {
    if (!state.isOpen) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootEl?.contains(target)) return
      if (menuEl?.contains(target)) return
      adapter.machine.close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  $effect(() => {
    if (state.isOpen && config.searchable !== false) {
      queueMicrotask(() => searchEl?.focus())
    }
  })
</script>

<div bind:this={rootEl} {...toSvelteProps(adapter.machine.getRootProps())}>
  <div class="vselect-control" {...toSvelteProps(adapter.machine.getControlProps())}>
    <div class="vselect-values">
      {#if !isMulti && selected[0] && !state.query}
        {#if renderValue}
          {@render renderValue(selected[0])}
        {:else}
          <span class="vselect-single">{selected[0].label}</span>
        {/if}
      {/if}

      {#if isMulti && selected.length > 0}
        {#each selected as option (option.id)}
          <span class="vselect-tag">
            <span class="vselect-tag-label">{option.label}</span>
            <button
              type="button"
              class="vselect-tag-remove"
              aria-label="Remove {option.label}"
              tabindex={-1}
              onmousedown={(event) => {
                event.preventDefault()
                adapter.machine.deselectOption(option)
              }}>×</button
            >
          </span>
        {/each}
      {/if}

      {#if config.searchable !== false}
        <input
          bind:this={searchEl}
          {...toSvelteProps(adapter.machine.getSearchProps())}
          class={['vselect-search', !isMulti && hasSelection && !state.query ? 'is-hidden' : '']
            .filter(Boolean)
            .join(' ')}
        />
      {/if}
    </div>

    <div class="vselect-indicators">
      {#if config.loading}
        <span class="vselect-spinner" aria-hidden="true"></span>
      {:else if config.clearable !== false && hasSelection && !config.disabled}
        <button {...toSvelteProps(adapter.machine.getClearButtonProps())} class="vselect-indicator"
          >×</button
        >
      {/if}
      <span class="vselect-indicator" aria-hidden="true">▾</span>
    </div>
  </div>

  <div bind:this={menuEl} {...toSvelteProps(adapter.machine.getMenuProps())} class="vselect-menu">
    {#if config.loading}
      <div class="vselect-loading">
        <span class="vselect-spinner"></span>
        <span>{config.loadingText ?? 'Loading…'}</span>
      </div>
    {:else if filtered.length === 0}
      <div class="vselect-empty">{adapter.machine.emptyMessage()}</div>
    {:else}
      {#each filtered as option, index (option.id)}
        {@const optProps = toSvelteProps(adapter.machine.getOptionProps(option, index))}
        <div {...optProps}>
          {#if renderOption}
            {@render renderOption(
              option,
              state.activeIndex === index,
              adapter.machine.isSelected(option),
            )}
          {:else}
            <span>{option.label}</span>
          {/if}
        </div>
      {/each}
    {/if}

    {#if adapter.machine.showCreate()}
      <div
        class="vselect-create"
        role="option"
        aria-selected={false}
        tabindex={-1}
        onmousedown={(event) => {
          event.preventDefault()
          adapter.machine.createFromQuery()
        }}
      >
        Create <strong>{state.query}</strong>
      </div>
    {/if}
  </div>
</div>

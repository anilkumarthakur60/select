import type {
  RootProps,
  ControlProps,
  MenuProps,
  SearchProps,
  OptionProps,
  ClearButtonProps,
} from '@anil-labs/select-core'

// React translators. The core machine produces Vue-JSX-shaped event keys
// (`onMousedown`); React needs camelCase + a `className` instead of `class`.
// These adapters do the minimum mapping so the JSX call sites stay terse.

export interface ReactRootProps {
  className: string
  'data-disabled': string | undefined
  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void
}

export function toReactRootProps(p: RootProps): ReactRootProps {
  return {
    className: p.class,
    'data-disabled': p['data-disabled'],
    onFocus: p.onFocusin as unknown as (event: React.FocusEvent) => void,
    onBlur: p.onFocusout as unknown as (event: React.FocusEvent) => void,
  }
}

export interface ReactControlProps {
  id: string
  role: 'combobox'
  'aria-expanded': boolean
  'aria-controls': string
  'aria-haspopup': 'listbox'
  'aria-disabled': boolean | undefined
  'aria-required': boolean | undefined
  'aria-label': string | undefined
  'aria-activedescendant': string | undefined
  tabIndex: number
  onMouseDown: (event: React.MouseEvent) => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

export function toReactControlProps(p: ControlProps): ReactControlProps {
  return {
    id: p.id,
    role: p.role,
    'aria-expanded': p['aria-expanded'],
    'aria-controls': p['aria-controls'],
    'aria-haspopup': p['aria-haspopup'],
    'aria-disabled': p['aria-disabled'],
    'aria-required': p['aria-required'],
    'aria-label': p['aria-label'],
    'aria-activedescendant': p['aria-activedescendant'],
    tabIndex: p.tabindex,
    onMouseDown: p.onMousedown as unknown as (event: React.MouseEvent) => void,
    onKeyDown: p.onKeydown as unknown as (event: React.KeyboardEvent) => void,
  }
}

export interface ReactMenuProps {
  id: string
  role: 'listbox'
  'aria-multiselectable': boolean
  hidden: boolean
}

export function toReactMenuProps(p: MenuProps): ReactMenuProps {
  return p
}

export interface ReactSearchProps {
  id: string
  type: 'text'
  autoComplete: 'off'
  spellCheck: false
  value: string
  placeholder: string | undefined
  disabled: boolean
  'aria-controls': string
  'aria-autocomplete': 'list'
  'aria-activedescendant': string | undefined
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

export function toReactSearchProps(p: SearchProps): ReactSearchProps {
  return {
    id: p.id,
    type: p.type,
    autoComplete: p.autocomplete,
    spellCheck: p.spellcheck,
    value: p.value,
    placeholder: p.placeholder,
    disabled: p.disabled,
    'aria-controls': p['aria-controls'],
    'aria-autocomplete': p['aria-autocomplete'],
    'aria-activedescendant': p['aria-activedescendant'],
    onChange: p.onInput as unknown as (event: React.ChangeEvent<HTMLInputElement>) => void,
    onKeyDown: p.onKeydown as unknown as (event: React.KeyboardEvent) => void,
  }
}

export interface ReactOptionProps {
  id: string
  role: 'option'
  'aria-selected': boolean
  'aria-disabled': boolean | undefined
  className: string
  onMouseDown: (event: React.MouseEvent) => void
  onMouseEnter: () => void
}

export function toReactOptionProps(p: OptionProps): ReactOptionProps {
  return {
    id: p.id,
    role: p.role,
    'aria-selected': p['aria-selected'],
    'aria-disabled': p['aria-disabled'],
    className: p.class,
    onMouseDown: p.onMousedown as unknown as (event: React.MouseEvent) => void,
    onMouseEnter: p.onMouseenter,
  }
}

export interface ReactClearProps {
  type: 'button'
  'aria-label': string
  tabIndex: -1
  onMouseDown: (event: React.MouseEvent) => void
}

export function toReactClearProps(p: ClearButtonProps): ReactClearProps {
  return {
    type: p.type,
    'aria-label': p['aria-label'],
    tabIndex: p.tabindex,
    onMouseDown: p.onMousedown as unknown as (event: React.MouseEvent) => void,
  }
}

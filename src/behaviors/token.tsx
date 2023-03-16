import PropTypes from 'prop-types';
import React, {
  ComponentType,
  FocusEvent,
  FocusEventHandler,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  useState,
} from 'react';
import { useRootClose } from 'react-overlays';

import { getDisplayName, isFunction, warn } from '../utils';

import { optionType } from '../propTypes';
import { OptionType, OptionHandler } from '../types';

export interface UseTokenProps<T, Option extends OptionType> extends Omit<HTMLProps<T>, 'onBlur'> {
  // `onBlur` is typed more generically because it's passed to `useRootClose`,
  // which passes a generic event to the callback.
  onBlur?: (event: Event) => void;
  onClick?: MouseEventHandler<T>;
  onFocus?: FocusEventHandler<T>;
  onRemove?: OptionHandler<Option>;
  option: Option;
}

const propTypes = {
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onRemove: PropTypes.func,
  option: optionType.isRequired,
};

export function useToken<T extends HTMLElement, Option extends OptionType>({
  onBlur,
  onClick,
  onFocus,
  onRemove,
  option,
  ...props
}: UseTokenProps<T, Option>) {
  const [active, setActive] = useState<boolean>(false);
  const [rootElement, attachRef] = useState<T | null>(null);

  const handleBlur = (e: Event) => {
    setActive(false);
    onBlur && onBlur(e);
  };

  const handleClick = (e: MouseEvent<T>) => {
    setActive(true);
    onClick && onClick(e);
  };

  const handleFocus = (e: FocusEvent<T>) => {
    setActive(true);
    onFocus && onFocus(e);
  };

  const handleRemove = () => {
    onRemove && onRemove(option);
  };

  const handleKeyDown = (e: KeyboardEvent<T>) => {
    if (e.key === 'Backspace' && active) {
      // Prevent browser from going back.
      e.preventDefault();
      handleRemove();
    }
  };

  useRootClose(rootElement, handleBlur, {
    ...props,
    disabled: !active,
  });

  return {
    active,
    onBlur: handleBlur,
    onClick: handleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onRemove: isFunction(onRemove) ? handleRemove : undefined,
    ref: attachRef,
  };
}

/* istanbul ignore next */
export function withToken<Option extends OptionType, T extends UseTokenProps<HTMLElement, Option>>(
  Component: ComponentType<T>
) {
  warn(
    false,
    'Warning: `withToken` is deprecated and will be removed in the next ' +
      'major version. Use `useToken` instead.'
  );

  const displayName = `withToken(${getDisplayName(Component)})`;

  const WrappedToken = (props: T) => (
    <Component {...props} {...useToken(props)} />
  );

  WrappedToken.displayName = displayName;
  WrappedToken.propTypes = propTypes;

  return WrappedToken;
}

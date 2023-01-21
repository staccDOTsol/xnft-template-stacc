import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { lighten } from 'polished'
import { useState } from 'react'

import { LoadingSpinner } from './LoadingSpinner'
import { getColorByBgColor } from './utils'

export type ButtonProps = {
  variant: 'primary' | 'secondary' | 'tertiary'
  boxShadow?: boolean
  disabled?: boolean
  bgColor?: string
  type?: 'button' | 'submit' | 'reset' | undefined
}

export const Button = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  border: none;
  outline: none;
  mix-blend-mode: normal;
  box-shadow: ${({ boxShadow }) =>
    boxShadow ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : ''};
  border-radius: 4px;
  transition: 0.2s background;
  ${({ variant = 'primary', disabled, bgColor = undefined }) => {
    return bgColor
      ? css`
          background: ${bgColor};
          color: ${getColorByBgColor(bgColor)};
          &:hover {
            background: ${!disabled && lighten(0.1, bgColor)}};
          }
        `
      : variant === 'primary'
      ? css`
          background: rgb(29, 155, 240);
          color: #fff;
          &:hover {
            background: ${!disabled && lighten(0.1, 'rgb(29, 155, 240)')}};
          }
        `
      : variant === 'secondary'
      ? css`
          background: #000;
          color: #fff;
          &:hover {
            background: ${!disabled && lighten(0.1, '#000')};
          }
        `
      : css`
          background: rgb(255, 255, 255, 0.15);
          color: #fff;
          &:hover {
            background: ${!disabled && lighten(0.05, '#000')};
          }
        `
  }}
  & > span {
    font-size: 14px;
  }
`

export const AsyncButton = ({
  children,
  handleClick,
  className,
  ...buttonProps
}: {
  children: JSX.Element | JSX.Element[] | string
  className?: string
  handleClick: () => void
} & ButtonProps) => {
  const [loading, setLoading] = useState(false)

  return (
    <Button
      {...buttonProps}
      className={className}
      onClick={async () => {
        try {
          setLoading(true)
          await handleClick()
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? <LoadingSpinner height="25px" /> : children}
    </Button>
  )
}

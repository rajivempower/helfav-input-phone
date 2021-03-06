// @flow
import React, { Component, PureComponent } from 'react'

import MaskedInput from 'react-text-mask'

// keyCode constants
const BACKSPACE = 8
const MOBILE_BACKSPACE = 46
const LEFT_ARROW = 37
const RIGHT_ARROW = 39
const DELETE = 46

type Props = {
  numInputs: number
  onChange: Function
  separator?: Object
  containerStyle?: Object
  inputStyle?: Object
  focusStyle?: Object
  isDisabled?: boolean
  disabledStyle?: Object
  hasErrored?: boolean
  errorStyle?: Object
  shouldAutoFocus?: boolean
  isInputNum?: boolean
  value?: string
}

type State = {
  activeInput: number
  otp: string[]
}

// Doesn't really check if it's a style Object
// Basic implemenetation to check if it's not a string
// of classNames and is an Object
// TODO: Better implementation
const isStyleObject = (obj: any) => typeof obj === 'object'

class SingleOtpInput extends Component<any> {
  input: HTMLInputElement | null = null

  // Focus on first render
  // Only when shouldAutoFocus is true
  componentDidMount() {
    const {
      input,
      props: { focus, shouldAutoFocus },
    } = this

    if (input && focus && shouldAutoFocus) {
      input.focus()
    }
  }

  componentDidUpdate(prevProps: any) {
    const {
      input,
      props: { focus },
    } = this

    // Check if focusedInput changed
    // Prevent calling function if input already in focus
    if (prevProps.focus !== focus && (input && focus)) {
      input.focus()
      input.select()
    }
  }

  getClasses = (...classes: any) => classes.filter((c: any) => !isStyleObject(c) && c !== false).join(' ')

  render() {
    const {
      separator,
      isLastChild,
      inputStyle,
      focus,
      isDisabled,
      hasErrored,
      errorStyle,
      focusStyle,
      disabledStyle,
      shouldAutoFocus,

      value,
      ...rest
    } = this.props

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MaskedInput
          mask={[/\d/]}
          placeholderChar={'\u2000'}
          style={Object.assign(
            { width: '1em', textAlign: 'center' },
            isStyleObject(inputStyle) && inputStyle,
            focus && isStyleObject(focusStyle) && focusStyle,
            isDisabled && isStyleObject(disabledStyle) && disabledStyle,
            hasErrored && isStyleObject(errorStyle) && errorStyle
          )}
          className={this.getClasses(
            inputStyle,
            focus && focusStyle,
            isDisabled && disabledStyle,
            hasErrored && errorStyle
          )}
          type={'tel'}
          maxLength={1}
          ref={input => {
            this.input = input ? (input!.inputElement as HTMLInputElement) : null
          }}
          disabled={isDisabled}
          value={value ? value : ''}
          {...rest}
        />
        {!isLastChild && separator}
      </div>
    )
  }
}

interface OtpInputProps {
  numInputs?: number
  onChange?: any
  value: string | number
  separator: React.Component
  containerStyle: string
  inputStyle: string
  focusStyle: string
  isDisabled: boolean
  disabledStyle: string
  hasErrored: boolean
  errorStyle: string
  shouldAutoFocus: boolean
}

export class OtpInput extends Component<Props, State> {
  static defaultProps = {
    numInputs: 4,
    onChange: (otp: number): void => console.log(otp),
    isDisabled: false,
    shouldAutoFocus: false,
    value: '',
  }

  state: any = {
    activeInput: 0,
  }

  getOtpValue = () => (this.props.value ? this.props.value.toString().split('') : [])

  // Helper to return OTP from input
  handleOtpChange = (otp: string[]) => {
    const { onChange, isInputNum } = this.props
    const otpValue = otp.join('')
    onChange(otpValue)
  }

  // Focus on input by index
  focusInput = (input: number) => {
    const { numInputs } = this.props
    const activeInput = Math.max(Math.min(numInputs - 1, input), 0)

    this.setState({ activeInput })
  }

  // Focus on next input
  focusNextInput = () => {
    const { activeInput } = this.state
    this.focusInput(activeInput + 1)
  }

  // Focus on previous input
  focusPrevInput = () => {
    const { activeInput } = this.state
    this.focusInput(activeInput - 1)
  }

  // Change OTP value at focused input
  changeCodeAtFocus = (value: string) => {
    const { activeInput } = this.state
    const otp = this.getOtpValue()
    otp[activeInput] = value[0]

    this.handleOtpChange(otp)
  }

  // Handle pasted OTP
  handleOnPaste = (e: any) => {
    e.preventDefault()
    const { numInputs } = this.props
    const { activeInput } = this.state
    const otp = this.getOtpValue()

    // Get pastedData in an array of max size (num of inputs - current position)
    const pastedData = e.clipboardData
      .getData('text/plain')
      .slice(0, numInputs - activeInput)
      .split('')

    // Paste data from focused input onwards
    for (let pos = 0; pos < numInputs; ++pos) {
      if (pos >= activeInput && pastedData.length > 0) {
        otp[pos] = pastedData.shift()
      }
    }

    this.handleOtpChange(otp)
  }

  handleOnChange = (e: any) => {
    this.changeCodeAtFocus(e.target.value)
    this.focusNextInput()
  }

  // Handle cases of backspace, delete, left arrow, right arrow
  handleOnKeyDown = (e: any) => {
    if (e.keyCode === BACKSPACE || e.key === 'Backspace' || e.keyCode === MOBILE_BACKSPACE || e.key === 'Delete') {
      e.preventDefault()
      this.changeCodeAtFocus('')
      this.focusPrevInput()
    } else if (e.keyCode === DELETE || e.key === 'Delete') {
      e.preventDefault()
      this.changeCodeAtFocus('')
    } else if (e.keyCode === LEFT_ARROW || e.key === 'ArrowLeft') {
      e.preventDefault()
      this.focusPrevInput()
    } else if (e.keyCode === RIGHT_ARROW || e.key === 'ArrowRight') {
      e.preventDefault()
      this.focusNextInput()
    }
  }

  checkLength = (e: any) => {
    if (e.target.value.length > 1) {
      e.preventDefault()
      this.focusNextInput()
    }
  }

  renderInputs = () => {
    let { activeInput } = this.state
    const {
      numInputs,
      inputStyle,
      focusStyle,
      separator,
      isDisabled,
      disabledStyle,
      hasErrored,
      errorStyle,
      shouldAutoFocus,
      isInputNum,
    } = this.props
    const otp = this.getOtpValue()
    if (otp && !otp.length) {
      activeInput = 0
    }
    const inputs = []

    for (let i = 0; i < numInputs; i++) {
      inputs.push(
        <SingleOtpInput
          key={i}
          focus={activeInput === i}
          value={otp && otp[i]}
          onChange={this.handleOnChange}
          onKeyDown={this.handleOnKeyDown}
          onInput={this.checkLength}
          onPaste={this.handleOnPaste}
          onFocus={(e: any) => {
            this.setState({ activeInput: i })
            e.target.select()
          }}
          onBlur={() => this.setState({ activeInput: -1 })}
          separator={separator}
          inputStyle={inputStyle}
          focusStyle={focusStyle}
          isLastChild={i === numInputs - 1}
          isDisabled={isDisabled}
          disabledStyle={disabledStyle}
          hasErrored={hasErrored}
          errorStyle={errorStyle}
          shouldAutoFocus={shouldAutoFocus}
        />
      )
    }

    return inputs
  }

  render() {
    const { containerStyle } = this.props

    return (
      <div
        style={Object.assign({ display: 'flex' }, isStyleObject(containerStyle) && containerStyle)}
        className={!isStyleObject(containerStyle) ? '' + containerStyle : ''}
      >
        {this.renderInputs()}
      </div>
    )
  }
}

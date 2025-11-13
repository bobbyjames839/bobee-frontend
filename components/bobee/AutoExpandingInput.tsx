// AutoExpandingInput.tsx
import React, { useEffect, useRef, useState } from 'react'
import {
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native'

type Props = TextInputProps & {
  minHeight?: number
  maxHeight?: number
  onLineCountChange?: (lineCount: number) => void
}

export default function AutoExpandingInput({
  value,
  onChangeText,
  minHeight = 40,
  maxHeight = 120,
  style,
  onLineCountChange,
  ...props
}: Props) {
  const [height, setHeight] = useState(minHeight)
  const prevLenRef = useRef((value ?? '').toString().length)
  const [lineCount, setLineCount] = useState(1)

  // If cleared externally, reset height and line count
  useEffect(() => {
    const len = (value ?? '').toString().length
    if (len === 0) {
      if (height !== minHeight) setHeight(minHeight)
      if (lineCount !== 1) {
        setLineCount(1)
        onLineCountChange?.(1)
      }
    }
    prevLenRef.current = len
  }, [value, minHeight, height, lineCount, onLineCountChange])

  const handleContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const h = e.nativeEvent.contentSize.height
    const clamped = Math.max(minHeight, Math.min(maxHeight, h))
    if (clamped !== height) {
      setHeight(clamped)
    }

    const approxLineHeight = minHeight // assuming minHeight == per-line height
    const estimatedLineCount = Math.max(1, Math.round(h / approxLineHeight))

    if (estimatedLineCount !== lineCount) {
      setLineCount(estimatedLineCount)
      onLineCountChange?.(estimatedLineCount)
    }
    console.log({ h, estimatedLineCount, prevState: lineCount })
  }


  const handleChangeText = (next: string) => {
    const nextLen = (next ?? '').toString().length
    const prevLen = prevLenRef.current
    const isDeleting = nextLen < prevLen


    if (isDeleting && height !== minHeight) {
      setHeight(minHeight)
    }

    prevLenRef.current = nextLen
    onChangeText?.(next)
  }

  return (
    <TextInput
      value={value}
      onChangeText={handleChangeText}
      multiline
      textAlignVertical="top"
      onContentSizeChange={handleContentSizeChange}
      scrollEnabled={height >= maxHeight}
      style={[style, { minHeight: height, maxHeight }]}
      {...props}
    />
  )
}
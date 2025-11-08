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
}

export default function AutoExpandingInput({
  value,
  onChangeText,
  minHeight = 40,
  maxHeight = 120,
  style,
  ...props
}: Props) {
  const [height, setHeight] = useState(minHeight)
  const prevLenRef = useRef((value ?? '').toString().length)

  // If cleared externally, reset height
  useEffect(() => {
    const len = (value ?? '').toString().length
    if (len === 0 && height !== minHeight) setHeight(minHeight)
    prevLenRef.current = len
  }, [value, minHeight])

  const handleContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const h = e.nativeEvent.contentSize.height
    const clamped = Math.max(minHeight, Math.min(maxHeight, h))
    if (clamped !== height) setHeight(clamped)
  }

  const handleChangeText = (next: string) => {
    const nextLen = (next ?? '').toString().length
    const prevLen = prevLenRef.current
    const isDeleting = nextLen < prevLen

    // On any deletion (no matter where), snap to min first,
    // then onContentSizeChange will grow to the exact minimal height needed.
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
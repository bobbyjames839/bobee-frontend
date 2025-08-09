import React, { useState } from 'react'
import { TextInput } from 'react-native'

export default function AutoExpandingInput({ value, onChangeText, placeholder, minHeight = 40, maxHeight = 120, style, ...props}: any) {
  const [height, setHeight] = useState(minHeight)
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
      textAlignVertical="top"
      onContentSizeChange={e => {
        const h = e.nativeEvent.contentSize.height
        setHeight(Math.max(minHeight, Math.min(maxHeight, h)))
      }}
      scrollEnabled={height >= maxHeight}
      style={[style, { minHeight: height, maxHeight }]}
      {...props}
    />
  )
}

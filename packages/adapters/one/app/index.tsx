import { parseAsInteger, useQueryState } from 'nuqs'
import { Pressable, StyleProp, Text, TextStyle, View } from 'react-native'

const textStyle: StyleProp<TextStyle> = {
  userSelect: 'none',
  fontSize: 60,
  fontWeight: 'bold'
}

export default function Index() {
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger
      .withDefault(0)
      .withOptions({ clearOnDefault: true, history: 'push' })
  )
  return (
    <View
      style={{
        width: 800,
        height: 400,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Text style={textStyle}>Counter: {counter}</Text>
      <Pressable onPress={() => setCounter(x => x - 1)}>
        <Text style={textStyle}>-1</Text>
      </Pressable>
      <Pressable onPress={() => setCounter(x => x + 1)}>
        <Text style={textStyle}>+1</Text>
      </Pressable>
      <Text style={textStyle}>Hello, one + nuqs!</Text>
    </View>
  )
}

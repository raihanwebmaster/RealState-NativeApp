import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaView className="bg-black" >
      <View>
        <Text>Root Layout</Text>
      </View>
    </SafeAreaView>
  )
}

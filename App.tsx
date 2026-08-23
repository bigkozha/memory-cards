import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/context/AppContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      {/* On web, a phone UI stretched across a desktop browser window looks
          broken — cards spanning 1400px, huge gaps, nothing reads as an app.
          Native ignores this (width: "100%" of a full-bleed screen), so it's
          a no-op there; on web it pins the layout to a phone-shaped column. */}
      <View style={styles.webFrame}>
        <SafeAreaProvider>
          <AppProvider>
            <RootNavigator />
            <StatusBar style="light" />
          </AppProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webFrame: {
    flex: 1,
    width: "100%",
    ...(Platform.OS === "web" ? { maxWidth: 480, alignSelf: "center" } : null),
  },
});

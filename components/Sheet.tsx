import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal as RNModal,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { theme, useColors } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const dragY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 80) {
        runOnJS(onClose)();
      }
      dragY.value = withTiming(0, { duration: 220 });
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  const closeFromOverlay = useCallback(() => onClose(), [onClose]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AnimatePresence>
          {visible ? (
            <MotiView
              key="overlay"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              style={StyleSheet.absoluteFillObject}
            >
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={closeFromOverlay}
              >
                <BlurView
                  intensity={20}
                  tint="dark"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: 'rgba(0,0,0,0.45)' },
                  ]}
                />
              </Pressable>
            </MotiView>
          ) : null}
        </AnimatePresence>

        <View style={styles.bottom}>
          <AnimatePresence>
            {visible ? (
              <MotiView
                key="sheet"
                from={{ translateY: 500 }}
                animate={{ translateY: 0 }}
                exit={{ translateY: 500 }}
                transition={{ type: 'timing', duration: 280 }}
                style={{ width: '100%', maxWidth: 480 }}
              >
                <GestureDetector gesture={pan}>
                  <Animated.View
                    style={[
                      styles.sheet,
                      {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                        paddingBottom: 20 + insets.bottom,
                      },
                      dragStyle,
                    ]}
                  >
                    <View
                      style={[
                        styles.grabber,
                        { backgroundColor: colors.grayMid },
                      ]}
                    />
                    {title ? (
                      <Text style={[styles.title, { color: colors.ink }]}>
                        {title}
                      </Text>
                    ) : null}
                    {children}
                  </Animated.View>
                </GestureDetector>
              </MotiView>
            ) : null}
          </AnimatePresence>
        </View>
      </GestureHandlerRootView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 3,
    borderTopColor: theme.colors.ink,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: 26,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.ink,
  },
});

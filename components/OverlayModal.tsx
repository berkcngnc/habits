import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface OverlayModalProps {
  visible: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
  avoidKeyboard?: boolean;
}

export const OverlayModal: React.FC<OverlayModalProps> = ({
  visible,
  onDismiss,
  children,
  avoidKeyboard = false,
}) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      enabled={avoidKeyboard}
    >
      <Pressable
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 24 }}
        onPress={onDismiss}
      >
        <Pressable onPress={() => {}} style={{ width: '100%' }}>
          <Animated.View entering={FadeInUp.springify().damping(22).mass(0.8)}>
            {children}
          </Animated.View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  </Modal>
);

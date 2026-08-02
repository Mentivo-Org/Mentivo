import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  profilePic: any;
  onClose: () => void;
}

export default function ImageViewerModal({ visible, profilePic, onClose }: ImageViewerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.viewerContainer}>
        <TouchableOpacity
          style={styles.viewerOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.viewerContent}>
          <Image
            source={profilePic}
            style={styles.fullImage}
            contentFit="contain"
          />
          <TouchableOpacity
            style={styles.closeViewerBtn}
            onPress={onClose}
          >
            <Image source={require("../app-assets/x-icon.svg")} style={styles.closeIcon} tintColor="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerContent: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeViewerBtn: {
    position: 'absolute',
    top: -40,
    right: 20,
    padding: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
});

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { ProfilePictureEndpoints } from '../constants/endpoint';

interface UseProfilePictureUploadOptions {
  /** Called with the new photo URL once the server confirms the upload. */
  onUploaded: (photoUrl: string) => void | Promise<void>;
  onSuccess: () => void;
  onError: () => void;
  onPermissionDenied: () => void;
}

export function useProfilePictureUpload({
  onUploaded,
  onSuccess,
  onError,
  onPermissionDenied,
}: UseProfilePictureUploadOptions) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('profilePic', { uri, name: filename, type } as any);

      const response = await api.post(ProfilePictureEndpoints.uploadProfilePicture, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data?.photo_url) {
        await onUploaded(response.data.photo_url);
        onSuccess();
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      onError();
    } finally {
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onPermissionDenied();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  return { uploading, handlePickImage };
}

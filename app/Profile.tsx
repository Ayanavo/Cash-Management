import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfileInfoCard from '../components/ProfileInfoCard';
import ProfileAvatarButton from '../components/ProfileAvatarButton';
import { showErrorToast } from '../utils/toast';

export default function ProfileScreen() {
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const pickFromLibrary = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            showErrorToast(
                'Permission required',
                'We need access to your photos to set a profile picture.',
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length) {
            setAvatarUri(result.assets[0].uri);
        }
    }, []);

    const openCamera = useCallback(async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            showErrorToast(
                'Permission required',
                'We need access to your camera to take a profile picture.',
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length) {
            setAvatarUri(result.assets[0].uri);
        }
    }, []);

    const handleAvatarPress = useCallback(() => {
        Alert.alert('Profile picture', 'Choose a source', [
            { text: 'Camera', onPress: () => { void openCamera(); } },
            { text: 'Photo library', onPress: () => { void pickFromLibrary(); } },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }, [openCamera, pickFromLibrary]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.avatarWrap}>
                <ProfileAvatarButton
                    size={88}
                    imageUrl={avatarUri}
                    onPress={handleAvatarPress}
                />
            </View>
            <ProfileInfoCard />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 24,
        color: '#111827',
    },
    avatarWrap: {
        marginBottom: 16,
    },
});



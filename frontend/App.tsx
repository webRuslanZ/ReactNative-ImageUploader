import {
  MediaTypeOptions,
  launchImageLibraryAsync,
  useMediaLibraryPermissions,
  PermissionStatus,
} from "expo-image-picker";
import { Alert, Image, Linking, StyleSheet, Text, View } from "react-native";
import FormData from "form-data";
import axios, { AxiosError } from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UploadResponse {
  url: string;
}

export const PREFIX = "http://10.22.7.64:3000";

export const FILE_API = {
  uploadImage: `${PREFIX}/upload`,
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);

  const [libraryPermissions, requestLibraryPermission] =
    useMediaLibraryPermissions();

  useEffect(() => {
    const loadImageFromStorage = async () => {
      const storedImage = await AsyncStorage.getItem('uploadedImage');
      if (storedImage) {
        setImage(storedImage);
      }
    };

    loadImageFromStorage();
  }, []);

  const upload = async () => {
    const isPermissionGranted = await verifyMediaPermissions();
    if (!isPermissionGranted) {
      console.log("Недостаточно прав");
      return;
    }
    const asset = await pickImage();
    if (!asset) {
      console.log("Не выбрано изображение");
      return;
    }
    const uploadedUrl = await uploadToServer(asset.uri, asset.fileName ?? "");
    if (!uploadedUrl) {
      console.log("Не удалось загрузить изображение");
      return;
    }
    setImage(uploadedUrl);
    await saveImageToStorage(uploadedUrl);
  };

  const verifyMediaPermissions = async () => {
    const { status } = await requestLibraryPermission();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Разрешение необходимо",
        "Перейдите в настройки и предоставьте доступ к библиотеке медиафайлов",
        [
          { text: "Отмена", style: "cancel" },
          { text: "OK", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.assets) {
      return null;
    }
    return result.assets[0];
  };

  const uploadToServer = async (uri: string, name: string) => {
    const formData = new FormData();
    formData.append("files", {
      uri,
      name,
      type: "image/jpeg",
    });

    try {
      const { data } = await axios.post<UploadResponse>(
        FILE_API.uploadImage,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("data : --->", data);
      return data.url;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error);
      }
      return null;
    }
  };

  const saveImageToStorage = async (url: string) => {
    try {
      await AsyncStorage.setItem('uploadedImage', url);
    } catch (error) {
      console.error("Error saving image to AsyncStorage", error);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.text}>Загрузить изображение</Text>
          <Ionicons.Button name="cloud-upload" onPress={upload} />
        </View>
        <View style={{ flex: 1 }}>
          <Text>{image}</Text>
          {image && <Image width={70} height={70} source={{ uri: image }} />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#000",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 17,
    alignItems: "center",
    flex: 1,
  },
  text: {
    color: "#fff",
  },
});

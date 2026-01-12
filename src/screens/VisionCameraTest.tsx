import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

/**
 * ТЕСТ С VISION CAMERA
 * Модерна библиотека, активно поддържана, работи с iOS 17+
 */
const VisionCameraTest: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  // Permissions
  const { hasPermission, requestPermission } = useCameraPermission();
  
  // Get back camera
  const device = useCameraDevice('back');

  // QR Code Scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'code-93'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        const code = codes[0].value;
        console.log('🟢 VISION CAMERA - QR CODE SCANNED:', code);
        setLastScannedCode(code);
        setIsActive(false); // Pause scanning
        Alert.alert(
          'QR Код Сканиран!',
          code.substring(0, 100),
          [{ text: 'OK', onPress: () => setIsActive(true) }]
        );
      }
    },
  });

  useEffect(() => {
    console.log('🔵 VisionCameraTest mounted');
    console.log('🔵 hasPermission:', hasPermission);
    console.log('🔵 device:', device?.id);
    
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission, device]);

  // No permission
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>📷 Няма достъп до камера</Text>
        <Text style={styles.subText}>Моля разрешете достъп в Settings</Text>
        <Text 
          style={styles.linkText}
          onPress={() => Linking.openSettings()}
        >
          Отвори Settings
        </Text>
      </View>
    );
  }

  // No device
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>📷 Камерата не е намерена</Text>
        <Text style={styles.subText}>Устройството няма камера или не е достъпна</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
      </View>
      
      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📷 VISION CAMERA ТЕСТ</Text>
        {lastScannedCode ? (
          <Text style={styles.infoText}>
            ✅ Последен: {lastScannedCode.substring(0, 40)}...
          </Text>
        ) : (
          <Text style={styles.infoText}>Насочи камерата към QR код</Text>
        )}
        <Text style={styles.smallText}>
          Камера: {device.name} | Active: {isActive ? 'YES' : 'NO'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00B4DB',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  infoBox: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  smallText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 200,
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#00B4DB',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default VisionCameraTest;


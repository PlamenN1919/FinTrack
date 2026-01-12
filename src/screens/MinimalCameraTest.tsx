import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * МИНИМАЛЕН ТЕСТ ЗА КАМЕРА
 * Без overlays, без допълнителна логика - само Camera компонент
 */
const MinimalCameraTest: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  useEffect(() => {
    const requestPermission = async () => {
      try {
        console.log('🔵 MinimalCameraTest: Requesting permission...');
        
        const permission = Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.CAMERA 
          : PERMISSIONS.ANDROID.CAMERA;
        
        const result = await check(permission);
        console.log('🔵 Permission check result:', result);
        
        if (result === RESULTS.GRANTED) {
          console.log('🟢 Permission GRANTED');
          setHasPermission(true);
        } else if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          console.log('🔵 Permission request result:', requestResult);
          setHasPermission(requestResult === RESULTS.GRANTED);
        } else {
          console.log('🔴 Permission:', result);
          setHasPermission(false);
          setError(`Permission: ${result}`);
        }
      } catch (err) {
        console.error('🔴 Permission error:', err);
        setError(String(err));
        setHasPermission(false);
      }
    };
    
    requestPermission();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Проверка на разрешения...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>❌ Няма достъп до камера</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  console.log('🟡 MinimalCameraTest: Rendering Camera component...');

  return (
    <View style={styles.container}>
      {/* САМО Camera компонент - нищо друго */}
      <Camera
        style={styles.camera}
        cameraType={CameraType.Back}
        flashMode="off"
        scanBarcode={true}
        showFrame={true}
        laserColor="red"
        frameColor="green"
        onReadCode={(event: any) => {
          const code = event?.nativeEvent?.codeStringValue || 'unknown';
          console.log('🟢 QR CODE SCANNED:', code);
          setLastScannedCode(code);
          Alert.alert('QR Код', code);
        }}
        onError={(error: any) => {
          console.error('🔴 CAMERA ERROR:', error);
          setError(String(error));
        }}
        ratioOverlay="1:1"
      />
      
      {/* Малък overlay за debug info */}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>📷 КАМЕРА ТЕСТ</Text>
        {lastScannedCode ? (
          <Text style={styles.overlayText}>Последен код: {lastScannedCode.substring(0, 50)}</Text>
        ) : (
          <Text style={styles.overlayText}>Насочи към QR код</Text>
        )}
        {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default MinimalCameraTest;


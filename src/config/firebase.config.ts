import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// With React Native Firebase, the native configuration (`GoogleService-Info.plist` & `google-services.json`)
// handles the initialization. We just need to import and re-export the modules for easy access.

export { auth, firestore as db, functions }; 
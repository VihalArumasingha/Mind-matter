import Config from 'react-native-config';
import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = (Config.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

import { supabase } from './supabase';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_TOKEN_KEY = '@device_token';

export interface UserDevice {
    device_id: string;
    device_name: string;
    device_token: string;
    last_active: string;
    is_active: boolean;
}

export class DeviceService {
    private static instance: DeviceService;
    private deviceToken: string | null = null;

    private constructor() {}

    static getInstance(): DeviceService {
        if (!DeviceService.instance) {
            DeviceService.instance = new DeviceService();
        }
        return DeviceService.instance;
    }

    async initialize(): Promise<void> {
        // Try to get existing device token
        this.deviceToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
        
        if (!this.deviceToken) {
            // Generate a new device token using uuid
            this.deviceToken = uuidv4();
            await AsyncStorage.setItem(DEVICE_TOKEN_KEY, this.deviceToken);
        }
    }

    async registerDevice(): Promise<string | null> {
        if (!this.deviceToken) {
            await this.initialize();
        }

        try {
            const deviceName = await this.getDeviceName();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user?.id) {
                console.log('No authenticated user found for device registration');
                return null;
            }

            // Generate unique device token for each registration to allow multiple devices
            const uniqueDeviceToken = `${this.deviceToken}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Insert the device with unique token
            const { data: deviceData, error } = await supabase
                .from('user_devices')
                .insert({
                    user_id: user.id,
                    device_name: deviceName,
                    device_token: uniqueDeviceToken,
                    is_active: true,
                    last_active: new Date().toISOString()
                })
                .select('device_id')
                .single();

            if (error) {
                console.error('Error registering device:', error);
                return null;
            }

            console.log('Device registered successfully:', deviceData?.device_id);
            return deviceData?.device_id || null;
        } catch (error) {
            console.error('Error in device registration process:', error);
            return null;
        }
    }

    async getActiveDevices(): Promise<UserDevice[]> {
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('is_active', true)
            .order('last_active', { ascending: false });

        if (error) {
            console.error('Error getting active devices:', error);
            return [];
        }

        return data || [];
    }

    async deactivateDevice(deviceId: string): Promise<boolean> {
        const { error } = await supabase
            .from('user_devices')
            .update({ is_active: false })
            .eq('device_id', deviceId);

        if (error) {
            console.error('Error deactivating device:', error);
            return false;
        }

        return true;
    }

    private async getDeviceName(): Promise<string> {
        const deviceName = Device.deviceName || 'Unknown Device';
        const brand = Device.brand || '';
        const modelName = Device.modelName || '';
        
        return `${deviceName} (${brand} ${modelName})`.trim();
    }

    getDeviceToken(): string | null {
        return this.deviceToken;
    }
}

export const deviceService = DeviceService.getInstance();

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
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.user?.id) {
                console.error('No authenticated user found');
                return null;
            }

            // Try to find existing device
            const { data: existingDevices, error: queryError } = await supabase
                .from('user_devices')
                .select('device_id')
                .eq('device_token', this.deviceToken)
                .eq('user_id', session.user.id);

            if (queryError) {
                console.error('Error querying devices:', queryError);
                return null;
            }

            if (existingDevices && existingDevices.length > 0) {
                // Update existing device
                const { data: updatedDevice, error: updateError } = await supabase
                    .from('user_devices')
                    .update({
                        device_name: deviceName,
                        is_active: true,
                        last_active: new Date().toISOString()
                    })
                    .eq('device_id', existingDevices[0].device_id)
                    .select('device_id')
                    .single();

                if (updateError) {
                    console.error('Error updating device:', updateError);
                    return null;
                }

                return updatedDevice?.device_id || null;
            }

            // Insert new device
            const { data: newDevice, error: insertError } = await supabase
                .from('user_devices')
                .insert({
                    user_id: session.user.id,
                    device_name: deviceName,
                    device_token: this.deviceToken,
                    is_active: true
                })
                .select('device_id')
                .single();

            if (insertError) {
                console.error('Error inserting device:', insertError);
                return null;
            }

            return newDevice?.device_id || null;
        } catch (error) {
            console.error('Error registering device:', error);
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

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import DiseaseScreen from '../screens/DiseaseScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CropClinicScreen from '../screens/CropClinicScreen';
import CropClinicResultScreen from '../screens/CropClinicResultScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen
                name="Disease"
                component={DiseaseScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Community"
                component={CommunityScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="PostDetail"
                component={PostDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="CropClinic"
                component={CropClinicScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="CropClinicResult"
                component={CropClinicResultScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default MainNavigator;

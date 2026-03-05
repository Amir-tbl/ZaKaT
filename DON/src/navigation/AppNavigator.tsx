import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {HomeNavigator} from './HomeNavigator';
import {SubscriptionsNavigator} from './SubscriptionsNavigator';
import {ProfileNavigator} from './ProfileNavigator';
import {RequestNavigator} from './RequestNavigator';
import {TreasuryNavigator} from './TreasuryNavigator';
import {colors} from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Subscriptions: undefined;
  Treasury: undefined;
  Requests: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Math.max(20, insets.bottom + 8),
          height: 60 + Math.max(20, insets.bottom),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Explorer',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsNavigator}
        options={{
          tabBarLabel: 'Suivis',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="heart-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Treasury"
        component={TreasuryNavigator}
        options={{
          tabBarLabel: 'Don',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="treasure-chest" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestNavigator}
        options={{
          tabBarLabel: 'Créer',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

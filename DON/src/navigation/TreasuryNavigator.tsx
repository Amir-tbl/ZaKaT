import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TreasuryScreen} from '../screens/TreasuryScreen';

export type TreasuryStackParamList = {
  TreasuryMain: undefined;
};

const Stack = createNativeStackNavigator<TreasuryStackParamList>();

export function TreasuryNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="TreasuryMain" component={TreasuryScreen} />
    </Stack.Navigator>
  );
}

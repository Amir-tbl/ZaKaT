import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreen} from '../screens/LoginScreen';
import {SignupScreen} from '../screens/SignupScreen';
import {ForgotPasswordScreen} from '../screens/ForgotPasswordScreen';
import {VerifyCodeScreen} from '../screens/VerifyCodeScreen';
import {ResetPasswordScreen} from '../screens/ResetPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyCode: {email: string};
  ResetPassword: {email: string; code: string};
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

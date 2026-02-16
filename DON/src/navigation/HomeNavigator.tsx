import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {RequestDetailScreen} from '../screens/RequestDetailScreen';
import {PostDetailScreen} from '../screens/PostDetailScreen';
import {PdfViewerScreen} from '../screens/PdfViewerScreen';
import {DonateScreen} from '../screens/DonateScreen';
import {OrganizationProfileScreen} from '../screens/OrganizationProfileScreen';
import {MediaViewerScreen} from '../screens/MediaViewerScreen';
import {NotificationsScreen} from '../screens/NotificationsScreen';
import {UserProfileScreen} from '../screens/UserProfileScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  RequestDetail: {requestId: string; from?: 'explorer'};
  PostDetail: {postId: string; from?: 'explorer'};
  PdfViewer: {uri: string; title: string};
  Donate: {
    type: 'treasury' | 'request' | 'organization';
    requestId?: string;
    organizationId?: string;
    organizationName?: string;
  };
  OrganizationProfile: {organizationId: string};
  MediaViewer: {
    media: Array<{id: string; uri: string; type: 'photo' | 'video'; duration?: number}>;
    initialIndex?: number;
  };
  Notifications: undefined;
  UserProfile: {userId: string};
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} options={{animation: 'fade'}} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

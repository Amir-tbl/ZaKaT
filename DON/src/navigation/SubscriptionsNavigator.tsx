import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SubscriptionsScreen} from '../screens/SubscriptionsScreen';
import {PostDetailScreen} from '../screens/PostDetailScreen';
import {RequestDetailScreen} from '../screens/RequestDetailScreen';
import {PdfViewerScreen} from '../screens/PdfViewerScreen';
import {OrganizationProfileScreen} from '../screens/OrganizationProfileScreen';
import {UserProfileScreen} from '../screens/UserProfileScreen';
import {DonateScreen} from '../screens/DonateScreen';
import {MediaViewerScreen} from '../screens/MediaViewerScreen';

export type SubscriptionsStackParamList = {
  SubscriptionsMain: undefined;
  PostDetail: {postId: string; from?: 'subscriptions'};
  RequestDetail: {requestId: string; from?: 'subscriptions'};
  PdfViewer: {uri: string; title: string};
  OrganizationProfile: {organizationId: string};
  UserProfile: {userId: string};
  Donate: {
    type: 'treasury' | 'request' | 'organization';
    requestId?: string;
    organizationId?: string;
    organizationName?: string;
  };
  MediaViewer: {
    media: Array<{id: string; uri: string; type: 'photo' | 'video'; duration?: number}>;
    initialIndex?: number;
  };
};

const Stack = createNativeStackNavigator<SubscriptionsStackParamList>();

export function SubscriptionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SubscriptionsMain" component={SubscriptionsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} options={{animation: 'fade'}} />
    </Stack.Navigator>
  );
}

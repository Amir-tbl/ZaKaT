import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {CreateRequestScreen} from '../screens/CreateRequestScreen';
import {CreatePostScreen} from '../screens/CreatePostScreen';
import {CreateMenuScreen} from '../screens/CreateMenuScreen';
import {RequestDetailScreen} from '../screens/RequestDetailScreen';
import {PostDetailScreen} from '../screens/PostDetailScreen';
import {PdfViewerScreen} from '../screens/PdfViewerScreen';
import {OrganizationProfileScreen} from '../screens/OrganizationProfileScreen';
import {DonateScreen} from '../screens/DonateScreen';
import {MediaViewerScreen} from '../screens/MediaViewerScreen';

export type RequestStackParamList = {
  CreateMenu: {mode?: 'publication' | 'request'};
  CreateRequest: undefined;
  CreatePost: undefined;
  RequestDetail: {requestId: string; from?: 'explorer' | 'requests' | 'profile' | 'notifications'};
  PostDetail: {postId: string; from?: 'explorer' | 'profile' | 'subscriptions'};
  PdfViewer: {uri: string; title: string};
  OrganizationProfile: {organizationId: string};
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

const Stack = createNativeStackNavigator<RequestStackParamList>();

export function RequestNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="CreateMenu" component={CreateMenuScreen} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} options={{animation: 'fade'}} />
    </Stack.Navigator>
  );
}

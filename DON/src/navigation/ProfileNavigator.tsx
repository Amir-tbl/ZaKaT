import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ProfileScreen} from '../screens/ProfileScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {EditProfileScreen} from '../screens/EditProfileScreen';
import {ZakatScreen} from '../screens/ZakatScreen';
import {AboutScreen} from '../screens/AboutScreen';
import {LegalScreen} from '../screens/LegalScreen';
import {AdminScreen} from '../screens/AdminScreen';
import {NotificationsScreen} from '../screens/NotificationsScreen';
import {FollowersScreen} from '../screens/FollowersScreen';
import {FollowingScreen} from '../screens/FollowingScreen';
import {RequestDetailScreen} from '../screens/RequestDetailScreen';
import {PostDetailScreen} from '../screens/PostDetailScreen';
import {PdfViewerScreen} from '../screens/PdfViewerScreen';
import {DonateScreen} from '../screens/DonateScreen';
import {OrganizationProfileScreen} from '../screens/OrganizationProfileScreen';
import {MediaViewerScreen} from '../screens/MediaViewerScreen';
import {DonationHistoryScreen} from '../screens/DonationHistoryScreen';
import {UserProfileScreen} from '../screens/UserProfileScreen';
import {WithdrawScreen} from '../screens/WithdrawScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Zakat: undefined;
  About: undefined;
  Legal: undefined;
  Admin: undefined;
  Notifications: undefined;
  Followers: undefined;
  Following: undefined;
  RequestDetail: {requestId: string; from?: 'profile'};
  PostDetail: {postId: string; from?: 'profile'};
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
  DonationHistory: undefined;
  UserProfile: {userId: string};
  Withdraw: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Zakat" component={ZakatScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Followers" component={FollowersScreen} />
      <Stack.Screen name="Following" component={FollowingScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfileScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} options={{animation: 'fade'}} />
      <Stack.Screen name="DonationHistory" component={DonationHistoryScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
    </Stack.Navigator>
  );
}

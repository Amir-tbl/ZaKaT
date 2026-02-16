import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {WebView} from 'react-native-webview';
import {colors, spacing, typography} from '../theme';

interface Props {
  route: any;
  navigation: any;
}

export function PdfViewerScreen({route, navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {uri, title} = route.params;

  // On Android, use Google Docs viewer as a fallback for PDF rendering
  // On iOS, WebView can render PDFs natively
  const pdfSource =
    Platform.OS === 'android'
      ? {uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`}
      : {uri};

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Document PDF'}
        </Text>
        <View style={{width: 40}} />
      </View>

      {/* PDF Viewer */}
      <WebView
        source={pdfSource}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <MaterialCommunityIcons name="file-pdf-box" size={48} color={colors.error} />
            <Text style={[typography.body, {marginTop: spacing.md}]}>
              Chargement du document...
            </Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.loading}>
            <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
            <Text style={[typography.body, {marginTop: spacing.md}]}>
              Impossible d'afficher ce document
            </Text>
            <Text style={[typography.caption, {marginTop: spacing.sm, textAlign: 'center'}]}>
              Le fichier est stocke localement et sera lisible une fois un backend connecte.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
});

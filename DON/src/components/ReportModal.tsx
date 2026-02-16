import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';
import {
  ReportContentType,
  ReportReason,
  REPORT_REASONS,
  reportService,
} from '../services/report';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
}

export function ReportModal({
  visible,
  onClose,
  contentType,
  contentId,
  reportedUserId,
  reportedUserName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function getTitle() {
    switch (contentType) {
      case 'post':
        return 'Signaler cette publication';
      case 'request':
        return 'Signaler cette demande';
      case 'user':
        return 'Signaler ce profil';
      default:
        return 'Signaler';
    }
  }

  async function handleSubmit() {
    if (!selectedReason) {
      Alert.alert('Erreur', 'Veuillez selectionner une raison');
      return;
    }

    if (selectedReason === 'other' && !message.trim()) {
      Alert.alert('Erreur', 'Veuillez preciser la raison du signalement');
      return;
    }

    setLoading(true);
    try {
      await reportService.create({
        reportedContentId: contentId,
        reportedContentType: contentType,
        reportedUserId,
        reportedUserName,
        reason: selectedReason,
        message: message.trim() || undefined,
      });

      Alert.alert(
        'Signalement envoye',
        'Merci de nous avoir signale ce contenu. Notre equipe va l\'examiner.',
        [{text: 'OK', onPress: handleClose}]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedReason(null);
    setMessage('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{getTitle()}</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Les signalements sont anonymes et seront examines par notre equipe de moderation.
              </Text>
            </View>

            {/* Reason selection */}
            <Text style={styles.sectionTitle}>Pourquoi signalez-vous ?</Text>
            <View style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.value && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}>
                  <View style={styles.reasonContent}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        selectedReason === reason.value && styles.reasonLabelSelected,
                      ]}>
                      {reason.label}
                    </Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedReason === reason.value && styles.radioOuterSelected,
                    ]}>
                    {selectedReason === reason.value && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message input */}
            <Text style={styles.sectionTitle}>
              Details supplementaires {selectedReason === 'other' ? '(requis)' : '(optionnel)'}
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Decrivez le probleme..."
              placeholderTextColor={colors.mutedText}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Submit button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || !selectedReason}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="flag" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Envoyer le signalement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
  },
  content: {
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  reasonList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  reasonLabelSelected: {
    color: colors.primary,
  },
  reasonDescription: {
    ...typography.caption,
    color: colors.mutedText,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  messageInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

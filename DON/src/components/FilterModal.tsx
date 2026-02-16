import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';
import {THEMES} from '../services/themes';

export interface FilterState {
  themes: string[];
  type: 'all' | 'individual' | 'organization';
  urgentOnly: boolean;
  maxAmount: number | null;
  country: string;
}

export const DEFAULT_FILTERS: FilterState = {
  themes: [],
  type: 'all',
  urgentOnly: false,
  maxAmount: null,
  country: '',
};

const AMOUNT_OPTIONS = [
  {label: 'Tous', value: null},
  {label: '< 500 EUR', value: 500},
  {label: '< 1 000 EUR', value: 1000},
  {label: '< 5 000 EUR', value: 5000},
  {label: '< 10 000 EUR', value: 10000},
];

const TYPE_OPTIONS = [
  {label: 'Tous', value: 'all' as const},
  {label: 'Particuliers', value: 'individual' as const},
  {label: 'Associations', value: 'organization' as const},
];

interface Props {
  visible: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export function FilterModal({visible, filters, onApply, onClose}: Props) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<FilterState>(filters);

  function toggleTheme(id: string) {
    setLocal(prev => ({
      ...prev,
      themes: prev.themes.includes(id)
        ? prev.themes.filter(t => t !== id)
        : [...prev.themes, id],
    }));
  }

  function reset() {
    setLocal({...DEFAULT_FILTERS});
  }

  function apply() {
    onApply(local);
    onClose();
  }

  const activeCount =
    local.themes.length +
    (local.type !== 'all' ? 1 : 0) +
    (local.urgentOnly ? 1 : 0) +
    (local.maxAmount !== null ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, {paddingTop: insets.top}]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h3}>Filtres</Text>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Themes */}
          <Text style={styles.sectionTitle}>Themes</Text>
          <View style={styles.chipGrid}>
            {THEMES.map(theme => {
              const active = local.themes.includes(theme.id);
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeChip,
                    active && {backgroundColor: theme.color, borderColor: theme.color},
                  ]}
                  onPress={() => toggleTheme(theme.id)}>
                  <MaterialCommunityIcons
                    name={theme.icon as any}
                    size={16}
                    color={active ? '#fff' : theme.color}
                  />
                  <Text style={[styles.chipText, active && {color: '#fff'}]}>
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Type */}
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.chipGrid}>
            {TYPE_OPTIONS.map(opt => {
              const active = local.type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setLocal(prev => ({...prev, type: opt.value}))}>
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Montant max */}
          <Text style={styles.sectionTitle}>Montant maximum</Text>
          <View style={styles.chipGrid}>
            {AMOUNT_OPTIONS.map(opt => {
              const active = local.maxAmount === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setLocal(prev => ({...prev, maxAmount: opt.value}))}>
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Urgent only */}
          <View style={styles.switchRow}>
            <View>
              <Text style={typography.body}>Urgences uniquement</Text>
              <Text style={typography.caption}>Afficher seulement les demandes urgentes</Text>
            </View>
            <Switch
              value={local.urgentOnly}
              onValueChange={v => setLocal(prev => ({...prev, urgentOnly: v}))}
              trackColor={{false: colors.border, true: colors.warning + '80'}}
              thumbColor={local.urgentOnly ? colors.warning : '#f4f3f4'}
            />
          </View>
        </ScrollView>

        {/* Bottom apply button */}
        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, spacing.lg)}]}>
          <TouchableOpacity style={styles.applyBtn} onPress={apply}>
            <Text style={styles.applyBtnText}>
              Appliquer{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  resetText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.mutedText,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  optionChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.text,
  },
  optionChipTextActive: {
    color: colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});

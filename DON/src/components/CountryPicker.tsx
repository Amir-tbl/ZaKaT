import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';
import {COUNTRIES, Country, getCountryName} from '../services/countries';

interface CountryPickerProps {
  selectedCodes: string[];
  onSelectionChange: (codes: string[]) => void;
  label?: string;
  placeholder?: string;
  minSelection?: number;
}

export function CountryPicker({
  selectedCodes,
  onSelectionChange,
  label,
  placeholder = 'Selectionner des pays',
  minSelection = 0,
}: CountryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function toggleCountry(code: string) {
    if (selectedCodes.includes(code)) {
      onSelectionChange(selectedCodes.filter(c => c !== code));
    } else {
      onSelectionChange([...selectedCodes, code]);
    }
  }

  function removeCountry(code: string) {
    onSelectionChange(selectedCodes.filter(c => c !== code));
  }

  function renderCountryItem({item}: {item: Country}) {
    const isSelected = selectedCodes.includes(item.code);
    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected && styles.countryItemSelected]}
        onPress={() => toggleCountry(item.code)}
        activeOpacity={0.7}>
        <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
          {item.name}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Selected countries as chips */}
      {selectedCodes.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedCodes.map(code => (
            <View key={code} style={styles.chip}>
              <Text style={styles.chipText}>{getCountryName(code)}</Text>
              <TouchableOpacity
                onPress={() => removeCountry(code)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Trigger button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}>
        <MaterialCommunityIcons name="earth" size={20} color={colors.mutedText} />
        <Text style={styles.triggerText}>
          {selectedCodes.length > 0
            ? `${selectedCodes.length} pays selectionne${selectedCodes.length > 1 ? 's' : ''}`
            : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.mutedText} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pays d'intervention</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalDoneBtn}>
              <Text style={styles.modalDoneText}>OK</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un pays..."
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selection info */}
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedCodes.length} pays selectionne{selectedCodes.length > 1 ? 's' : ''}
              {minSelection > 0 && ` (min. ${minSelection})`}
            </Text>
            {selectedCodes.length > 0 && (
              <TouchableOpacity onPress={() => onSelectionChange([])}>
                <Text style={styles.clearAllText}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Country list */}
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.code}
            renderItem={renderCountryItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="map-search" size={48} color={colors.border} />
                <Text style={styles.emptyText}>Aucun pays trouve</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: colors.mutedText,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  chipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
  },
  modalDoneBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectionText: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  clearAllText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryItemSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  countryName: {
    fontSize: 15,
    color: colors.text,
  },
  countryNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.md,
  },
});

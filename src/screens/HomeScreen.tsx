import React, {useEffect, useState, useCallback} from 'react';
import {View, FlatList, StyleSheet, RefreshControl, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  TotalBanner,
  ApplicantCard,
  DonationBottomSheet,
  Loading,
  EmptyState,
} from '../components';
import {useDonationStore, useApplicantStore} from '../store';
import {Applicant} from '../domain/models';
import {formatCentsToEuros} from '../utils';
import {colors, spacing} from '../theme';

type DonationMode = 'treasury' | 'applicant';

export function HomeScreen() {
  const {totalCents, loadTotal, donateToTreasury, distributeToApplicant} =
    useDonationStore();
  const {validatedApplicants, isLoading, loadValidated, refreshApplicant} =
    useApplicantStore();

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null,
  );
  const [showDonationSheet, setShowDonationSheet] = useState(false);
  const [donationMode, setDonationMode] = useState<DonationMode>('treasury');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTotal();
    loadValidated();
  }, [loadTotal, loadValidated]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTotal(), loadValidated()]);
    setRefreshing(false);
  }, [loadTotal, loadValidated]);

  const handleDonateTreasury = () => {
    setDonationMode('treasury');
    setSelectedApplicant(null);
    setShowDonationSheet(true);
  };

  const handleDonateToApplicant = (applicant: Applicant) => {
    setDonationMode('applicant');
    setSelectedApplicant(applicant);
    setShowDonationSheet(true);
  };

  const handleCloseDonationSheet = () => {
    setShowDonationSheet(false);
    setSelectedApplicant(null);
  };

  const handleConfirmDonation = async (
    amountCents: number,
    applicantId: number | null,
  ) => {
    if (donationMode === 'treasury') {
      await donateToTreasury(amountCents);
      Alert.alert('Merci !', `Votre don de ${formatCentsToEuros(amountCents)} a été enregistré.`);
    } else if (applicantId) {
      if (amountCents > totalCents) {
        Alert.alert(
          'Fonds insuffisants',
          'Le trésor ne contient pas assez de fonds pour cette distribution.',
        );
        throw new Error('Fonds insuffisants');
      }
      await distributeToApplicant(applicantId, amountCents);
      await refreshApplicant(applicantId);
      await loadValidated();
    }
  };

  const renderItem = ({item}: {item: Applicant}) => (
    <ApplicantCard applicant={item} onDonate={handleDonateToApplicant} />
  );

  if (isLoading && validatedApplicants.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading message="Chargement des demandes..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={validatedApplicants}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TotalBanner totalCents={totalCents} onDonate={handleDonateTreasury} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-off-outline"
            title="Aucune demande"
            message="Il n'y a pas encore de demandeurs validés."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <DonationBottomSheet
        visible={showDonationSheet}
        applicant={selectedApplicant}
        onClose={handleCloseDonationSheet}
        onConfirm={handleConfirmDonation}
        mode={donationMode === 'treasury' ? 'treasury' : 'distribute'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});

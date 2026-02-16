import {create} from 'zustand';
import {initPaymentSheet, presentPaymentSheet} from '@stripe/stripe-react-native';
import {Donation, CreateDonationInput} from '../domain/models';
import {donationRepository, applicantRepository} from '../db';
import {fetchPaymentSheetParams} from '../services/stripeService';

interface DonationState {
  donations: Donation[];
  totalCents: number;
  isLoading: boolean;
  error: string | null;
  loadDonations: () => Promise<void>;
  loadTotal: () => Promise<void>;
  donateToTreasury: (amountCents: number) => Promise<void>;
  distributeToApplicant: (applicantId: number, amountCents: number) => Promise<void>;
  reset: () => void;
}

export const useDonationStore = create<DonationState>((set, get) => ({
  donations: [],
  totalCents: 0,
  isLoading: false,
  error: null,

  loadDonations: async () => {
    set({isLoading: true, error: null});
    try {
      const donations = await donationRepository.getAll();
      set({donations, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  loadTotal: async () => {
    try {
      const totalDonations = await donationRepository.getTotalAmount();
      const allApplicants = await applicantRepository.getAll();
      const totalDistributed = allApplicants.reduce(
        (sum, a) => sum + a.collectedCents,
        0,
      );
      set({totalCents: totalDonations - totalDistributed});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de calcul du total',
      });
    }
  },

  donateToTreasury: async (amountCents: number) => {
    set({isLoading: true, error: null});
    try {
      // 1. Fetch payment params from backend
      const {
        paymentIntentClientSecret,
        ephemeralKeySecret,
        customerId,
      } = await fetchPaymentSheetParams(amountCents);

      // 2. Initialize the Stripe PaymentSheet
      const {error: initError} = await initPaymentSheet({
        paymentIntentClientSecret,
        customerEphemeralKeySecret: ephemeralKeySecret,
        customerId,
        merchantDisplayName: 'DonApp Zakat',
        appearance: {
          colors: {
            primary: '#0EA5A4',
          },
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present the PaymentSheet to the user
      const {error: presentError} = await presentPaymentSheet();

      if (presentError) {
        // User cancelled — reset loading, return silently
        if (presentError.code === 'Canceled') {
          set({isLoading: false});
          return;
        }
        throw new Error(presentError.message);
      }

      // 4. Payment succeeded — record in SQLite
      await donationRepository.create({amountCents, applicantId: null});
      await get().loadDonations();
      await get().loadTotal();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur lors du don',
        isLoading: false,
      });
      throw err;
    }
  },

  distributeToApplicant: async (applicantId: number, amountCents: number) => {
    set({isLoading: true, error: null});
    try {
      const currentTotal = get().totalCents;
      if (amountCents > currentTotal) {
        throw new Error('Fonds insuffisants dans le trésor');
      }
      await applicantRepository.addCollected(applicantId, amountCents);
      await get().loadTotal();
      set({isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur lors de la distribution',
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => {
    set({
      donations: [],
      totalCents: 0,
      isLoading: false,
      error: null,
    });
  },
}));

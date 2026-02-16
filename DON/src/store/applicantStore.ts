import {create} from 'zustand';
import {Applicant, CreateApplicantInput} from '../domain/models';
import {applicantRepository} from '../db';

interface ApplicantState {
  applicants: Applicant[];
  validatedApplicants: Applicant[];
  pendingApplicants: Applicant[];
  isLoading: boolean;
  error: string | null;
  loadApplicants: () => Promise<void>;
  loadValidated: () => Promise<void>;
  loadPending: () => Promise<void>;
  createApplicant: (input: CreateApplicantInput) => Promise<void>;
  validateApplicant: (id: number) => Promise<void>;
  refreshApplicant: (id: number) => Promise<Applicant | null>;
  reset: () => void;
}

export const useApplicantStore = create<ApplicantState>((set, get) => ({
  applicants: [],
  validatedApplicants: [],
  pendingApplicants: [],
  isLoading: false,
  error: null,

  loadApplicants: async () => {
    set({isLoading: true, error: null});
    try {
      const applicants = await applicantRepository.getAll();
      set({applicants, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  loadValidated: async () => {
    set({isLoading: true, error: null});
    try {
      const validatedApplicants = await applicantRepository.getValidated();
      set({validatedApplicants, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  loadPending: async () => {
    set({isLoading: true, error: null});
    try {
      const pendingApplicants = await applicantRepository.getPending();
      set({pendingApplicants, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  createApplicant: async (input: CreateApplicantInput) => {
    set({isLoading: true, error: null});
    try {
      await applicantRepository.create(input);
      await get().loadApplicants();
      await get().loadPending();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de creation',
        isLoading: false,
      });
      throw err;
    }
  },

  validateApplicant: async (id: number) => {
    set({isLoading: true, error: null});
    try {
      await applicantRepository.validate(id);
      await get().loadApplicants();
      await get().loadValidated();
      await get().loadPending();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de validation',
        isLoading: false,
      });
      throw err;
    }
  },

  refreshApplicant: async (id: number) => {
    try {
      const applicant = await applicantRepository.getById(id);
      if (applicant) {
        set(state => ({
          validatedApplicants: state.validatedApplicants.map(a =>
            a.id === id ? applicant : a,
          ),
          applicants: state.applicants.map(a =>
            a.id === id ? applicant : a,
          ),
        }));
      }
      return applicant;
    } catch {
      return null;
    }
  },

  reset: () => {
    set({
      applicants: [],
      validatedApplicants: [],
      pendingApplicants: [],
      isLoading: false,
      error: null,
    });
  },
}));

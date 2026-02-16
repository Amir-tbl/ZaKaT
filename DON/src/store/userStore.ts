import {create} from 'zustand';
import {User, UpdateUserInput} from '../domain/models';
import {userRepository} from '../db';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAdminMode: boolean;
  loadUser: () => Promise<void>;
  updateUser: (input: UpdateUserInput) => Promise<void>;
  toggleAdminMode: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAdminMode: false,

  loadUser: async () => {
    set({isLoading: true, error: null});
    try {
      const user = await userRepository.get();
      set({user, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  updateUser: async (input: UpdateUserInput) => {
    set({isLoading: true, error: null});
    try {
      await userRepository.update(input);
      await get().loadUser();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erreur de mise a jour',
        isLoading: false,
      });
      throw err;
    }
  },

  toggleAdminMode: () => {
    set(state => ({isAdminMode: !state.isAdminMode}));
  },

  reset: () => {
    set({
      user: null,
      isLoading: false,
      error: null,
      isAdminMode: false,
    });
  },
}));

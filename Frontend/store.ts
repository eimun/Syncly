import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Theme = 'dark' | 'light';

export interface Task {
  id: number;
  title: string;
  status: string;
  progress: string;
  priority: TaskDifficulty;
  xpValue: number;   // maps to xp_reward on the server
}

export interface User {
  uid: string;
  email: string;
  username: string; // maps to display_name on the server
  xp: number;
  level: number;
}

// ── XP helpers ────────────────────────────────────────────────────────────────

export const DIFFICULTY_XP: Record<TaskDifficulty, number> = {
  EASY: 30,
  MEDIUM: 50,
  HARD: 100,
};

const xpForNextLevel = (level: number) => 1000 + (level - 1) * 500;

// ── Store definition ──────────────────────────────────────────────────────────

interface GameState {
  user: User | null;
  theme: Theme;
  currentXp: number;
  nextLevelXp: number;
  level: number;
  tasks: Task[];
}

interface GameActions {
  // Auth
  setUser: (user: User) => void;
  login: (username: string) => void;   // legacy compat — keeps existing screens working
  logout: () => void;
  // Theme
  toggleTheme: () => void;
  // Tasks
  setTasks: (tasks: Task[]) => void;
  addTaskLocally: (task: Task) => void;
  toggleTask: (id: number) => void;
  addTask: (taskName: string, difficulty: TaskDifficulty) => boolean; // legacy compat
  // XP
  addXp: (amount: number) => void;
  removeXp: (amount: number) => void;
  updateXp: (xp: number, level: number) => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      user: null,
      theme: 'dark',
      currentXp: 0,
      nextLevelXp: 1000,
      level: 1,
      tasks: [],

      // ── Auth actions ────────────────────────────────────────────────────────
      setUser: (user) =>
        set({
          user,
          currentXp: user.xp,
          level: user.level,
          nextLevelXp: xpForNextLevel(user.level),
        }),

      // Legacy: used by userAuth screen until Firebase auth replaces it fully
      login: (username) =>
        set({ user: { uid: '', email: '', username, xp: 0, level: 1 } }),

      logout: () =>
        set({ user: null, tasks: [], currentXp: 0, level: 1, nextLevelXp: 1000 }),

      // ── Theme ───────────────────────────────────────────────────────────────
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // ── Tasks ───────────────────────────────────────────────────────────────
      setTasks: (tasks) => set({ tasks }),

      addTaskLocally: (task) =>
        set((s) => ({ tasks: [task, ...s.tasks] })),

      toggleTask: (id) => {
        const { tasks, addXp, removeXp } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const isComp = task.status === 'COMPLETED';
        set({
          tasks: tasks.map((t) =>
            t.id !== id
              ? t
              : {
                  ...t,
                  status: isComp ? 'IN_PROGRESS' : 'COMPLETED',
                  progress: isComp ? '50%' : '100%',
                }
          ),
        });
        if (!isComp) addXp(task.xpValue);
        else removeXp(task.xpValue);
      },

      // Legacy: adds task locally with no API call (works offline too)
      addTask: (taskName, difficulty) => {
        if (!taskName.trim()) return false;
        get().addTaskLocally({
          id: Date.now(),
          title: taskName.toUpperCase().replace(/\s+/g, '_'),
          status: 'PENDING',
          progress: '0%',
          priority: difficulty,
          xpValue: DIFFICULTY_XP[difficulty],
        });
        return true;
      },

      // ── XP ──────────────────────────────────────────────────────────────────
      addXp: (amount) =>
        set((s) => {
          const total = s.currentXp + amount;
          if (total >= s.nextLevelXp) {
            const newLevel = s.level + 1;
            return {
              currentXp: total - s.nextLevelXp,
              level: newLevel,
              nextLevelXp: xpForNextLevel(newLevel),
            };
          }
          return { currentXp: total };
        }),

      removeXp: (amount) =>
        set((s) => ({ currentXp: Math.max(0, s.currentXp - amount) })),

      updateXp: (xp, level) =>
        set({ currentXp: xp, level, nextLevelXp: xpForNextLevel(level) }),
    }),
    {
      name: 'questify-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist auth/theme — tasks are always fetched fresh from the server
      partialize: (s) => ({
        user: s.user,
        theme: s.theme,
        currentXp: s.currentXp,
        level: s.level,
        nextLevelXp: s.nextLevelXp,
      }),
    }
  )
);

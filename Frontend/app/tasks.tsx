import React, { useState } from 'react';
import {
  Text, View, StyleSheet, ScrollView, Pressable,
  Platform, SafeAreaView, Alert, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView, MotiText } from 'moti';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransition } from './_layout';
import { useGameStore, DIFFICULTY_XP } from '../store';
import type { TaskDifficulty } from '../store';
import {
  apiFetchTasks, apiCreateTask, apiUpdateTask, apiDeleteTask,
  apiUpdateUserXp, apiAddXpLog,
} from '../services/api';

export default function TasksScreen() {
  const pathname = usePathname();
  const { navigateWithTransition } = useTransition();
  const { user, currentXp, level, nextLevelXp, addXp, removeXp, theme } = useGameStore();

  const isLight = theme === 'light';
  const localStyles = getStyles(theme);

  const [taskName, setTaskName] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('MEDIUM');

  const qc = useQueryClient();

  // ── Fetch tasks ─────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: apiFetchTasks,
    enabled: !!user,
  });

  // ── Create task ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: ({ title, xp_reward, priority }: { title: string; xp_reward: number; priority: TaskDifficulty }) =>
      apiCreateTask(title, xp_reward, priority),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err: any) => Alert.alert('ERROR', err.message),
  });

  // ── Toggle complete ─────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiUpdateTask(id, status),
    onSuccess: async (updated) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      const xpDelta = updated.xp_reward ?? 0;
      const isNowComplete = updated.status === 'COMPLETED';
      const newXp = isNowComplete
        ? Math.min(currentXp + xpDelta, nextLevelXp)
        : Math.max(0, currentXp - xpDelta);
      const newLevel = isNowComplete && currentXp + xpDelta >= nextLevelXp ? level + 1 : level;
      if (isNowComplete) {
        addXp(xpDelta);
        await Promise.all([
          apiUpdateUserXp(newXp, newLevel).catch(() => null),
          apiAddXpLog(updated.id, xpDelta).catch(() => null),
        ]);
      } else {
        removeXp(xpDelta);
        await apiUpdateUserXp(Math.max(0, currentXp - xpDelta), level).catch(() => null);
      }
    },
    onError: (err: any) => Alert.alert('ERROR', err.message),
  });

  // ── Delete task ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err: any) => Alert.alert('ERROR', err.message),
  });

  const addNewTask = () => {
    if (!taskName.trim()) {
      Alert.alert('INPUT_REQUIRED', 'Objective title cannot be empty.');
      return;
    }
    const title = taskName.toUpperCase().replace(/\s+/g, '_');
    createMutation.mutate({ title, xp_reward: DIFFICULTY_XP[difficulty], priority: difficulty });
    setTaskName('');
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  const SkeletonCard = ({ delay }: { delay: number }) => (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true, delay }}
      style={[localStyles.taskCard, { height: 80 }]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: isLight ? '#FFFFFF' : '#050506' }}>
      <StatusBar style={isLight ? 'dark' : 'light'} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={localStyles.container}>

          {/* Header */}
          <View style={localStyles.headerWrapper}>
            <View style={localStyles.header}>
              <Pressable onPress={() => navigateWithTransition('/', 'zoom')} style={localStyles.backButton}>
                <Text style={localStyles.backText}>{'<'} BACK</Text>
              </Pressable>
              <View>
                <Text style={localStyles.screenTitle}>QUESTS</Text>
                <Text style={localStyles.xpTotalText}>{currentXp} Total XP</Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={localStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Input */}
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={localStyles.textInput}
                placeholder="ACCEPT A QUEST..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={taskName}
                onChangeText={setTaskName}
                autoCapitalize="characters"
              />
              <Pressable
                style={[localStyles.addButtonSmall, createMutation.isPending && { opacity: 0.5 }]}
                onPress={addNewTask}
                disabled={createMutation.isPending}
              >
                <Text style={localStyles.addButtonTextSmall}>EMBARK</Text>
              </Pressable>
            </View>

            {/* Difficulty selector */}
            <View style={localStyles.difficultyRow}>
              {(['EASY', 'MEDIUM', 'HARD'] as TaskDifficulty[]).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setDifficulty(opt)}
                  style={[localStyles.difficultyChip, difficulty === opt && localStyles.difficultyChipActive]}
                >
                  <Text style={[localStyles.difficultyText, difficulty === opt && localStyles.difficultyTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Loading skeletons */}
            {isLoading && [0, 1, 2].map((i) => <SkeletonCard key={i} delay={i * 120} />)}

            {/* Task list */}
            {tasks.map((task, index) => {
              const xpValue = task.xp_reward;
              const isComplete = task.status === 'COMPLETED';
              return (
                <MotiView
                  key={task.id}
                  from={{ opacity: 0, translateY: 16 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 60 }}
                >
                  <Pressable
                    onPress={() =>
                      toggleMutation.mutate({
                        id: task.id,
                        status: isComplete ? 'IN_PROGRESS' : 'COMPLETED',
                      })
                    }
                    onLongPress={() =>
                      Alert.alert('DELETE QUEST', `Remove "${task.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(task.id) },
                      ])
                    }
                    style={[localStyles.taskCard, isComplete && { borderColor: 'rgba(0,255,150,0.3)' }]}
                  >
                    <View style={localStyles.taskHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[localStyles.taskTitle, isComplete && { color: '#00FF96', textDecorationLine: 'line-through' }]}>
                          {task.title}
                        </Text>
                        <Text style={localStyles.xpRewardText}>+{xpValue} XP REWARD</Text>
                      </View>
                      <View style={[localStyles.priorityBadge, isComplete && { borderColor: '#00FF96' }]}>
                        <Text style={[localStyles.priorityText, isComplete && { color: '#00FF96' }]}>
                          {isComplete ? 'CLEARED' : task.priority}
                        </Text>
                      </View>
                    </View>
                    <View style={localStyles.progressBarContainer}>
                      <View style={[
                        localStyles.progressBarFill,
                        { width: task.progress },
                        isComplete && { backgroundColor: '#00FF96' },
                      ]} />
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}

            {!isLoading && tasks.length === 0 && (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 200 }}
                style={{ alignItems: 'center', marginTop: 60 }}>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '800', letterSpacing: 3, fontSize: 12 }}>
                  NO ACTIVE QUESTS
                </Text>
              </MotiView>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Bottom Nav */}
      <View style={localStyles.bottomNav}>
        <Pressable onPress={() => navigateWithTransition('/settings', 'zoom')}>
          <Image style={localStyles.navIcon} source={require('../assets/images/settings.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition('/', 'zoom')}>
          <Image style={[localStyles.navIcon, pathname === '/' && { tintColor: '#FF6500' }]} source={require('../assets/images/Home.png')} />
        </Pressable>
        <Pressable onPress={() => {}}>
          <Image style={[localStyles.navIcon, pathname === '/tasks' && { tintColor: isLight ? '#8000FF' : '#FF6500' }]} source={require('../assets/images/questIcon.png')} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  const primaryText = isLight ? '#000000' : '#FFFFFF';
  const accent = isLight ? '#8000FF' : '#FF6500';
  const bg = isLight ? '#FFFFFF' : '#050506';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    headerWrapper: { paddingTop: Platform.OS === 'ios' ? 10 : 25 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
    backButton: { marginRight: 20 },
    backText: { color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 12 },
    screenTitle: { color: primaryText, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    xpTotalText: { color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { padding: 20, paddingBottom: 120 },
    inputWrapper: { flexDirection: 'row', backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', marginBottom: 15, paddingHorizontal: 12, alignItems: 'center', height: 50 },
    textInput: { flex: 1, color: primaryText, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
    addButtonSmall: { backgroundColor: accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    addButtonTextSmall: { color: isLight ? '#FFFFFF' : '#000000', fontWeight: '900', fontSize: 10 },
    difficultyRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    difficultyChip: { borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' },
    difficultyChipActive: { borderColor: accent, backgroundColor: isLight ? 'rgba(128,0,255,0.1)' : 'rgba(255,101,0,0.2)' },
    difficultyText: { color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    difficultyTextActive: { color: accent },
    taskCard: { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    taskTitle: { color: primaryText, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    xpRewardText: { color: isLight ? 'rgba(128,0,255,0.6)' : 'rgba(255,101,0,0.6)', fontSize: 9, fontWeight: '900', marginTop: 4 },
    priorityBadge: { borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    priorityText: { color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '900' },
    progressBarContainer: { height: 4, backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: accent },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: isLight ? '#F5F5F5' : '#050506', height: 80, width: '100%', borderTopWidth: 1, borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    navIcon: { width: 22, height: 22, tintColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' },
  });
};
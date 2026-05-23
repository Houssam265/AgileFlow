import type { EpicItem, UserStoryItem } from '../types';

export const storyTaskProgress = (story: UserStoryItem) => {
  if (story.taskCount === 0) return 0;
  return Math.round((story.completedTaskCount / story.taskCount) * 100);
};

export const epicPlannedPercent = (epic: EpicItem) => {
  if (epic.storyCount === 0) return 0;
  const planned = epic.plannedStoryCount ?? epic.completedStoryCount;
  return Math.round((planned / epic.storyCount) * 100);
};

export const epicDeliveryPercent = (epic: EpicItem) => {
  if (epic.progressPercent != null) return epic.progressPercent;
  if (epic.storyCount === 0) return 0;
  const done = epic.doneStoryCount ?? 0;
  return Math.round((done / epic.storyCount) * 100);
};

export const sprintUsedPoints = (stories: UserStoryItem[], sprintId: number) =>
  stories
    .filter((s) => s.sprintId === sprintId)
    .reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

import type { PlanDetail } from "backend/contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./session";

export const planKeys = {
  all: ["plans"] as const,
  detail: (planId: string) => ["plans", planId] as const,
};

export function usePlans() {
  const api = useApi();
  return useQuery({ queryKey: planKeys.all, queryFn: api.listPlans });
}

export function usePlan(planId: string) {
  const api = useApi();
  return useQuery({ queryKey: planKeys.detail(planId), queryFn: () => api.getPlan(planId) });
}

export function useProposal() {
  const api = useApi();
  return useMutation({ mutationFn: api.propose });
}

function withActivityCompleted(plan: PlanDetail, activityId: string, completed: boolean): PlanDetail {
  const activities = plan.activities.map((activity) => (activity.id === activityId ? { ...activity, completed } : activity));
  const done = activities.filter((activity) => activity.completed);
  return {
    ...plan,
    activities,
    progress: {
      ...plan.progress,
      completedActivities: done.length,
      completedMinutes: done.reduce((sum, activity) => sum + activity.durationMinutes, 0),
    },
  };
}

/**
 * Marks an Activity at once on screen. Several taps can be in flight together, so each one
 * only ever touches its own Activity, Progress is always recounted from the Activities
 * (a late reply's Progress could be stale), and once the last tap settles the plan is
 * reloaded so the server has the final word.
 */
export function useSetActivityCompleted(planId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const key = planKeys.detail(planId);
  const mutationKey = [...key, "mark"];
  const show = (activityId: string, completed: boolean) =>
    queryClient.setQueryData<PlanDetail>(key, (plan) => plan && withActivityCompleted(plan, activityId, completed));

  return useMutation({
    mutationKey,
    mutationFn: ({ activityId, completed }: { activityId: string; completed: boolean }) =>
      api.setActivityCompleted(planId, activityId, completed),
    onMutate: async ({ activityId, completed }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      show(activityId, completed);
    },
    onError: (_error, { activityId, completed }) => show(activityId, !completed),
    onSuccess: ({ activity }) => show(activity.id, activity.completed),
    onSettled: () => {
      // This mutation still counts as in flight here, so 1 means it is the last one.
      if (queryClient.isMutating({ mutationKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key, exact: true });
      }
      void queryClient.invalidateQueries({ queryKey: planKeys.all, exact: true });
    },
  });
}

export function useDeletePlan(planId: string, onDeleted: () => void) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deletePlan(planId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all, exact: true });
      onDeleted();
    },
  });
}

export function useCreatePlan(onCreated: (plan: PlanDetail) => void) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: planKeys.all, exact: true });
      onCreated(plan);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../lib/orval-fetcher";
import type {
  EmailOut,
  DraftOut,
  AnalyticsOut,
  HistoryItem,
  SenderPreferenceOut,
  ToneRuleOut,
} from "../generated/pyapi/model";

// --- GENERATED TYPES (re-exported for backward compatibility) ---
export type { EmailOut as Email, DraftOut, AnalyticsOut as AnalyticsData, HistoryItem, SimilarEmail } from "../generated/pyapi/model";

/** Backward-compatible alias with narrowed importance literal type */
export type SenderPreference = Omit<SenderPreferenceOut, "importance"> & {
  importance: "high" | "medium" | "low";
};

/** Backward-compatible alias for ToneRuleOut */
export type ToneRule = ToneRuleOut;

// --- HOOKS ---
export function useEmails(filters?: { priority?: string; intent?: string; action?: string; is_read?: boolean }) {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") queryParams.append(k, String(v));
    });
  }
  return useQuery({
    queryKey: ["/pyapi/emails", filters],
    queryFn: () => customFetch<{ emails: EmailOut[]; total: number }>(`/emails?${queryParams.toString()}`),
  });
}

export function useEmail(id: number | null) {
  return useQuery({
    queryKey: ["/pyapi/emails", id],
    queryFn: () => customFetch<EmailOut>(`/emails/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function useSeedData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => customFetch<unknown>("/seed", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useGenerateDraft() {
  return useMutation({
    mutationFn: ({ id, tone_override }: { id: number; tone_override?: string }) =>
      customFetch<DraftOut>(`/emails/${id}/draft`, {
        method: "POST",
        body: JSON.stringify({ tone_override }),
      }),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      user_action,
      final_output,
      tone_used,
      edit_distance,
    }: {
      id: number;
      user_action: string;
      final_output?: string;
      tone_used?: string;
      edit_distance?: number;
    }) =>
      customFetch<unknown>(`/emails/${id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ user_action, final_output, tone_used, edit_distance }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/analytics"] }),
  });
}

// PREFERENCES
export function usePreferences() {
  return useQuery({
    queryKey: ["/pyapi/preferences"],
    queryFn: () => customFetch<SenderPreference[]>("/preferences"),
  });
}

export function useCreatePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SenderPreference>) =>
      customFetch<SenderPreference>("/preferences", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/preferences"] }),
  });
}

export function useUpdatePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SenderPreference> & { id: number }) =>
      customFetch<SenderPreference>(`/preferences/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/preferences"] }),
  });
}

export function useDeletePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customFetch<unknown>(`/preferences/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/preferences"] }),
  });
}

// TONE RULES
export function useToneRules() {
  return useQuery({
    queryKey: ["/pyapi/tone-rules"],
    queryFn: () => customFetch<ToneRule[]>("/tone-rules"),
  });
}

export function useCreateToneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ToneRule>) =>
      customFetch<ToneRule>("/tone-rules", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/tone-rules"] }),
  });
}

export function useUpdateToneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ToneRule> & { id: number }) =>
      customFetch<ToneRule>(`/tone-rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/tone-rules"] }),
  });
}

export function useDeleteToneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customFetch<unknown>(`/tone-rules/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/pyapi/tone-rules"] }),
  });
}

// ANALYTICS
export function useAnalytics() {
  return useQuery({
    queryKey: ["/pyapi/analytics"],
    queryFn: () => customFetch<AnalyticsOut>("/analytics"),
  });
}

// HISTORY
export function useHistory() {
  return useQuery({
    queryKey: ["/pyapi/history"],
    queryFn: () => customFetch<HistoryItem[]>("/history"),
  });
}

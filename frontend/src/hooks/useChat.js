import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteChat, getChat, sendChat } from '../services/chatApi';

export function useChat(repoId) {
  return useQuery({
    queryKey: ['chat', repoId],
    queryFn: () => getChat(repoId),
    enabled: !!repoId,
  });
}

export function useChatActions(repoId) {
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (payload) => sendChat(repoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', repoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteChat(repoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', repoId] });
    },
  });

  return { sendMutation, deleteMutation };
}


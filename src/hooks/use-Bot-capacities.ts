import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

  interface canNotDo{
    id: string;
    title: string;
    description: string | null;
    botId: string;
}  


  interface canDo{
    id: string;
    title: string;
    description: string | null;
    botId: string;
}   


export function useBotCapabilities(botId: string) {
  return useQuery({
    queryKey: ['bot-capabilities', botId],
    queryFn: async () => {
      const response = await api.get<{ 
        canDo: canDo[], 
        canNotDo: canNotDo[] 
      }>(`/bots/${botId}/capabilities`);
      return response.data;
    },
    enabled: !!botId,
  });
}
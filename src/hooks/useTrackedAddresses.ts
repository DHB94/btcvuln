import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrackedAddress {
  id: string;
  address: string;
  first_seen: string;
  last_seen: string;
  transaction_count: number;
  total_received: number;
  total_sent: number;
  balance: number;
  risk_score: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

const SATOSHIS_PER_BTC = 100_000_000;

const estimateRiskScore = (chainStats: {
  funded_txo_count: number;
  spent_txo_count: number;
  tx_count: number;
}) => {
  let score = 0;
  if (chainStats.tx_count > 500) score += 30;
  else if (chainStats.tx_count > 100) score += 20;
  else if (chainStats.tx_count > 30) score += 10;

  if (chainStats.spent_txo_count > chainStats.funded_txo_count * 0.9) score += 25;
  if (chainStats.funded_txo_count > 1000) score += 25;

  return Math.min(score, 100);
};

export const useTrackedAddresses = () => {
  return useQuery({
    queryKey: ['tracked-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrackedAddress[];
    },
    refetchInterval: 10000,
  });
};

export const useAddTrackedAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address }: { address: string; label?: string }) => {
      const normalizedAddress = address.trim();
      const response = await fetch(`https://blockstream.info/api/address/${normalizedAddress}`);
      if (!response.ok) {
        throw new Error('Unable to fetch live address stats. Verify the Bitcoin address and try again.');
      }

      const payload = await response.json();
      const chainStats = payload.chain_stats ?? {};
      const mempoolStats = payload.mempool_stats ?? {};
      const funded = Number(chainStats.funded_txo_sum || 0) + Number(mempoolStats.funded_txo_sum || 0);
      const spent = Number(chainStats.spent_txo_sum || 0) + Number(mempoolStats.spent_txo_sum || 0);
      const txCount = Number(chainStats.tx_count || 0) + Number(mempoolStats.tx_count || 0);

      const liveData = {
        address: normalizedAddress,
        balance: (funded - spent) / SATOSHIS_PER_BTC,
        transaction_count: txCount,
        total_received: funded / SATOSHIS_PER_BTC,
        total_sent: spent / SATOSHIS_PER_BTC,
        risk_score: estimateRiskScore({
          funded_txo_count: Number(chainStats.funded_txo_count || 0),
          spent_txo_count: Number(chainStats.spent_txo_count || 0),
          tx_count: txCount,
        }),
        is_flagged: txCount > 1000 || spent > funded * 0.95,
      };

      const { data, error } = await supabase.from('tracked_addresses').insert([liveData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-addresses'] });
    },
  });
};

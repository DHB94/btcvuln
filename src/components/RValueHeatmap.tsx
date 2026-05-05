import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RValueMatch {
  id: string;
  r_value: string;
  txid_1: string;
  txid_2: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  private_key_recovered: boolean | null;
  private_key_hex: string | null;
  private_key_wif: string | null;
  created_at: string;
}

const RValueHeatmap = () => {
  const { data: matches = [] } = useQuery({
    queryKey: ['r-value-matches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('r_value_matches').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data as RValueMatch[];
    },
    refetchInterval: 5000,
  });

  const formatTimeAgo = (date: string) => {
    const diffInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (<div className="space-y-6">
    <Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white flex items-center"><Shield className="mr-2 h-5 w-5 text-red-400" />ECDSA R-Value Reuse Detection</CardTitle></CardHeader><CardContent><div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"><div className="flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-amber-400" /><span className="text-amber-200 text-sm">Displaying live r-value reuse matches from stored scan results.</span></div></div></CardContent></Card>
    <Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white">R-Value Reuse Matches</CardTitle></CardHeader><CardContent><ScrollArea className="h-96"><div className="space-y-4">{matches.length === 0 ? <div className="text-center py-8 text-slate-400"><Shield className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No R-value reuse detected yet</p></div> : matches.map((match) => <div key={match.id} className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg"><div className="flex items-start justify-between mb-3"><div className="flex items-center space-x-2"><Badge className={`${match.severity === 'critical' ? 'bg-red-600' : 'bg-amber-500'} text-white text-xs`}>{match.severity.toUpperCase()}</Badge>{match.private_key_recovered && <Badge variant="destructive" className="text-xs">PRIVATE KEY RECOVERED</Badge>}</div><span className="text-xs text-slate-400">{formatTimeAgo(match.created_at)}</span></div><div className="text-xs font-mono text-slate-200 bg-slate-800 p-2 rounded break-all mb-2">{match.r_value}</div><div className="text-xs text-slate-300">TX 1: <span className="font-mono break-all">{match.txid_1}</span></div><div className="text-xs text-slate-300">TX 2: <span className="font-mono break-all">{match.txid_2}</span></div>{match.private_key_hex && <div className="mt-2 text-xs text-purple-200 font-mono break-all">{match.private_key_hex}</div>}</div>)}</div></ScrollArea></CardContent></Card>
  </div>);
};

export default RValueHeatmap;

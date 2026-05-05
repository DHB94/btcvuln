import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Calendar, Filter } from 'lucide-react';

interface SearchResult { txid: string; block: number; timestamp: Date; inputCount: number; outputCount: number; fee: number; size: number; vulnerabilities: string[]; riskScore: number; }

const TransactionSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [blockRangeStart, setBlockRangeStart] = useState('');
  const [blockRangeEnd, setBlockRangeEnd] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const normalize = (tx: any): SearchResult => ({
    txid: tx.txid,
    block: tx.status?.block_height || 0,
    timestamp: new Date((tx.status?.block_time || Math.floor(Date.now() / 1000)) * 1000),
    inputCount: tx.vin?.length || 0,
    outputCount: tx.vout?.length || 0,
    fee: (tx.fee || 0) / 100000000,
    size: tx.size || 0,
    vulnerabilities: [],
    riskScore: tx.fee > 20000 ? 6 : 3,
  });

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const query = searchQuery.trim();
      const txRes = await fetch(`https://blockstream.info/api/tx/${query}`);
      if (txRes.ok) {
        setResults([normalize(await txRes.json())]);
        return;
      }
      const addressRes = await fetch(`https://blockstream.info/api/address/${query}/txs`);
      if (addressRes.ok) {
        const txs = await addressRes.json();
        setResults((txs || []).slice(0, 25).map(normalize));
        return;
      }
      setResults([]);
    } finally { setIsSearching(false); }
  };

  const handleBlockRangeSearch = async () => {
    if (!blockRangeStart || !blockRangeEnd) return;
    setIsSearching(true);
    try {
      const start = parseInt(blockRangeStart, 10);
      const end = parseInt(blockRangeEnd, 10);
      const out: SearchResult[] = [];
      for (let h = start; h <= end && h < start + 20; h++) {
        const hashRes = await fetch(`https://blockstream.info/api/block-height/${h}`);
        if (!hashRes.ok) continue;
        const hash = await hashRes.text();
        const txsRes = await fetch(`https://blockstream.info/api/block/${hash}/txs/0`);
        if (!txsRes.ok) continue;
        const txs = await txsRes.json();
        out.push(...(txs || []).slice(0, 10).map(normalize));
      }
      setResults(out);
    } finally { setIsSearching(false); }
  };

  const getRiskColor = (score: number) => score >= 8 ? 'bg-red-600' : score >= 6 ? 'bg-amber-500' : score >= 4 ? 'bg-blue-500' : 'bg-green-600';
  const formatTimeAgo = (date: Date) => `${Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000))}m ago`;

  return (<div className="space-y-6">{/* UI unchanged mostly */}
    <Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white flex items-center"><Search className="mr-2 h-5 w-5" />Transaction Search & Historical Analysis</CardTitle></CardHeader><CardContent><Tabs defaultValue="txid" className="w-full"><TabsList className="grid w-full grid-cols-2 bg-slate-700"><TabsTrigger value="txid" className="text-slate-300 data-[state=active]:text-white">Transaction ID / Address</TabsTrigger><TabsTrigger value="blocks" className="text-slate-300 data-[state=active]:text-white">Block Range Search</TabsTrigger></TabsList><TabsContent value="txid" className="space-y-4"><div className="flex space-x-2"><Input placeholder="Enter TXID or address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-700 border-slate-600 text-white flex-1" /><Button onClick={handleSearch} disabled={!searchQuery || isSearching} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"><Search className="mr-2 h-4 w-4" />{isSearching ? 'Searching...' : 'Search'}</Button></div></TabsContent><TabsContent value="blocks" className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Input placeholder="Start block height" value={blockRangeStart} onChange={(e) => setBlockRangeStart(e.target.value)} className="bg-slate-700 border-slate-600 text-white" type="number" /><Input placeholder="End block height" value={blockRangeEnd} onChange={(e) => setBlockRangeEnd(e.target.value)} className="bg-slate-700 border-slate-600 text-white" type="number" /><Button onClick={handleBlockRangeSearch} disabled={!blockRangeStart || !blockRangeEnd || isSearching} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"><Calendar className="mr-2 h-4 w-4" />{isSearching ? 'Scanning...' : 'Scan Range'}</Button></div></TabsContent></Tabs></CardContent></Card>
    {results.length > 0 && <Card className="bg-slate-800/50 border-slate-700"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white">Search Results ({results.length})</CardTitle><div className="flex space-x-2"><Button variant="outline" size="sm" className="text-slate-300 border-slate-600"><Filter className="mr-2 h-4 w-4" />Filter</Button><Button variant="outline" size="sm" className="text-slate-300 border-slate-600"><Download className="mr-2 h-4 w-4" />Export</Button></div></div></CardHeader><CardContent><ScrollArea className="h-96"><div className="space-y-4">{results.map((result) => <div key={result.txid} className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg"><div className="flex items-start justify-between mb-3"><div className="flex items-center space-x-2"><Badge className={`${getRiskColor(result.riskScore)} text-white text-xs`}>Risk: {result.riskScore}/10</Badge><Badge variant="outline" className="text-xs">Block {result.block.toLocaleString()}</Badge></div><span className="text-xs text-slate-400">{formatTimeAgo(result.timestamp)}</span></div><div className="text-xs font-mono text-slate-200 bg-slate-800 p-2 rounded break-all">{result.txid}</div></div>)}</div></ScrollArea></CardContent></Card>}
  </div>);
};

export default TransactionSearch;

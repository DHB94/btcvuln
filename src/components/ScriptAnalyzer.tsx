import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Code, AlertTriangle, CheckCircle } from 'lucide-react';
import { BitcoinTransactionParser } from '@/utils/bitcoinParser';
import { VulnerabilityScanner } from '@/utils/vulnerabilityScanner';

const ScriptAnalyzer = () => {
  const [txid, setTxid] = useState('');
  const [rawHex, setRawHex] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!txid && !rawHex) return;
    setIsAnalyzing(true);

    try {
      const txHex = rawHex.trim() || await (await fetch(`https://blockstream.info/api/tx/${txid.trim()}/hex`)).text();
      const parsed = BitcoinTransactionParser.parseRawTransaction(txHex);
      const vulnerabilities = await VulnerabilityScanner.scanTransaction(parsed);

      setAnalysis({
        txid: parsed.txid,
        inputs: parsed.inputs.map((input: any) => ({
          scriptSig: input.scriptSig,
          decodedScript: input.decodedScript || [],
          type: 'INPUT',
          vulnerabilities: vulnerabilities
            .filter((v) => v.affectedInputs?.includes(parsed.inputs.indexOf(input)))
            .map((v) => v.description),
          severity: vulnerabilities.some((v) => v.affectedInputs?.includes(parsed.inputs.indexOf(input)) && v.severity === 'critical')
            ? 'critical' : 'safe',
        })),
        outputs: parsed.outputs.map((output: any) => ({
          scriptPubKey: output.scriptPubKey,
          decodedScript: output.decodedScript || [],
          type: output.type,
          vulnerabilities: vulnerabilities
            .filter((v) => v.affectedOutputs?.includes(parsed.outputs.indexOf(output)))
            .map((v) => v.description),
          severity: vulnerabilities.some((v) => v.affectedOutputs?.includes(parsed.outputs.indexOf(output)) && ['critical', 'high'].includes(v.severity))
            ? 'high' : 'safe',
        })),
        overallRisk: vulnerabilities.some((v) => v.severity === 'critical') ? 'critical' : vulnerabilities.length ? 'high' : 'safe',
        recommendations: vulnerabilities.length
          ? vulnerabilities.map((v) => v.description)
          : ['No immediate script-level vulnerabilities detected.'],
      });
    } catch (error) {
      setAnalysis(null);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => ({ critical: 'bg-red-600', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-green-600', safe: 'bg-gray-600' }[severity] || 'bg-gray-500');

  return <div className="space-y-6">{/* unchanged UI */}
    <Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white flex items-center"><Code className="mr-2 h-5 w-5" />Bitcoin Script Analyzer & Disassembler</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-sm text-slate-300 mb-2 block">Transaction ID</label><Input placeholder="Enter TXID to analyze..." value={txid} onChange={(e) => setTxid(e.target.value)} className="bg-slate-700 border-slate-600 text-white" /></div><div><label className="text-sm text-slate-300 mb-2 block">Or Raw Transaction Hex</label><Textarea placeholder="Paste raw transaction hex..." value={rawHex} onChange={(e) => setRawHex(e.target.value)} className="bg-slate-700 border-slate-600 text-white" /></div></div><Button onClick={handleAnalyze} disabled={(!txid && !rawHex) || isAnalyzing} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"><Search className="mr-2 h-4 w-4" />{isAnalyzing ? 'Analyzing...' : 'Analyze Transaction'}</Button></CardContent></Card>

    {analysis && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white text-lg">Input Scripts (scriptSig)</CardTitle></CardHeader><CardContent><ScrollArea className="h-64"><div className="space-y-4">{analysis.inputs.map((input: any, index: number) => <div key={index} className="p-3 bg-slate-700/30 rounded-lg"><div className="flex items-center justify-between mb-2"><Badge variant="outline" className="text-xs">Input #{index + 1}</Badge><Badge className={`${getSeverityColor(input.severity)} text-white text-xs`}>{input.severity.toUpperCase()}</Badge></div><div className="text-xs text-slate-300 font-mono mb-2 break-all">{input.scriptSig}</div>{input.vulnerabilities.length > 0 && input.vulnerabilities.map((v: string, i: number) => <div key={i} className="flex items-center text-red-400 text-xs"><AlertTriangle className="mr-1 h-3 w-3" />{v}</div>)}</div>)}</div></ScrollArea></CardContent></Card>
    <Card className="bg-slate-800/50 border-slate-700"><CardHeader><CardTitle className="text-white text-lg">Output Scripts (scriptPubKey)</CardTitle></CardHeader><CardContent><ScrollArea className="h-64"><div className="space-y-4">{analysis.outputs.map((output: any, index: number) => <div key={index} className="p-3 bg-slate-700/30 rounded-lg"><div className="flex items-center justify-between mb-2"><Badge variant="outline" className="text-xs">Output #{index + 1} - {output.type}</Badge><Badge className={`${getSeverityColor(output.severity)} text-white text-xs`}>{output.severity.toUpperCase()}</Badge></div><div className="text-xs text-slate-300 font-mono mb-2 break-all">{output.scriptPubKey}</div>{output.vulnerabilities.length > 0 ? output.vulnerabilities.map((v: string, i: number) => <div key={i} className="flex items-center text-amber-400 text-xs"><AlertTriangle className="mr-1 h-3 w-3" />{v}</div>) : <div className="flex items-center text-green-400 text-xs mt-2"><CheckCircle className="mr-1 h-3 w-3" />No vulnerabilities detected</div>}</div>)}</div></ScrollArea></CardContent></Card></div>}
  </div>;
};

export default ScriptAnalyzer;

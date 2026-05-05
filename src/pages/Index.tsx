
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, Activity, Database, Download } from 'lucide-react';
import VulnerabilityFeed from '@/components/VulnerabilityFeed';
import ScriptAnalyzer from '@/components/ScriptAnalyzer';
import AddressTracker from '@/components/AddressTracker';
import RValueHeatmap from '@/components/RValueHeatmap';
import TransactionSearch from '@/components/TransactionSearch';
import DashboardStats from '@/components/DashboardStats';

const Index = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress] = useState(100);
  const [currentBlock] = useState(870000);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">BTCVulnScan</h1>
                <p className="text-sm text-slate-400">Bitcoin Blockchain Vulnerability Scanner</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Activity className="h-4 w-4 text-green-400" />
                <span>Block {currentBlock.toLocaleString()}</span>
              </div>
              <Badge variant={isScanning ? "default" : "secondary"} className="bg-green-600">
                {isScanning ? "Live Scanning" : "Paused"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Real-time Status Bar */}
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            <div className="flex items-center justify-between">
              <span>Scanning mempool and latest blocks for vulnerabilities...</span>
              <div className="flex items-center space-x-2">
                <Progress value={scanProgress} className="w-32 h-2" />
                <span className="text-xs">{scanProgress}%</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
            <TabsTrigger value="dashboard" className="text-slate-300 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="text-slate-300 data-[state=active]:text-white">
              Script Analyzer
            </TabsTrigger>
            <TabsTrigger value="addresses" className="text-slate-300 data-[state=active]:text-white">
              Address Tracker
            </TabsTrigger>
            <TabsTrigger value="rvalues" className="text-slate-300 data-[state=active]:text-white">
              R-Value Analysis
            </TabsTrigger>
            <TabsTrigger value="search" className="text-slate-300 data-[state=active]:text-white">
              Transaction Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VulnerabilityFeed />
              </div>
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-300">Recent Alerts are sourced directly from the Live Vulnerability Feed on the left.</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Database className="mr-2 h-5 w-5" />
                      Export Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Export Vulnerabilities (CSV)
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Export Analysis (JSON)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="mt-6">
            <ScriptAnalyzer />
          </TabsContent>

          <TabsContent value="addresses" className="mt-6">
            <AddressTracker />
          </TabsContent>

          <TabsContent value="rvalues" className="mt-6">
            <RValueHeatmap />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <TransactionSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Terminal, 
  Link2, 
  Copy, 
  Check, 
  Monitor, 
  Server,
  Shield
} from 'lucide-react';

// Custom Apple icon (official style)
const AppleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 384 512"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function AgentDownload() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [deviceName, setDeviceName] = React.useState('');
  const [selectedOS, setSelectedOS] = React.useState<'windows' | 'linux' | 'mac'>('windows');
  const user = auth.currentUser;

  const userId = user?.uid || 'YOUR_USER_ID';
  const baseUrl = 'https://github.com/JessiJC44/HypeRMM/releases/latest/download';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const windowsCommand = `powershell -ExecutionPolicy Bypass -Command "& {Invoke-WebRequest -Uri '${baseUrl}/hyperemote-agent-windows.exe' -OutFile agent.exe; .\\agent.exe '${userId}' '${deviceName || '$env:COMPUTERNAME'}'}"`;
  
  const linuxCommand = `curl -sSL ${baseUrl}/hyperemote-agent-linux -o agent && chmod +x agent && ./agent "${userId}" "${deviceName || '$(hostname)'}"`;
  
  const macCommand = `curl -sSL ${baseUrl}/hyperemote-agent-mac-arm -o agent && chmod +x agent && ./agent "${userId}" "${deviceName || '$(hostname)'}"`;

  const macIntelCommand = `curl -sSL ${baseUrl}/hyperemote-agent-mac-intel -o agent && chmod +x agent && ./agent "${userId}" "${deviceName || '$(hostname)'}"`;

  const getShareLink = () => {
    switch (selectedOS) {
      case 'windows':
        return `${baseUrl}/hyperemote-agent-windows.exe`;
      case 'linux':
        return `${baseUrl}/hyperemote-agent-linux`;
      case 'mac':
        return `${baseUrl}/hyperemote-agent-mac-arm`;
      default:
        return `${baseUrl}/hyperemote-agent-windows.exe`;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 bg-background min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold">Install Agent</h1>
        <p className="text-muted-foreground">Deploy the HypeRemote agent on devices you want to manage</p>
      </motion.div>

      {/* Device Name Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Configuration</CardTitle>
          <CardDescription>Optionally set a custom name for the device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Device name (optional)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield size={16} />
              <span>Your ID: <code className="bg-muted px-2 py-0.5 rounded text-xs">{userId}</code></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Methods */}
      <Tabs 
        defaultValue="windows" 
        className="space-y-4"
        onValueChange={(value) => setSelectedOS(value as 'windows' | 'linux' | 'mac')}
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="windows" className="gap-2">
            <Monitor size={16} />
            Windows
          </TabsTrigger>
          <TabsTrigger value="linux" className="gap-2">
            <Server size={16} />
            Linux
          </TabsTrigger>
          <TabsTrigger value="mac" className="gap-2">
            <AppleIcon size={16} />
            macOS
          </TabsTrigger>
        </TabsList>

        {/* Windows */}
        <TabsContent value="windows" className="h-[200px] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  <CardTitle className="text-base">Download Installer</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 py-3">
                <Button 
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-windows.exe`, '_blank')}
                >
                  <Download size={16} />
                  Download HypeRemote-Agent.exe
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Windows 10/11 x64 • Run: <code className="bg-muted px-1 rounded">agent.exe {userId}</code>
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <CardTitle className="text-base">PowerShell Command</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[80px]">
                    {windowsCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(windowsCommand, 'windows')}
                  >
                    {copied === 'windows' ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Linux */}
        <TabsContent value="linux" className="h-[200px] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <CardTitle className="text-base">Install Command</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[80px]">
                    {linuxCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(linuxCommand, 'linux')}
                  >
                    {copied === 'linux' ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  <CardTitle className="text-base">Manual Download</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 py-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-linux`, '_blank')}
                >
                  <Download size={16} />
                  Download Linux Binary (x64)
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Debian, Ubuntu, RHEL, Fedora, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* macOS */}
        <TabsContent value="mac" className="h-[200px] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <CardTitle className="text-base">Install Command (M series)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[80px]">
                    {macCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(macCommand, 'mac-arm')}
                  >
                    {copied === 'mac-arm' ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <CardTitle className="text-base">Install Command (Intel)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[80px]">
                    {macIntelCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(macIntelCommand, 'mac-intel')}
                  >
                    {copied === 'mac-intel' ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  <CardTitle className="text-base">Direct Downloads</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap py-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-mac-arm`, '_blank')}
                >
                  <Download size={16} />
                  M series (ARM)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-mac-intel`, '_blank')}
                >
                  <Download size={16} />
                  Intel (x64)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-primary" />
            <CardTitle className="text-lg">Share Installation Link</CardTitle>
          </div>
          <CardDescription>
            Send this link to users to install the agent ({selectedOS === 'windows' ? 'Windows' : selectedOS === 'linux' ? 'Linux' : 'macOS'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={getShareLink()}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(getShareLink(), 'link')}
            >
              {copied === 'link' ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            After download, user runs: <code className="bg-muted px-1 rounded">agent.exe {userId}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

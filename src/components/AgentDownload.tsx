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

// Custom Apple icon (full apple, not bitten)
const AppleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.15-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 1.97-1.1 3.1 1.16.09 2.32-.68 3.05-1.51z"/>
  </svg>
);
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function AgentDownload() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [deviceName, setDeviceName] = React.useState('');
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
      <Tabs defaultValue="windows" className="space-y-4 min-h-[500px]">
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
        <TabsContent value="windows">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download size={20} className="text-primary" />
                  <CardTitle className="text-lg">Download Installer</CardTitle>
                </div>
                <CardDescription>Download and run the Windows installer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-windows.exe`, '_blank')}
                >
                  <Download size={18} />
                  Download HypeRemote-Agent.exe
                </Button>
                <p className="text-xs text-muted-foreground">
                  Windows 10/11 x64 • After download, run: <code className="bg-muted px-1 rounded">agent.exe {userId}</code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={20} className="text-primary" />
                  <CardTitle className="text-lg">PowerShell Command</CardTitle>
                </div>
                <CardDescription>Run this command in PowerShell (Admin)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {windowsCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(windowsCommand, 'windows')}
                  >
                    {copied === 'windows' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Linux */}
        <TabsContent value="linux">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={20} className="text-primary" />
                  <CardTitle className="text-lg">Install Command</CardTitle>
                </div>
                <CardDescription>Run this command in terminal (one-liner)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {linuxCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(linuxCommand, 'linux')}
                  >
                    {copied === 'linux' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download size={20} className="text-primary" />
                  <CardTitle className="text-lg">Manual Download</CardTitle>
                </div>
                <CardDescription>Download the binary directly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-linux`, '_blank')}
                >
                  <Download size={18} />
                  Download Linux Binary (x64)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Debian, Ubuntu, RHEL, Fedora, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* macOS */}
        <TabsContent value="mac">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={20} className="text-primary" />
                  <CardTitle className="text-lg">Install Command (M series)</CardTitle>
                </div>
                <CardDescription>For Apple Silicon (M1, M2, M3, M4...)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {macCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(macCommand, 'mac-arm')}
                  >
                    {copied === 'mac-arm' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={20} className="text-primary" />
                  <CardTitle className="text-lg">Install Command (Intel)</CardTitle>
                </div>
                <CardDescription>For older Intel-based Macs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {macIntelCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(macIntelCommand, 'mac-intel')}
                  >
                    {copied === 'mac-intel' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download size={20} className="text-primary" />
                  <CardTitle className="text-lg">Direct Downloads</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-mac-arm`, '_blank')}
                >
                  <Download size={18} />
                  Download for M series (ARM)
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open(`${baseUrl}/hyperemote-agent-mac-intel`, '_blank')}
                >
                  <Download size={18} />
                  Download for Intel (x64)
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
          <CardDescription>Send this link to users to install the agent on their devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${baseUrl}/hyperemote-agent-windows.exe`}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(`${baseUrl}/hyperemote-agent-windows.exe`, 'link')}
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

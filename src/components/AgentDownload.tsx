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
  Apple, 
  Server,
  Shield
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function AgentDownload() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [deviceName, setDeviceName] = React.useState('');
  const user = auth.currentUser;

  const userId = user?.uid || 'YOUR_USER_ID';
  const baseUrl = 'https://get.hyperemote.com'; // Replace with your actual URL

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const windowsCommand = `powershell -ExecutionPolicy Bypass -Command "& {Invoke-WebRequest -Uri '${baseUrl}/install.ps1' -OutFile install.ps1; .\\install.ps1 -UserID '${userId}' -DeviceName '${deviceName || '$env:COMPUTERNAME'}'}"`;
  
  const linuxCommand = `curl -sSL ${baseUrl}/install.sh | sudo bash -s -- --user-id "${userId}" --name "${deviceName || '$(hostname)'}"`;
  
  const macCommand = `curl -sSL ${baseUrl}/install-mac.sh | bash -s -- --user-id "${userId}" --name "${deviceName || '$(hostname)'}"`;

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
          <div className="flex gap-4">
            <Input
              placeholder="Device name (optional)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield size={16} />
              <span>Your ID: <code className="bg-muted px-2 py-0.5 rounded">{userId.slice(0, 8)}...</code></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Methods */}
      <Tabs defaultValue="windows" className="space-y-4">
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
            <Apple size={16} />
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
              <CardContent>
                <Button className="w-full gap-2">
                  <Download size={18} />
                  Download HypeRemote-Agent.exe
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Size: ~8 MB | Windows 10/11 x64
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
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {windowsCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(windowsCommand, 'windows')}
                  >
                    {copied === 'windows' ? <Check size={14} /> : <Copy size={14} />}
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
                <CardDescription>Run this command in terminal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {linuxCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(linuxCommand, 'linux')}
                  >
                    {copied === 'linux' ? <Check size={14} /> : <Copy size={14} />}
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
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full gap-2">
                  <Download size={18} />
                  Download .deb (Debian/Ubuntu)
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Download size={18} />
                  Download .rpm (RHEL/Fedora)
                </Button>
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
                  <CardTitle className="text-lg">Install Command</CardTitle>
                </div>
                <CardDescription>Run this command in Terminal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {macCommand}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/10 hover:bg-white/20"
                    onClick={() => copyToClipboard(macCommand, 'mac')}
                  >
                    {copied === 'mac' ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download size={20} className="text-primary" />
                  <CardTitle className="text-lg">Download App</CardTitle>
                </div>
                <CardDescription>Download the macOS application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full gap-2">
                  <Download size={18} />
                  Download for Apple Silicon (M1/M2)
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Download size={18} />
                  Download for Intel
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
              value={`${baseUrl}/install/${userId}`}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(`${baseUrl}/install/${userId}`, 'link')}
            >
              {copied === 'link' ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

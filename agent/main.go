package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"strings"
	"time"

	"github.com/go-ping/ping"
	"github.com/grandcat/zeroconf"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

const (
	VERSION               = "1.0.0"
	HEARTBEAT_INTERVAL    = 30 * time.Second
	COMMAND_POLL_INTERVAL = 5 * time.Second
)

type Device struct {
	ID           string `json:"id,omitempty"`
	Name         string `json:"name"`
	UserID       string `json:"user_id"`
	OS           string `json:"os"`
	Hostname     string `json:"hostname"`
	IPAddress    string `json:"ip_address"`
	PublicIP     string `json:"public_ip"`
	Status       string `json:"status"`
	CPU          string `json:"cpu"`
	RAMTotal     int64  `json:"ram_total"`
	RAMUsed      int64  `json:"ram_used"`
	DiskTotal    int64  `json:"disk_total"`
	DiskUsed     int64  `json:"disk_used"`
	AgentVersion string `json:"agent_version"`
	LastSeen     string `json:"last_seen"`
}

type Command struct {
	ID          string `json:"id"`
	DeviceID    string `json:"device_id"`
	UserID      string `json:"user_id"`
	CommandType string `json:"command_type"`
	Payload     string `json:"payload"`
	Status      string `json:"status"`
	Result      string `json:"result"`
}

type Config struct {
	DeviceID  string `json:"device_id"`
	FluxID    string `json:"flux_id"`
	AgentJWT  string `json:"agent_jwt"`
	ServerURL string `json:"server_url"`
}

var config Config
var configPath string

func main() {
	log.Println("HypeRemote Agent v" + VERSION + " starting...")

	// Set config path based on OS
	switch runtime.GOOS {
	case "windows":
		configPath = os.Getenv("ProgramData") + "\\HypeRemote\\config.json"
	default:
		configPath = "/etc/hyperemote/config.json"
	}

	// Load existing config
	loadConfig()

	// Handle CLI arguments
	if len(os.Args) > 1 {
		if os.Args[1] == "--enroll" {
			if len(os.Args) < 4 {
				log.Fatal("Usage: hyperemote-agent --enroll <server_url> <token>")
			}
			enrollDevice(os.Args[2], os.Args[3])
		}
	}

	// If not enrolled, die
	if config.AgentJWT == "" {
		log.Println("Agent not enrolled. Use --enroll <server_url> <token> to register.")
		return
	}

	// Start background tasks
	go heartbeatLoop()
	go commandPollLoop()

	// Keep running
	select {}
}

func enrollDevice(serverURL, token string) {
	log.Println("Enrolling device with token...")

	hostInfo, _ := host.Info()
	enrollPayload := map[string]string{
		"enrollment_token": token,
		"hostname":         hostInfo.Hostname,
		"os":               hostInfo.OS,
	}
	body, _ := json.Marshal(enrollPayload)

	resp, err := http.Post(serverURL+"/api/agent/enroll", "application/json", bytes.NewBuffer(body))
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Fatal("Enrollment failed: ", string(body))
	}

	var result struct {
		AgentID string `json:"agent_id"`
		Token   string `json:"token"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	config.DeviceID = result.AgentID
	config.AgentJWT = result.Token
	config.ServerURL = serverURL
	saveConfig()

	log.Printf("Successfully enrolled! Agent ID: %s", config.DeviceID)
	os.Exit(0)
}

func loadConfig() {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return
	}
	json.Unmarshal(data, &config)
}

func saveConfig() {
	// Ensure directory exists
	dir := configPath[:strings.LastIndex(configPath, string(os.PathSeparator))]
	os.MkdirAll(dir, 0755)

	data, _ := json.MarshalIndent(config, "", "  ")
	os.WriteFile(configPath, data, 0600)
}

func getSystemInfo() Device {
	hostInfo, _ := host.Info()
	cpuInfo, _ := cpu.Info()
	memInfo, _ := mem.VirtualMemory()
	diskInfo, _ := disk.Usage("/")

	// Get local IP
	localIP := "unknown"
	interfaces, _ := net.Interfaces()
	for _, iface := range interfaces {
		for _, addr := range iface.Addrs {
			if strings.Contains(addr.Addr, ".") && !strings.HasPrefix(addr.Addr, "127.") {
				localIP = strings.Split(addr.Addr, "/")[0]
				break
			}
		}
	}

	// Get public IP
	publicIP := getPublicIP()

	// Get CPU name
	cpuName := "Unknown"
	if len(cpuInfo) > 0 {
		cpuName = cpuInfo[0].ModelName
	}

	return Device{
		Name:         hostInfo.Hostname,
		Hostname:     hostInfo.Hostname,
		OS:           fmt.Sprintf("%s %s", hostInfo.OS, hostInfo.PlatformVersion),
		IPAddress:    localIP,
		PublicIP:     publicIP,
		Status:       "online",
		CPU:          cpuName,
		RAMTotal:     int64(memInfo.Total),
		RAMUsed:      int64(memInfo.Used),
		DiskTotal:    int64(diskInfo.Total),
		DiskUsed:     int64(diskInfo.Used),
		AgentVersion: VERSION,
		LastSeen:     time.Now().UTC().Format(time.RFC3339),
	}
}

func getPublicIP() string {
	resp, err := http.Get("https://api.ipify.org")
	if err != nil {
		return "unknown"
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

func heartbeatLoop() {
	for {
		sendHeartbeat()
		time.Sleep(HEARTBEAT_INTERVAL)
	}
}

func sendHeartbeat() {
	if config.AgentJWT == "" {
		return
	}

	device := getSystemInfo()
	metrics := map[string]interface{}{
		"cpu":        device.CPU,
		"ram_total":  device.RAMTotal,
		"ram_used":   device.RAMUsed,
		"disk_total": device.DiskTotal,
		"disk_used":  device.DiskUsed,
		"public_ip":  device.PublicIP,
		"ip_address": device.IPAddress,
		"last_seen":  device.LastSeen,
	}

	payload := map[string]interface{}{
		"metrics": metrics,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", config.ServerURL+"/api/agent/heartbeat", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+config.AgentJWT)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Heartbeat failed:", err)
		return
	}
	resp.Body.Close()
	log.Println("Heartbeat sent")
}

func commandPollLoop() {
	for {
		pollCommands()
		time.Sleep(COMMAND_POLL_INTERVAL)
	}
}

func pollCommands() {
	if config.AgentJWT == "" {
		return
	}

	req, _ := http.NewRequest("GET", config.ServerURL+"/api/agent/commands", nil)
	req.Header.Set("Authorization", "Bearer "+config.AgentJWT)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return
	}

	var commands []Command
	json.NewDecoder(resp.Body).Decode(&commands)

	for _, cmd := range commands {
		executeCommand(cmd)
	}
}

func executeCommand(cmd Command) {
	log.Printf("Executing command: %s (type: %s)", cmd.ID, cmd.CommandType)

	updateCommandStatus(cmd.ID, "running", "")

	var result string
	var err error

	switch cmd.CommandType {
	case "ping":
		result = "pong"
	case "restart":
		result, err = executeRestart()
	case "shutdown":
		result, err = executeShutdown()
	case "run_script":
		result, err = executeScript(cmd.Payload)
	case "network_scan":
		result, err = executeNetworkScan(cmd.Payload)
	case "get_info":
		info := getSystemInfo()
		infoBytes, _ := json.MarshalIndent(info, "", "  ")
		result = string(infoBytes)
	default:
		result = "Unknown command: " + cmd.CommandType
	}

	status := "completed"
	if err != nil {
		status = "failed"
		result = err.Error()
	}

	updateCommandStatus(cmd.ID, status, result)
	log.Printf("Command %s %s", cmd.ID, status)

	addLog("info", fmt.Sprintf("Command %s executed: %s", cmd.CommandType, status), "agent")
}

func updateCommandStatus(cmdID, status, result string) {
	data := map[string]string{
		"status": status,
		"result": result,
	}
	body, _ := json.Marshal(data)

	req, _ := http.NewRequest("POST", config.ServerURL+"/api/agent/commands/"+cmdID+"/result", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+config.AgentJWT)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Status update failed:", err)
		return
	}
	if resp != nil {
		resp.Body.Close()
	}
}

func addLog(level, message, source string) {
	logs := []map[string]string{
		{
			"level":   level,
			"message": message,
			"source":  source,
		},
	}
	payload := map[string]interface{}{
		"logs": logs,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", config.ServerURL+"/api/agent/logs", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+config.AgentJWT)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	if resp != nil {
		resp.Body.Close()
	}
}

func executeRestart() (string, error) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("shutdown", "/r", "/t", "5")
	case "darwin":
		cmd = exec.Command("sudo", "shutdown", "-r", "+1")
	default:
		cmd = exec.Command("sudo", "shutdown", "-r", "+1")
	}
	err := cmd.Run()
	if err != nil {
		return "", err
	}
	return "Restart initiated", nil
}

func executeShutdown() (string, error) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("shutdown", "/s", "/t", "5")
	case "darwin":
		cmd = exec.Command("sudo", "shutdown", "-h", "+1")
	default:
		cmd = exec.Command("sudo", "shutdown", "-h", "+1")
	}
	err := cmd.Run()
	if err != nil {
		return "", err
	}
	return "Shutdown initiated", nil
}

func executeScript(payload string) (string, error) {
	var scriptContent string
	
	// Try to parse as JSON with variables
	var data struct {
		Content   string            `json:"content"`
		Variables map[string]string `json:"variables"`
	}
	
	err := json.Unmarshal([]byte(payload), &data)
	if err == nil && data.Content != "" {
		scriptContent = data.Content
		// Perform variable substitution: replace {key} with value
		for k, v := range data.Variables {
			placeholder := "{" + k + "}"
			scriptContent = strings.ReplaceAll(scriptContent, placeholder, v)
		}
	} else {
		// Fallback to raw script content if not JSON
		scriptContent = payload
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("powershell", "-Command", scriptContent)
	default:
		cmd = exec.Command("bash", "-c", scriptContent)
	}

	output, err := cmd.CombinedOutput()
	return string(output), err
}

type NetworkScanPayload struct {
	ScanID    string   `json:"scanId"`
	ScanTypes []string `json:"scanTypes"`
	Subnet    string   `json:"subnet"`
}

type ScanResult struct {
	IPAddress      string `json:"ipAddress"`
	MACAddress     string `json:"macAddress,omitempty"`
	Hostname       string `json:"hostname,omitempty"`
	OSGuess        string `json:"osGuess,omitempty"`
	OpenPorts      []int  `json:"openPorts,omitempty"`
	DeviceType     string `json:"deviceType,omitempty"`
	Vendor         string `json:"vendor,omitempty"`
	ResponseTimeMs int64  `json:"responseTimeMs,omitempty"`
}

var macVendorMap = map[string]string{
	"00:1E:C2": "Apple", "3C:07:54": "Apple", "A4:5E:60": "Apple", "F4:0F:24": "Apple",
	"00:14:22": "Dell", "00:26:B9": "Dell", "B8:CA:3A": "Dell",
	"00:1F:29": "HP", "3C:D9:2B": "HP", "9C:8E:99": "HP",
	"00:00:0C": "Cisco", "00:0A:41": "Cisco",
	"00:04:23": "Intel", "00:15:17": "Intel",
	"B8:27:EB": "Raspberry Pi", "DC:A6:32": "Raspberry Pi", "E4:5F:01": "Raspberry Pi",
	"00:07:AB": "Samsung", "00:15:99": "Samsung", "28:BA:B5": "Samsung",
	"00:50:56": "VMware", "00:0C:29": "VMware",
	"08:00:27": "VirtualBox",
}

func executeNetworkScan(payload string) (string, error) {
	var scanPayload NetworkScanPayload
	if err := json.Unmarshal([]byte(payload), &scanPayload); err != nil {
		return "", err
	}

	subnet := scanPayload.Subnet
	if subnet == "" {
		detected, err := detectLocalSubnet()
		if err != nil {
			sendScanError(scanPayload.ScanID, "Failed to detect subnet: "+err.Error())
			return "", err
		}
		subnet = detected
	}

	// Expand /24 subnet (only supporting /24 for now as per instructions)
	baseIP := subnet[:strings.LastIndex(subnet, ".")+1]
	
	var wg sync.WaitGroup
	var resultsMu sync.Mutex
	results := []ScanResult{}
	
	// Semaphore for 50 concurrent goroutines
	sem := make(chan struct{}, 50)

	for i := 1; i < 255; i++ {
		ip := fmt.Sprintf("%s%d", baseIP, i)
		wg.Add(1)
		go func(ipAddr string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			result, ok := scanIP(ipAddr)
			if ok {
				resultsMu.Lock()
				results = append(results, result)
				resultsMu.Unlock()
			}
		}(ip)
	}

	// Start mDNS discovery in background
	mdnsResults := make(map[string]string)
	mdnsWG := sync.WaitGroup{}
	mdnsWG.Add(1)
	go func() {
		defer mdnsWG.Done()
		resolver, err := zeroconf.NewResolver(nil)
		if err != nil {
			return
		}

		entries := make(chan *zeroconf.ServiceEntry)
		go func() {
			for entry := range entries {
				if len(entry.AddrIPv4) > 0 {
					resultsMu.Lock()
					mdnsResults[entry.AddrIPv4[0].String()] = entry.Instance
					resultsMu.Unlock()
				}
			}
		}()

		ctx := reqContext(5 * time.Second)
		resolver.Browse(ctx, "_workstation._tcp", "local.", entries)
		resolver.Browse(ctx, "_ipp._tcp", "local.", entries)
		resolver.Browse(ctx, "_airplay._tcp", "local.", entries)
		resolver.Browse(ctx, "_ssh._tcp", "local.", entries)
		<-ctx.Done()
	}()

	wg.Wait()
	mdnsWG.Wait()

	// Merge mDNS hostnames
	for i := range results {
		if name, ok := mdnsResults[results[i].IPAddress]; ok {
			results[i].Hostname = name
		}
	}

	// Submit results
	submitScanResults(scanPayload.ScanID, subnet, results)

	summary := fmt.Sprintf("Scan complete: %d devices found on %s", len(results), subnet)
	return summary, nil
}

func scanIP(ip string) (ScanResult, bool) {
	pinger, err := ping.NewPinger(ip)
	if err != nil {
		return ScanResult{}, false
	}
	pinger.Count = 1
	pinger.Timeout = time.Second
	err = pinger.Run()
	if err != nil || pinger.PacketsRecv == 0 {
		return ScanResult{}, false
	}

	stats := pinger.Statistics()
	res := ScanResult{
		IPAddress:      ip,
		ResponseTimeMs: stats.AvgRtt.Milliseconds(),
	}

	// ARP lookup
	res.MACAddress = lookupMAC(ip)
	if res.MACAddress != "" {
		res.Vendor = lookupVendor(res.MACAddress)
	}

	// Reverse DNS
	names, _ := net.LookupAddr(ip)
	if len(names) > 0 {
		res.Hostname = strings.TrimSuffix(names[0], ".")
	}

	// Port Scan
	scanPorts(&res)

	return res, true
}

func lookupMAC(ip string) string {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("arp", "-a", ip)
	case "darwin":
		cmd = exec.Command("arp", "-n", ip)
	default:
		// Linux: read /proc/net/arp is better but lets try command first for simplicity in this helper
		output, err := os.ReadFile("/proc/net/arp")
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, ip) {
					fields := strings.Fields(line)
					if len(fields) >= 4 {
						return fields[3]
					}
				}
			}
		}
		cmd = exec.Command("arp", "-n", ip)
	}

	if cmd != nil {
		out, err := cmd.CombinedOutput()
		if err == nil {
			// Basic parsing logic - find something that looks like a MAC
			fields := strings.Fields(string(out))
			for _, f := range fields {
				if strings.Count(f, ":") == 5 || strings.Count(f, "-") == 5 {
					return strings.ReplaceAll(f, "-", ":")
				}
			}
		}
	}
	return ""
}

func lookupVendor(mac string) string {
	if len(mac) < 8 {
		return ""
	}
	prefix := strings.ToUpper(mac[:8])
	return macVendorMap[prefix]
}

func scanPorts(res *ScanResult) {
	ports := []int{22, 80, 443, 445, 3389, 5900, 631, 9100, 161, 8080}
	res.OpenPorts = []int{}
	
	for _, port := range ports {
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", res.IPAddress, port), 200*time.Millisecond)
		if err == nil {
			res.OpenPorts = append(res.OpenPorts, port)
			conn.Close()
		}
	}

	// Heuristics
	hasPort := func(p int) bool {
		for _, op := range res.OpenPorts {
			if op == p { return true }
		}
		return false
	}

	res.DeviceType = "unknown"
	if hasPort(3389) || hasPort(445) {
		res.OSGuess = "Windows"
		res.DeviceType = "computer"
	} else if hasPort(22) {
		res.OSGuess = "Linux/macOS"
		res.DeviceType = "computer"
	}
	
	if hasPort(631) || hasPort(9100) || strings.Contains(strings.ToLower(res.Hostname), "printer") {
		res.DeviceType = "printer"
	} else if hasPort(161) && res.DeviceType == "unknown" {
		res.DeviceType = "router"
	}
}

func detectLocalSubnet() (string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && ipnet.IP.To4() != nil {
				ip := ipnet.IP.To4()
				return fmt.Sprintf("%d.%d.%d.0/24", ip[0], ip[1], ip[2]), nil
			}
		}
	}
	return "", fmt.Errorf("no active IPv4 interface found")
}

func submitScanResults(scanID, subnet string, results []ScanResult) {
	payload := map[string]interface{}{
		"scanId":  scanID,
		"subnet":  subnet,
		"results": results,
	}
	sendScanPayload(payload)
}

func sendScanError(scanID, errStr string) {
	payload := map[string]interface{}{
		"scanId":  scanID,
		"results": []ScanResult{},
		"error":   errStr,
	}
	sendScanPayload(payload)
}

func sendScanPayload(payload interface{}) {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", config.ServerURL+"/api/agent/network-scan-result", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+config.AgentJWT)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err == nil && resp != nil {
		resp.Body.Close()
	}
}

// Simple context helper for mDNS
type SimpleContext struct {
	done chan struct{}
}
func (c *SimpleContext) Done() <-chan struct{} { return c.done }
func (c *SimpleContext) Err() error { return nil }
func (c *SimpleContext) Deadline() (time.Time, bool) { return time.Time{}, false }
func (c *SimpleContext) Value(key interface{}) interface{} { return nil }

func reqContext(d time.Duration) *SimpleContext {
	ctx := &SimpleContext{done: make(chan struct{})}
	go func() {
		time.Sleep(d)
		close(ctx.done)
	}()
	return ctx
}

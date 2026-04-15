package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

const (
	VERSION       = "1.0.0"
	SUPABASE_URL  = "https://vyrnbsybajwmishy.supabase.co"
	SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cm5ic3liYWp3cWFqd21pc2h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE5NjExMywiZXhwIjoyMDkxNzcyMTEzfQ.dHoa0z7D5VmYbXlQpoICbp_2mcT5laUgj0BQVu4RR8M"
	HEARTBEAT_INTERVAL = 30 * time.Second
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
	FluxID       string `json:"flux_id"`
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
	DeviceID string `json:"device_id"`
	UserID   string `json:"user_id"`
	FluxID   string `json:"flux_id"`
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

	// Load or create config
	loadConfig()

	// If no user_id, wait for registration via command line args
	if config.UserID == "" {
		if len(os.Args) < 2 {
			log.Fatal("Usage: hyperemote-agent <user_id> [device_name]")
		}
		config.UserID = os.Args[1]
		deviceName := ""
		if len(os.Args) > 2 {
			deviceName = os.Args[2]
		}
		registerDevice(deviceName)
	}

	// Start background tasks
	go heartbeatLoop()
	go commandPollLoop()

	// Keep running
	select {}
}

func loadConfig() {
	data, err := os.ReadFile(configPath)
	if err != nil {
		log.Println("No existing config, will register as new device")
		return
	}
	json.Unmarshal(data, &config)
	log.Printf("Loaded config: DeviceID=%s, UserID=%s", config.DeviceID, config.UserID)
}

func saveConfig() {
	// Ensure directory exists
	dir := configPath[:strings.LastIndex(configPath, string(os.PathSeparator))]
	os.MkdirAll(dir, 0755)

	data, _ := json.MarshalIndent(config, "", "  ")
	os.WriteFile(configPath, data, 0600)
	log.Println("Config saved")
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

	// Get Flux ID if installed
	fluxID := getFluxID()

	return Device{
		Name:         hostInfo.Hostname,
		Hostname:     hostInfo.Hostname,
		OS:           fmt.Sprintf("%s %s", hostInfo.OS, hostInfo.PlatformVersion),
		IPAddress:    localIP,
		PublicIP:     publicIP,
		Status:       "online",
		FluxID:       fluxID,
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

func getFluxID() string {
	// Check if Flux/RustDesk is installed and get ID
	var configFile string
	switch runtime.GOOS {
	case "windows":
		configFile = os.Getenv("AppData") + "\\Flux\\config\\id"
	case "darwin":
		configFile = os.Getenv("HOME") + "/Library/Application Support/Flux/config/id"
	default:
		configFile = os.Getenv("HOME") + "/.config/flux/id"
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func registerDevice(customName string) {
	log.Println("Registering device...")

	device := getSystemInfo()
	device.UserID = config.UserID
	if customName != "" {
		device.Name = customName
	}

	body, _ := json.Marshal(device)

	req, _ := http.NewRequest("POST", SUPABASE_URL+"/rest/v1/devices", bytes.NewBuffer(body))
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal("Failed to register device:", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		log.Fatal("Registration failed:", string(respBody))
	}

	var devices []Device
	json.Unmarshal(respBody, &devices)
	if len(devices) > 0 {
		config.DeviceID = devices[0].ID
		config.FluxID = devices[0].FluxID
		saveConfig()
		log.Printf("Device registered successfully! ID: %s", config.DeviceID)
	}
}

func heartbeatLoop() {
	for {
		sendHeartbeat()
		time.Sleep(HEARTBEAT_INTERVAL)
	}
}

func sendHeartbeat() {
	if config.DeviceID == "" {
		return
	}

	device := getSystemInfo()
	device.ID = config.DeviceID
	device.UserID = config.UserID

	body, _ := json.Marshal(device)

	req, _ := http.NewRequest("PATCH", 
		SUPABASE_URL+"/rest/v1/devices?id=eq."+config.DeviceID, 
		bytes.NewBuffer(body))
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
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
	if config.DeviceID == "" {
		return
	}

	req, _ := http.NewRequest("GET",
		SUPABASE_URL+"/rest/v1/commands?device_id=eq."+config.DeviceID+"&status=eq.pending&order=created_at.asc",
		nil)
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	var commands []Command
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &commands)

	for _, cmd := range commands {
		executeCommand(cmd)
	}
}

func executeCommand(cmd Command) {
	log.Printf("Executing command: %s (type: %s)", cmd.ID, cmd.CommandType)

	// Update status to running
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
	case "get_info":
		info := getSystemInfo()
		infoBytes, _ := json.MarshalIndent(info, "", "  ")
		result = string(infoBytes)
	case "install_flux":
		result, err = installFlux()
	default:
		result = "Unknown command: " + cmd.CommandType
	}

	status := "completed"
	if err != nil {
		status = "failed"
		result = err.Error()
	}

	updateCommandStatus(cmd.ID, status, result)
	log.Printf("Command %s %s: %s", cmd.ID, status, result)

	// Log to Supabase
	addLog("info", fmt.Sprintf("Command %s executed: %s", cmd.CommandType, status), "agent")
}

func updateCommandStatus(cmdID, status, result string) {
	data := map[string]string{
		"status": status,
		"result": result,
	}
	body, _ := json.Marshal(data)

	req, _ := http.NewRequest("PATCH",
		SUPABASE_URL+"/rest/v1/commands?id=eq."+cmdID,
		bytes.NewBuffer(body))
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	if resp != nil {
		resp.Body.Close()
	}
}

func addLog(level, message, source string) {
	data := map[string]string{
		"device_id": config.DeviceID,
		"user_id":   config.UserID,
		"level":     level,
		"message":   message,
		"source":    source,
	}
	body, _ := json.Marshal(data)

	req, _ := http.NewRequest("POST", SUPABASE_URL+"/rest/v1/logs", bytes.NewBuffer(body))
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
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

func executeScript(script string) (string, error) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("powershell", "-Command", script)
	default:
		cmd = exec.Command("bash", "-c", script)
	}

	output, err := cmd.CombinedOutput()
	return string(output), err
}

func installFlux() (string, error) {
	log.Println("Installing Flux (RustDesk)...")

	var downloadURL string
	var installCmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		downloadURL = "https://github.com/rustdesk/rustdesk/releases/download/1.2.3/rustdesk-1.2.3-x86_64.exe"
		// Download and run installer
		installCmd = exec.Command("powershell", "-Command", fmt.Sprintf(`
			$url = "%s"
			$output = "$env:TEMP\flux-installer.exe"
			Invoke-WebRequest -Uri $url -OutFile $output
			Start-Process -FilePath $output -ArgumentList "--silent-install" -Wait
		`, downloadURL))
	case "darwin":
		downloadURL = "https://github.com/rustdesk/rustdesk/releases/download/1.2.3/rustdesk-1.2.3.dmg"
		installCmd = exec.Command("bash", "-c", fmt.Sprintf(`
			curl -L -o /tmp/flux.dmg "%s"
			hdiutil attach /tmp/flux.dmg
			cp -R "/Volumes/RustDesk/RustDesk.app" /Applications/Flux.app
			hdiutil detach "/Volumes/RustDesk"
		`, downloadURL))
	default:
		downloadURL = "https://github.com/rustdesk/rustdesk/releases/download/1.2.3/rustdesk-1.2.3-x86_64.deb"
		installCmd = exec.Command("bash", "-c", fmt.Sprintf(`
			curl -L -o /tmp/flux.deb "%s"
			sudo dpkg -i /tmp/flux.deb || sudo apt-get install -f -y
		`, downloadURL))
	}

	output, err := installCmd.CombinedOutput()
	if err != nil {
		return string(output), err
	}

	// Update flux_id in config
	time.Sleep(2 * time.Second) // Wait for installation
	config.FluxID = getFluxID()
	saveConfig()

	// Update device in Supabase with flux_id
	sendHeartbeat()

	return "Flux installed successfully. ID: " + config.FluxID, nil
}

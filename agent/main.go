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

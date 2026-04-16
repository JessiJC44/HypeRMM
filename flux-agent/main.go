package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/process"
)

// Configuration
type Config struct {
	ServerURL   string
	TenantID    string
	DeviceID    string
	DeviceToken string
}

// Messages WebSocket
type RegisterMessage struct {
	Type     string `json:"type"`
	DeviceID string `json:"device_id"`
	TenantID string `json:"tenant_id"`
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Version  string `json:"version"`
}

type HeartbeatMessage struct {
	Type      string  `json:"type"`
	DeviceID  string  `json:"device_id"`
	CPU       float64 `json:"cpu"`
	RAM       float64 `json:"ram"`
	DiskUsed  float64 `json:"disk_used"`
	DiskTotal float64 `json:"disk_total"`
	Uptime    uint64  `json:"uptime"`
	Timestamp string  `json:"timestamp"`
}

type CommandMessage struct {
	Type      string `json:"type"`
	CommandID string `json:"command_id"`
	Action    string `json:"action"`
	Payload   string `json:"payload"`
}

type ResultMessage struct {
	Type      string `json:"type"`
	CommandID string `json:"command_id"`
	DeviceID  string `json:"device_id"`
	Output    string `json:"output"`
	Status    string `json:"status"` // success, error, timeout
	ExecTime  int64  `json:"exec_time_ms"`
}

type SystemInfo struct {
	Hostname    string  `json:"hostname"`
	OS          string  `json:"os"`
	Arch        string  `json:"arch"`
	CPUModel    string  `json:"cpu_model"`
	CPUCores    int     `json:"cpu_cores"`
	CPUUsage    float64 `json:"cpu_usage"`
	RAMTotal    uint64  `json:"ram_total"`
	RAMUsed     uint64  `json:"ram_used"`
	RAMPercent  float64 `json:"ram_percent"`
	DiskTotal   uint64  `json:"disk_total"`
	DiskUsed    uint64  `json:"disk_used"`
	DiskPercent float64 `json:"disk_percent"`
	Uptime      uint64  `json:"uptime"`
	PublicIP    string  `json:"public_ip"`
}

type ProcessInfo struct {
	PID     int32   `json:"pid"`
	Name    string  `json:"name"`
	CPU     float64 `json:"cpu"`
	Memory  float32 `json:"memory"`
	Status  string  `json:"status"`
	User    string  `json:"user"`
	Created int64   `json:"created"`
}

// Agent principal
type FluxAgent struct {
	config     Config
	conn       *websocket.Conn
	isRunning  bool
	reconnects int
}

func NewFluxAgent(serverURL, tenantID string) *FluxAgent {
	deviceID := getOrCreateDeviceID()
	
	return &FluxAgent{
		config: Config{
			ServerURL: serverURL,
			TenantID:  tenantID,
			DeviceID:  deviceID,
		},
		isRunning: true,
	}
}

func getOrCreateDeviceID() string {
	// Essayer de lire l'ID existant
	configPath := getConfigPath()
	data, err := os.ReadFile(configPath)
	if err == nil && len(data) > 0 {
		return strings.TrimSpace(string(data))
	}
	
	// Générer un nouvel ID
	id := uuid.New().String()
	os.MkdirAll(getConfigDir(), 0755)
	os.WriteFile(configPath, []byte(id), 0644)
	return id
}

func getConfigDir() string {
	if runtime.GOOS == "windows" {
		return os.Getenv("PROGRAMDATA") + "\\FluxAgent"
	}
	return "/etc/flux-agent"
}

func getConfigPath() string {
	return getConfigDir() + string(os.PathSeparator) + "device_id"
}

// Connexion WebSocket
func (a *FluxAgent) Connect() error {
	u, err := url.Parse(a.config.ServerURL)
	if err != nil {
		return err
	}

	// Configuration TLS
	dialer := websocket.Dialer{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: false, // Mettre true pour dev uniquement
		},
		HandshakeTimeout: 10 * time.Second,
	}

	// Headers d'authentification
	headers := make(map[string][]string)
	headers["X-Tenant-ID"] = []string{a.config.TenantID}
	headers["X-Device-ID"] = []string{a.config.DeviceID}

	conn, _, err := dialer.Dial(u.String(), headers)
	if err != nil {
		return err
	}

	a.conn = conn
	a.reconnects = 0
	log.Printf("✅ Connected to %s", a.config.ServerURL)

	// Enregistrement
	return a.register()
}

func (a *FluxAgent) register() error {
	hostname, _ := os.Hostname()
	
	msg := RegisterMessage{
		Type:     "register",
		DeviceID: a.config.DeviceID,
		TenantID: a.config.TenantID,
		Hostname: hostname,
		OS:       runtime.GOOS,
		Arch:     runtime.GOARCH,
		Version:  "1.0.0",
	}

	return a.send(msg)
}

func (a *FluxAgent) send(msg interface{}) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return a.conn.WriteMessage(websocket.TextMessage, data)
}

// Heartbeat
func (a *FluxAgent) startHeartbeat() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for a.isRunning {
		select {
		case <-ticker.C:
			if a.conn != nil {
				a.sendHeartbeat()
			}
		}
	}
}

func (a *FluxAgent) sendHeartbeat() {
	cpuPercent, _ := cpu.Percent(0, false)
	memInfo, _ := mem.VirtualMemory()
	diskInfo, _ := disk.Usage("/")
	hostInfo, _ := host.Info()

	cpuVal := 0.0
	if len(cpuPercent) > 0 {
		cpuVal = cpuPercent[0]
	}

	msg := HeartbeatMessage{
		Type:      "heartbeat",
		DeviceID:  a.config.DeviceID,
		CPU:       cpuVal,
		RAM:       memInfo.UsedPercent,
		DiskUsed:  float64(diskInfo.Used),
		DiskTotal: float64(diskInfo.Total),
		Uptime:    hostInfo.Uptime,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	if err := a.send(msg); err != nil {
		log.Printf("❌ Heartbeat failed: %v", err)
	}
}

// Écoute des commandes
func (a *FluxAgent) listen() {
	for a.isRunning {
		_, message, err := a.conn.ReadMessage()
		if err != nil {
			log.Printf("❌ Read error: %v", err)
			a.reconnect()
			continue
		}

		var cmd CommandMessage
		if err := json.Unmarshal(message, &cmd); err != nil {
			log.Printf("❌ Parse error: %v", err)
			continue
		}

		if cmd.Type == "command" {
			go a.executeCommand(cmd)
		}
	}
}

// Exécution des commandes
func (a *FluxAgent) executeCommand(cmd CommandMessage) {
	log.Printf("📥 Command received: %s - %s", cmd.CommandID, cmd.Action)
	
	start := time.Now()
	var output string
	var status string = "success"

	switch cmd.Action {
	case "run_shell_command":
		output, status = a.runShellCommand(cmd.Payload)
	case "get_system_info":
		output, status = a.getSystemInfo()
	case "list_processes":
		output, status = a.listProcesses()
	case "ping":
		output = "pong"
	default:
		output = fmt.Sprintf("Unknown action: %s", cmd.Action)
		status = "error"
	}

	execTime := time.Since(start).Milliseconds()

	result := ResultMessage{
		Type:      "result",
		CommandID: cmd.CommandID,
		DeviceID:  a.config.DeviceID,
		Output:    output,
		Status:    status,
		ExecTime:  execTime,
	}

	if err := a.send(result); err != nil {
		log.Printf("❌ Failed to send result: %v", err)
	} else {
		log.Printf("📤 Result sent for %s (%dms)", cmd.CommandID, execTime)
	}
}

func (a *FluxAgent) runShellCommand(command string) (string, string) {
	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		cmd = exec.Command("powershell", "-Command", command)
	} else {
		cmd = exec.Command("sh", "-c", command)
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return stderr.String() + "\n" + err.Error(), "error"
	}

	return stdout.String(), "success"
}

func (a *FluxAgent) getSystemInfo() (string, string) {
	hostname, _ := os.Hostname()
	hostInfo, _ := host.Info()
	cpuInfo, _ := cpu.Info()
	cpuPercent, _ := cpu.Percent(0, false)
	memInfo, _ := mem.VirtualMemory()
	diskInfo, _ := disk.Usage("/")

	cpuModel := ""
	if len(cpuInfo) > 0 {
		cpuModel = cpuInfo[0].ModelName
	}

	cpuVal := 0.0
	if len(cpuPercent) > 0 {
		cpuVal = cpuPercent[0]
	}

	info := SystemInfo{
		Hostname:    hostname,
		OS:          fmt.Sprintf("%s %s", hostInfo.Platform, hostInfo.PlatformVersion),
		Arch:        runtime.GOARCH,
		CPUModel:    cpuModel,
		CPUCores:    runtime.NumCPU(),
		CPUUsage:    cpuVal,
		RAMTotal:    memInfo.Total,
		RAMUsed:     memInfo.Used,
		RAMPercent:  memInfo.UsedPercent,
		DiskTotal:   diskInfo.Total,
		DiskUsed:    diskInfo.Used,
		DiskPercent: diskInfo.UsedPercent,
		Uptime:      hostInfo.Uptime,
	}

	data, _ := json.MarshalIndent(info, "", "  ")
	return string(data), "success"
}

func (a *FluxAgent) listProcesses() (string, string) {
	procs, err := process.Processes()
	if err != nil {
		return err.Error(), "error"
	}

	var processes []ProcessInfo
	for _, p := range procs {
		name, _ := p.Name()
		cpuPercent, _ := p.CPUPercent()
		memPercent, _ := p.MemoryPercent()
		status, _ := p.Status()
		username, _ := p.Username()
		createTime, _ := p.CreateTime()

		processes = append(processes, ProcessInfo{
			PID:     p.Pid,
			Name:    name,
			CPU:     cpuPercent,
			Memory:  memPercent,
			Status:  strings.Join(status, ","),
			User:    username,
			Created: createTime,
		})
	}

	data, _ := json.Marshal(processes)
	return string(data), "success"
}

// Reconnexion automatique
func (a *FluxAgent) reconnect() {
	if !a.isRunning {
		return
	}

	a.reconnects++
	delay := time.Duration(min(a.reconnects*5, 60)) * time.Second
	
	log.Printf("🔄 Reconnecting in %v... (attempt %d)", delay, a.reconnects)
	time.Sleep(delay)

	if err := a.Connect(); err != nil {
		log.Printf("❌ Reconnect failed: %v", err)
		a.reconnect()
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Arrêt propre
func (a *FluxAgent) Shutdown() {
	log.Println("🛑 Shutting down Flux Agent...")
	a.isRunning = false
	if a.conn != nil {
		a.conn.Close()
	}
}

// Point d'entrée
func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: flux-agent <server_url> <tenant_id>")
		fmt.Println("Example: flux-agent wss://flux.hyperemote.com/ws abc123-tenant-id")
		os.Exit(1)
	}

	serverURL := os.Args[1]
	tenantID := os.Args[2]

	log.Println("🚀 Starting Flux Agent...")
	log.Printf("   Server: %s", serverURL)
	log.Printf("   Tenant: %s", tenantID)

	agent := NewFluxAgent(serverURL, tenantID)

	// Gestion des signaux
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		agent.Shutdown()
		os.Exit(0)
	}()

	// Connexion initiale
	if err := agent.Connect(); err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}

	// Démarrer heartbeat en arrière-plan
	go agent.startHeartbeat()

	// Écouter les commandes
	agent.listen()
}

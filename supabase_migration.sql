-- Table devices (extension for Flux RMM)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS flux_id TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS cpu TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ram_used DECIMAL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS disk_used BIGINT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS disk_total BIGINT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_devices_flux_id ON devices(flux_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Ensure commands table exists (based on current implementation)
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload TEXT,
  status TEXT DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure logs table exists
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

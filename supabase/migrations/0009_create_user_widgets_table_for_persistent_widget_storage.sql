-- Create user_widgets table for persistent widget storage
CREATE TABLE IF NOT EXISTS user_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, widget_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_widgets_user_id ON user_widgets(user_id);

-- Enable RLS
ALTER TABLE user_widgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own widgets"
  ON user_widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widgets"
  ON user_widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
  ON user_widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets"
  ON user_widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_widgets_updated_at
  BEFORE UPDATE ON user_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
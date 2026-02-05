-- =============================================
-- CrossFile Schema - Run in Supabase SQL Editor
-- =============================================

-- 1. UPLOADS TABLE
-- Tracks uploaded McKesson files
-- =============================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  row_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UPLOAD_ITEMS TABLE
-- Stores each row from the uploaded Excel file
-- =============================================
CREATE TABLE upload_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  
  -- Original McKesson columns
  item_number TEXT,
  manufacturer TEXT,
  mfr_number TEXT,
  description TEXT,
  contents TEXT,
  uom TEXT,
  ship_qty NUMERIC,
  cost_per_unit NUMERIC,
  total_ext_purchase NUMERIC,
  percent_total_purchases NUMERIC,
  invoice_count INTEGER,
  
  -- Match results
  match_status TEXT DEFAULT 'pending',
  matched_product_id UUID REFERENCES products(id),
  match_confidence INTEGER DEFAULT 0,
  match_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPROVED_MATCHES TABLE
-- Pre-approved equivalents (grows as admins approve fuzzy matches)
-- =============================================
CREATE TABLE approved_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mckesson_mfr_number TEXT NOT NULL UNIQUE,
  mckesson_description TEXT,
  hart_product_id UUID REFERENCES products(id),
  hart_manufacturer_item_code TEXT NOT NULL,
  approved_by TEXT,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_upload_items_upload_id ON upload_items(upload_id);
CREATE INDEX idx_upload_items_mfr_number ON upload_items(mfr_number);
CREATE INDEX idx_upload_items_match_status ON upload_items(match_status);
CREATE INDEX idx_approved_matches_mfr ON approved_matches(mckesson_mfr_number);
CREATE INDEX idx_products_mfr_code ON products(manufacturer_item_code);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uploads_set_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER upload_items_set_updated_at
  BEFORE UPDATE ON upload_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER approved_matches_set_updated_at
  BEFORE UPDATE ON approved_matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_matches ENABLE ROW LEVEL SECURITY;

-- Uploads policies
CREATE POLICY "uploads_select" ON uploads FOR SELECT USING (true);
CREATE POLICY "uploads_insert" ON uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "uploads_update" ON uploads FOR UPDATE USING (true);
CREATE POLICY "uploads_delete" ON uploads FOR DELETE USING (true);

-- Upload items policies
CREATE POLICY "upload_items_select" ON upload_items FOR SELECT USING (true);
CREATE POLICY "upload_items_insert" ON upload_items FOR INSERT WITH CHECK (true);
CREATE POLICY "upload_items_update" ON upload_items FOR UPDATE USING (true);
CREATE POLICY "upload_items_delete" ON upload_items FOR DELETE USING (true);

-- Approved matches policies
CREATE POLICY "approved_matches_select" ON approved_matches FOR SELECT USING (true);
CREATE POLICY "approved_matches_insert" ON approved_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "approved_matches_update" ON approved_matches FOR UPDATE USING (true);
CREATE POLICY "approved_matches_delete" ON approved_matches FOR DELETE USING (true);

-- =============================================
-- Done! Tables created:
--   - uploads
--   - upload_items  
--   - approved_matches
-- =============================================

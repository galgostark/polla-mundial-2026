-- Agregar soporte para tanda de penales en predicciones y partidos oficiales
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS penalty_winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalty_winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL;

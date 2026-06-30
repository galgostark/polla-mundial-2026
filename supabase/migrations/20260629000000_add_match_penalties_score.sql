-- Agregar columnas para registrar marcador de penales oficial en los partidos reales
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalties_home INT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalties_away INT;

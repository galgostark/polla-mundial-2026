-- Actualización de fechas, horas y clasificados de la Ronda de 32 (Dieciseisavos) - V3 (27 de Junio 2026)
-- Todos los partidos están configurados con la hora local de Perú (GMT-5)

UPDATE matches SET home_team_id = 'BEL', away_team_id = NULL WHERE id = 77;
UPDATE matches SET home_team_id = 'AUS', away_team_id = 'EGY' WHERE id = 87;

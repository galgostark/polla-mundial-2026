-- 1. Agregar columnas a la tabla de participantes
ALTER TABLE participants ADD COLUMN IF NOT EXISTS groups_match_points INT NOT NULL DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS r32_match_points INT NOT NULL DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS bracket_points INT NOT NULL DEFAULT 0;

-- 2. Actualizar la función que calcula puntos de partidos de predicciones individuales (para incluir desglose)
CREATE OR REPLACE FUNCTION calculate_match_predictions_points()
RETURNS TRIGGER AS $$
DECLARE
    pred RECORD;
    p_points INT;
BEGIN
    -- Se ejecuta cuando el partido pasa a 'FINISHED' o cambia su marcador cuando ya está 'FINISHED'
    IF (NEW.status = 'FINISHED' AND 
        (OLD.status IS DISTINCT FROM 'FINISHED' OR 
         OLD.home_score IS DISTINCT FROM NEW.home_score OR 
         OLD.away_score IS DISTINCT FROM NEW.away_score)) THEN
        
        -- 1. Recorrer y puntuar cada predicción de este partido
        FOR pred IN SELECT * FROM predictions WHERE match_id = NEW.id LOOP
            p_points := 0;
            
            -- Verificar acierto del resultado simple (Ganador o Empate)
            IF (
                (NEW.home_score > NEW.away_score AND pred.home_score > pred.away_score) OR
                (NEW.home_score < NEW.away_score AND pred.home_score < pred.away_score) OR
                (NEW.home_score = NEW.away_score AND pred.home_score = pred.away_score)
            ) THEN
                p_points := 3; -- Acierto simple
                
                -- Verificar si es acierto de marcador exacto (+1 punto adicional, total 4)
                IF (NEW.home_score = pred.home_score AND NEW.away_score = pred.away_score) THEN
                    p_points := 4;
                END IF;
            END IF;
            
            -- Actualizar puntos ganados en esta predicción
            UPDATE predictions 
            SET points_won = p_points 
            WHERE id = pred.id;
        END LOOP;
        
        -- 2. Recalcular el puntaje total y desgloses de todos los participantes involucrados
        UPDATE participants p
        SET 
            total_points = COALESCE((SELECT SUM(points_won) FROM predictions WHERE participant_id = p.id), 0) + COALESCE((SELECT points_won FROM bracket_predictions WHERE participant_id = p.id), 0),
            exact_matches = COALESCE((SELECT COUNT(*) FROM predictions WHERE participant_id = p.id AND points_won = 4), 0),
            correct_results = COALESCE((SELECT COUNT(*) FROM predictions WHERE participant_id = p.id AND points_won = 3), 0),
            groups_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = p.id AND m.stage = 'GROUPS'), 0),
            r32_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = p.id AND m.stage = 'ROUND_32'), 0),
            bracket_points = COALESCE((SELECT points_won FROM bracket_predictions WHERE participant_id = p.id), 0)
        WHERE p.id IN (SELECT participant_id FROM predictions WHERE match_id = NEW.id);
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar la función que recalcula puntos de brackets (para incluir desglose en participants)
CREATE OR REPLACE FUNCTION recalculate_bracket_predictions_points(polla_uuid UUID)
RETURNS VOID AS $$
DECLARE
    team_champ TEXT;
    team_runner TEXT;
    teams_semi TEXT[];
    teams_quarter TEXT[];
    teams_r16 TEXT[];
    teams_r32 TEXT[];
    
    r_bp RECORD;
    pts_total INT;
    t_id TEXT;
BEGIN
    -- Obtener los resultados oficiales definidos en la base de datos
    SELECT home_team_id, away_team_id INTO team_champ, team_runner 
    FROM matches 
    WHERE id = 104 AND status = 'FINISHED';
    
    -- Ronda de 32
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_r32 FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'ROUND_32' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'ROUND_32' AND away_team_id IS NOT NULL
    ) AS q32;

    -- Ronda de 16
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_r16 FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'ROUND_16' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'ROUND_16' AND away_team_id IS NOT NULL
    ) AS q16;
    
    -- Cuartos de final
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_quarter FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'QUARTERS' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'QUARTERS' AND away_team_id IS NOT NULL
    ) AS q4;
    
    -- Semifinalistas
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_semi FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'SEMIS' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'SEMIS' AND away_team_id IS NOT NULL
    ) AS q2;

    -- Recorrer predicciones de brackets
    FOR r_bp IN 
        SELECT b.* FROM bracket_predictions b
        JOIN participants p ON b.participant_id = p.id
        WHERE p.polla_id = polla_uuid
    LOOP
        pts_total := 0;
        
        -- Aciertos Ronda de 32 (Dieciseisavos): 1 punto por cada selección correcta
        IF r_bp.round_of_32 IS NOT NULL AND teams_r32 IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_r32 LOOP
                IF r_bp.round_of_32 @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Aciertos Ronda de 16 (Octavos): 2 puntos por cada selección correcta
        IF r_bp.round_of_16 IS NOT NULL AND teams_r16 IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_r16 LOOP
                IF r_bp.round_of_16 @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 2;
                END IF;
            END LOOP;
        END IF;
        
        -- Aciertos Cuartos de Final: 3 puntos por cada selección correcta
        IF r_bp.quarterfinalists IS NOT NULL AND teams_quarter IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_quarter LOOP
                IF r_bp.quarterfinalists @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 3;
                END IF;
            END LOOP;
        END IF;
        
        -- Aciertos Semifinales: 4 puntos por cada selección correcta
        IF r_bp.semifinalists IS NOT NULL AND teams_semi IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_semi LOOP
                IF r_bp.semifinalists @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 4;
                END IF;
            END LOOP;
        END IF;
        
        -- Subcampeón: 5 puntos
        IF r_bp.runner_up_team_id IS NOT NULL AND team_runner IS NOT NULL AND r_bp.runner_up_team_id = team_runner THEN
            pts_total := pts_total + 5;
        END IF;
        
        -- Campeón: 10 puntos
        IF r_bp.champion_team_id IS NOT NULL AND team_champ IS NOT NULL AND r_bp.champion_team_id = team_champ THEN
            pts_total := pts_total + 10;
        END IF;
        
        -- Actualizar puntos del bracket
        UPDATE bracket_predictions 
        SET points_won = pts_total 
        WHERE id = r_bp.id;
        
        -- Actualizar puntaje acumulado en participantes
        UPDATE participants 
        SET 
            total_points = COALESCE((SELECT SUM(points_won) FROM predictions WHERE participant_id = r_bp.participant_id), 0) + pts_total,
            groups_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = r_bp.participant_id AND m.stage = 'GROUPS'), 0),
            r32_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = r_bp.participant_id AND m.stage = 'ROUND_32'), 0),
            bracket_points = pts_total
        WHERE id = r_bp.participant_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Inicializar valores de las nuevas columnas para los registros existentes
UPDATE participants p
SET
    groups_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = p.id AND m.stage = 'GROUPS'), 0),
    r32_match_points = COALESCE((SELECT SUM(pr.points_won) FROM predictions pr JOIN matches m ON pr.match_id = m.id WHERE pr.participant_id = p.id AND m.stage = 'ROUND_32'), 0),
    bracket_points = COALESCE((SELECT points_won FROM bracket_predictions WHERE participant_id = p.id), 0);

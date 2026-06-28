-- Corrección de la función recalculate_bracket_predictions_points para evitar colisión de nombres de variable/alias (bp)
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
        SET total_points = COALESCE((SELECT SUM(points_won) FROM predictions WHERE participant_id = r_bp.participant_id), 0) + pts_total
        WHERE id = r_bp.participant_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

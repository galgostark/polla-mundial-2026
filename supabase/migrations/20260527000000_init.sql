-- Migración Inicial: Estructura de Base de Datos para Polla Mundial 2026

-- Habilitar extensión uuid-ossp por si acaso
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: pollas (Grupos de quiniela)
CREATE TABLE IF NOT EXISTS pollas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    admin_pin TEXT NOT NULL,
    entry_fee NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PEN',
    payment_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: teams (Selecciones del mundial)
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY, -- e.g., 'ARG', 'BRA', 'MEX'
    name TEXT NOT NULL,
    flag_url TEXT,
    group_letter TEXT NOT NULL -- 'A' a 'L'
);

-- 3. TABLA: matches (Fixture de los 104 partidos del mundial)
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY,
    home_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    away_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    home_score INT,
    away_score INT,
    stage TEXT NOT NULL, -- 'GROUPS', 'ROUND_32', 'ROUND_16', 'QUARTERS', 'SEMIS', 'THIRD_PLACE', 'FINAL'
    match_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' -- 'SCHEDULED', 'LIVE', 'FINISHED'
);

-- 4. TABLA: participants (Usuarios en cada polla)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    polla_id UUID NOT NULL REFERENCES pollas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    total_points INT NOT NULL DEFAULT 0,
    exact_matches INT NOT NULL DEFAULT 0,
    correct_results INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índice para acelerar ordenamientos de ranking
CREATE INDEX IF NOT EXISTS idx_participants_ranking ON participants(polla_id, total_points DESC, exact_matches DESC, correct_results DESC);

-- 5. TABLA: predictions (Cartilla de partidos individuales)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    points_won INT, -- null hasta que termine el partido
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_participant_match UNIQUE (participant_id, match_id)
);

-- 6. TABLA: bracket_predictions (Predicciones del cuadro y campeones)
CREATE TABLE IF NOT EXISTS bracket_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
    champion_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    runner_up_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    semifinalists JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de team_ids
    quarterfinalists JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de team_ids
    round_of_16 JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de team_ids
    round_of_32 JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de team_ids
    points_won INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FUNCIÓN Y TRIGGER PARA CÁLCULO AUTOMÁTICO DE PUNTOS DE PARTIDOS
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
        
        -- 2. Recalcular el puntaje total, aciertos exactos y aciertos simples de todos los participantes involucrados
        UPDATE participants p
        SET 
            total_points = COALESCE((SELECT SUM(points_won) FROM predictions WHERE participant_id = p.id), 0) + COALESCE((SELECT points_won FROM bracket_predictions WHERE participant_id = p.id), 0),
            exact_matches = COALESCE((SELECT COUNT(*) FROM predictions WHERE participant_id = p.id AND points_won = 4), 0),
            correct_results = COALESCE((SELECT COUNT(*) FROM predictions WHERE participant_id = p.id AND points_won = 3), 0)
        WHERE p.id IN (SELECT participant_id FROM predictions WHERE match_id = NEW.id);
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calculate_match_predictions
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION calculate_match_predictions_points();

-- 8. FUNCIÓN PARA RECALCULAR PUNTOS DE BRACKETS Y CUADRO DE CLASIFICACIÓN
-- Esta función se puede llamar cuando se definen de manera oficial los clasificados de cada ronda
CREATE OR REPLACE FUNCTION recalculate_bracket_predictions_points(polla_uuid UUID)
RETURNS VOID AS $$
DECLARE
    team_champ TEXT;
    team_runner TEXT;
    teams_semi TEXT[];
    teams_quarter TEXT[];
    teams_r16 TEXT[];
    teams_r32 TEXT[];
    
    bp RECORD;
    pts_total INT;
    t_id TEXT;
BEGIN
    -- Obtener los resultados oficiales definidos en la base de datos
    -- Campeón y Subcampeón: son el ganador y perdedor del partido con id 104 (Final)
    SELECT home_team_id, away_team_id INTO team_champ, team_runner 
    FROM matches 
    WHERE id = 104 AND status = 'FINISHED';
    
    -- Si el visitante ganó la final (o si hay penales y se define de otra forma)
    -- En un escenario básico, dependemos de quién tenga más goles en la final.
    -- Pero el admin puede registrar de manera explícita el campeón/subcampeón si hubo prórroga/penales.
    -- Para este script, asumiremos que se llama pasándole los datos o el admin los calcula.
    -- Vamos a diseñar una lógica flexible donde calculamos basándonos en los partidos oficiales del fixture.
    -- (Esta función de brackets es llamada por el administrador para liquidar las rondas)
    
    -- Recopilar los equipos reales que jugaron en cada ronda
    -- Ronda de 32: Equipos que figuran en partidos de ROUND_32 (id del 73 al 88)
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_r32 FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'ROUND_32' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'ROUND_32' AND away_team_id IS NOT NULL
    ) AS q32;

    -- Ronda de 16: Equipos que jugaron en ROUND_16 (id del 89 al 96)
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_r16 FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'ROUND_16' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'ROUND_16' AND away_team_id IS NOT NULL
    ) AS q16;
    
    -- Cuartos de final: Equipos en QUARTERS (id del 97 al 100)
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_quarter FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'QUARTERS' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'QUARTERS' AND away_team_id IS NOT NULL
    ) AS q4;
    
    -- Semifinalistas: Equipos en SEMIS (id 101 y 102)
    SELECT ARRAY_AGG(DISTINCT t) INTO teams_semi FROM (
        SELECT home_team_id AS t FROM matches WHERE stage = 'SEMIS' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id AS t FROM matches WHERE stage = 'SEMIS' AND away_team_id IS NOT NULL
    ) AS q2;

    -- Recorrer predicciones de brackets para la polla seleccionada
    FOR bp IN 
        SELECT bp.* FROM bracket_predictions bp
        JOIN participants p ON bp.participant_id = p.id
        WHERE p.polla_id = polla_uuid
    LOOP
        pts_total := 0;
        
        -- Aciertos Ronda de 16: 2 puntos por cada selección correcta
        IF bp.round_of_16 IS NOT NULL AND teams_r16 IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_r16 LOOP
                IF bp.round_of_16 @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 2;
                END IF;
            END LOOP;
        END IF;
        
        -- Aciertos Cuartos de Final: 3 puntos por cada selección correcta
        IF bp.quarterfinalists IS NOT NULL AND teams_quarter IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_quarter LOOP
                IF bp.quarterfinalists @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 3;
                END IF;
            END LOOP;
        END IF;
        
        -- Aciertos Semifinales: 4 puntos por cada selección correcta
        IF bp.semifinalists IS NOT NULL AND teams_semi IS NOT NULL THEN
            FOREACH t_id IN ARRAY teams_semi LOOP
                IF bp.semifinalists @> jsonb_build_array(t_id) THEN
                    pts_total := pts_total + 4;
                END IF;
            END LOOP;
        END IF;
        
        -- Subcampeón: 5 puntos
        IF bp.runner_up_team_id IS NOT NULL AND team_runner IS NOT NULL AND bp.runner_up_team_id = team_runner THEN
            pts_total := pts_total + 5;
        END IF;
        
        -- Campeón: 10 puntos
        IF bp.champion_team_id IS NOT NULL AND team_champ IS NOT NULL AND bp.champion_team_id = team_champ THEN
            pts_total := pts_total + 10;
        END IF;
        
        -- Actualizar puntos del bracket
        UPDATE bracket_predictions 
        SET points_won = pts_total 
        WHERE id = bp.id;
        
        -- Actualizar puntaje acumulado en participantes
        UPDATE participants 
        SET total_points = COALESCE((SELECT SUM(points_won) FROM predictions WHERE participant_id = bp.participant_id), 0) + pts_total
        WHERE id = bp.participant_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

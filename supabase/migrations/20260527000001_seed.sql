-- Semilla de Datos: Equipos y Fixture Completo del Mundial FIFA 2026

-- 1. Insertar las 48 selecciones clasificadas en sus 12 grupos oficiales (A-L)
INSERT INTO teams (id, name, flag_url, group_letter) VALUES
-- Grupo A
('MEX', 'México', 'https://flagcdn.com/w80/mx.png', 'A'),
('ZAF', 'Sudáfrica', 'https://flagcdn.com/w80/za.png', 'A'),
('KOR', 'Corea del Sur', 'https://flagcdn.com/w80/kr.png', 'A'),
('CZE', 'República Checa', 'https://flagcdn.com/w80/cz.png', 'A'),
-- Grupo B
('CAN', 'Canadá', 'https://flagcdn.com/w80/ca.png', 'B'),
('BIH', 'Bosnia y Herzegovina', 'https://flagcdn.com/w80/ba.png', 'B'),
('QAT', 'Catar', 'https://flagcdn.com/w80/qa.png', 'B'),
('SUI', 'Suiza', 'https://flagcdn.com/w80/ch.png', 'B'),
-- Grupo C
('BRA', 'Brasil', 'https://flagcdn.com/w80/br.png', 'C'),
('MAR', 'Marruecos', 'https://flagcdn.com/w80/ma.png', 'C'),
('HAI', 'Haití', 'https://flagcdn.com/w80/ht.png', 'C'),
('SCO', 'Escocia', 'https://flagcdn.com/w80/gb-sct.png', 'C'),
-- Grupo D
('USA', 'Estados Unidos', 'https://flagcdn.com/w80/us.png', 'D'),
('PAR', 'Paraguay', 'https://flagcdn.com/w80/py.png', 'D'),
('AUS', 'Australia', 'https://flagcdn.com/w80/au.png', 'D'),
('TUR', 'Turquía', 'https://flagcdn.com/w80/tr.png', 'D'),
-- Grupo E
('GER', 'Alemania', 'https://flagcdn.com/w80/de.png', 'E'),
('CUW', 'Curazao', 'https://flagcdn.com/w80/cw.png', 'E'),
('CIV', 'Costa de Marfil', 'https://flagcdn.com/w80/ci.png', 'E'),
('ECU', 'Ecuador', 'https://flagcdn.com/w80/ec.png', 'E'),
-- Grupo F
('NED', 'Países Bajos', 'https://flagcdn.com/w80/nl.png', 'F'),
('JPN', 'Japón', 'https://flagcdn.com/w80/jp.png', 'F'),
('SWE', 'Suecia', 'https://flagcdn.com/w80/se.png', 'F'),
('TUN', 'Túnez', 'https://flagcdn.com/w80/tn.png', 'F'),
-- Grupo G
('BEL', 'Bélgica', 'https://flagcdn.com/w80/be.png', 'G'),
('EGY', 'Egipto', 'https://flagcdn.com/w80/eg.png', 'G'),
('IRN', 'Irán', 'https://flagcdn.com/w80/ir.png', 'G'),
('NZL', 'Nueva Zelanda', 'https://flagcdn.com/w80/nz.png', 'G'),
-- Grupo H
('ESP', 'España', 'https://flagcdn.com/w80/es.png', 'H'),
('CPV', 'Cabo Verde', 'https://flagcdn.com/w80/cv.png', 'H'),
('KSA', 'Arabia Saudita', 'https://flagcdn.com/w80/sa.png', 'H'),
('URU', 'Uruguay', 'https://flagcdn.com/w80/uy.png', 'H'),
-- Grupo I
('FRA', 'Francia', 'https://flagcdn.com/w80/fr.png', 'I'),
('SEN', 'Senegal', 'https://flagcdn.com/w80/sn.png', 'I'),
('IRQ', 'Irak', 'https://flagcdn.com/w80/iq.png', 'I'),
('NOR', 'Noruega', 'https://flagcdn.com/w80/no.png', 'I'),
-- Grupo J
('ARG', 'Argentina', 'https://flagcdn.com/w80/ar.png', 'J'),
('DZA', 'Argelia', 'https://flagcdn.com/w80/dz.png', 'J'),
('AUT', 'Austria', 'https://flagcdn.com/w80/at.png', 'J'),
('JOR', 'Jordania', 'https://flagcdn.com/w80/jo.png', 'J'),
-- Grupo K
('POR', 'Portugal', 'https://flagcdn.com/w80/pt.png', 'K'),
('COD', 'República Democrática del Congo', 'https://flagcdn.com/w80/cd.png', 'K'),
('UZB', 'Uzbekistán', 'https://flagcdn.com/w80/uz.png', 'K'),
('COL', 'Colombia', 'https://flagcdn.com/w80/co.png', 'K'),
-- Grupo L
('ENG', 'Inglaterra', 'https://flagcdn.com/w80/gb-eng.png', 'L'),
('CRO', 'Croacia', 'https://flagcdn.com/w80/hr.png', 'L'),
('GHA', 'Ghana', 'https://flagcdn.com/w80/gh.png', 'L'),
('PAN', 'Panamá', 'https://flagcdn.com/w80/pa.png', 'L')
ON CONFLICT (id) DO NOTHING;

-- 2. Generar el Fixture automáticamente mediante PL/pgSQL
DO $$
DECLARE
    grp CHAR(1);
    t_ids TEXT[];
    m_date TIMESTAMPTZ := '2026-06-11 17:00:00-05'; -- Fecha de inauguración: 11 de Junio de 2026
    m_id INT := 1;
    stage_name TEXT := 'GROUPS';
    i INT;
BEGIN
    -- Eliminar partidos existentes si se vuelve a correr
    DELETE FROM matches;

    -- A. FASE DE GRUPOS (72 partidos, del ID 1 al 72)
    FOR grp IN SELECT unnest(ARRAY['A','B','C','D','E','F','G','H','I','J','K','L']) LOOP
        -- Obtener los 4 equipos de este grupo
        SELECT ARRAY_AGG(id ORDER BY id) INTO t_ids FROM teams WHERE group_letter = grp;
        
        -- Partido 1: 1 vs 2
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[1], t_ids[2], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '6 hours';
        
        -- Partido 2: 3 vs 4
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[3], t_ids[4], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '6 hours';
        
        -- Partido 3: 1 vs 3
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[1], t_ids[3], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '6 hours';
        
        -- Partido 4: 2 vs 4
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[2], t_ids[4], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '6 hours';
        
        -- Partido 5: 4 vs 1
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[4], t_ids[1], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '6 hours';
        
        -- Partido 6: 2 vs 3
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (m_id, t_ids[2], t_ids[3], stage_name, m_date, 'SCHEDULED');
        m_id := m_id + 1;
        m_date := m_date + INTERVAL '12 hours'; -- Salto de día
    END LOOP;

    -- Ajustar la fecha para la fase eliminatoria
    m_date := '2026-06-28 12:00:00-05';

    -- B. RONDA DE 32 (16 partidos, del ID 73 al 88)
    stage_name := 'ROUND_32';
    FOR i IN 73..88 LOOP
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (i, NULL, NULL, stage_name, m_date, 'SCHEDULED');
        m_date := m_date + INTERVAL '6 hours';
    END LOOP;

    -- C. OCTAVOS DE FINAL (8 partidos, del ID 89 al 96)
    stage_name := 'ROUND_16';
    m_date := '2026-07-04 12:00:00-05';
    FOR i IN 89..96 LOOP
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (i, NULL, NULL, stage_name, m_date, 'SCHEDULED');
        m_date := m_date + INTERVAL '6 hours';
    END LOOP;

    -- D. CUARTOS DE FINAL (4 partidos, del ID 97 al 100)
    stage_name := 'QUARTERS';
    m_date := '2026-07-09 13:00:00-05';
    FOR i IN 97..100 LOOP
        INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
        VALUES (i, NULL, NULL, stage_name, m_date, 'SCHEDULED');
        m_date := m_date + INTERVAL '8 hours';
    END LOOP;

    -- E. SEMIFINALES (2 partidos, IDs 101 y 102)
    stage_name := 'SEMIS';
    m_date := '2026-07-14 15:00:00-05';
    INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
    VALUES (101, NULL, NULL, stage_name, m_date, 'SCHEDULED');
    
    m_date := '2026-07-15 15:00:00-05';
    INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
    VALUES (102, NULL, NULL, stage_name, m_date, 'SCHEDULED');

    -- F. TERCER PUESTO (ID 103)
    stage_name := 'THIRD_PLACE';
    m_date := '2026-07-18 15:00:00-05';
    INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
    VALUES (103, NULL, NULL, stage_name, m_date, 'SCHEDULED');

    -- G. GRAN FINAL (ID 104)
    stage_name := 'FINAL';
    m_date := '2026-07-19 15:00:00-05';
    INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status)
    VALUES (104, NULL, NULL, stage_name, m_date, 'SCHEDULED');
END;
$$;

-- Semilla de Datos: Equipos y Fixture Completo del Mundial FIFA 2026

-- 1. Insertar las 48 selecciones clasificadas en sus 12 grupos oficiales (A-L)
INSERT INTO teams (id, name, flag_url, group_letter) VALUES
-- Grupo A
('MEX', 'México', 'https://flagcdn.com/w80/mx.png', 'A'),
('ECU', 'Ecuador', 'https://flagcdn.com/w80/ec.png', 'A'),
('CGO', 'Congo', 'https://flagcdn.com/w80/cg.png', 'A'),
('NZL', 'Nueva Zelanda', 'https://flagcdn.com/w80/nz.png', 'A'),
-- Grupo B
('CAN', 'Canadá', 'https://flagcdn.com/w80/ca.png', 'B'),
('NGA', 'Nigeria', 'https://flagcdn.com/w80/ng.png', 'B'),
('IRQ', 'Irak', 'https://flagcdn.com/w80/iq.png', 'B'),
('SVN', 'Eslovenia', 'https://flagcdn.com/w80/si.png', 'B'),
-- Grupo C
('USA', 'Estados Unidos', 'https://flagcdn.com/w80/us.png', 'C'),
('MAR', 'Marruecos', 'https://flagcdn.com/w80/ma.png', 'C'),
('UZB', 'Uzbekistán', 'https://flagcdn.com/w80/uz.png', 'C'),
('ROU', 'Rumania', 'https://flagcdn.com/w80/ro.png', 'C'),
-- Grupo D
('ARG', 'Argentina', 'https://flagcdn.com/w80/ar.png', 'D'),
('SWE', 'Suecia', 'https://flagcdn.com/w80/se.png', 'D'),
('CIV', 'Costa de Marfil', 'https://flagcdn.com/w80/ci.png', 'D'),
('AUS', 'Australia', 'https://flagcdn.com/w80/au.png', 'D'),
-- Grupo E
('BRA', 'Brasil', 'https://flagcdn.com/w80/br.png', 'E'),
('COL', 'Colombia', 'https://flagcdn.com/w80/co.png', 'E'),
('KOR', 'Corea del Sur', 'https://flagcdn.com/w80/kr.png', 'E'),
('EGY', 'Egipto', 'https://flagcdn.com/w80/eg.png', 'E'),
-- Grupo F
('FRA', 'Francia', 'https://flagcdn.com/w80/fr.png', 'F'),
('URU', 'Uruguay', 'https://flagcdn.com/w80/uy.png', 'F'),
('JPN', 'Japón', 'https://flagcdn.com/w80/jp.png', 'F'),
('SEN', 'Senegal', 'https://flagcdn.com/w80/sn.png', 'F'),
-- Grupo G
('ENG', 'Inglaterra', 'https://flagcdn.com/w80/gb.png', 'G'),
('CHL', 'Chile', 'https://flagcdn.com/w80/cl.png', 'G'),
('GHA', 'Ghana', 'https://flagcdn.com/w80/gh.png', 'G'),
('KSA', 'Arabia Saudita', 'https://flagcdn.com/w80/sa.png', 'G'),
-- Grupo H
('ESP', 'España', 'https://flagcdn.com/w80/es.png', 'H'),
('PAR', 'Paraguay', 'https://flagcdn.com/w80/py.png', 'H'),
('TUN', 'Túnez', 'https://flagcdn.com/w80/tn.png', 'H'),
('CHN', 'China', 'https://flagcdn.com/w80/cn.png', 'H'),
-- Grupo I
('POR', 'Portugal', 'https://flagcdn.com/w80/pt.png', 'I'),
('NED', 'Países Bajos', 'https://flagcdn.com/w80/nl.png', 'I'),
('CMR', 'Camerún', 'https://flagcdn.com/w80/cm.png', 'I'),
('CRC', 'Costa Rica', 'https://flagcdn.com/w80/cr.png', 'I'),
-- Grupo J
('ITA', 'Italia', 'https://flagcdn.com/w80/it.png', 'J'),
('BEL', 'Bélgica', 'https://flagcdn.com/w80/be.png', 'J'),
('DZA', 'Argelia', 'https://flagcdn.com/w80/dz.png', 'J'),
('HON', 'Honduras', 'https://flagcdn.com/w80/hn.png', 'J'),
-- Grupo K
('GER', 'Alemania', 'https://flagcdn.com/w80/de.png', 'K'),
('CRO', 'Croacia', 'https://flagcdn.com/w80/hr.png', 'K'),
('MLI', 'Mali', 'https://flagcdn.com/w80/ml.png', 'K'),
('PAN', 'Panamá', 'https://flagcdn.com/w80/pa.png', 'K'),
-- Grupo L
('AUT', 'Austria', 'https://flagcdn.com/w80/at.png', 'L'),
('SUI', 'Suiza', 'https://flagcdn.com/w80/ch.png', 'L'),
('ZAF', 'Sudáfrica', 'https://flagcdn.com/w80/za.png', 'L'),
('JAM', 'Jamaica', 'https://flagcdn.com/w80/jm.png', 'L')
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

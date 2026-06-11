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

-- 2. Generar el Fixture y Rondas Eliminatorias
DO $$
DECLARE
    m_date TIMESTAMPTZ;
    stage_name TEXT := 'GROUPS';
    i INT;
BEGIN
    -- Eliminar partidos existentes si se vuelve a correr
    DELETE FROM matches;

    -- A. FASE DE GRUPOS (72 partidos del fixture oficial)
    INSERT INTO matches (id, home_team_id, away_team_id, stage, match_date, status) VALUES
    -- Jueves 11 de junio
    (1, 'MEX', 'ZAF', 'GROUPS', '2026-06-11 14:00:00-05', 'SCHEDULED'),
    (2, 'KOR', 'CZE', 'GROUPS', '2026-06-11 21:00:00-05', 'SCHEDULED'),
    -- Viernes 12 de junio
    (3, 'CAN', 'BIH', 'GROUPS', '2026-06-12 14:00:00-05', 'SCHEDULED'),
    (4, 'USA', 'PAR', 'GROUPS', '2026-06-12 20:00:00-05', 'SCHEDULED'),
    -- Sábado 13 de junio
    (5, 'QAT', 'SUI', 'GROUPS', '2026-06-13 14:00:00-05', 'SCHEDULED'),
    (6, 'BRA', 'MAR', 'GROUPS', '2026-06-13 17:00:00-05', 'SCHEDULED'),
    (7, 'HAI', 'SCO', 'GROUPS', '2026-06-13 20:00:00-05', 'SCHEDULED'),
    (8, 'AUS', 'TUR', 'GROUPS', '2026-06-13 23:00:00-05', 'SCHEDULED'),
    -- Domingo 14 de junio
    (9, 'GER', 'CUW', 'GROUPS', '2026-06-14 12:00:00-05', 'SCHEDULED'),
    (10, 'NED', 'JPN', 'GROUPS', '2026-06-14 15:00:00-05', 'SCHEDULED'),
    (11, 'CIV', 'ECU', 'GROUPS', '2026-06-14 18:00:00-05', 'SCHEDULED'),
    (12, 'SWE', 'TUN', 'GROUPS', '2026-06-14 21:00:00-05', 'SCHEDULED'),
    -- Lunes 15 de junio
    (13, 'ESP', 'CPV', 'GROUPS', '2026-06-15 11:00:00-05', 'SCHEDULED'),
    (14, 'BEL', 'EGY', 'GROUPS', '2026-06-15 14:00:00-05', 'SCHEDULED'),
    (15, 'KSA', 'URU', 'GROUPS', '2026-06-15 17:00:00-05', 'SCHEDULED'),
    (16, 'IRN', 'NZL', 'GROUPS', '2026-06-15 20:00:00-05', 'SCHEDULED'),
    -- Martes 16 de junio
    (17, 'FRA', 'SEN', 'GROUPS', '2026-06-16 14:00:00-05', 'SCHEDULED'),
    (18, 'IRQ', 'NOR', 'GROUPS', '2026-06-16 17:00:00-05', 'SCHEDULED'),
    (19, 'ARG', 'DZA', 'GROUPS', '2026-06-16 20:00:00-05', 'SCHEDULED'),
    (20, 'AUT', 'JOR', 'GROUPS', '2026-06-16 23:00:00-05', 'SCHEDULED'),
    -- Miércoles 17 de junio
    (21, 'POR', 'COD', 'GROUPS', '2026-06-17 12:00:00-05', 'SCHEDULED'),
    (22, 'ENG', 'CRO', 'GROUPS', '2026-06-17 15:00:00-05', 'SCHEDULED'),
    (23, 'GHA', 'PAN', 'GROUPS', '2026-06-17 18:00:00-05', 'SCHEDULED'),
    (24, 'UZB', 'COL', 'GROUPS', '2026-06-17 21:00:00-05', 'SCHEDULED'),
    -- Jueves 18 de junio
    (25, 'CZE', 'ZAF', 'GROUPS', '2026-06-18 11:00:00-05', 'SCHEDULED'),
    (26, 'SUI', 'BIH', 'GROUPS', '2026-06-18 14:00:00-05', 'SCHEDULED'),
    (27, 'CAN', 'QAT', 'GROUPS', '2026-06-18 17:00:00-05', 'SCHEDULED'),
    (28, 'MEX', 'KOR', 'GROUPS', '2026-06-18 20:00:00-05', 'SCHEDULED'),
    -- Viernes 19 de junio
    (29, 'USA', 'AUS', 'GROUPS', '2026-06-19 14:00:00-05', 'SCHEDULED'),
    (30, 'SCO', 'MAR', 'GROUPS', '2026-06-19 17:00:00-05', 'SCHEDULED'),
    (31, 'BRA', 'HAI', 'GROUPS', '2026-06-19 19:30:00-05', 'SCHEDULED'),
    (32, 'TUR', 'PAR', 'GROUPS', '2026-06-19 22:00:00-05', 'SCHEDULED'),
    -- Sábado 20 de junio
    (33, 'NED', 'SWE', 'GROUPS', '2026-06-20 12:00:00-05', 'SCHEDULED'),
    (34, 'GER', 'CIV', 'GROUPS', '2026-06-20 15:00:00-05', 'SCHEDULED'),
    (35, 'ECU', 'CUW', 'GROUPS', '2026-06-20 19:00:00-05', 'SCHEDULED'),
    (36, 'TUN', 'JPN', 'GROUPS', '2026-06-20 23:00:00-05', 'SCHEDULED'),
    -- Domingo 21 de junio
    (37, 'ESP', 'KSA', 'GROUPS', '2026-06-21 11:00:00-05', 'SCHEDULED'),
    (38, 'BEL', 'IRN', 'GROUPS', '2026-06-21 14:00:00-05', 'SCHEDULED'),
    (39, 'URU', 'CPV', 'GROUPS', '2026-06-21 17:00:00-05', 'SCHEDULED'),
    (40, 'NZL', 'EGY', 'GROUPS', '2026-06-21 20:00:00-05', 'SCHEDULED'),
    -- Lunes 22 de junio
    (41, 'ARG', 'AUT', 'GROUPS', '2026-06-22 12:00:00-05', 'SCHEDULED'),
    (42, 'FRA', 'IRQ', 'GROUPS', '2026-06-22 16:00:00-05', 'SCHEDULED'),
    (43, 'NOR', 'SEN', 'GROUPS', '2026-06-22 19:00:00-05', 'SCHEDULED'),
    (44, 'JOR', 'DZA', 'GROUPS', '2026-06-22 22:00:00-05', 'SCHEDULED'),
    -- Martes 23 de junio
    (45, 'POR', 'UZB', 'GROUPS', '2026-06-23 12:00:00-05', 'SCHEDULED'),
    (46, 'ENG', 'GHA', 'GROUPS', '2026-06-23 15:00:00-05', 'SCHEDULED'),
    (47, 'PAN', 'CRO', 'GROUPS', '2026-06-23 18:00:00-05', 'SCHEDULED'),
    (48, 'COL', 'COD', 'GROUPS', '2026-06-23 21:00:00-05', 'SCHEDULED'),
    -- Miércoles 24 de junio
    (49, 'SUI', 'CAN', 'GROUPS', '2026-06-24 14:00:00-05', 'SCHEDULED'),
    (50, 'BIH', 'QAT', 'GROUPS', '2026-06-24 14:00:00-05', 'SCHEDULED'),
    (51, 'MAR', 'HAI', 'GROUPS', '2026-06-24 17:00:00-05', 'SCHEDULED'),
    (52, 'SCO', 'BRA', 'GROUPS', '2026-06-24 17:00:00-05', 'SCHEDULED'),
    (53, 'ZAF', 'KOR', 'GROUPS', '2026-06-24 20:00:00-05', 'SCHEDULED'),
    (54, 'CZE', 'MEX', 'GROUPS', '2026-06-24 20:00:00-05', 'SCHEDULED'),
    -- Jueves 25 de junio
    (55, 'CUW', 'CIV', 'GROUPS', '2026-06-25 15:00:00-05', 'SCHEDULED'),
    (56, 'ECU', 'GER', 'GROUPS', '2026-06-25 15:00:00-05', 'SCHEDULED'),
    (57, 'TUN', 'NED', 'GROUPS', '2026-06-25 18:00:00-05', 'SCHEDULED'),
    (58, 'JPN', 'SWE', 'GROUPS', '2026-06-25 18:00:00-05', 'SCHEDULED'),
    (59, 'TUR', 'USA', 'GROUPS', '2026-06-25 21:00:00-05', 'SCHEDULED'),
    (60, 'PAR', 'AUS', 'GROUPS', '2026-06-25 21:00:00-05', 'SCHEDULED'),
    -- Viernes 26 de junio
    (61, 'NOR', 'FRA', 'GROUPS', '2026-06-26 14:00:00-05', 'SCHEDULED'),
    (62, 'SEN', 'IRQ', 'GROUPS', '2026-06-26 14:00:00-05', 'SCHEDULED'),
    (63, 'CPV', 'KSA', 'GROUPS', '2026-06-26 19:00:00-05', 'SCHEDULED'),
    (64, 'URU', 'ESP', 'GROUPS', '2026-06-26 19:00:00-05', 'SCHEDULED'),
    (65, 'NZL', 'BEL', 'GROUPS', '2026-06-26 22:00:00-05', 'SCHEDULED'),
    (66, 'EGY', 'IRN', 'GROUPS', '2026-06-26 22:00:00-05', 'SCHEDULED'),
    -- Sábado 27 de junio
    (67, 'PAN', 'ENG', 'GROUPS', '2026-06-27 16:00:00-05', 'SCHEDULED'),
    (68, 'CRO', 'GHA', 'GROUPS', '2026-06-27 16:00:00-05', 'SCHEDULED'),
    (69, 'COL', 'POR', 'GROUPS', '2026-06-27 18:30:00-05', 'SCHEDULED'),
    (70, 'COD', 'UZB', 'GROUPS', '2026-06-27 18:30:00-05', 'SCHEDULED'),
    (71, 'DZA', 'AUT', 'GROUPS', '2026-06-27 21:00:00-05', 'SCHEDULED'),
    (72, 'JOR', 'ARG', 'GROUPS', '2026-06-27 21:00:00-05', 'SCHEDULED');

    -- B. RONDA DE 32 (16 partidos, del ID 73 al 88)
    stage_name := 'ROUND_32';
    m_date := '2026-06-28 12:00:00-05';
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

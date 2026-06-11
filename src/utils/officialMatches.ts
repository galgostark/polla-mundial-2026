export interface OfficialMatchRaw {
  id: number;
  home: string;
  away: string;
  date: string; // Formato: 'YYYY-MM-DD HH:mm:ss-05' (Hora de Perú)
}

export const officialMatchesRaw: OfficialMatchRaw[] = [
  // Jueves 11 de junio
  { id: 1, home: 'MEX', away: 'ZAF', date: '2026-06-11 14:00:00-05' },
  { id: 2, home: 'KOR', away: 'CZE', date: '2026-06-11 21:00:00-05' },
  
  // Viernes 12 de junio
  { id: 3, home: 'CAN', away: 'BIH', date: '2026-06-12 14:00:00-05' },
  { id: 4, home: 'USA', away: 'PAR', date: '2026-06-12 20:00:00-05' },
  
  // Sábado 13 de junio
  { id: 5, home: 'QAT', away: 'SUI', date: '2026-06-13 14:00:00-05' },
  { id: 6, home: 'BRA', away: 'MAR', date: '2026-06-13 17:00:00-05' },
  { id: 7, home: 'HAI', away: 'SCO', date: '2026-06-13 20:00:00-05' },
  { id: 8, home: 'AUS', away: 'TUR', date: '2026-06-13 23:00:00-05' },
  
  // Domingo 14 de junio
  { id: 9, home: 'GER', away: 'CUW', date: '2026-06-14 12:00:00-05' },
  { id: 10, home: 'NED', away: 'JPN', date: '2026-06-14 15:00:00-05' },
  { id: 11, home: 'CIV', away: 'ECU', date: '2026-06-14 18:00:00-05' },
  { id: 12, home: 'SWE', away: 'TUN', date: '2026-06-14 21:00:00-05' },
  
  // Lunes 15 de junio
  { id: 13, home: 'ESP', away: 'CPV', date: '2026-06-15 11:00:00-05' },
  { id: 14, home: 'BEL', away: 'EGY', date: '2026-06-15 14:00:00-05' },
  { id: 15, home: 'KSA', away: 'URU', date: '2026-06-15 17:00:00-05' },
  { id: 16, home: 'IRN', away: 'NZL', date: '2026-06-15 20:00:00-05' },
  
  // Martes 16 de junio
  { id: 17, home: 'FRA', away: 'SEN', date: '2026-06-16 14:00:00-05' },
  { id: 18, home: 'IRQ', away: 'NOR', date: '2026-06-16 17:00:00-05' },
  { id: 19, home: 'ARG', away: 'DZA', date: '2026-06-16 20:00:00-05' },
  { id: 20, home: 'AUT', away: 'JOR', date: '2026-06-16 23:00:00-05' },
  
  // Miércoles 17 de junio
  { id: 21, home: 'POR', away: 'COD', date: '2026-06-17 12:00:00-05' },
  { id: 22, home: 'ENG', away: 'CRO', date: '2026-06-17 15:00:00-05' },
  { id: 23, home: 'GHA', away: 'PAN', date: '2026-06-17 18:00:00-05' },
  { id: 24, home: 'UZB', away: 'COL', date: '2026-06-17 21:00:00-05' },
  
  // Jueves 18 de junio
  { id: 25, home: 'CZE', away: 'ZAF', date: '2026-06-18 11:00:00-05' },
  { id: 26, home: 'SUI', away: 'BIH', date: '2026-06-18 14:00:00-05' },
  { id: 27, home: 'CAN', away: 'QAT', date: '2026-06-18 17:00:00-05' },
  { id: 28, home: 'MEX', away: 'KOR', date: '2026-06-18 20:00:00-05' },
  
  // Viernes 19 de junio
  { id: 29, home: 'USA', away: 'AUS', date: '2026-06-19 14:00:00-05' },
  { id: 30, home: 'SCO', away: 'MAR', date: '2026-06-19 17:00:00-05' },
  { id: 31, home: 'BRA', away: 'HAI', date: '2026-06-19 19:30:00-05' },
  { id: 32, home: 'TUR', away: 'PAR', date: '2026-06-19 22:00:00-05' },
  
  // Sábado 20 de junio
  { id: 33, home: 'NED', away: 'SWE', date: '2026-06-20 12:00:00-05' },
  { id: 34, home: 'GER', away: 'CIV', date: '2026-06-20 15:00:00-05' },
  { id: 35, home: 'ECU', away: 'CUW', date: '2026-06-20 19:00:00-05' },
  { id: 36, home: 'TUN', away: 'JPN', date: '2026-06-20 23:00:00-05' },
  
  // Domingo 21 de junio
  { id: 37, home: 'ESP', away: 'KSA', date: '2026-06-21 11:00:00-05' },
  { id: 38, home: 'BEL', away: 'IRN', date: '2026-06-21 14:00:00-05' },
  { id: 39, home: 'URU', away: 'CPV', date: '2026-06-21 17:00:00-05' },
  { id: 40, home: 'NZL', away: 'EGY', date: '2026-06-21 20:00:00-05' },
  
  // Lunes 22 de junio
  { id: 41, home: 'ARG', away: 'AUT', date: '2026-06-22 12:00:00-05' },
  { id: 42, home: 'FRA', away: 'IRQ', date: '2026-06-22 16:00:00-05' },
  { id: 43, home: 'NOR', away: 'SEN', date: '2026-06-22 19:00:00-05' },
  { id: 44, home: 'JOR', away: 'DZA', date: '2026-06-22 22:00:00-05' },
  
  // Martes 23 de junio
  { id: 45, home: 'POR', away: 'UZB', date: '2026-06-23 12:00:00-05' },
  { id: 46, home: 'ENG', away: 'GHA', date: '2026-06-23 15:00:00-05' },
  { id: 47, home: 'PAN', away: 'CRO', date: '2026-06-23 18:00:00-05' },
  { id: 48, home: 'COL', away: 'COD', date: '2026-06-23 21:00:00-05' },
  
  // Miércoles 24 de junio
  { id: 49, home: 'SUI', away: 'CAN', date: '2026-06-24 14:00:00-05' },
  { id: 50, home: 'BIH', away: 'QAT', date: '2026-06-24 14:00:00-05' },
  { id: 51, home: 'MAR', away: 'HAI', date: '2026-06-24 17:00:00-05' },
  { id: 52, home: 'SCO', away: 'BRA', date: '2026-06-24 17:00:00-05' },
  { id: 53, home: 'ZAF', away: 'KOR', date: '2026-06-24 20:00:00-05' },
  { id: 54, home: 'CZE', away: 'MEX', date: '2026-06-24 20:00:00-05' },
  
  // Jueves 25 de junio
  { id: 55, home: 'CUW', away: 'CIV', date: '2026-06-25 15:00:00-05' },
  { id: 56, home: 'ECU', away: 'GER', date: '2026-06-25 15:00:00-05' },
  { id: 57, home: 'TUN', away: 'NED', date: '2026-06-25 18:00:00-05' },
  { id: 58, home: 'JPN', away: 'SWE', date: '2026-06-25 18:00:00-05' },
  { id: 59, home: 'TUR', away: 'USA', date: '2026-06-25 21:00:00-05' },
  { id: 60, home: 'PAR', away: 'AUS', date: '2026-06-25 21:00:00-05' },
  
  // Viernes 26 de junio
  { id: 61, home: 'NOR', away: 'FRA', date: '2026-06-26 14:00:00-05' },
  { id: 62, home: 'SEN', away: 'IRQ', date: '2026-06-26 14:00:00-05' },
  { id: 63, home: 'CPV', away: 'KSA', date: '2026-06-26 19:00:00-05' },
  { id: 64, home: 'URU', away: 'ESP', date: '2026-06-26 19:00:00-05' },
  { id: 65, home: 'NZL', away: 'BEL', date: '2026-06-26 22:00:00-05' },
  { id: 66, home: 'EGY', away: 'IRN', date: '2026-06-26 22:00:00-05' },
  
  // Sábado 27 de junio
  { id: 67, home: 'PAN', away: 'ENG', date: '2026-06-27 16:00:00-05' },
  { id: 68, home: 'CRO', away: 'GHA', date: '2026-06-27 16:00:00-05' },
  { id: 69, home: 'COL', away: 'POR', date: '2026-06-27 18:30:00-05' },
  { id: 70, home: 'COD', away: 'UZB', date: '2026-06-27 18:30:00-05' },
  { id: 71, home: 'DZA', away: 'AUT', date: '2026-06-27 21:00:00-05' },
  { id: 72, home: 'JOR', away: 'ARG', date: '2026-06-27 21:00:00-05' }
];

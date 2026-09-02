// Manual declaration — the package ships a root-level .d.ts that its
// "exports" map does not resolve, so TypeScript falls back to `any`.
// Mirrors the public surface we use (see node_modules/solarlunar/solarlunar.d.ts).

declare module 'solarlunar' {
  export interface SolarLunarResult {
    lYear: number;
    lMonth: number;
    lDay: number;
    animal: string;
    yearCn: string;
    monthCn: string;
    dayCn: string;
    cYear: number;
    cMonth: number;
    cDay: number;
    gzYear: string;
    gzMonth: string;
    gzDay: string;
    isToday: boolean;
    isLeap: boolean;
    nWeek: number;
    ncWeek: string;
    isTerm: boolean;
    term: string;
  }

  const solarLunar: {
    lunar2solar(year: number, month: number, day: number, isLeapMonth: boolean): SolarLunarResult;
    solar2lunar(year: number, month: number, day: number): SolarLunarResult;
    getFestivals(year: number, month: number, day: number): string[];
  };

  export default solarLunar;
}

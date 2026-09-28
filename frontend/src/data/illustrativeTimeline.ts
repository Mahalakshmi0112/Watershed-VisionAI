// TODO_REMOVE_BOOTSTRAP: illustrative data, not measured. Delete this
// file and the components that import it once real multi-year data exists.

import { LulcChangeItem } from '../types';

export interface TimelineDataPoint {
  year: '2005-06' | '2009-10' | '2013-14' | '2018-19' | '2030';
  area: number;
  measuredArea: number | null;
  projectedArea: number;
  isIllustrative: boolean;
  label: string;
}

export interface ClassTimelineSeries {
  className: string;
  points: TimelineDataPoint[];
  t0_area_sqkm: number;
  t1_area_sqkm: number;
  change_sqkm: number;
  change_pct: number;
  projected_2030_sqkm: number;
  projected_2030_change_sqkm: number;
  projected_2030_change_pct: number;
}

export interface TimelineSummaryRow {
  className: string;
  t0_area_sqkm: number;
  t1_area_sqkm: number;
  change_sqkm: number;
  change_pct: number;
  projected_2030_sqkm: number;
  projected_2030_change_sqkm: number;
  projected_2030_change_pct: number;
  isIllustrative: true;
}

/**
 * Linearly interpolates and extrapolates a single LULC class across:
 * - 2005-06: Measured (Real)
 * - 2009-10: Interpolated (Illustrative)
 * - 2013-14: Interpolated (Illustrative, Project start marker)
 * - 2018-19: Measured (Real)
 * - 2030: Extrapolated trend clamped at >= 0 (Illustrative)
 */
export function computeClassTimeline(changeItem: LulcChangeItem): ClassTimelineSeries {
  const t0 = Number(changeItem.t0_area_sqkm) || 0;
  const t1 = Number(changeItem.t1_area_sqkm) || 0;
  
  // Span between 2005-06 and 2018-19 is 13 years
  const annualSlope = (t1 - t0) / 13.0;

  // 2009-10 is +4 years from 2005-06
  const v2009_10 = Math.max(0, Number((t0 + annualSlope * 4.0).toFixed(2)));

  // 2013-14 is +8 years from 2005-06 (IWMP-24 start)
  const v2013_14 = Math.max(0, Number((t0 + annualSlope * 8.0).toFixed(2)));

  // 2030 is +11.5 years from 2018-19 (or +24.5 from 2005-06)
  const v2030 = Math.max(0, Number((t1 + annualSlope * 11.5).toFixed(2)));

  const projChangeSqkm = Number((v2030 - t0).toFixed(2));
  const projChangePct = t0 > 0 ? Number(((projChangeSqkm / t0) * 100).toFixed(1)) : 0;

  const points: TimelineDataPoint[] = [
    {
      year: '2005-06',
      area: t0,
      measuredArea: t0,
      projectedArea: t0,
      isIllustrative: false,
      label: '2005-06 (Measured)'
    },
    {
      year: '2009-10',
      area: v2009_10,
      measuredArea: null,
      projectedArea: v2009_10,
      isIllustrative: true,
      label: '2009-10 (Interpolated)'
    },
    {
      year: '2013-14',
      area: v2013_14,
      measuredArea: null,
      projectedArea: v2013_14,
      isIllustrative: true,
      label: '2013-14 (Project start)'
    },
    {
      year: '2018-19',
      area: t1,
      measuredArea: t1,
      projectedArea: t1,
      isIllustrative: false,
      label: '2018-19 (Measured)'
    },
    {
      year: '2030',
      area: v2030,
      measuredArea: null,
      projectedArea: v2030,
      isIllustrative: true,
      label: '2030 (Projected)'
    }
  ];

  return {
    className: changeItem.class,
    points,
    t0_area_sqkm: t0,
    t1_area_sqkm: t1,
    change_sqkm: Number(changeItem.change_sqkm) || Number((t1 - t0).toFixed(2)),
    change_pct: Number(changeItem.change_pct) || (t0 > 0 ? Number((((t1 - t0) / t0) * 100).toFixed(1)) : 0),
    projected_2030_sqkm: v2030,
    projected_2030_change_sqkm: projChangeSqkm,
    projected_2030_change_pct: projChangePct
  };
}

/**
 * Computes the complete timeline summary table rows for all classes
 */
export function computeTimelineSummaryTable(changes: LulcChangeItem[]): TimelineSummaryRow[] {
  return changes.map(item => {
    const timeline = computeClassTimeline(item);
    return {
      className: timeline.className,
      t0_area_sqkm: timeline.t0_area_sqkm,
      t1_area_sqkm: timeline.t1_area_sqkm,
      change_sqkm: timeline.change_sqkm,
      change_pct: timeline.change_pct,
      projected_2030_sqkm: timeline.projected_2030_sqkm,
      projected_2030_change_sqkm: timeline.projected_2030_change_sqkm,
      projected_2030_change_pct: timeline.projected_2030_change_pct,
      isIllustrative: true
    };
  });
}

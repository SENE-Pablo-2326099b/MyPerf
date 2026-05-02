import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type BodyMetric from '@/db/models/BodyMetric';

export function useBodyMetrics(): BodyMetric[] {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);

  useEffect(() => {
    const sub = database
      .get<BodyMetric>('body_metrics')
      .query(Q.sortBy('recorded_at', Q.desc))
      .observe()
      .subscribe(setMetrics);
    return () => sub.unsubscribe();
  }, []);

  return metrics;
}

import React from 'react';
import styles from './OverviewSection.module.css';

interface BranchMetric {
  icon: React.ReactNode;
  trend: 'up' | 'down';
  change: string;
  value: string | number;
  label: string;
}

interface DashboardData {
  branch_metrics?: BranchMetric[];
}

function OverviewSection({ dashboardData }: { dashboardData?: DashboardData }) {
  const branchMetrics = dashboardData?.branch_metrics || [];

  // Show empty state if no data
  if (branchMetrics.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateText}>No branch metrics available</p>
      </div>
    );
  }

  return (
    <>
      {/* Branch Metrics */}
      <div className={styles.metricsGrid}>
        {branchMetrics.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.metricCardHeader}>
              <div className={styles.metricIcon}>
                {metric.icon}
              </div>
              <div className={`${styles.trendBadge} ${metric.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                {metric.change}
              </div>
            </div>
            <div className={styles.metricValue}>
              {metric.value}
            </div>
            <div className={styles.metricLabel}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default OverviewSection;

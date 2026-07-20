// Ta Panda Business OS — Analytics (range-aware charts)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;

  let range = '30d';
  const RANGE_LABEL = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' };
  const REACH_BASE = { '7d': 18200, '30d': 74300, '90d': 214800 };
  const ENGAGEMENT = { '7d': '6.8%', '30d': '7.2%', '90d': '7.5%' };

  function renderKPIs() {
    const series = D.ANALYTICS[range];
    const leads = series.leadGeneration.reduce((s, p) => s + p.v, 0);
    const avgApproval = (series.approvalVelocity.reduce((s, p) => s + p.v, 0) / series.approvalVelocity.length).toFixed(1);

    window.OS.renderKPICards(document.getElementById('anKpiStrip'), [
      { label: 'Total Reach', value: REACH_BASE[range].toLocaleString(), bg: 'var(--status-info-bg)', color: 'var(--status-info-text)', trend: 'up', trendText: RANGE_LABEL[range], icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' },
      { label: 'Engagement Rate', value: ENGAGEMENT[range], bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)', trend: 'up', trendText: RANGE_LABEL[range], icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' },
      { label: 'Leads Generated', value: leads, bg: 'var(--status-success-bg)', color: 'var(--status-success-text)', trend: 'up', trendText: RANGE_LABEL[range], icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>' },
      { label: 'Avg Approval Time', value: avgApproval + 'h', bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', trendText: RANGE_LABEL[range], icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' }
    ]);
  }

  function renderCharts() {
    const series = D.ANALYTICS[range];
    ['anRangeNote1', 'anRangeNote2', 'anRangeNote3', 'anRangeNote4'].forEach((id) => document.getElementById(id).textContent = RANGE_LABEL[range]);

    OSCharts.line(document.getElementById('anChartPublishingTrend'), series.publishingTrend, { height: 200 });
    OSCharts.donut(document.getElementById('anChartContentMix'), D.ANALYTICS.contentMix, { size: 150, centerValue: D.CONTENT_ITEMS.length, centerLabel: 'Items' });
    OSCharts.donut(document.getElementById('anChartPlatform'), D.ANALYTICS.platformDistribution, { size: 150, centerLabel: 'Platforms' });
    OSCharts.line(document.getElementById('anChartLeads'), series.leadGeneration, { height: 180, color: 'var(--status-success-text)' });
    OSCharts.bar(document.getElementById('anChartApproval'), series.approvalVelocity, { height: 180, formatValue: (v) => v + 'h' });
    OSCharts.bar(document.getElementById('anChartProduction'), series.productionVelocity, { height: 180, color: 'var(--status-info-text)' });
    OSCharts.bar(document.getElementById('anChartMonthly'), D.ANALYTICS.monthlyPerformance, { height: 200 });
    OSCharts.hbar(document.getElementById('anChartContentType'), D.ANALYTICS.contentTypeAnalysis, { formatValue: (v) => v + '%' });
    OSCharts.heatmap(document.getElementById('anChartFrequency'), D.ANALYTICS.publicationFrequency);
  }

  document.getElementById('anRangeSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    range = btn.dataset.range;
    document.querySelectorAll('#anRangeSwitch button').forEach((b) => b.classList.toggle('active', b === btn));
    renderKPIs();
    renderCharts();
  });

  renderKPIs();
  renderCharts();
});

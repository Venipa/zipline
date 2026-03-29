import { Metric } from '@/lib/db/models/metric';
import { ChartTooltip, LineChart } from '@mantine/charts';
import { Paper, Title } from '@mantine/core';
import { defaultChartProps } from '../statsHelpers';

export default function ViewsGraph({ metrics }: { metrics: Metric[] }) {
  const sortedMetrics = metrics.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Paper radius='sm' withBorder p='sm'>
      <Title order={3}>Views</Title>
      <LineChart
        data={sortedMetrics.map((metric) => ({
          date: new Date(metric.createdAt).getTime(),
          files: metric.data.fileViews,
          urls: metric.data.urlViews,
        }))}
        series={[
          {
            name: 'files',
            label: 'Files',
            color: 'blue',
          },
          {
            name: 'urls',
            label: 'URLs',
            color: 'green',
          },
        ]}
        xAxisProps={{
          tickFormatter: (v) => new Date(v).toLocaleString(),
        }}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip
              label={new Date(label).toLocaleString()}
              payload={payload}
              series={[
                { name: 'files', label: 'Files' },
                { name: 'urls', label: 'URLs' },
              ]}
              valueFormatter={(v) => v + ` view${v === 1 ? '' : 's'}`}
            />
          ),
        }}
        {...defaultChartProps}
      />
    </Paper>
  );
}

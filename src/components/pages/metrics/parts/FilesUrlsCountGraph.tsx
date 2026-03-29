import { Metric } from '@/lib/db/models/metric';
import { ChartTooltip, LineChart } from '@mantine/charts';
import { Paper, Title } from '@mantine/core';
import { defaultChartProps } from '../statsHelpers';

export default function FilesUrlsCountGraph({ metrics }: { metrics: Metric[] }) {
  const sortedMetrics = metrics.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Paper radius='sm' withBorder p='sm'>
      <Title order={3}>Count</Title>

      <LineChart
        data={sortedMetrics.map((metric) => ({
          date: new Date(metric.createdAt).getTime(),
          files: metric.data.files,
          urls: metric.data.urls,
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
            />
          ),
        }}
        {...defaultChartProps}
      />
    </Paper>
  );
}

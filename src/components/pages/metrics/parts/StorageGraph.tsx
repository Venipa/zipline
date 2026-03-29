import { bytes } from '@/lib/bytes';
import { Metric } from '@/lib/db/models/metric';
import { LineChart, ChartTooltip } from '@mantine/charts';
import { Paper, Title } from '@mantine/core';
import { defaultChartProps } from '../statsHelpers';

export default function StorageGraph({ metrics }: { metrics: Metric[] }) {
  const sortedMetrics = metrics.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Paper radius='sm' withBorder p='sm' mt='md'>
      <Title order={3} mb='sm'>
        Storage Used
      </Title>

      <LineChart
        data={sortedMetrics.map((metric) => ({
          date: new Date(metric.createdAt).getTime(),
          storage: metric.data.storage,
        }))}
        series={[
          {
            name: 'storage',
            label: 'Storage Used',
          },
        ]}
        valueFormatter={(v) => bytes(Number(v))}
        xAxisProps={{
          tickFormatter: (v) => new Date(v).toLocaleString(),
        }}
        tooltipProps={{
          content: ({ label, payload }) => (
            <ChartTooltip
              label={new Date(label).toLocaleString()}
              payload={payload}
              valueFormatter={(v) => bytes(Number(v))}
              series={[{ name: 'storage', label: 'Storage Used' }]}
            />
          ),
        }}
        {...defaultChartProps}
        withLegend={false}
      />
    </Paper>
  );
}

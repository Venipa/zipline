import { bytes } from '@/lib/bytes';
import { Metric } from '@/lib/db/models/metric';
import { Group, Paper, rgba, SimpleGrid, Skeleton, Text } from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconDatabase,
  IconEyeFilled,
  IconFiles,
  IconLink,
  IconUsers,
  Icon as TablerIcon,
} from '@tabler/icons-react';
import { percentChange } from '../statsHelpers';

function StatCard({
  title,
  first,
  last,
  formatter,
  Icon,
}: {
  title: string;
  first: number;
  last: number;
  Icon: TablerIcon;
  formatter?: (value: number) => string;
}) {
  const [color, percentStr] = percentChange(last, first);

  const ChangeIcon = {
    green: IconArrowUp,
    red: IconArrowDown,
    gray: null,
  }[color];

  return (
    <Paper radius='sm' withBorder p='sm'>
      <Group justify='space-between'>
        <Text size='xl' fw='bolder'>
          {title}
        </Text>

        <Icon size='1.2rem' />
      </Group>

      <Group justify='flex-start' gap='xs'>
        <Text size='xl' fw='bolder'>
          {formatter ? formatter(first) : first}
        </Text>

        <Paper
          c={color}
          py={2}
          pl={5}
          pr={8}
          radius='sm'
          display='flex'
          bg={rgba(`var(--mantine-color-${color}-6)`, 0.25)}
        >
          <Group gap={2} align='center'>
            {ChangeIcon && <ChangeIcon size={20} stroke={1.5} />}
            <Text c={color} fz='sm' fw={500}>
              {percentStr}
            </Text>
          </Group>
        </Paper>
      </Group>
    </Paper>
  );
}

export function StatsCardsSkeleton() {
  return (
    <SimpleGrid
      cols={{
        base: 1,
        md: 2,
        lg: 3,
      }}
      mb='sm'
    >
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={100} animate />
      ))}
    </SimpleGrid>
  );
}

export default function StatsCards({ data }: { data: Metric[] }) {
  if (!data.length) return null;
  const sortedMetrics = data.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const recent = sortedMetrics[0];
  const last = sortedMetrics[sortedMetrics.length - 1];

  return (
    <SimpleGrid
      cols={{
        base: 1,
        md: 2,
        lg: 3,
      }}
      mb='sm'
    >
      <StatCard title='Files' first={recent.data.files} last={last.data.files} Icon={IconFiles} />
      <StatCard title='URLs' first={recent.data.urls} last={last.data.urls} Icon={IconLink} />
      <StatCard
        title='Storage Used'
        first={recent.data.storage}
        last={last.data.storage}
        formatter={bytes}
        Icon={IconDatabase}
      />
      <StatCard title='Users' first={recent.data.users} last={last.data.users} Icon={IconUsers} />
      <StatCard
        title='File Views'
        first={recent.data.fileViews}
        last={last.data.fileViews}
        Icon={IconEyeFilled}
      />
      <StatCard
        title='URL Views'
        first={recent.data.urlViews}
        last={last.data.urlViews}
        Icon={IconEyeFilled}
      />
    </SimpleGrid>
  );
}

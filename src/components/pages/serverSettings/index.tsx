import { Response } from '@/lib/api/response';
import { Alert, Anchor, Collapse, Group, SimpleGrid, Skeleton, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useSWR from 'swr';
import { lazy, Suspense, useMemo } from 'react';

const Core = lazy(() => import('./parts/Core'));
const Chunks = lazy(() => import('./parts/Chunks'));
const Discord = lazy(() => import('./parts/Discord'));
const Domains = lazy(() => import('./parts/Domains'));
const Features = lazy(() => import('./parts/Features'));
const Files = lazy(() => import('./parts/Files'));
const HttpWebhook = lazy(() => import('./parts/HttpWebhook'));
const Invites = lazy(() => import('./parts/Invites'));
const Mfa = lazy(() => import('./parts/Mfa'));
const Oauth = lazy(() => import('./parts/Oauth'));
const PWA = lazy(() => import('./parts/PWA'));
const Ratelimit = lazy(() => import('./parts/Ratelimit'));
const Tasks = lazy(() => import('./parts/Tasks'));
const Urls = lazy(() => import('./parts/Urls'));
const Website = lazy(() => import('./parts/Website'));

function SettingsSkeleton() {
  return Array(17)
    .fill(null)
    .map((_, index) => <Skeleton key={index} height={280} animate />);
}

export default function DashboardServerSettings() {
  const { data, isLoading, error } = useSWR<Response['/api/server/settings']>('/api/server/settings');
  const [opened, { toggle }] = useDisclosure(false);

  const scrollToSetting = useMemo(() => {
    return (setting: string) => {
      const input = document.querySelector<HTMLInputElement>(`[data-path="${setting}"]`);
      const parent = input?.parentElement?.parentElement;
      if (!input || !parent) return;

      parent.style.transition = 'all 0.4s ease';
      parent.style.borderRadius = 'var(--mantine-radius-xs)';
      parent.style.outline = '2px solid var(--mantine-primary-color-filled)';
      parent.style.outlineOffset = 'var(--mantine-spacing-xs)';

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.length === 0) return;
          if (!entries[0].isIntersecting) return;

          observer.disconnect();
          setTimeout(() => {
            parent.style.outline = '0 solid transparent';
            parent.style.outlineOffset = '0';
            parent.style.borderRadius = '0';
          }, 2000);
        },
        { threshold: 1.0 },
      );
      observer.observe(input);

      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    };
  }, []);

  const onTamperedClick = (e: React.MouseEvent<HTMLAnchorElement>, setting: string) => {
    e.preventDefault();

    scrollToSetting(setting);
  };

  return (
    <>
      <Group gap='sm'>
        <Title order={1}>Server Settings</Title>
      </Group>

      {(data?.tampered?.length ?? 0) > 0 && (
        <Alert color='red' title='Environment Variable Settings' mt='md'>
          <strong>{data!.tampered.length}</strong> setting{data!.tampered.length > 1 ? 's' : ''} have been set
          via environment variables, therefore any changes made to them on this page will not take effect
          unless the environment variable corresponding to the setting is removed. If you prefer using
          environment variables, you can ignore this message. Click{' '}
          <Anchor onClick={toggle} size='sm'>
            here
          </Anchor>{' '}
          to {opened ? 'close' : 'view'} the list of overridden settings.
          <Collapse in={opened} transitionDuration={200}>
            <ul>
              {data!.tampered.map((setting) => (
                <li key={setting}>
                  <Anchor onClick={(e) => onTamperedClick(e, setting)}>{setting}</Anchor>
                </li>
              ))}
            </ul>
          </Collapse>
        </Alert>
      )}

      <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
        {error ? (
          <div>Error loading server settings</div>
        ) : (
          <Suspense fallback={<SettingsSkeleton />}>
            <Core swr={{ data, isLoading }} />
            <Chunks swr={{ data, isLoading }} />
            <Tasks swr={{ data, isLoading }} />
            <Mfa swr={{ data, isLoading }} />

            <Features swr={{ data, isLoading }} />
            <Files swr={{ data, isLoading }} />
            <Stack>
              <Urls swr={{ data, isLoading }} />
              <Invites swr={{ data, isLoading }} />
            </Stack>

            <Ratelimit swr={{ data, isLoading }} />
            <Stack>
              <Website swr={{ data, isLoading }} />
              <PWA swr={{ data, isLoading }} />
            </Stack>
            <Oauth swr={{ data, isLoading }} />

            <HttpWebhook swr={{ data, isLoading }} />

            <Domains swr={{ data, isLoading }} />
          </Suspense>
        )}
      </SimpleGrid>

      <Stack mt='md' gap='md'>
        {error ? null : <Discord swr={{ data, isLoading }} />}
      </Stack>
    </>
  );
}

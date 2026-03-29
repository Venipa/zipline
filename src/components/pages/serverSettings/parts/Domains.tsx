import { Response } from '@/lib/api/response';
import { ActionIcon, Group, LoadingOverlay, Paper, Table, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsOnSubmit } from '../settingsOnSubmit';

export default function Domains({
  swr: { data, isLoading },
}: {
  swr: {
    data: Response['/api/server/settings'] | undefined;
    isLoading: boolean;
  };
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    // using 'domains' here so that settingsOnSubmit picks up errors correctly
    initialValues: { domains: '' },
  });

  const submitSettings = settingsOnSubmit(navigate, form);

  const domains = Array.isArray(data?.settings.domains) ? data!.settings.domains.map(String) : [];

  async function updateDomains(nextDomains: string[]) {
    setSubmitting(true);

    try {
      const error = await submitSettings({ domains: nextDomains });
      if (!error) form.setFieldValue('domains', '');
    } catch (err: any) {
      form.setFieldError('domains', err?.message ?? err?.error ?? 'Failed to update domains');
    } finally {
      setSubmitting(false);
    }
  }

  const addDomain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const domain = form.values.domains.trim();
    if (!domain) return;

    if (domains.includes(domain)) return form.setFieldError('domains', 'This domain already exists');

    await updateDomains([...domains, domain]);
  };

  const removeDomain = async (domain: string) => {
    await updateDomains(domains.filter((d) => d !== domain));
  };

  return (
    <Paper withBorder p='sm' pos='relative'>
      <LoadingOverlay visible={isLoading || submitting} />

      <Title order={2}>Domains</Title>

      <form onSubmit={addDomain}>
        <Group mt='md' align='flex-end'>
          <TextInput
            description='Enter a domain name'
            placeholder='example.com'
            flex={1}
            {...form.getInputProps('domains')}
          />
          <ActionIcon type='submit' color='blue' size='lg' variant='filled' disabled={submitting}>
            <IconPlus size='1.25rem' />
          </ActionIcon>
        </Group>
      </form>

      {domains.length > 0 ? (
        <Paper withBorder p={0} mt='md'>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Domain</Table.Th>
                <Table.Th w={30}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {domains.map((domain) => (
                <Table.Tr key={domain}>
                  <Table.Td>
                    <Text fw={500} truncate>
                      {domain}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color='red' onClick={() => removeDomain(domain)} disabled={submitting}>
                      <IconTrash size='1.25rem' />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Text mt='md' c='dimmed'>
          No domains added yet.
        </Text>
      )}
    </Paper>
  );
}

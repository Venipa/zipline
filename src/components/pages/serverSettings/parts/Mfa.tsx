import { Response } from '@/lib/api/response';
import { Button, LoadingOverlay, Paper, SimpleGrid, Switch, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsOnSubmit } from '../settingsOnSubmit';

export default function Mfa({
  swr: { data, isLoading },
}: {
  swr: { data: Response['/api/server/settings'] | undefined; isLoading: boolean };
}) {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      mfaTotpEnabled: false,
      mfaTotpIssuer: 'Zipline',
      mfaPasskeysEnabled: false,
      mfaPasskeysRpID: '',
      mfaPasskeysOrigin: '',
    },
    enhanceGetInputProps: (payload) => ({
      disabled: data?.tampered?.includes(payload.field) || false,
    }),
  });

  const onSubmit = settingsOnSubmit(navigate, form);

  useEffect(() => {
    if (!data) return;

    form.setValues({
      mfaTotpEnabled: data.settings.mfaTotpEnabled ?? false,
      mfaTotpIssuer: data.settings.mfaTotpIssuer ?? 'Zipline',
      mfaPasskeysEnabled: data.settings.mfaPasskeysEnabled ?? false,
      mfaPasskeysRpID: data.settings.mfaPasskeysRpID ?? '',
      mfaPasskeysOrigin: data.settings.mfaPasskeysOrigin ?? '',
    });
  }, [data]);

  return (
    <Paper withBorder p='sm' pos='relative'>
      <LoadingOverlay visible={isLoading} />

      <Title order={2}>Multi-Factor Authentication</Title>

      <form onSubmit={form.onSubmit(onSubmit)}>
        <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
          <Switch
            label='Passkeys'
            description='Enable the use of passwordless login with the use of WebAuthn passkeys like your phone, security keys, etc.'
            {...form.getInputProps('mfaPasskeysEnabled', { type: 'checkbox' })}
          />

          <TextInput
            label='Relying Party ID'
            description='The Relying Party ID (RP ID) to use for WebAuthn passkeys.'
            placeholder='example.com'
            {...form.getInputProps('mfaPasskeysRpID')}
          />

          <TextInput
            label='Origin'
            description='The Origin to use for WebAuthn passkeys.'
            placeholder='https://example.com'
            {...form.getInputProps('mfaPasskeysOrigin')}
          />

          <Switch
            label='Enable TOTP'
            description='Enable Time-based One-Time Passwords with the use of an authenticator app.'
            {...form.getInputProps('mfaTotpEnabled', { type: 'checkbox' })}
          />
          <TextInput
            label='Issuer'
            description='The issuer to use for the TOTP token.'
            placeholder='Zipline'
            {...form.getInputProps('mfaTotpIssuer')}
          />
        </SimpleGrid>

        <Button type='submit' mt='md' loading={isLoading} leftSection={<IconDeviceFloppy size='1rem' />}>
          Save
        </Button>
      </form>
    </Paper>
  );
}

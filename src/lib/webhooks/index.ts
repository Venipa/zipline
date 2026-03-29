import { Config } from '../config/validate';
import { onShorten as discordOnShorten, onUpload as discordOnUpload } from './discord';
import { onShorten as httpOnShorten, onUpload as httpOnUpload } from './http';
import { onUpload as thumbnailOnUpload } from './thumbnail';

export async function onUpload(config: Config, args: Parameters<typeof discordOnUpload>[1]) {
  Promise.all([discordOnUpload(config, args), httpOnUpload(config, args), thumbnailOnUpload(config, args)]);

  return;
}

export async function onShorten(config: Config, args: Parameters<typeof discordOnShorten>[1]) {
  Promise.all([discordOnShorten(config, args), httpOnShorten(config, args)]);

  return;
}

import type { Config } from "@/lib/config/validate";
import type { File } from "@/lib/db/models/file";
import type { User } from "@/lib/db/models/user";
import Logger from "@/lib/logger";
import type { ParseValue } from "@/lib/parser";
import { generateThumbnail } from "@/offload/thumbnails";

const log = new Logger('webhooks').c('thumbnail');
export async function onUpload(
  config: Config,
  { file }: { user: User; file: File; link: ParseValue['link'] },
) {
  if (!file || !file.type.startsWith('video/')) return;
  if (!config.features.thumbnails.onUpload) return;
  const datasource = global.__datasource__;
  if (!datasource) return;
  try {
    return await generateThumbnail(config, datasource, [file.id]);

  } catch (error) {
    log.error('failed to generate thumbnail', { error });
    return;
  }
}
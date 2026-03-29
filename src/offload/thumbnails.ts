import { bytes } from '@/lib/bytes';
import { Config } from '@/lib/config/validate';
import { getDatasource } from '@/lib/datasource';
import { Datasource } from '@/lib/datasource/Datasource';
import type { File } from '@/lib/db/models/file';
import { log } from '@/lib/logger';
import ffmpeg from 'fluent-ffmpeg';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { isMainThread, parentPort, workerData } from 'worker_threads';
import { dbProxy, pending } from './proxiedDb';

export type ThumbnailWorkerData = {
  id: string;
  enabled: boolean;
  config: Config;
};

type ThumbnailId = File['thumbnail'] & { id: string };

const { id, enabled, config } = workerData as ThumbnailWorkerData;

const logger = log('tasks').c(id);

if (isMainThread) {
  logger.error("thumbnail worker can't run on the main thread");
  process.exit(1);
}

if (!enabled) {
  logger.debug('thumbnail generation is disabled');
  process.exit(0);
}

logger.debug('started thumbnail worker');

const formatMimes = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function name(str: string) {
  return `${str}.${config.features.thumbnails.format}`;
}

function genThumbnail(input: ReadableStream, output: string): Promise<Buffer | undefined> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const isReadableStream = (value: unknown): value is Readable => {
      return !!value && typeof (value as Readable).destroy === "function";
    };

    const cleanup = () => {
      if (existsSync(output)) {
        unlinkSync(output);
      }

      if (typeof input === "string" && existsSync(input)) {
        unlinkSync(input);
      }
      if (isReadableStream(input)) {
        input.destroy();
      }
    };

    const resolveOnce = (value: Buffer | undefined) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(value);
    };

    const rejectOnce = (err: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(err);
    };

    const command = ffmpeg(input as unknown as Readable)
      .inputOptions(["-ss 1"])
      .videoFilters("thumbnail=100")
      .frames(1)
      .output(output)
      .on("start", (cmd) => {
        logger.debug("generating thumbnail", { cmd });
      })
      .on("error", (err, _stdout, stderr) => {
        if (stderr?.includes("does not contain any stream")) {
          logger.error(
            `file ${String(
              input,
            )} does not contain any video stream, probably audio only`,
          );
          return resolveOnce(Buffer.alloc(0));
        }

        logger.error("failed to generate thumbnail", {
          err: err.message,
        });

        if (isReadableStream(input)) {
          input.destroy(err);
        }

        return rejectOnce(err);
      })
      .on("end", () => {
        if (!existsSync(output)) {
          logger.error("expected thumbnail file does not exist", {
            thumbnailTmp: output,
          });
          return resolveOnce(undefined);
        }

        const buffer = readFileSync(output);

        logger.debug("thumbnail generated");
        return resolveOnce(buffer);
      });

    command.run();
  });
}

async function generate(config: Config, datasource: Datasource, ids: string[]) {
  for (const id of ids) {
    const file = await dbProxy<File>('file.findUnique', {
      where: {
        id,
      },
      include: {
        thumbnail: true,
      },
    });

    if (!file) return;
    if (!file.type.startsWith('video/')) {
      logger.debug('received file that is not a video', { id: file.id, type: file.type });
      continue;
    }

    const stream = await datasource.range(file.name, 0, Math.min(file.size, 1024 * 1024 * 20)); // 20MB or the file size, whichever is smaller
    if (!stream) return;

    const thumbnailTmpFile = join(config.core.tempDirectory, name(`zthumbnail_${file.id}`));
    const thumbnail = await genThumbnail(stream as unknown as ReadableStream, thumbnailTmpFile);
    if (!thumbnail) return;

    const existing = await datasource.size(name(`.thumbnail.${file.id}`));
    if (existing || existing === 0) {
      await datasource.delete(name(`.thumbnail.${file.id}`));
    }

    await datasource.put(name(`.thumbnail.${file.id}`), thumbnail, {
      mimetype: formatMimes[config.features.thumbnails.format] || 'image/jpeg',
    });

    const existingThumbnail = await dbProxy<ThumbnailId>('thumbnail.findFirst', {
      where: {
        fileId: file.id,
      },
    });

    let t;
    if (!existingThumbnail) {
      t = await dbProxy<ThumbnailId>('thumbnail.create', {
        data: {
          fileId: file.id,
          path: name(`.thumbnail.${file.id}`),
        },
      });
    } else {
      t = await dbProxy<ThumbnailId>('thumbnail.update', {
        where: {
          id: existingThumbnail.id,
        },
        data: {
          createdAt: new Date(),
        },
      });
    }

    logger.info('generated thumbnail', { id: t.id, fileId: file.id, size: bytes(thumbnail.length) });
  }
}

async function main() {
  getDatasource(config);

  const datasource = global.__datasource__;

  parentPort!.on('message', async (message) => {
    const { type, data } = message as {
      type: 0 | 1 | 'response';
      data?: string[];
    };

    switch (type) {
      case 0:
        logger.debug('received thumbnail generation request', { ids: data });
        await generate(config, datasource, data!);
        break;
      case 1:
        logger.debug('received kill request');
        process.exit(0);
      case 'response':
        const { id, result } = message;
        if (pending[id]) {
          try {
            pending[id](JSON.parse(result));
          } catch (e) {
            pending[id](null);
            console.error(e);
          }
          delete pending[id];
        }
        break;
      default:
        logger.error('unknown message type', { type, message });
        break;
    }
  });
}

main();


export { generate as generateThumbnail };

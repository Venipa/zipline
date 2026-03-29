import { ApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/db';
import { fileSelect } from '@/lib/db/models/file';
import { buildPublicParentChain, cleanFolder, Folder, folderSchema } from '@/lib/db/models/folder';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiServerFolderResponse = Partial<Folder>;

export const PATH = '/api/server/folder/:id';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Fetch a folder by ID. Behavior varies based on public and allowUploads flags.',
          params: z.object({
            id: z.string(),
          }),
          response: {
            200: folderSchema.partial(),
          },
        },
      },
      async (req, res) => {
        const { id } = req.params;

        const folder = await prisma.folder.findUnique({
          where: { id },
          include: {
            files: {
              select: { ...fileSelect, password: true, tags: false },
              orderBy: { createdAt: 'desc' },
            },
            children: {
              where: { public: true },
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                public: true,
                _count: { select: { children: true, files: true } },
              },
            },
            parent: {
              select: { id: true, name: true, public: true, parentId: true },
            },
          },
        });

        if (!folder) throw new ApiError(9002);
        if (!folder.public && !folder.allowUploads) throw new ApiError(9002);

        if (!folder.public && folder.allowUploads) {
          return res.send({
            id: folder.id,
            name: folder.name,
            allowUploads: folder.allowUploads,
            public: folder.public,
          });
        }

        if (folder.parentId) {
          folder.parent = await buildPublicParentChain(folder.parentId);
        }

        return res.send(cleanFolder(folder, true));
      },
    );
  },
  { name: PATH },
);

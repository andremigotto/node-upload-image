import { uploadImage } from '@/app/functions/upload-image'
import { isRight, unwrapEither } from '@/infra/shared/either'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

export const uploadImageRoute: FastifyPluginAsync = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        consumes: ['multipart/form-data'],
        response: {
          201: z.null().describe('Image uploaded.'),
          400: z.object({ message: z.string() }),
        },
      },
    },

    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 2, // 2MB
        },
      })

      if (!uploadedFile?.filename) {
        return reply.status(400).send({ message: 'File name is require.' })
      }

      const result = await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.type,
        contentStream: uploadedFile.file,
      })

      if (uploadedFile.file.truncated) {
        return reply.status(400).send({ message: 'File Size Limit Reached.' })
      }

      if (isRight(result)) {
        console.log(unwrapEither(result))

        return reply.status(201).send()
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileFormat':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}

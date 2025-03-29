import { Readable } from 'node:stream'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { type Either, makeLeft, makeRight } from '@/shared/either'
import { z } from 'zod'
import { InvalidFileFormat } from './errors/invalid-file-format'

const uploadImageInput = z.object({
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type UploadImageInput = z.input<typeof uploadImageInput>

const allowMimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

export async function uploadImage(
  input: UploadImageInput
): Promise<Either<InvalidFileFormat, { url: string }>> {
  const { fileName, contentType, contentStream } = uploadImageInput.parse(input)

  if (allowMimeTypes.includes(contentType)) {
    return makeLeft(new InvalidFileFormat())
  }

  const { key, url } = await uploadFileToStorage({
    fileName,
    contentType,
    contentStream,
    folder: 'images',
  })

  await db.insert(schema.uploads).values({
    name: fileName,
    remoteKey: fileName,
    remoteUrl: fileName,
  })

  return makeRight({ url })
}

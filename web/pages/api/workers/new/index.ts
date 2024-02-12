import { APIAccessController } from "lib/api/APIAccessControler"
import { APIMethodHandler } from "lib/api/MethodHandler"
import { generateFileName, getUploadDirForImages, renameFile } from "lib/api/fileManager"
import { parseFormWithSingleImage, getPhotoPath } from "lib/api/parse-form"
import { validateOrSendError } from "lib/api/validator"
import { createWorker, updateWorker } from "lib/data/workers"
import logger from "lib/logger/logger"
import { ExtendedSession, Permission } from "lib/types/auth"
import { APILogEvent } from "lib/types/logger"
import { WorkerCreateDataInput, WorkerCreateSchema } from "lib/types/worker"
import { NextApiRequest, NextApiResponse } from "next"

export type WorkerAPIPostData = WorkerCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages()
  const { files, json } = await parseFormWithSingleImage(req, temporaryName, uploadDir)

  const singleWorker = validateOrSendError(WorkerCreateSchema, json, res)
  if(!singleWorker) {
    return
  }
  const worker = await createWorker(singleWorker)
  /* Rename photo file and update worker with new photo path to it. */
  if (files.photoFile) {
    const temporaryPhotoPath = getPhotoPath(files.photoFile) // update photoPath
    singleWorker.photoPath = uploadDir + '/' + worker.id
    renameFile(temporaryPhotoPath, singleWorker.photoPath)
    await updateWorker(worker.id, singleWorker)
  }
  await logger.apiRequest(
    APILogEvent.WORKER_CREATE,
    'workers',
    singleWorker,
    session
  )
  res.status(201).json(worker)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.PLANS],
  APIMethodHandler({ post })
)

export const config = {
  api: {
    bodyParser: false
  }
}
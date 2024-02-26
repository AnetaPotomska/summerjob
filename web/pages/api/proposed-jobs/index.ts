import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { WrappedError, ApiError } from 'lib/types/api-error'
import {
  createProposedJob,
  getProposedJobs,
  getProposedJobsAssignableTo,
  updateProposedJob,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'
import { createDirectory, generateFileName, getUploadDirForImages } from 'lib/api/fileManager'
import { parseFormWithImages } from 'lib/api/parse-form'
import { registerPhotos } from 'lib/api/registerPhotos'

export type ProposedJobsAPIGetResponse = Awaited<
  ReturnType<typeof getProposedJobs>
>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIGetResponse>
) {
  const { assignableToPlan } = req.query
  let jobs
  if (assignableToPlan && typeof assignableToPlan === 'string') {
    jobs = await getProposedJobsAssignableTo(assignableToPlan)
  } else {
    jobs = await getProposedJobs()
  }
  res.status(200).json(jobs)
}

export type ProposedJobsAPIPostData = ProposedJobCreateData
export type ProposedJobsAPIPostResponse = Awaited<
  ReturnType<typeof createProposedJob>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDirectory = getUploadDirForImages() + '/proposed-job'
  const { files, json } = await parseFormWithImages(req, temporaryName, uploadDirectory, 10)

  const result = validateOrSendError(ProposedJobCreateSchema, json, res)
  if (!result) {
    return
  }

  const job = await createProposedJob(result)

  // Create directory for photos
  await createDirectory(uploadDirectory + "/" + job.id)

  // Save those photos and save photo ids that belong to proposedJob
  const newPhotoIds = await registerPhotos(files, "/" + job.id)

  await updateProposedJob(job.id, {photoIds: newPhotoIds})
  await logger.apiRequest(
    APILogEvent.JOB_CREATE,
    'proposed-jobs',
    {...json, photoIds: newPhotoIds},
    session
  )
  res.status(201).json(job)
}

export default APIAccessController(
  [Permission.JOBS, Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false
  }
}
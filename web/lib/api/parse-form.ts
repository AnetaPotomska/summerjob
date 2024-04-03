import type { NextApiRequest } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import { createDirectory } from './fileManager'
export const FormidableError = formidable.errors.FormidableError

/* Get simple data from string jsonData containing json data. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getJson = (fieldsJsonData: string | string[]): any => {
  const jsonData = Array.isArray(fieldsJsonData)
    ? fieldsJsonData[0]
    : fieldsJsonData
  let json
  try {
    json = JSON.parse(jsonData)
  } catch (error) {
    console.log(error)
  }
  return json
}

/* Get photoPath from uploaded photoFile. */
export const getPhotoPath = (
  filesPhotoFile: formidable.File | formidable.File[]
): string => {
  return Array.isArray(filesPhotoFile)
    ? filesPhotoFile[0].filepath
    : filesPhotoFile.filepath
}

export const parseForm = async (
  req: NextApiRequest
): Promise<{
  fields: formidable.Fields
  files: formidable.Files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
}> => {
  return await new Promise(async (resolve, reject) => {
    const form = formidable({})
    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}

export const parseFormWithImages = async (
  req: NextApiRequest,
  nameOfImage: string,
  uploadDir: string,
  maxFiles: number
): Promise<{
  fields: formidable.Fields
  files: formidable.Files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
}> => {
  await createDirectory(uploadDir)
  let count = 0

  return await new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFiles: maxFiles,
      maxFileSize: 1024 * 1024 * 10,
      maxTotalFileSize: 1024 * 1024 * 10 * maxFiles, // 10 MB a picture
      uploadDir,
      filename: (_name, _ext, part) => {
        let filename = ''
        if (maxFiles > 1) {
          filename = `${nameOfImage}-${count}.${
            mime.getExtension(part.mimetype || '') || 'unknown'
          }`
          count = count + 1
        } else {
          filename = `${nameOfImage}.${
            mime.getExtension(part.mimetype || '') || 'unknown'
          }`
        }
        return filename
      },
      filter: part => {
        if (!part.mimetype?.includes('image')) {
          reject(new Error('Invalid file type - only images are allowed.'))
          return false
        }
        return true
      },
    })

    form.parse(req, function (err, fields, files) {
      if (err) {
        reject(err)
      }
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}

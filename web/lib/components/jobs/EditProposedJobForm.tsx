'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIProposedJobUpdate } from 'lib/fetcher/proposed-job'
import { allowForNumber, formatNumber } from 'lib/helpers/helpers'
import {
  deserializeProposedJob,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { jobTypeMapping } from '../../data/jobTypeMapping'
import { JobType } from '../../prisma/client'
import { Area } from '../../prisma/zod'
import { deserializeAreas } from '../../types/area'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { useRouter } from 'next/navigation'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { Label } from '../forms/Label'
import FormWarning from '../forms/FormWarning'
import { AlergyPillInput } from '../forms/input/AlergyPillInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { DateBool } from 'lib/data/dateSelectionType'
import { ImageUploader } from '../forms/ImageUploader'
import { MapInput } from '../forms/input/MapInput'
import { getGeocodingData, getReverseGeocodingData } from '../map/GeocodingData'

interface EditProposedJobProps {
  serializedJob: Serialized
  serializedAreas: Serialized
  allDates: DateBool[][]
}

const schema = ProposedJobUpdateSchema
type ProposedJobForm = z.input<typeof schema>

export default function EditProposedJobForm({
  serializedJob,
  serializedAreas,
  allDates,
}: EditProposedJobProps) {
  const job = deserializeProposedJob(serializedJob)
  const areas = deserializeAreas(serializedAreas)
  const { trigger, error, isMutating, reset } = useAPIProposedJobUpdate(job.id)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues
  } = useForm<ProposedJobForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: job.name,
      publicDescription: job.publicDescription,
      privateDescription: job.privateDescription,
      allergens: job.allergens,
      address: job.address,
      coordinations: job.coordinations,
      contact: job.contact,
      requiredDays: job.requiredDays,
      minWorkers: job.minWorkers,
      maxWorkers: job.maxWorkers,
      strongWorkers: job.strongWorkers,
      hasFood: job.hasFood,
      hasShower: job.hasShower,
      availability: job.availability.map(day => day.toJSON()),
      jobType: job.jobType,
      areaId: job.areaId,
    },
  })

  const router = useRouter()

  const onSubmit = (data: ProposedJobForm) => {
    console.log(data)
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const selectJobType = (id: string) => {
    setValue('jobType', id as JobType, { shouldDirty: true, shouldValidate: true })
  }

  const selectArea = (id: string) => {
    setValue('areaId', id, { shouldDirty: true, shouldValidate: true })
  }

  const jobTypeSelectItems = Object.entries(jobTypeMapping).map(
    ([jobTypeKey, jobTypeToSelectName]) => ({
      id: jobTypeKey,
      name: jobTypeToSelectName,
      searchable: jobTypeToSelectName
    })
  )

  const areaSelectItems = areas.map(areaToSelectItem)

  function areaToSelectItem(area: Area): FilterSelectItem {
    return {
      id: area.id,
      name: area.name,
      searchable: `${area.name}`
    }
  }

  //#region Photo
  
  // Remove existing photo from backend.
  const removeExistingPhoto = (id: string) => {
    const prevPhotoIdsDeleted = getValues('photoIdsDeleted') || []
    setValue('photoIdsDeleted', [...prevPhotoIdsDeleted, id])
  }

  // Remove newly added photo from FileList before sending
  const removeNewPhoto = (index: number) => {
    const prevPhotoFiles: (FileList | undefined) = getValues('photoFiles')
    // Filter out the file at the specified index
    const filteredFiles: Array<File> = Array.from(prevPhotoFiles ?? []).filter((_, i) => i !== index)
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    filteredFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files)
  }

  // Register newly added photo to FileList
  const registerPhoto = (fileList: FileList) => {
    const prevPhotoFiles: (FileList | undefined) = getValues('photoFiles')
    // Combine existing files and newly added files
    const combinedFiles: File[] = (Array.from(prevPhotoFiles ?? [])).concat(Array.from(fileList ?? []))
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    combinedFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files)
  }

  const fetchImages = () => {
    return job.photoIds.map((photoId) => ({
      url: `/api/proposed-jobs/${job.id}/photos/${photoId}`,
      index: photoId,
    }))
  }

  //#endregion

  //#region Coordinations and Address

  const getCoordinations = (): [number, number] | null => {
    if (job.coordinations && job.coordinations[0] && job.coordinations[1]) {
      return [job.coordinations[0], job.coordinations[1]]
    }
    return null
  }

  const registerCoordinations = (coords: [number, number]) => {
    setValue('coordinations', coords, { shouldDirty: true, shouldValidate: true })
  }

  const registerAdress = (address: string) => {
    setValue('address', address, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Upravit job</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              id="name"
              label="Název jobu"
              placeholder="Název jobu"
              register={() => register("name")}
              errors={errors}
            />
            <TextAreaInput
              id="publicDescription"
              label="Popis navrhované práce"
              placeholder="Popis"
              rows={4}
              register={() => register("publicDescription")}
            />
            <TextAreaInput
              id="privateDescription"
              label="Poznámka pro organizátory"
              placeholder="Poznámka"
              rows={4}
              register={() => register("privateDescription")}
            />
            <FilterSelectInput
              id="areaId"
              label="Oblast jobu"
              placeholder={ job.area?.name ?? "Vyberte oblast" }
              items={areaSelectItems}
              onSelected={selectArea}
              defaultSelected={areaSelectItems.find(
                item => item.id === job.areaId
              )}
              errors={errors}
              register={() => register('areaId')}
            />
            <MapInput
              idAddress="address"
              idCoordinations="coordinations"
              label="Adresa"
              placeholder="Adresa"
              markerPosition={getCoordinations()}
              addressInit={job.address}
              registerAdress={registerAdress}
              registerCoordinations={registerCoordinations}
              errors={errors}
            />
            <ImageUploader
              id="photoFiles"
              label="Fotografie"
              secondaryLabel="Maximálně 10 souborů, každý o maximální velikosti 10 MB."
              photoInit={fetchImages()}
              errors={errors}
              registerPhoto={registerPhoto}
              removeNewPhoto={removeNewPhoto}
              removeExistingPhoto={removeExistingPhoto}
              multiple
              maxPhotos={10}
            />
            <TextInput
              id="contact"
              label="Kontakt"
              placeholder="Kontakt"
              register={() => register("contact")}
              errors={errors}
            />
            <TextInput
              id="requiredDays"
              label="Celkový počet dní na splnění"
              placeholder="Počet dní"
              type="number"
              min={1}
              defaultValue={1}
              onKeyDown={(e) => allowForNumber(e)}
              register={() => register("requiredDays", {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              errors={errors}
            />
            <Label
              id="minWorkers"
              label="Počet pracantů minimálně / maximálně / z toho silných"
            />
            <div className="d-flex w-50">
              <input
                className="form-control p-1 ps-2"
                id="minWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('minWorkers', { valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="maxWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('maxWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="strongWorkers"
                type="number"
                min={0}
                defaultValue={0}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('strongWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
            </div>
            {(errors.minWorkers ||
              errors.maxWorkers ||
              errors.strongWorkers) && (<FormWarning message={
                errors?.minWorkers?.message as string | undefined ||
                errors?.maxWorkers?.message as string | undefined ||
                errors?.strongWorkers?.message as string | undefined
              } />)}

            <div className="d-flex flex-row">
              <DateSelectionInput
                id="availability"
                label="Časová dostupnost"
                register={() => register("availability")}
                days={allDates}
              />
            </div>

            <FilterSelectInput
              id="jobType"
              label="Typ práce"
              placeholder={jobTypeMapping[job.jobType] ?? "Vyberte typ práce"}
              items={jobTypeSelectItems}
              onSelected={selectJobType}
              defaultSelected={jobTypeSelectItems.find(
                item => item.id === JobType.OTHER
              )}
              errors={errors}
              register={() => register('jobType')}
            />
            <AlergyPillInput
              label="Alergeny"
              register={() => register("allergens")}
            />
            <OtherAttributesInput
              label="Další vlastnosti"
              register={register}
              objects={[
                {
                  id: "hasFood",
                  icon: "fa fa-utensils",
                  label: "Strava na místě",
                }, 
                {
                  id: "hasShower",
                  icon: "fa fa-shower",
                  label: "Sprcha na místě",
                }
              ]}
            />
            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => router.back()}
              >
                Zpět
              </button>
              <input
                type={'submit'}
                className="btn btn-primary mt-4"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
          </form>
        </div>
      </div>
      {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}

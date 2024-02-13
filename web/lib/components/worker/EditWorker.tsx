'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deserializeWorker, WorkerUpdateSchema } from 'lib/types/worker'
import { useState } from 'react'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModalTest from '../modal/SuccessProceedModalTest'
import { Serialized } from 'lib/types/serialize'
import { formatName, formatPhoneNumber, pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import { Allergy } from '../../prisma/client'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { AlergyPillInput } from '../forms/input/AlergyPillInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { ImageUploader } from '../forms/ImageUpload'
import { Label } from '../forms/Label'
import { TextAreaInput } from '../forms/input/TextAreaInput'

const schema = WorkerUpdateSchema
type WorkerForm = z.input<typeof schema>

interface EditWorkerProps {
  serializedWorker: Serialized
  allDates: DateBool[][]
  isProfilePage: boolean
  carAccess: boolean
}

export default function EditWorker({
  serializedWorker,
  allDates,
  isProfilePage,
  carAccess,
}: EditWorkerProps) {
  const worker = deserializeWorker(serializedWorker)

  const {
    formState: { dirtyFields },
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: formatPhoneNumber(worker.phone),
      strong: worker.isStrong,
      note: worker.note,
      allergyIds: worker.allergies as Allergy[],
      availability: {
        workDays: worker.availability.workDays.map(day => day.toJSON()),
        adorationDays: worker.availability.adorationDays.map(day =>
          day.toJSON()
        ),
      },
    },
  })

  //#region Form
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIWorkerUpdate(worker.id, {
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (dataForm: WorkerForm) => {
    const modified = pick(dataForm, ...Object.keys(dirtyFields)) as WorkerForm
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (isHandlingCar) {
      router.push(`/cars/${carRoute}`)
    }
    if (!isProfilePage) {
      router.back()
    }
  }
  //#endregion

  //#region Car
  const [isHandlingCar, setIsHandlingCar] = useState(false);
  const [carRoute, setCarRoute] = useState('new')

  const handleAddCar = () => {
    setIsHandlingCar(true)
  }

  const handleEditCar = (route: string) => {
    setIsHandlingCar(true)
    setCarRoute(route)
  }
  //#endregion

  //#region File

  /* If photo was deleted set it to yes and let it be dirty so it will be picked by pick later on.  */
  const setPhotoFileState = (state: boolean) => {
    setValue('photoFileRemoved', state, { shouldDirty: state, shouldValidate: state })
  }
 
  const removePhoto = () => {
    setValue('photoFile', undefined, { shouldDirty: false, shouldValidate: false })
    setPhotoFileState(true)
  }

  //#endregion

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>
            {worker.firstName} {worker.lastName}
          </h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              id="firstName"
              label="Jméno"
              placeholder="Jméno"
              register={() => register("firstName", {onChange: (e) => e.target.value = formatName(e.target.value)})}
              errors={errors}
            />
            <TextInput
              id="lastName"
              label="Příjmení"
              placeholder="Příjmení"
              errors={errors}
              register={() => register("lastName", {onChange: (e) => e.target.value = formatName(e.target.value)})}
            />
            <TextInput
              id="phone"
              label="Telefonní číslo"
              placeholder="(+420) 123 456 789"
              errors={errors}
              register={() => register("phone", {onChange: (e) => e.target.value = formatPhoneNumber(e.target.value)})}
            />
            <TextInput
              id="email"
              label="Email"
              placeholder="uzivatel@example.cz"
              errors={errors}
              register={() => register("email")}
            />
            <p className="text-muted mt-1">
              {isProfilePage
                ? 'Změnou e-mailu dojde k odhlášení z aplikace.'
                : 'Změnou e-mailu dojde k odhlášení uživatele z aplikace.'}
            </p>
            <div className="d-flex flex-row flex-wrap">
              <div className="me-5">
                <DateSelectionInput
                  id="availability.workDays"
                  label="Pracovní dostupnost"
                  register={() => register("availability.workDays")}
                  days={allDates}
                />
              </div>
              <DateSelectionInput
                id="availability.adorationDays"
                label="Dny adorace"
                register={() => register("availability.adorationDays")}
                days={allDates}
              />
            </div>
            <AlergyPillInput
              label="Alergie"
              register={() => register("allergyIds")}
            />
            {!isProfilePage && (
              <OtherAttributesInput
                label="Další vlastnosti"
                register={register}
                objects={[
                  {
                    id: "strong",
                    icon: "fas fa-dumbbell",
                    label: "Silák",
                  }
                ]}
              />
            )}
            {!isProfilePage && (
              <ImageUploader
                id="photoFile"
                photoInit={worker.photoPath ? `/api/workers/${worker.id}/photo` : null}
                setPhotoFileState={setPhotoFileState}
                errors={errors}
                register={register}
                removePhoto={removePhoto}
              />
            )}
            {(carAccess || isProfilePage) && (
              <Label
                id="car"
                label="Auta"
              />
            )}
          
            {carAccess ? (
              <>
                {worker.cars.length === 0 && <p>Žádná auta</p>}
                {worker.cars.length > 0 && (
                  <div className="list-group mb-2">
                    {worker.cars.map(car => (
                      <input
                        key={car.id}
                        type={'submit'}
                        className="list-group-item list-group-item-action ps-2 d-flex align-items-center justify-content-between w-50"
                        value={car.name}
                        disabled={isMutating}
                        onClick={() => handleEditCar(car.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              isProfilePage && (
                <div className="mb-2">
                  {worker.cars.length > 0 && (
                    <div className="list-group">
                      {worker.cars.map(car => (
                        <div key={car.id} className="list-group-item ps-2 w-50">
                          {car.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          
            {carAccess ? (
                <div className="d-flex align-items-baseline flex-wrap">
                  <div className="me-3">
                    <i>Auta je možné přiřadit v záložce Auta: </i> 
                  </div>
                  <button
                    type={'submit'}
                    className="btn btn-light pt-2 pb-2"
                    disabled={isMutating}
                    onClick={handleAddCar}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-plus me-2" />
                      Přidat auto
                    </div>
                  </button>
                </div>
            ) : (
              isProfilePage && (
                <p>
                  <i>Pro přiřazení auta kontaktujte tým SummerJob.</i>
                </p>
              )
            )}

            {!isProfilePage && (
              <TextAreaInput
                id="note"
                label="Poznámka"
                placeholder="Poznámka"
                rows={1}
                register={() => register("note")}
              />
            )}

            <div className={`d-flex ${
                isProfilePage ? 'justify-content-end' : 'justify-content-between gap-3'
              }`}>
              {!isProfilePage && (
                <button
                  className="btn btn-secondary mt-4"
                  type="button"
                  onClick={() => router.back()}
                >
                  Zpět
                </button>
              )}
              <input
                type={'submit'}
                className="btn btn-primary mt-4"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
            {saved && <SuccessProceedModalTest onConfirm={onConfirmationClosed} onClose={() => {setSaved(false)}} />}
            {error && <ErrorMessageModal onClose={reset} />}
          </form>
        </div>
      </div>
    </>
  )
}

/*

            

*/
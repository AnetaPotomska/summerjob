import ErrorPage404 from "lib/components/404/404";
import EditBox from "lib/components/forms/EditBox";
import EditProposedJobForm from "lib/components/jobs/EditProposedJobForm";
import { getAllergies } from "lib/data/allergies";
import { cache_getActiveSummerJobEvent } from "lib/data/cache";
import { getProposedJobById } from "lib/data/proposed-jobs";
import { serializeAllergies, translateAllergies } from "lib/types/allergy";
import { serializeProposedJob } from "lib/types/proposed-job";

type PathProps = {
  params: {
    id: string;
  };
};

export default async function EditProposedJobPage({ params }: PathProps) {
  const job = await getProposedJobById(params.id);
  if (!job) {
    return <ErrorPage404 message="Job nenalezen."></ErrorPage404>;
  }
  const serialized = serializeProposedJob(job);

  const allergies = await getAllergies();
  const translatedAllergens = translateAllergies(allergies);
  const serializedAllergens = serializeAllergies(translatedAllergens);
  const summerJobEvent = await cache_getActiveSummerJobEvent();
  if (!summerJobEvent) {
    return <ErrorPage404 message="Není nastaven aktivní SummerJob ročník." />;
  }
  const { startDate, endDate } = summerJobEvent;

  return (
    <section>
      <EditBox>
        <EditProposedJobForm
          serializedJob={serialized}
          serializedAllergens={serializedAllergens}
          eventStartDate={startDate.toJSON()}
          eventEndDate={endDate.toJSON()}
        />
      </EditBox>
    </section>
  );
}

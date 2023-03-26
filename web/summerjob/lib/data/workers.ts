import { WorkerAvailability, Worker } from "lib/prisma/client";
import prisma from "lib/prisma/connection";
import { WorkerComplete, WorkerUpdateData } from "lib/types/worker";
import { cache_getActiveSummerJobEventId } from "./cache";
import { NoActiveEventError } from "./internal-error";

export async function getWorkers(
  planId: string | undefined = undefined,
  hasJob: boolean | undefined = undefined
): Promise<WorkerComplete[]> {
  let whereClause: any = {
    where: {
      registeredIn: {
        some: {
          isActive: true,
        },
      },
    },
  };
  if (planId) {
    let inPlan: any = {
      jobs: {
        some: {
          planId,
        },
      },
    };
    if (!hasJob) {
      inPlan = {
        NOT: inPlan,
      };
    }
    whereClause = {
      where: {
        ...whereClause.where,
        ...inPlan,
      },
    };
  }

  const users = await prisma.worker.findMany({
    ...whereClause,
    include: {
      allergies: true,
      cars: true,
      availability: {
        where: {
          event: {
            isActive: true,
          },
        },
        take: 1,
      },
    },
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });
  // TODO: Remove this when the prisma client findMany is fixed
  let correctType = users as Parameters<
    typeof databaseWorkerToWorkerComplete
  >[0][];
  const res = correctType.map(databaseWorkerToWorkerComplete);
  return res;
}

export async function getWorkerById(
  id: string
): Promise<WorkerComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId();
  if (!activeEventId) {
    throw new NoActiveEventError();
  }
  const user = await prisma.worker.findUnique({
    where: {
      id,
    },
    include: {
      cars: true,
      allergies: true,
      availability: {
        where: {
          eventId: activeEventId,
        },
        take: 1,
      },
    },
  });
  if (!user) {
    return null;
  }
  // Only return availability for the active event
  return databaseWorkerToWorkerComplete(user);
}

export function databaseWorkerToWorkerComplete(
  worker: Omit<WorkerComplete, "availability"> & {
    availability: WorkerAvailability[];
  }
): WorkerComplete {
  const { availability, ...rest } = worker;
  return { ...rest, availability: availability[0] };
}

export async function updateWorker(id: string, data: WorkerUpdateData) {
  const activeEventId = await cache_getActiveSummerJobEventId();
  if (!activeEventId) {
    throw new NoActiveEventError();
  }

  const user = await prisma.worker.update({
    where: {
      id,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      allergies: {
        set: data.allergyIds?.map((allergyId) => ({ id: allergyId })),
      },
      availability: {
        update: {
          where: {
            workerId_eventId: {
              workerId: id,
              eventId: activeEventId,
            },
          },
          data: {
            days: data.availability,
          },
        },
      },
    },
  });

  return user;
}

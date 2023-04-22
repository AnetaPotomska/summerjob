import { Id, api } from "./common";
import chai from "chai";
import { faker } from "@faker-js/faker/locale/cz";

chai.should();

describe("Workers", function () {
  it("returns empty list of workers", async function () {
    const resp = await api.get("/api/workers", Id.WORKERS);
    resp.status.should.equal(200);
    resp.body.should.be.an("array");
    resp.body.should.have.lengthOf(0);
  });

  it("returns 404 when worker does not exist", async function () {
    const resp = await api.get("/api/workers/1", Id.WORKERS);
    resp.status.should.equal(404);
  });

  it("creates a worker", async function () {
    const body = createUserData();
    const resp = await api.post("/api/workers", Id.WORKERS, body);
    resp.status.should.equal(201);
    resp.body.should.be.an("object");
    resp.body.should.have.property("id");
  });

  it("creates multiple workers", async function () {
    const body = {
      workers: [createUserData(), createUserData(), createUserData()],
    };
    const resp = await api.post("/api/workers", Id.WORKERS, body);
    resp.status.should.equal(201);
    resp.body.should.be.an("array");
    resp.body.should.have.lengthOf(3);
  });

  it("returns a list of workers", async function () {
    const resp = await api.get("/api/workers", Id.WORKERS);
    resp.status.should.equal(200);
    resp.body.should.be.an("array");
    resp.body.should.have.lengthOf(4);
  });

  it("returns a worker by id", async function () {
    const workers = await api.get("/api/workers", Id.WORKERS);
    const selectedWorker = workers.body[0];
    const resp = await api.get(`/api/workers/${selectedWorker.id}`, Id.WORKERS);
    resp.status.should.equal(200);
    resp.body.should.be.an("object");
    resp.body.should.have.property("id");
  });

  it("updates a worker", async function () {
    const workers = await api.get("/api/workers", Id.WORKERS);
    const selectedWorker = workers.body[0];

    const body = {
      firstName: "Jane",
      email: "janedoe@gmail.com",
    };
    const patch = await api.patch(
      `/api/workers/${selectedWorker.id}`,
      Id.WORKERS,
      body
    );
    patch.status.should.equal(204);
    const resp = await api.get(`/api/workers/${selectedWorker.id}`, Id.WORKERS);
    resp.body.should.be.an("object");
    resp.body.should.have.property("id");
    resp.body.firstName.should.equal("Jane");
    resp.body.email.should.equal("janedoe@gmail.com");
  });

  it("deletes a worker", async function () {
    const workers = await api.get("/api/workers", Id.WORKERS);
    const selectedWorker = workers.body[0];
    const resp = await api.del(`/api/workers/${selectedWorker.id}`, Id.WORKERS);
    resp.status.should.equal(204);
    const workers2 = await api.get("/api/workers", Id.WORKERS);
    workers2.body.should.have.lengthOf(3);
    workers2.body.should.not.include(selectedWorker);
  });

  it("should not be accessible without permission", async function () {
    const perms = [Id.CARS, Id.JOBS, ""];
    for (const perm of perms) {
      const resp = await api.get("/api/workers", perm);
      resp.status.should.equal(403);
      resp.body.should.be.empty;
    }
  });
});

function createUserData() {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number("### ### ###"),
    strong: Math.random() > 0.5,
    allergyIds: [],
    availability: {
      workDays: [],
      adorationDays: [],
    },
  };
}

export default {};

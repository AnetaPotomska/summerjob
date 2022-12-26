"use client";
import { LoadingRow } from "lib/components/table/LoadingRow";
import { VariableWidthRow } from "lib/components/table/VariableWidthRow";
import useData from "lib/fetcher/fetcher";
import type { Worker } from "../../../lib/prisma/client";

export default function WorkersPage() {
  const { data, error, isLoading } = useData("/api/users");
  const workers = data as Worker[];
  const rowWidths = [2, 2, 2, 2, 2, 2];
  return (
    <>
      <section className="mb-3 mt-3">
        <div className="container-fluid">
          <div className="row">
            <div className="col">
              <h2>Pracanti</h2>
            </div>
            <div className="col-auto d-xl-flex justify-content-xl-end align-items-xl-center plan-controlbar">
              <button
                className="btn btn-warning d-xl-flex align-items-xl-center"
                type="button"
              >
                <i className="far fa-user"></i>
                <span>Přidat pracanta</span>
              </button>
              <button
                className="btn btn-primary d-xl-flex align-items-xl-center"
                type="button"
              >
                <i className="fas fa-print"></i>
                <span>Tisknout</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="container-fluid">
          <div className="row gx-3">
            <div className="col-sm-12 col-lg-9">
              <div className="smj-table">
                <div className="row fw-bold smj-table-header">
                  <div className="col-2">
                    <span>Jméno</span>
                  </div>
                  <div className="col-2">
                    <span>Příjmení</span>
                  </div>
                  <div className="col-2">
                    <span>Telefonní číslo</span>
                  </div>
                  <div className="col-2">
                    <span>E-mail</span>
                  </div>
                  <div className="col-2">
                    <span>Schopnosti</span>
                  </div>
                  <div className="col">
                    <span>Akce</span>
                  </div>
                </div>
                {isLoading && <LoadingRow />}
                {!isLoading &&
                  workers.map((worker) => (
                    <VariableWidthRow
                      key={worker.id}
                      {...{
                        data: Object.values(worker).slice(1),
                        widths: rowWidths,
                      }}
                    />
                  ))}
              </div>
            </div>
            <div className="col-sm-12 col-lg-3 offset-xl-0">
              <div className="vstack smj-search-stack">
                <h5>Filtrovat</h5>
                <hr />
                <label className="form-label" htmlFor="worker-name">
                  Jméno:
                </label>
                <input
                  type="text"
                  placeholder="Jméno a příjmení"
                  name="worker-name"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

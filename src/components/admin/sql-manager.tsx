"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faDatabase,
  faEye,
  faPenToSquare,
  faPlus,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/dashboard/table";
import type {
  SqlManagerFieldMeta,
  SqlManagerModelMeta,
  SqlManagerModelOverview,
  SqlManagerRecordListResponse
} from "@/types/sql-manager";

type FormValues = Record<string, string | boolean>;
type Feedback = { tone: "success" | "error"; text: string } | null;

const studioUrl = process.env.NEXT_PUBLIC_PRISMA_STUDIO_URL ?? "http://127.0.0.1:5555";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function toDatetimeLocal(value: unknown) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fieldToFormValue(field: SqlManagerFieldMeta, value: unknown) {
  if (field.input === "boolean") {
    return Boolean(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (field.input === "json") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  if (field.input === "string-array") {
    return Array.isArray(value) ? value.join("\n") : String(value);
  }

  if (field.input === "datetime") {
    return toDatetimeLocal(value);
  }

  return String(value);
}

function createEmptyForm(meta: SqlManagerModelMeta) {
  return Object.fromEntries(
    meta.fields.map((field) => [field.name, field.input === "boolean" ? false : ""])
  );
}

function createEditForm(meta: SqlManagerModelMeta, record: Record<string, unknown>) {
  return Object.fromEntries(
    meta.fields.map((field) => [field.name, fieldToFormValue(field, record[field.name])])
  );
}

function renderFieldValue(field: SqlManagerFieldMeta | undefined, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">—</span>;
  }

  if (typeof value === "boolean") {
    return <Badge label={value ? "Bật" : "Tắt"} status={value ? "ACTIVE" : "REFUNDED"} />;
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.slice(0, 4).map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-3 py-2 text-xs text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const stringValue = String(value);
  if (field?.input === "datetime" || /At$/.test(field?.name ?? "")) {
    return <span>{formatDateTime(stringValue)}</span>;
  }

  if (field?.options?.length || ["ACTIVE", "PENDING", "PAID", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ADMIN", "STAFF", "USER", "AVAILABLE", "RESERVED", "SOLD", "USED", "EXPIRED"].includes(stringValue)) {
    return <Badge label={stringValue} status={stringValue} />;
  }

  return <span className="line-clamp-2 break-all">{stringValue}</span>;
}

async function readJson(response: Response) {
  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
    [key: string]: unknown;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Không thể xử lý yêu cầu.");
  }

  return payload;
}

export function SqlManager() {
  const [models, setModels] = useState<SqlManagerModelOverview[]>([]);
  const [selectedModel, setSelectedModel] = useState<SqlManagerModelMeta | null>(null);
  const [records, setRecords] = useState<SqlManagerRecordListResponse | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<FormValues>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOverview = useMemo(
    () => models.find((model) => model.name === selectedModel?.name) ?? null,
    [models, selectedModel]
  );

  const editableFields = useMemo(
    () => selectedModel?.fields.filter((field) => !field.readOnly || modalMode === "edit") ?? [],
    [modalMode, selectedModel]
  );

  const loadModels = useCallback(async (preferredModel?: string) => {
    setIsLoadingModels(true);

    try {
      const params = new URLSearchParams();
      if (preferredModel) {
        params.set("model", preferredModel);
      }

      const response = await fetch(`/api/admin/sql/models?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = await readJson(response);

      setModels(payload.models as SqlManagerModelOverview[]);
      setSelectedModel((payload.selectedModel as SqlManagerModelMeta | null) ?? null);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể tải danh sách bảng dữ liệu."
      });
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const loadRecords = useCallback(async (
    modelName: string,
    nextPage: number,
    nextQuery: string,
    nextPageSize: number
  ) => {
    setIsLoadingRecords(true);

    try {
      const params = new URLSearchParams({
        model: modelName,
        page: String(nextPage),
        pageSize: String(nextPageSize),
        query: nextQuery
      });
      const response = await fetch(`/api/admin/sql/records?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = await readJson(response);

      setRecords({
        items: payload.items as Record<string, unknown>[],
        totalItems: Number(payload.totalItems),
        totalPages: Number(payload.totalPages),
        currentPage: Number(payload.currentPage),
        pageSize: Number(payload.pageSize)
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể tải bản ghi của bảng."
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (!selectedModel?.name) {
      return;
    }

    void loadRecords(selectedModel.name, page, query, pageSize);
  }, [loadRecords, page, pageSize, query, selectedModel?.name]);

  const handlePickModel = async (modelName: string) => {
    setPage(1);
    setQuery("");
    setSelectedRecord(null);
    await loadModels(modelName);
  };

  const loadSingleRecord = async (id: string) => {
    if (!selectedModel) {
      return null;
    }

    const response = await fetch(`/api/admin/sql/records?model=${selectedModel.name}&id=${id}`, {
      cache: "no-store"
    });
    const payload = await readJson(response);
    return (payload.record as Record<string, unknown> | null) ?? null;
  };

  const handleViewRecord = async (id: string) => {
    try {
      const record = await loadSingleRecord(id);
      setSelectedRecord(record);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể xem chi tiết bản ghi."
      });
    }
  };

  const handleOpenCreate = () => {
    if (!selectedModel) {
      return;
    }

    setModalMode("create");
    setEditingId(null);
    setFormValues(createEmptyForm(selectedModel));
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    if (!selectedModel) {
      return;
    }

    try {
      const record = await loadSingleRecord(id);
      if (!record) {
        throw new Error("Không tìm thấy bản ghi để chỉnh sửa.");
      }

      setSelectedRecord(record);
      setModalMode("edit");
      setEditingId(id);
      setFormValues(createEditForm(selectedModel, record));
      setIsModalOpen(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể tải dữ liệu bản ghi."
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!selectedModel) {
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa bản ghi này khỏi cơ sở dữ liệu?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/sql/records", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel.name,
          id
        })
      });
      const payload = await readJson(response);

      setFeedback({
        tone: "success",
        text: String(payload.message ?? "Đã xóa bản ghi.")
      });
      setSelectedRecord((current) => (current?.id === id ? null : current));
      await loadModels(selectedModel.name);
      await loadRecords(selectedModel.name, 1, query, pageSize);
      setPage(1);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể xóa bản ghi."
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedModel) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/sql/records", {
        method: modalMode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel.name,
          id: editingId,
          data: formValues
        })
      });
      const payload = await readJson(response);

      setFeedback({
        tone: "success",
        text: String(payload.message ?? "Đã lưu bản ghi.")
      });
      setSelectedRecord((payload.record as Record<string, unknown>) ?? null);
      setIsModalOpen(false);
      await loadModels(selectedModel.name);
      await loadRecords(selectedModel.name, 1, query, pageSize);
      setPage(1);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thể lưu bản ghi."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableHeaders = useMemo(() => {
    if (!selectedModel) {
      return [];
    }

    return [
      ...selectedModel.tableColumns.map(
        (column) => selectedModel.fields.find((field) => field.name === column)?.label ?? column
      ),
      "Thao tác"
    ];
  }, [selectedModel]);

  const tableRows =
    !selectedModel || !records?.items.length
      ? []
      : records.items.map((record) => [
          ...selectedModel.tableColumns.map((column) =>
            renderFieldValue(
              selectedModel.fields.find((field) => field.name === column),
              record[column]
            )
          ),
          <div key={`actions-${String(record.id)}`} className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleViewRecord(String(record.id))}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <FontAwesomeIcon icon={faEye} className="mr-1.5 h-3.5 w-3.5" />
              Xem
            </button>
            <button
              type="button"
              onClick={() => void handleOpenEdit(String(record.id))}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5 h-3.5 w-3.5" />
              Sửa
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteRecord(String(record.id))}
              className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <FontAwesomeIcon icon={faTrashCan} className="mr-1.5 h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        ]);

  return (
    <section className="space-y-6">
      <Card className="space-y-4 bg-gradient-to-br from-white via-[#fff8fc] to-[#eef3ff]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">
              Trình quản lý SQL nội bộ
            </p>
            <h1 className="text-3xl font-black text-ink">Quản lý cơ sở dữ liệu ngay trong admin</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted">
              Xem, tạo, chỉnh sửa và xóa bản ghi trực tiếp trong PostgreSQL mà không cần rời khỏi
              MeowMarket.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={studioUrl} target="_blank" rel="noreferrer" variant="outline">
              Mở Prisma Studio
            </Button>
            <Button type="button" variant="ghost" onClick={() => void loadModels(selectedModel?.name)}>
              <FontAwesomeIcon icon={faArrowsRotate} className="h-4 w-4" />
              Làm mới dữ liệu
            </Button>
          </div>
        </div>
        {feedback ? (
          <div
            className={`rounded-[22px] border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-600"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Danh sách bảng</p>
              <p className="mt-1 text-sm text-muted">Chọn model để xem và quản lý dữ liệu.</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-primary">
              {models.length} bảng
            </span>
          </div>

          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {isLoadingModels ? (
              <div className="rounded-[22px] bg-slate-100 px-4 py-6 text-sm text-muted">
                Đang tải danh sách model...
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  type="button"
                  onClick={() => void handlePickModel(model.name)}
                  className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                    selectedModel?.name === model.name
                      ? "border-primary/30 bg-rose-50 shadow-sm"
                      : "border-transparent bg-slate-50 hover:border-rose-100 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <FontAwesomeIcon icon={faDatabase} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{model.label}</p>
                        <p className="text-xs text-muted">{model.name}</p>
                      </div>
                    </div>
                    <Badge label={String(model.count)} className="shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {selectedModel ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="space-y-2">
                  <p className="text-sm text-muted">Model đang xem</p>
                  <p className="text-2xl font-black text-ink">{selectedModel.label}</p>
                  <p className="text-sm text-muted">{selectedModel.name}</p>
                </Card>
                <Card className="space-y-2">
                  <p className="text-sm text-muted">Tổng bản ghi</p>
                  <p className="text-2xl font-black text-ink">{selectedOverview?.count ?? 0}</p>
                  <p className="text-sm text-muted">Đếm trực tiếp từ PostgreSQL</p>
                </Card>
                <Card className="space-y-2">
                  <p className="text-sm text-muted">Tổng trường</p>
                  <p className="text-2xl font-black text-ink">{selectedModel.fields.length}</p>
                  <p className="text-sm text-muted">Bao gồm trường hệ thống</p>
                </Card>
                <Card className="space-y-2">
                  <p className="text-sm text-muted">Trường chỉnh sửa</p>
                  <p className="text-2xl font-black text-ink">
                    {selectedModel.fields.filter((field) => !field.readOnly).length}
                  </p>
                  <p className="text-sm text-muted">Có thể nhập từ form quản trị</p>
                </Card>
              </div>

              <Card className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted">{selectedModel.label}</p>
                    <h2 className="text-2xl font-black text-ink">Quản lý bản ghi</h2>
                    <p className="max-w-3xl text-sm leading-7 text-muted">{selectedModel.description}</p>
                  </div>
                  <Button type="button" onClick={handleOpenCreate}>
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    Thêm bản ghi
                  </Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
                  <input
                    value={query}
                    onChange={(event) => {
                      setPage(1);
                      setQuery(event.target.value);
                    }}
                    placeholder="Tìm kiếm theo các trường text chính..."
                    className="rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary"
                  />
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPage(1);
                      setPageSize(Number(event.target.value));
                    }}
                    className="rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary"
                  >
                    <option value={10}>10 dòng / trang</option>
                    <option value={20}>20 dòng / trang</option>
                    <option value={50}>50 dòng / trang</option>
                  </select>
                </div>
              </Card>
            </>
          ) : null}
          {selectedModel && isLoadingRecords ? (
            <Card className="py-16 text-center text-sm text-muted">
              Đang tải bản ghi của bảng {selectedModel.label}...
            </Card>
          ) : null}

          {selectedModel && !isLoadingRecords && records?.items.length ? (
            <div className="space-y-4">
              <Table headers={tableHeaders} rows={tableRows} />
              <div className="flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  Trang <span className="font-semibold text-ink">{records.currentPage}</span> /{" "}
                  <span className="font-semibold text-ink">{records.totalPages}</span> • {records.totalItems} bản ghi
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={records.currentPage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={records.currentPage >= records.totalPages}
                    onClick={() => setPage((current) => Math.min(records.totalPages, current + 1))}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {selectedModel && !isLoadingRecords && !records?.items.length ? (
            <EmptyState
              title={`Chưa có dữ liệu trong ${selectedModel.label}`}
              description="Bảng này hiện chưa có bản ghi nào hoặc không có bản ghi khớp với bộ lọc tìm kiếm."
            />
          ) : null}

          {selectedModel && selectedRecord ? (
            <Card className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted">
                    Chi tiết bản ghi
                  </p>
                  <h3 className="text-2xl font-black text-ink">
                    {String(selectedRecord[selectedModel.primaryField] ?? selectedRecord.id ?? "Bản ghi đã chọn")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleOpenEdit(String(selectedRecord.id))}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => void handleDeleteRecord(String(selectedRecord.id))}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
                    Xóa bản ghi
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedModel.fields.map((field) => (
                  <div key={field.name} className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{field.label}</p>
                    <div className="mt-3 text-sm text-ink">{renderFieldValue(field, selectedRecord[field.name])}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {selectedModel ? (
        <Modal
          open={isModalOpen}
          title={modalMode === "create" ? `Tạo bản ghi mới cho ${selectedModel.label}` : `Chỉnh sửa ${selectedModel.label}`}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {editableFields.map((field) => {
              const value = formValues[field.name];

              return (
                <label key={field.name} className="block space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{field.label}</span>
                    <div className="flex items-center gap-2">
                      {field.required ? (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600">
                          Bắt buộc
                        </span>
                      ) : null}
                      {field.readOnly ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          Chỉ xem
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {field.input === "textarea" || field.input === "json" || field.input === "string-array" ? (
                    <textarea
                      rows={field.input === "json" ? 6 : 4}
                      value={String(value ?? "")}
                      disabled={field.readOnly}
                      onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="w-full rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary disabled:bg-slate-100"
                    />
                  ) : field.input === "select" ? (
                    <select
                      value={String(value ?? "")}
                      disabled={field.readOnly}
                      onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="w-full rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary disabled:bg-slate-100"
                    >
                      <option value="">Chọn giá trị</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.input === "boolean" ? (
                    <select
                      value={String(Boolean(value))}
                      disabled={field.readOnly}
                      onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value === "true" }))}
                      className="w-full rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary disabled:bg-slate-100"
                    >
                      <option value="true">Bật / True</option>
                      <option value="false">Tắt / False</option>
                    </select>
                  ) : (
                    <input
                      type={field.input === "number" || field.input === "decimal" ? "number" : field.input === "datetime" ? "datetime-local" : field.input === "password" ? "password" : "text"}
                      step={field.input === "decimal" ? "0.01" : undefined}
                      value={typeof value === "boolean" ? String(value) : String(value ?? "")}
                      disabled={field.readOnly}
                      onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="w-full rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary disabled:bg-slate-100"
                    />
                  )}
                  {field.helperText ? <p className="text-xs leading-6 text-muted">{field.helperText}</p> : null}
                </label>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : modalMode === "create" ? "Tạo bản ghi" : "Lưu thay đổi"}
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

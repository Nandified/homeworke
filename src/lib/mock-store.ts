export type WorkOrderStatus = "pending" | "scheduled" | "in_progress" | "completed";

export type WorkOrder = {
  id: string;
  createdAt: string;
  token: string;
  originPartnerId?: string | null;
  shareWithPartner?: boolean | null;
  serviceCategory: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  propertyAddress?: string;
  propertyType?: string;
  preferredDate?: string;
  preferredWindow?: string;
  status: WorkOrderStatus;
};

type Store = {
  workOrders: WorkOrder[];
};

function getGlobal(): { __HW3_STORE__?: Store } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return globalThis as any;
}

export function store(): Store {
  const g = getGlobal();
  if (!g.__HW3_STORE__) {
    g.__HW3_STORE__ = { workOrders: [] };
  }
  return g.__HW3_STORE__;
}

export function createWorkOrder(input: Omit<WorkOrder, "id" | "createdAt" | "status"> & { status?: WorkOrderStatus }) {
  const id = `wo_${Math.random().toString(36).slice(2, 10)}`;
  const wo: WorkOrder = {
    id,
    createdAt: new Date().toISOString(),
    status: input.status || "pending",
    ...input,
  };
  store().workOrders.unshift(wo);
  return wo;
}

export function listWorkOrders(token: string) {
  return store().workOrders.filter((w) => w.token === token);
}

export function getWorkOrder(token: string, id: string) {
  return store().workOrders.find((w) => w.token === token && w.id === id) || null;
}

export function listSharedWorkOrdersForPartner(partnerId: string): WorkOrder[] {
  return store().workOrders.filter(
    (w) => w.originPartnerId === partnerId && !!w.shareWithPartner
  );
}

export function countSharedWorkOrdersForPartner(partnerId: string): number {
  return listSharedWorkOrdersForPartner(partnerId).length;
}

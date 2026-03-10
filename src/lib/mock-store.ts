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

export type Property = {
  id: string;
  createdAt: string;
  token: string;
  address: string;
  nickname?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type Message = {
  id: string;
  createdAt: string;
  token?: string;
  partnerId?: string;
  threadId: string;
  fromRole: "HO" | "PARTNER" | "SP" | "HG" | "PM" | "SYSTEM";
  body: string;
  readAt?: string | null;
};

type Store = {
  workOrders: WorkOrder[];
  properties: Property[];
  messages: Message[];
};

function getGlobal(): { __HW3_STORE__?: Store } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return globalThis as any;
}

export function store(): Store {
  const g = getGlobal();
  if (!g.__HW3_STORE__) {
    g.__HW3_STORE__ = { workOrders: [], properties: [], messages: [] };
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

export function listRecentWorkOrders(limit = 10) {
  return store().workOrders.slice(0, limit);
}

export function getWorkOrder(token: string, id: string) {
  return store().workOrders.find((w) => w.token === token && w.id === id) || null;
}

export function listSharedWorkOrdersForPartner(partnerId: string): WorkOrder[] {
  return store().workOrders.filter((w) => w.originPartnerId === partnerId && !!w.shareWithPartner);
}

export function countSharedWorkOrdersForPartner(partnerId: string): number {
  return listSharedWorkOrdersForPartner(partnerId).length;
}

export function createProperty(input: Omit<Property, "id" | "createdAt">) {
  const id = `prop_${Math.random().toString(36).slice(2, 10)}`;
  const p: Property = { id, createdAt: new Date().toISOString(), ...input };
  store().properties.unshift(p);
  return p;
}

export function listProperties(token: string): Property[] {
  return store().properties.filter((p) => p.token === token);
}

export function createMessage(input: Omit<Message, "id" | "createdAt" | "threadId"> & { threadId?: string }) {
  const id = `msg_${Math.random().toString(36).slice(2, 10)}`;
  const m: Message = {
    id,
    createdAt: new Date().toISOString(),
    threadId: input.threadId || "thread_default",
    ...input,
  };
  store().messages.unshift(m);
  return m;
}

export function listMessages(input: { token?: string; partnerId?: string; limit?: number }): Message[] {
  const limit = input.limit ?? 20;
  return store().messages
    .filter((m) => (input.token ? m.token === input.token : true))
    .filter((m) => (input.partnerId ? m.partnerId === input.partnerId : true))
    .slice(0, limit);
}

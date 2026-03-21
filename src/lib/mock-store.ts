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
  /** UI-only demo metadata until real data model is wired. */
  sharedWithMe?: boolean;
  ownerName?: string;
  /** Count of active projects/work orders attached to the property (demo). */
  projectsCount?: number;
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

// Demo seeding
export function seedDemoStoreIfEmpty() {
  const s = store();
  if (s.workOrders.length || s.properties.length || s.messages.length) return;

  const token = "demo";
  const partnerId = "frj";

  // Properties
  const props = [
    "3603 W Marquette Rd, Chicago, IL 60629, USA",
    "8949 S Buffalo Ave, Chicago, IL 60617, USA",
    "3307 S Aberdeen St, Chicago, IL 60608, USA",
    "615 W Lake St, Chicago, IL 60661, USA",
    "8020 S Brandon Ave, Chicago, IL 60617, USA",
    "16877 Anthony Ave, Hazel Crest, IL 60429, USA",
  ];
  props.forEach((address, idx) => {
    createProperty({
      token,
      address,
      nickname:
        idx === 0 ? "Home" : idx === 3 ? "Lake St Condo" : idx === 5 ? "Hazel Crest" : undefined,
      sharedWithMe: idx % 3 === 1,
      ownerName: idx % 3 === 1 ? "Client" : "Me",
      projectsCount: idx % 3 === 2 ? 2 : idx % 3 === 1 ? 1 : 0,
    });
  });

  // Work orders (mix statuses so dashboard looks “full”)
  const wos: Array<Partial<WorkOrder> & Pick<WorkOrder, "serviceCategory" | "token" | "status">> = [
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Roof maintenance",
      propertyAddress: props[1],
      status: "in_progress",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Drywall + paint touch-up",
      propertyAddress: props[2],
      status: "scheduled",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Electrical (GFCI outlets)",
      propertyAddress: props[4],
      status: "pending",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "Express Estimate",
      serviceSubcategory: "Inspection PDF estimate",
      propertyAddress: props[0],
      status: "pending",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Plumbing (leak under sink)",
      propertyAddress: props[3],
      status: "completed",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Kitchen faucet replacement",
      propertyAddress: props[5],
      status: "scheduled",
    },
  ];

  // Create with slightly staggered timestamps
  const now = Date.now();
  wos.forEach((w, idx) => {
    const wo = createWorkOrder({
      token: w.token,
      originPartnerId: w.originPartnerId,
      shareWithPartner: w.shareWithPartner,
      serviceCategory: w.serviceCategory,
      serviceSubcategory: w.serviceSubcategory,
      propertyAddress: w.propertyAddress,
      status: w.status,
    });
    // Override createdAt for ordering realism
    wo.createdAt = new Date(now - idx * 1000 * 60 * 60 * 8).toISOString();
  });

  // Messages
  const msgBodies = [
    "Can you confirm access for the inspection visit window?",
    "Estimate is ready—want me to package it for the seller credits request?",
    "Need 2 photos of the affected area to finalize pricing.",
    "Scheduling update: provider can come Thursday 9–11am.",
    "Work completed—please confirm and leave a quick review.",
  ];
  msgBodies.forEach((body, i) => {
    createMessage({
      token,
      partnerId,
      fromRole: i % 2 === 0 ? "HG" : "HO",
      body,
      readAt: i < 2 ? null : new Date().toISOString(),
      threadId: `thread_${i % 2}`,
    });
  });
}


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

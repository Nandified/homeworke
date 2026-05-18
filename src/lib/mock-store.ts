export type WorkOrderStatus = "pending" | "confirming" | "scheduled" | "in_progress" | "completed";

export type WorkOrderAppointment = {
  id: string;
  trade: string; // handyman | plumbing | flooring | ...
  preferredDate?: string;
  preferredWindow?: string;
  status: "PROPOSED" | "PENDING_HG_CONFIRM" | "CONFIRMED" | "DONE" | "CANCELED";
};

export type WorkOrder = {
  id: string;
  createdAt: string;
  token: string;
  originPartnerId?: string | null;
  shareWithPartner?: boolean | null;
  /** Display-only until the real data model is wired. */
  clientName?: string;
  /** True when this work order belongs to the partner's own property (vs a client). */
  isMyProperty?: boolean;
  serviceCategory: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  propertyAddress?: string;
  propertyType?: string;
  preferredDate?: string;
  preferredWindow?: string;
  appointments?: WorkOrderAppointment[];
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
  /** Optional thread metadata (demo + Phase 2). */
  threadTitle?: string;
  propertyAddress?: string;
  ownerName?: string;
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
      id: `prop_demo_${idx + 1}`,
      token,
      address,
      nickname: idx === 0 ? "Home" : idx === 3 ? "Lake St Condo" : idx === 5 ? "Hazel Crest" : undefined,
      sharedWithMe: idx % 3 === 1,
      ownerName:
        idx === 0
          ? "Fernando Rocha Jr"
          : idx === 1
            ? "Ava Martinez"
            : idx === 2
              ? "Noah Johnson"
              : idx === 3
                ? "Sophia Lee"
                : idx === 4
                  ? "Estrella Puente"
                  : "Desyi Mejia",
      projectsCount: idx % 3 === 2 ? 2 : idx % 3 === 1 ? 1 : 0,
    });
  });

  // Work orders (mix statuses so dashboard looks “full”)
  const wos: Array<Partial<WorkOrder> & Pick<WorkOrder, "serviceCategory" | "token" | "status">> = [
    // Client jobs

    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Ava Martinez",
      isMyProperty: false,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Roof maintenance",
      propertyAddress: props[1],
      status: "in_progress",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Noah Johnson",
      isMyProperty: false,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Drywall + paint touch-up",
      propertyAddress: props[2],
      status: "scheduled",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Estrella Puente",
      isMyProperty: false,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Electrical (GFCI outlets)",
      propertyAddress: props[4],
      status: "pending",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Desyi Mejia",
      isMyProperty: false,
      serviceCategory: "Express Estimate",
      serviceSubcategory: "Inspection PDF estimate",
      propertyAddress: props[0],
      status: "pending",
    },
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Sophia Lee",
      isMyProperty: false,
      serviceCategory: "House Repairs & Improvements",
      serviceSubcategory: "Plumbing (leak under sink)",
      propertyAddress: props[3],
      status: "completed",
    },
    // My properties (these should show under the My properties tab)
    {
      token,
      originPartnerId: partnerId,
      shareWithPartner: true,
      clientName: "Fernando Rocha Jr",
      isMyProperty: true,
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
      clientName: w.clientName,
      isMyProperty: w.isMyProperty,
      serviceCategory: w.serviceCategory,
      serviceSubcategory: w.serviceSubcategory,
      propertyAddress: w.propertyAddress,
      status: w.status,
    });
    // Override createdAt for ordering realism
    wo.createdAt = new Date(now - idx * 1000 * 60 * 60 * 8).toISOString();
  });

  // Messages (demo inbox + threads)
  const threads: Array<{ id: string; title: string; ownerName: string; propertyAddress: string }> = [
    {
      id: "thread_credits",
      title: "Seller credits packet",
      ownerName: "Desyi Mejia",
      propertyAddress: "2310 Cuyler Avenue, Berwyn, IL 60402",
    },
    {
      id: "thread_schedule_plumber",
      title: "Plumbing visit scheduling",
      ownerName: "Estrella Puente",
      propertyAddress: "3836 Home Avenue, Berwyn, IL 60402",
    },
    {
      id: "thread_followup_photos",
      title: "Need photos to finalize",
      ownerName: "Saul Margarito",
      propertyAddress: "6635 South Karlov Avenue, Chicago, IL 60629",
    },
  ];

  const now2 = Date.now();

  const push = (
    t: (typeof threads)[number],
    idx: number,
    fromRole: Message["fromRole"],
    body: string,
    unread = false
  ) => {
    const m = createMessage({
      token,
      partnerId,
      threadId: t.id,
      threadTitle: t.title,
      ownerName: t.ownerName,
      propertyAddress: t.propertyAddress,
      fromRole,
      body,
      readAt: unread ? null : new Date().toISOString(),
    });
    m.createdAt = new Date(now2 - idx * 1000 * 60 * 22).toISOString();
  };

  // Thread: credits packet
  push(threads[0], 1, "HO", "Hey Fernando — can you send me a clean summary for seller credits?", true);
  push(threads[0], 2, "HG", "We can package a negotiation-friendly repair list + ranges. Any deadline?", true);
  push(threads[0], 3, "HO", "Offer review is tomorrow morning. Ideally tonight.");
  push(threads[0], 4, "HG", "Got it. I’ll prioritize the Safety + Repair items and include assumptions.");

  // Thread: scheduling plumber
  push(threads[1], 5, "HG", "Plumber available Thu 9–11am or Fri 1–3pm. Which works?", true);
  push(threads[1], 6, "HO", "Friday afternoon works best.");
  push(threads[1], 7, "HG", "Confirmed Fri 1–3pm. We’ll text when en route.");

  // Thread: photos follow-up
  push(threads[2], 8, "HG", "Quick ask — can you snap 2 photos of the affected wall so pricing is tighter?", true);
  push(threads[2], 9, "HO", "Yep, I can take them after work.");
  push(threads[2], 10, "HG", "Perfect. Upload here anytime — we’ll update the estimate within the hour.");

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

  const preferredDate = (input as any)?.preferredDate;
  const preferredWindow = (input as any)?.preferredWindow;

  const appointments = Array.isArray((input as any)?.appointments) ? ((input as any).appointments as WorkOrderAppointment[]) : undefined;
  const defaultAppointments: WorkOrderAppointment[] = !appointments
    ? [
        {
          id: `apt_${Math.random().toString(36).slice(2, 9)}`,
          trade: "handyman",
          preferredDate,
          preferredWindow,
          status: "PENDING_HG_CONFIRM",
        },
      ]
    : [];

  const wo: WorkOrder = {
    id,
    createdAt: new Date().toISOString(),
    status: input.status || (preferredDate ? "confirming" : "pending"),
    appointments: appointments || defaultAppointments,
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

// Operator access helper (Home Guide / admin views)
export function getWorkOrderById(id: string) {
  return store().workOrders.find((w) => w.id === id) || null;
}

export function updateWorkOrderSchedule(token: string, id: string, input: { preferredDate?: string; preferredWindow?: string }) {
  const wo = getWorkOrder(token, id);
  if (!wo) return null;

  const preferredDate = typeof input.preferredDate === "string" ? input.preferredDate : wo.preferredDate;
  const preferredWindow = typeof input.preferredWindow === "string" ? input.preferredWindow : wo.preferredWindow;

  wo.preferredDate = preferredDate;
  wo.preferredWindow = preferredWindow;

  // Ensure we have at least one appointment stub.
  if (!Array.isArray(wo.appointments) || wo.appointments.length === 0) {
    wo.appointments = [
      {
        id: `apt_${Math.random().toString(36).slice(2, 9)}`,
        trade: "handyman",
        preferredDate,
        preferredWindow,
        status: "PENDING_HG_CONFIRM",
      },
    ];
  }

  // Update first appointment stub to match.
  const first = wo.appointments[0];
  if (first) {
    first.preferredDate = preferredDate;
    first.preferredWindow = preferredWindow;
    if (first.status === "PROPOSED") first.status = "PENDING_HG_CONFIRM";
  }

  // Status mapping
  if (preferredDate && preferredWindow) wo.status = "confirming";
  return wo;
}

export function listSharedWorkOrdersForPartner(partnerId: string): WorkOrder[] {
  const norm = (s: string) => (s || "").replace(/^(pro_|partner_)/, "");
  const want = norm(partnerId);
  return store().workOrders.filter((w) => norm(String(w.originPartnerId || "")) === want && !!w.shareWithPartner);
}

export function countSharedWorkOrdersForPartner(partnerId: string): number {
  return listSharedWorkOrdersForPartner(partnerId).length;
}

export function createProperty(input: Omit<Property, "createdAt"> & { id?: string }) {
  const id = input.id || `prop_${Math.random().toString(36).slice(2, 10)}`;
  const { id: _ignored, ...rest } = input;
  const p: Property = { id, createdAt: new Date().toISOString(), ...(rest as Omit<Property, "id" | "createdAt">) };
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

export function markReadThread(input: { partnerId?: string; threadId: string }) {
  const now = new Date().toISOString();
  for (const m of store().messages) {
    if (m.threadId !== input.threadId) continue;
    if (input.partnerId && m.partnerId !== input.partnerId) continue;
    if (!m.readAt) m.readAt = now;
  }
}

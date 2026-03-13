export type DemoWorkOrder = {
  id: string;
  title: string;
  address: string;
  status: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
};

export const PRO_DEMO_WORK_ORDERS: DemoWorkOrder[] = [
  {
    id: "wo-demo-1001",
    title: "Kitchen sink leak + drywall patch",
    address: "123 Main St, Chicago, IL",
    status: "In progress",
    clientName: "Ava Martinez",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wo-demo-1002",
    title: "Electrical: outlets + GFCI check",
    address: "98 W Hubbard St, Chicago, IL",
    status: "Pending",
    clientName: "Noah Johnson",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "wo-demo-1003",
    title: "HVAC tune-up + filter replacement",
    address: "410 N Dearborn St, Chicago, IL",
    status: "Scheduled",
    clientName: "Sophia Lee",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

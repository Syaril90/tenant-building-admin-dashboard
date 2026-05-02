export type SharedPaymentMethod = {
  id: string;
  typeLabel: string;
  metaLabel: string;
  selectedByDefault?: boolean;
};

export type SharedPropertyUnit = {
  unitCode: string;
  unitName: string;
  status: string;
  residentCode: string;
  residentName: string;
  documentsExpected: string[];
};

export type SharedPropertyArea = {
  areaCode: string;
  areaName: string;
  status: string;
  documentsExpected: string[];
  units: SharedPropertyUnit[];
};

export type SharedPropertyBuilding = {
  buildingCode: string;
  buildingName: string;
  status: string;
  documentsExpected: string[];
  visitorSlots: number;
  areas: SharedPropertyArea[];
};

export type SharedBillingCharge = {
  id: string;
  billingType: string;
  category: string;
  periodLabel: string;
  icon: string;
  amount: number;
  dueDate: string;
  postedAt: string;
  reference: string;
  description: string;
  source: "system" | "building_admin";
};

export type SharedBillingPayment = {
  id: string;
  amount: number;
  paidAt: string;
  reference: string;
  description: string;
  source: "resident_app" | "building_admin" | "system";
  methodId: string;
  methodLabel: string;
  status: "successful" | "pending_review";
  chargeIds: string[];
};

export type SharedBillingAccount = {
  accountId: string;
  buildingCode: string;
  buildingName: string;
  areaCode: string;
  areaName: string;
  unitCode: string;
  unitName: string;
  residentCode: string;
  residentName: string;
  charges: SharedBillingCharge[];
  payments: SharedBillingPayment[];
};

export const sharedPaymentMethods: SharedPaymentMethod[] = [
  {
    id: "card-ending-1842",
    typeLabel: "Visa ending 1842",
    metaLabel: "Default card",
    selectedByDefault: true,
  },
  {
    id: "fpx-cimb",
    typeLabel: "FPX via CIMB",
    metaLabel: "Instant online banking",
  },
  {
    id: "duitnow-qr",
    typeLabel: "DuitNow QR",
    metaLabel: "Mobile banking payment",
  },
];

export const sharedPropertyBuildings: SharedPropertyBuilding[] = [
  {
    buildingCode: "BLD-A",
    buildingName: "Serene Heights Tower A",
    status: "Active building",
    documentsExpected: ["Master plan", "Fire compliance file"],
    visitorSlots: 8,
    areas: [
      {
        areaCode: "AREA-A-LZ",
        areaName: "Low Zone",
        status: "Shared facilities zone",
        documentsExpected: ["Area schematic", "Maintenance zone report"],
        units: [
          {
            unitCode: "A-01-01",
            unitName: "Unit A-01-01",
            status: "Owner occupied",
            residentCode: "RES-A0101-2026",
            residentName: "Amirul Faiz",
            documentsExpected: ["SPA / title", "Resident registration form"],
          },
          {
            unitCode: "A-01-02",
            unitName: "Unit A-01-02",
            status: "Tenanted",
            residentCode: "RES-A0102-2026",
            residentName: "Mei Ling Tan",
            documentsExpected: ["Tenancy agreement", "Resident registration form"],
          },
        ],
      },
      {
        areaCode: "AREA-A-MZ",
        areaName: "Mid Zone",
        status: "Shared facilities zone",
        documentsExpected: ["Area schematic", "Renovation notice register"],
        units: [
          {
            unitCode: "A-12-08",
            unitName: "Unit A-12-08",
            status: "Owner occupied",
            residentCode: "RES-A1208-2026",
            residentName: "Aisyah Rahman",
            documentsExpected: ["SPA / title", "Resident registration form"],
          },
          {
            unitCode: "A-12-09",
            unitName: "Unit A-12-09",
            status: "Tenanted",
            residentCode: "RES-A1209-2026",
            residentName: "Daniel Wong",
            documentsExpected: ["Tenancy agreement", "Resident registration form"],
          },
        ],
      },
      {
        areaCode: "AREA-A-SZ",
        areaName: "Sky Zone",
        status: "Premium residential zone",
        documentsExpected: ["Area schematic", "Access control plan"],
        units: [
          {
            unitCode: "A-20-01",
            unitName: "Unit A-20-01",
            status: "Reserved",
            residentCode: "",
            residentName: "Pending Occupant",
            documentsExpected: ["Booking form", "Purchaser registration pack"],
          },
        ],
      },
    ],
  },
  {
    buildingCode: "BLD-B",
    buildingName: "Serene Heights Tower B",
    status: "Active building",
    documentsExpected: ["Master plan", "CCC certificate"],
    visitorSlots: 6,
    areas: [
      {
        areaCode: "AREA-B-E",
        areaName: "East Wing",
        status: "Shared facilities zone",
        documentsExpected: ["Area schematic", "Mechanical services drawing"],
        units: [
          {
            unitCode: "B-04-11",
            unitName: "Unit B-04-11",
            status: "Owner occupied",
            residentCode: "RES-B0411-2026",
            residentName: "Nurul Huda",
            documentsExpected: ["SPA / title", "Resident registration form"],
          },
          {
            unitCode: "B-04-12",
            unitName: "Unit B-04-12",
            status: "Tenanted",
            residentCode: "RES-B0412-2026",
            residentName: "Kelvin Yap",
            documentsExpected: ["Tenancy agreement", "Resident registration form"],
          },
        ],
      },
      {
        areaCode: "AREA-B-W",
        areaName: "West Wing",
        status: "Shared facilities zone",
        documentsExpected: ["Area schematic", "Renovation control checklist"],
        units: [
          {
            unitCode: "B-15-01",
            unitName: "Unit B-15-01",
            status: "Vacant",
            residentCode: "",
            residentName: "Vacant Unit",
            documentsExpected: ["Vacancy checklist", "Meter handover form"],
          },
          {
            unitCode: "B-15-02",
            unitName: "Unit B-15-02",
            status: "Tenanted",
            residentCode: "RES-B1502-2026",
            residentName: "Siti Kamilah",
            documentsExpected: ["Tenancy agreement", "Resident registration form"],
          },
        ],
      },
    ],
  },
  {
    buildingCode: "BLD-C",
    buildingName: "Crescent Bay Tower C",
    status: "New residential tower",
    documentsExpected: ["Master plan", "Fire compliance certificate"],
    visitorSlots: 5,
    areas: [
      {
        areaCode: "AREA-C-E",
        areaName: "East Wing",
        status: "Floors 1 to 10",
        documentsExpected: ["Area layout plan", "Mechanical services drawing"],
        units: [
          {
            unitCode: "C-02-01",
            unitName: "Unit C-02-01",
            status: "Owner occupied",
            residentCode: "RES-C0201-2026",
            residentName: "Harith Iskandar",
            documentsExpected: ["SPA / title", "Resident registration form"],
          },
          {
            unitCode: "C-02-02",
            unitName: "Unit C-02-02",
            status: "Tenanted",
            residentCode: "RES-C0202-2026",
            residentName: "Chloe Lim",
            documentsExpected: ["Tenancy agreement", "Resident registration form"],
          },
        ],
      },
    ],
  },
  {
    buildingCode: "BLD-P",
    buildingName: "Retail Podium",
    status: "Retail block",
    documentsExpected: ["Retail master plan", "Trade license file"],
    visitorSlots: 4,
    areas: [
      {
        areaCode: "AREA-P-G",
        areaName: "Ground Retail",
        status: "Street-facing lots",
        documentsExpected: ["Retail fit-out guide", "Trade access schedule"],
        units: [
          {
            unitCode: "P-G-03",
            unitName: "Lot P-G-03",
            status: "Trading",
            residentCode: "SHOP-PG03-2026",
            residentName: "Brew Yard Cafe",
            documentsExpected: ["Tenancy agreement", "Business registration"],
          },
          {
            unitCode: "P-G-05",
            unitName: "Lot P-G-05",
            status: "Trading",
            residentCode: "SHOP-PG05-2026",
            residentName: "Common Ground Pharmacy",
            documentsExpected: ["Tenancy agreement", "Business registration"],
          },
        ],
      },
    ],
  },
];

export const sharedBillingAccounts: SharedBillingAccount[] = [
  {
    accountId: "acct-a1208",
    buildingCode: "BLD-A",
    buildingName: "Serene Heights Tower A",
    areaCode: "AREA-A-MZ",
    areaName: "Mid Zone",
    unitCode: "A-12-08",
    unitName: "Unit A-12-08",
    residentCode: "RES-A1208-2026",
    residentName: "Aisyah Rahman",
    charges: [
      {
        id: "charge-a1208-maint-apr",
        billingType: "Maintenance",
        category: "Management",
        periodLabel: "April 2026",
        icon: "home-outline",
        amount: 220,
        dueDate: "2026-05-05",
        postedAt: "01 Apr 2026 • 09:00 AM",
        reference: "APR-MTN-A1208",
        description: "April 2026 maintenance charges",
        source: "system",
      },
      {
        id: "charge-a1208-sink-apr",
        billingType: "Sinking Fund",
        category: "Management",
        periodLabel: "April 2026",
        icon: "wallet-outline",
        amount: 220,
        dueDate: "2026-05-05",
        postedAt: "01 Apr 2026 • 09:05 AM",
        reference: "APR-SNK-A1208",
        description: "April 2026 sinking fund contribution",
        source: "system",
      },
    ],
    payments: [
      {
        id: "payment-a1208-apr",
        amount: 220,
        paidAt: "24 Apr 2026 • 11:20 AM",
        reference: "FPX-884201",
        description: "Resident online settlement received",
        source: "system",
        methodId: "fpx-cimb",
        methodLabel: "FPX via CIMB",
        status: "successful",
        chargeIds: ["charge-a1208-maint-apr"],
      },
    ],
  },
  {
    accountId: "acct-a1209",
    buildingCode: "BLD-A",
    buildingName: "Serene Heights Tower A",
    areaCode: "AREA-A-MZ",
    areaName: "Mid Zone",
    unitCode: "A-12-09",
    unitName: "Unit A-12-09",
    residentCode: "RES-A1209-2026",
    residentName: "Daniel Wong",
    charges: [
      {
        id: "charge-a1209-maint-apr",
        billingType: "Maintenance",
        category: "Management",
        periodLabel: "April 2026",
        icon: "home-outline",
        amount: 220,
        dueDate: "2026-05-05",
        postedAt: "01 Apr 2026 • 09:10 AM",
        reference: "APR-MTN-A1209",
        description: "April 2026 maintenance charges",
        source: "system",
      },
      {
        id: "charge-a1209-water-mar",
        billingType: "Water Bill",
        category: "Utility",
        periodLabel: "March 2026",
        icon: "water-outline",
        amount: 68,
        dueDate: "2026-05-05",
        postedAt: "03 Apr 2026 • 10:30 AM",
        reference: "APR-WTR-A1209",
        description: "March 2026 metered water bill",
        source: "system",
      },
    ],
    payments: [],
  },
  {
    accountId: "acct-b0411",
    buildingCode: "BLD-B",
    buildingName: "Serene Heights Tower B",
    areaCode: "AREA-B-E",
    areaName: "East Wing",
    unitCode: "B-04-11",
    unitName: "Unit B-04-11",
    residentCode: "RES-B0411-2026",
    residentName: "Nurul Huda",
    charges: [
      {
        id: "charge-b0411-maint-apr",
        billingType: "Maintenance",
        category: "Management",
        periodLabel: "April 2026",
        icon: "home-outline",
        amount: 240,
        dueDate: "2026-04-20",
        postedAt: "01 Apr 2026 • 09:12 AM",
        reference: "APR-MTN-B0411",
        description: "April 2026 maintenance charges",
        source: "system",
      },
      {
        id: "charge-b0411-water-mar",
        billingType: "Water Bill",
        category: "Utility",
        periodLabel: "March 2026",
        icon: "water-outline",
        amount: 72,
        dueDate: "2026-04-20",
        postedAt: "03 Apr 2026 • 10:40 AM",
        reference: "APR-WTR-B0411",
        description: "March 2026 metered water bill",
        source: "system",
      },
    ],
    payments: [],
  },
  {
    accountId: "acct-b0412",
    buildingCode: "BLD-B",
    buildingName: "Serene Heights Tower B",
    areaCode: "AREA-B-E",
    areaName: "East Wing",
    unitCode: "B-04-12",
    unitName: "Unit B-04-12",
    residentCode: "RES-B0412-2026",
    residentName: "Kelvin Yap",
    charges: [
      {
        id: "charge-b0412-maint-apr",
        billingType: "Maintenance",
        category: "Management",
        periodLabel: "April 2026",
        icon: "home-outline",
        amount: 240,
        dueDate: "2026-05-10",
        postedAt: "01 Apr 2026 • 09:18 AM",
        reference: "APR-MTN-B0412",
        description: "April 2026 maintenance charges",
        source: "system",
      },
    ],
    payments: [
      {
        id: "payment-b0412-apr",
        amount: 120,
        paidAt: "18 Apr 2026 • 02:45 PM",
        reference: "DQN-410821",
        description: "Partial settlement received online",
        source: "resident_app",
        methodId: "duitnow-qr",
        methodLabel: "DuitNow QR",
        status: "successful",
        chargeIds: ["charge-b0412-maint-apr"],
      },
    ],
  },
  {
    accountId: "acct-c0201",
    buildingCode: "BLD-C",
    buildingName: "Crescent Bay Tower C",
    areaCode: "AREA-C-E",
    areaName: "East Wing",
    unitCode: "C-02-01",
    unitName: "Unit C-02-01",
    residentCode: "RES-C0201-2026",
    residentName: "Harith Iskandar",
    charges: [
      {
        id: "charge-c0201-maint-apr",
        billingType: "Maintenance",
        category: "Management",
        periodLabel: "April 2026",
        icon: "home-outline",
        amount: 210,
        dueDate: "2026-05-12",
        postedAt: "01 Apr 2026 • 09:25 AM",
        reference: "APR-MTN-C0201",
        description: "April 2026 maintenance charges",
        source: "system",
      },
    ],
    payments: [],
  },
  {
    accountId: "acct-pg03",
    buildingCode: "BLD-P",
    buildingName: "Retail Podium",
    areaCode: "AREA-P-G",
    areaName: "Ground Retail",
    unitCode: "P-G-03",
    unitName: "Lot P-G-03",
    residentCode: "SHOP-PG03-2026",
    residentName: "Brew Yard Cafe",
    charges: [
      {
        id: "charge-pg03-util-apr",
        billingType: "Utilities",
        category: "Utility",
        periodLabel: "April 2026",
        icon: "flash-outline",
        amount: 180,
        dueDate: "2026-05-10",
        postedAt: "02 Apr 2026 • 02:00 PM",
        reference: "APR-UTIL-PG03",
        description: "April 2026 shared utilities billing",
        source: "system",
      },
    ],
    payments: [
      {
        id: "payment-pg03-apr",
        amount: 180,
        paidAt: "22 Apr 2026 • 03:08 PM",
        reference: "OFFLINE-CHK-1009",
        description: "Cheque payment recorded by management office",
        source: "building_admin",
        methodId: "offline_cheque",
        methodLabel: "Cheque",
        status: "successful",
        chargeIds: ["charge-pg03-util-apr"],
      },
    ],
  },
  {
    accountId: "acct-pg05",
    buildingCode: "BLD-P",
    buildingName: "Retail Podium",
    areaCode: "AREA-P-G",
    areaName: "Ground Retail",
    unitCode: "P-G-05",
    unitName: "Lot P-G-05",
    residentCode: "SHOP-PG05-2026",
    residentName: "Common Ground Pharmacy",
    charges: [
      {
        id: "charge-pg05-util-apr",
        billingType: "Utilities",
        category: "Utility",
        periodLabel: "April 2026",
        icon: "flash-outline",
        amount: 200,
        dueDate: "2026-05-10",
        postedAt: "02 Apr 2026 • 02:10 PM",
        reference: "APR-UTIL-PG05",
        description: "April 2026 shared utilities billing",
        source: "system",
      },
      {
        id: "charge-pg05-access-apr",
        billingType: "Access Card Replacement",
        category: "Access",
        periodLabel: "April 2026",
        icon: "card-outline",
        amount: 50,
        dueDate: "2026-05-10",
        postedAt: "12 Apr 2026 • 09:20 AM",
        reference: "APR-AC-PG05",
        description: "Access card replacement fee",
        source: "building_admin",
      },
    ],
    payments: [],
  },
];

export function getSharedBillingAccount(unitCode: string) {
  return sharedBillingAccounts.find((account) => account.unitCode === unitCode);
}

export function listSharedPropertyUnits() {
  return sharedPropertyBuildings.flatMap((building) =>
    building.areas.flatMap((area) =>
      area.units.map((unit) => ({
        buildingCode: building.buildingCode,
        buildingName: building.buildingName,
        areaCode: area.areaCode,
        areaName: area.areaName,
        ...unit,
      })),
    ),
  );
}

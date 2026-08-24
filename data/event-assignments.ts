export type EventAssignment = {
  sponsoringCustomer: string;
  organizingCustomer: string;
  managedBy: string;
  attendingCustomers: string[];
  notes: string;
};

const common: EventAssignment = {
  sponsoringCustomer: "Department of Defense",
  organizingCustomer: "Department of Defense",
  managedBy: "Maya Chen",
  attendingCustomers: ["Department of Defense"],
  notes: "Internal planning assignment; not published by the event organizer."
};

export const eventAssignments: Record<string, EventAssignment> = {
  "ausa-annual-meeting": { ...common, sponsoringCustomer: "U.S. Army", organizingCustomer: "U.S. Army", attendingCustomers: ["U.S. Army", "Army Futures Command", "Army Materiel Command"], notes: "Internal Army engagement assignment; not published by AUSA." },
  "geoint-symposium": { ...common, sponsoringCustomer: "NGA", organizingCustomer: "National Geospatial-Intelligence Agency", managedBy: "Jordan Lewis", attendingCustomers: ["NGA", "U.S. Space Force", "DIA"], notes: "Internal GEOINT engagement assignment; not published by USGIF." },
  geogala: { ...common, sponsoringCustomer: "NGA", organizingCustomer: "National Geospatial-Intelligence Agency", managedBy: "Jordan Lewis", attendingCustomers: ["NGA", "DIA"], notes: "Internal community engagement assignment; not published by USGIF." },
  "dodiis-worldwide": { ...common, sponsoringCustomer: "DIA", organizingCustomer: "Defense Intelligence Agency", managedBy: "Priya Shah", attendingCustomers: ["DIA", "NSA", "NGA"], notes: "Internal intelligence-enterprise assignment; not published by DIA." },
  "technet-indo-pacific": { ...common, sponsoringCustomer: "U.S. Army Pacific", organizingCustomer: "U.S. Indo-Pacific Command", managedBy: "Evan Brooks", attendingCustomers: ["U.S. Indo-Pacific Command", "U.S. Army Pacific"], notes: "Internal regional engagement assignment; not published by AFCEA." },
  west: { ...common, sponsoringCustomer: "U.S. Navy", organizingCustomer: "U.S. Navy", managedBy: "Evan Brooks", attendingCustomers: ["U.S. Navy", "U.S. Marine Corps", "U.S. Indo-Pacific Command"], notes: "Internal maritime engagement assignment; not published by AFCEA or USNI." },
  "technet-cyber": { ...common, sponsoringCustomer: "U.S. Army", organizingCustomer: "Army Cyber Command", managedBy: "Jordan Lewis", attendingCustomers: ["Army Cyber Command", "NSA", "U.S. Cyber Command"], notes: "Internal cyber engagement assignment; not published by AFCEA." },
  "army-signal": { ...common, sponsoringCustomer: "U.S. Army", organizingCustomer: "Network Enterprise Center", managedBy: "Jordan Lewis", attendingCustomers: ["U.S. Army", "Army Cyber Command"], notes: "Internal Army communications assignment; not published by AFCEA." },
  dAFITC: { ...common, sponsoringCustomer: "U.S. Air Force", organizingCustomer: "Department of the Air Force", managedBy: "Priya Shah", attendingCustomers: ["U.S. Air Force", "U.S. Space Force"], notes: "Internal Air Force IT assignment; not published by AFCEA." },
  dhits: { ...common, sponsoringCustomer: "Defense Health Agency", organizingCustomer: "Defense Health Agency", managedBy: "Evan Brooks", attendingCustomers: ["Defense Health Agency", "U.S. Army", "U.S. Navy"], notes: "Internal health IT assignment; not published by AFCEA." },
  "rocky-mountain-cyberspace": { ...common, sponsoringCustomer: "U.S. Space Force", organizingCustomer: "U.S. Northern Command", managedBy: "Jordan Lewis", attendingCustomers: ["U.S. Space Force", "U.S. Northern Command", "NORAD"], notes: "Internal cyber and space assignment; not published by AFCEA." },
  "intelligence-national-security": { ...common, sponsoringCustomer: "DIA", organizingCustomer: "Office of the Director of National Intelligence", managedBy: "Priya Shah", attendingCustomers: ["ODNI", "DIA", "CIA"], notes: "Internal intelligence-community assignment; not published by INSA or AFCEA." },
  "afa-warfare": { ...common, sponsoringCustomer: "U.S. Air Force", organizingCustomer: "U.S. Air Force", attendingCustomers: ["U.S. Air Force", "U.S. Space Force", "Air Mobility Command"], notes: "Internal air and space engagement assignment; not published by AFA." },
  "afa-air-space-cyber": { ...common, sponsoringCustomer: "U.S. Air Force", organizingCustomer: "U.S. Air Force", attendingCustomers: ["U.S. Air Force", "U.S. Space Force", "U.S. Cyber Command"], notes: "Internal air and space engagement assignment; not published by AFA." },
  "sea-air-space": { ...common, sponsoringCustomer: "U.S. Navy", organizingCustomer: "U.S. Navy", managedBy: "Evan Brooks", attendingCustomers: ["U.S. Navy", "U.S. Coast Guard", "U.S. Marine Corps"], notes: "Internal maritime engagement assignment; not published by the Navy League." },
  "aaaa-summit": { ...common, sponsoringCustomer: "U.S. Army", organizingCustomer: "Army Aviation Center of Excellence", attendingCustomers: ["U.S. Army", "Army Futures Command"], notes: "Internal Army aviation assignment; not published by AAAA." },
  "sof-week": { ...common, sponsoringCustomer: "USSOCOM", organizingCustomer: "U.S. Special Operations Command", managedBy: "Luis Romero", attendingCustomers: ["USSOCOM", "U.S. Army", "U.S. Navy"], notes: "Internal special operations assignment; not published by USSOCOM or GSOF." },
  "modern-day-marine": { ...common, sponsoringCustomer: "U.S. Marine Corps", organizingCustomer: "U.S. Marine Corps", managedBy: "Evan Brooks", attendingCustomers: ["U.S. Marine Corps", "U.S. Navy"], notes: "Internal Marine Corps engagement assignment; not published by MCAA." },
  sofic: { ...common, sponsoringCustomer: "USSOCOM", organizingCustomer: "U.S. Special Operations Command", managedBy: "Luis Romero", attendingCustomers: ["USSOCOM", "U.S. Army", "U.S. Air Force"], notes: "Internal SOF assignment; no separate SOFIC date was published by the organizer." },
  "space-symposium": { ...common, sponsoringCustomer: "U.S. Space Force", organizingCustomer: "U.S. Space Force", attendingCustomers: ["U.S. Space Force", "NASA", "Commercial Space Companies"], notes: "Internal space engagement assignment; not published by Space Foundation." },
  "ndia-expeditionary-warfare": { ...common, sponsoringCustomer: "Office of the Secretary of Defense", organizingCustomer: "Office of the Secretary of Defense", managedBy: "Evan Brooks", attendingCustomers: ["Office of the Secretary of Defense", "U.S. Army", "U.S. Navy"], notes: "Internal defense-industrial-base assignment; not published by NDIA." }
};

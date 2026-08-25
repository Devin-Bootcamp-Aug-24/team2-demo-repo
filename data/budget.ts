import { eventAssignments } from "./event-assignments";

// These are internal budget-planning inputs, not scraped data. The refresh
// workflow must never write this file.
export type BudgetPlan = {
  registrationFee: number | null;
  headcount: number;
  attending: boolean;
};

export const budgetPlans: Record<string, BudgetPlan> = Object.fromEntries(
  Object.entries(eventAssignments).map(([id, assignment]) => [
    id,
    {
      registrationFee: null,
      headcount: 0,
      attending: assignment.status === "Confirmed"
    }
  ])
);

/** Elixir MD INC brand tokens — from elixir-task-tracker_4.html + brand guide */
export const elixir = {
  navy: "#21264C",
  slate: "#8598B1",
  white: "#FFFFFF",
  red: "#E8495A",
  amber: "#E8A840",
  green: "#3DB87A",
  blueMid: "#4A78C4",
  gradient:
    "linear-gradient(135deg, #212F59 0%, #293D85 30%, #1D569D 60%, #5E7080 85%, #8EB8D4 100%)",
} as const;

export const priorityLabels = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export const priorityOrder = ["critical", "high", "medium", "low"] as const;

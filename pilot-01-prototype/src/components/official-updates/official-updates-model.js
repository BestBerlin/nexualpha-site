import { visibleEventSourceItems } from "../../data/event-source.js";

export function visibleOfficialUpdates(updates = [], now = Date.now()) {
  return visibleEventSourceItems(updates, { now }).items;
}

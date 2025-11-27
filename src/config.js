// src/config.js
export function loadConfigToWindow() {
  // prefer explicitly provided SP site id, otherwise fall back to old name
  window.SITE_ID = window.SITE_ID || import.meta.env.VITE_SP_SITE_ID || import.meta.env.VITE_SITE_ID || "";

  // parse LISTS JSON if provided
  let listsObj = {};
  const raw = import.meta.env.VITE_LISTS_JSON || import.meta.env.VITE_LISTS || "";
  if (raw) {
    try {
      listsObj = JSON.parse(raw);
    } catch (e) {
      try {
        // sometimes Vite quoting can keep quotes, try eval fallback carefully
        listsObj = (new Function("return " + raw))();
      } catch (err) {
        console.warn("Could not parse VITE_LISTS_JSON:", err);
        listsObj = {};
      }
    }
  }

  // fallback per-list env variables (optional)
  listsObj.userRoles = listsObj.userRoles || import.meta.env.VITE_LIST_USERROLES || "";
  listsObj.students = listsObj.students || import.meta.env.VITE_LIST_STUDENTS || "";
  listsObj.assessments = listsObj.assessments || import.meta.env.VITE_LIST_ASSESSMENTS || "";
  listsObj.leaves = listsObj.leaves || import.meta.env.VITE_LIST_LEAVES || "";
  listsObj.lessonPlans = listsObj.lessonPlans || import.meta.env.VITE_LIST_LESSONPLANS || "";
  listsObj.activities = listsObj.activities || import.meta.env.VITE_LIST_ACTIVITIES || "";
  listsObj.attendance = listsObj.attendance || import.meta.env.VITE_LIST_ATTENDANCE || "";
  listsObj.participation = listsObj.participation || import.meta.env.VITE_LIST_PARTICIPATION || "";
  listsObj.interventions = listsObj.interventions || import.meta.env.VITE_LIST_INTERVENTIONS || "";
  listsObj.milestones = listsObj.milestones || import.meta.env.VITE_LIST_MILESTONES || "";
  listsObj.interventionTasks = listsObj.interventionTasks || import.meta.env.VITE_LIST_INTERVENTIONTASKS || "";

  window.LISTS = window.LISTS || listsObj;

  if (import.meta.env.DEV) {
    console.info("loadConfigToWindow -> SITE_ID:", window.SITE_ID);
    console.info("loadConfigToWindow -> LISTS keys:", Object.keys(window.LISTS).filter(k => !!window.LISTS[k]));
  }
}

# /tasks Route – Create Task Flow: Current Steps, Issues, and Fixes

## Current steps (as per code)

1. **User clicks "Create Task"**  
   - `TaskHeader.tsx`: `onClick={openAddTaskSidebar}` → `AddTaskSidebar` opens with `TaskForm` in `mode='create'`.

2. **User types the first character in the task name field**  
   - `TaskForm.tsx`: Name input uses `onChange={(e) => handleNameChange(e, handleChange, values?.name)}`.

3. **handleNameChange runs** (`TaskForm.tsx` ~505–516)  
   - Calls `handleChange(e)` → Formik updates `values.name`.  
   - Condition: `if (mode !== 'create' || name.length !== 0 || taskId) return;`  
     - So it only continues when: `mode === 'create'`, current `name` is empty, and `taskId` is falsy.  
   - On **first keystroke**: `name` is `''`, so the condition is false and the block runs.  
   - Calls `createTask({ name: e.target.value })` → **API creates a task with that single character** (e.g. `"A"`).  
   - On success: `setParams('taskId', res?.data?.id)` → **URL gets `?taskId=<newTaskId>`**.

4. **Tasks page reacts to `taskId` in URL** (`Tasks.tsx` ~66–71)  
   - `useEffect` depends on `taskIdFromUrl` (`getParam('taskId')`).  
   - When `taskId` appears: `setSelectedTask({ id: taskIdFromUrl })`, `openEditTaskSidebar()`.  
   - **Edit Task sidebar opens** with the newly created task (name = one character).  
   - Add Task sidebar is still open in the background (no logic closes it when `taskId` is set).

5. **Result**  
   - A task is created with only the first character.  
   - User is taken to Edit Task sidebar instead of continuing to fill the Add Task form.  
   - Add Task sidebar remains open underneath.

---

## UX issues

| # | Issue | Why it’s wrong |
|---|--------|-----------------|
| 1 | **Task created on first keystroke** | User expects to type a full name and then create via “Save” or “Create”. Creating and persisting a task as soon as they type one character is surprising and creates junk/partial tasks. |
| 2 | **Edit sidebar opens automatically** | User clicked “Create Task” to add a task, not to edit. Switching to Edit sidebar after one letter feels like the app took over and changed context. |
| 3 | **Task name is a single character** | Backend stores a task whose name is literally the first character. That is not a valid “draft” and is confusing in lists and history. |
| 4 | **Add sidebar not closed** | Two sidebars (Add + Edit) can be open; state is confusing and doesn’t match user intent (one “Create Task” flow). |
| 5 | **No explicit “Create” action** | Creation happens implicitly on input, with no confirmation or “Create” click. Good UX is: fill form → click Create → task created. |

---

## Suggested fixes

1. **Remove “create on first letter” in create mode**  
   - In `TaskForm.tsx`, do **not** call `createTask` or `setParams('taskId', …)` from `handleNameChange` when in `mode='create'`.  
   - Task creation should happen only when the user submits the form (e.g. “Create Task” / “Save” in Add Task sidebar).

2. **Keep a single flow: Add Task → submit → done**  
   - Add Task: user fills name (and any other fields), then submits.  
   - On submit: `AddTaskSidebar`’s `handleSubmit` already calls `createTask`, shows success, resets form, and closes the sidebar.  
   - No `taskId` is set from the name field, so the Tasks page effect does not open the Edit sidebar.  
   - Optional later enhancement: after a successful create in Add Task sidebar, you could set `taskId` and open Edit sidebar once, so the user can continue editing the new task (with a clear “created → now editing” transition). For now, the fix is “create only on submit, no auto-open Edit”.

3. **No change required for Edit sidebar**  
   - When user explicitly clicks a task card, `handleTaskClick` sets `taskId` and opens Edit; that behavior stays.  
   - Closing Edit sidebar already clears `taskId` via `deleteParams(['taskId'])` in `EditTaskSidebar`.

---

## Summary

- **Current:** First character in the name field creates a task and sets `taskId` → Edit Task opens, Add stays open, task name is one character.  
- **Desired:** First character only updates the form. Task is created only when the user submits the Add Task form. No automatic switch to Edit; no double sidebar.

Implementing the fix by removing the create-task + set-params logic from `handleNameChange` in create mode.

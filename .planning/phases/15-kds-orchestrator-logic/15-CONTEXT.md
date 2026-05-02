# Phase 15 Context: KDS Orchestrator Logic

## 1. Objective
Implement the backend timing logic to orchestrate dish preparation, ensuring that all items in a single order finish simultaneously (Just-in-Time orchestration).

## 2. Decision Log

### 2.1. Orchestration Strategy
- **Synchronized (JIT):** The orchestrator will calculate an `heure_lancement` (launch time) for each dish line such that they all reach the `PRETE` state at the same time.
- **Calculation Formula:**
    - `MaxPrepTime` = Max(`plat.temps_preparation`) across all active lines in the order.
    - `TargetReadyTime` = `commande.created_at` + `MaxPrepTime`.
    - `line.heure_lancement` = `TargetReadyTime` - `line.plat.temps_preparation`.
- **Flat Ordering:** For this phase, all items in an order are treated as a single group (no staged delays between Entrées and Mains).

### 2.2. Trigger & Notification Strategy
- **Backend-Triggered (Celery):** The backend will be responsible for "releasing" tickets to the KDS at the correct time.
- **Workflow:**
    1. When an order is created or updated, the orchestrator calculates/recalculates launch times.
    2. A Celery task is scheduled for each line at its `heure_lancement`.
    3. When the task executes, it updates the `CommandeLigne.statut` (if appropriate) and broadcasts a `line_launched` event via WebSocket to the KDS.
- **Frontend Behavior:** The KDS will receive a real-time event when a dish is officially "launched," prompting the cook to start preparation.

### 2.3. Model Enhancements
- **CommandeLigne Fields:**
    - `heure_lancement` (DateTimeField): When the dish should start.
    - `heure_fin_estimee` (DateTimeField): When the dish is expected to be ready.
    - `temps_preparation_snapshot` (PositiveIntegerField): The prep time used for the calculation (to handle menu price/time changes).

### 2.4. Handling Updates
- **Dynamic Re-orchestration:** If items are added to an existing order, the `TargetReadyTime` must be recalculated. If the new `MaxPrepTime` requires a later ready time, existing "pending" launch tasks must be revoked and rescheduled.

## 3. Constraints
- **Idempotency:** Re-orchestration must be idempotent and handle cases where some items have already been started or completed.
- **Precision:** Celery tasks must handle millisecond-level precision if possible, though second-level is acceptable for kitchen environments.

## 4. Next Steps
- **Research Phase:** Investigate Celery's `apply_async(eta=...)` and how to effectively revoke/update scheduled tasks using task IDs or metadata.
- **Planning Phase:** Design the Orchestrator service class and the signal handlers to trigger it.

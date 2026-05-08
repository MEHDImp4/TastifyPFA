# Phase 31: Back-Office Dashboard KPIs - Research

## Data Aggregation Logic

### Real-time KPIs (Today)
1. **Today's Revenue**:
   - Source: `paiements.Paiement`
   - Filter: `statut='COMPLETE'`, `created_at__date=timezone.now().date()`
   - Aggregation: `Sum('montant')`
2. **Active Tables**:
   - Source: `tables.Table`
   - Filter: `statut='OCCUPEE'`
   - Aggregation: `Count('id')`
3. **Pending Orders**:
   - Source: `commandes.Commande`
   - Filter: `statut__in=['EN_COURS', 'EN_CUISINE']`, `est_active=True`
   - Aggregation: `Count('id')`
4. **Average Prep Time**:
   - Source: `commandes.CommandeLigne`
   - Filter: `statut='SERVI'`, `heure_lancement__isnull=False`, `created_at__date=timezone.now().date()`
   - Logic: `Avg(updated_at - heure_lancement)`
   - Note: In Django, this requires `ExpressionWrapper` with `DurationField`.

### Historical Trends
1. **7-Day Revenue**:
   - Query: `Paiement.objects.completed().filter(created_at__date__gte=today-6).values('created_at__date').annotate(total=Sum('montant')).order_by('created_at__date')`
2. **Top 5 Dishes**:
   - Query: `CommandeLigne.objects.filter(commande__est_active=True).values('plat__nom').annotate(total_qty=Sum('quantite')).order_by('-total_qty')[:5]`

## WebSocket Integration
- Reuse `StaffConsumer` in `core.consumers`.
- Use `apps.core.realtime.STAFF_GROUP`.
- Trigger `dashboard_update` event from signals:
  - `post_save` on `Paiement` (when status becomes COMPLETE).
  - `post_save` on `Table` (when status changes).
  - `post_save` on `Commande` (when status changes).

## Tech Stack Considerations
- **Recharts**: Chosen for its declarative React-first approach and ease of customization within the Ardoise theme.
- **DRF Custom ViewSet**: Create a `DashboardViewSet` in a new `analytics` app or inside `core` to consolidate these metrics into a single `/api/analytics/dashboard/` endpoint.

## Design Alignment (ECO-FRESH)
- Use `Teal (#2A9D8F)` for positive trends/revenue.
- Use `Ardoise (#264653)` for card backgrounds.
- Use `Amber (#E9C46A)` for pending items/warnings.
- Tabular figures for all numeric KPI values.

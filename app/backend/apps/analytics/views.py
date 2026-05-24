from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Avg, Q
from django.db.models.functions import TruncDate
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from apps.paiements.models import Paiement
from apps.tables.models import Table
from apps.commandes.models import Commande, CommandeLigne
from apps.avis.models import AnalyseSentiment
from apps.users.permissions import IsGerant  # Assuming there's a custom permission


class RevenuePointSerializer(serializers.Serializer):
    date = serializers.CharField()
    revenue = serializers.FloatField()


class TopDishSerializer(serializers.Serializer):
    name = serializers.CharField()
    quantity = serializers.IntegerField()


class LiveFeedItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    message = serializers.CharField()
    time = serializers.DateTimeField()


class SentimentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    positif_pct = serializers.FloatField()
    negatif_pct = serializers.FloatField()
    neutre_pct = serializers.FloatField()


class DashboardResponseSerializer(serializers.Serializer):
    todayRevenue = serializers.FloatField()
    activeTables = serializers.IntegerField()
    pendingOrders = serializers.IntegerField()
    avgPrepTime = serializers.IntegerField()
    revenue7Days = RevenuePointSerializer(many=True)
    topDishes = TopDishSerializer(many=True)
    liveFeed = LiveFeedItemSerializer(many=True)
    sentimentStats = SentimentStatsSerializer()

class DashboardAPIView(APIView):
    # Only authenticated users with the GERANT role should access this
    permission_classes = [IsAuthenticated, IsGerant]
    serializer_class = DashboardResponseSerializer

    @extend_schema(responses={200: DashboardResponseSerializer})
    def get(self, request, *args, **kwargs):
        today = timezone.now().date()
        
        # 1. Today's Revenue
        # Paiement completed today
        today_payments = Paiement.objects.completed().filter(
            updated_at__date=today
        )
        today_revenue = today_payments.aggregate(total=Sum('montant'))['total'] or 0.0

        # 2. Active Tables
        active_tables = Table.objects.active().filter(statut=Table.Statut.OCCUPEE).count()

        # 3. Pending Orders
        pending_orders = Commande.objects.active().filter(
            statut__in=[Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE]
        ).count()

        # 4. Average Prep Time (for items served today)
        served_lines = CommandeLigne.objects.filter(
            statut=CommandeLigne.Statut.SERVI,
            updated_at__date=today,
            heure_lancement__isnull=False
        )
        # avg duration = avg(updated_at - heure_lancement)
        avg_prep_duration = served_lines.aggregate(
            avg_duration=Avg(F('updated_at') - F('heure_lancement'))
        )['avg_duration']
        
        avg_prep_time_minutes = 0
        if avg_prep_duration:
            avg_prep_time_minutes = int(avg_prep_duration.total_seconds() / 60)

        # 5. Revenue last 7 days
        seven_days_ago = today - timedelta(days=6)
        daily_revenue_qs = Paiement.objects.completed().filter(
            updated_at__date__gte=seven_days_ago
        ).annotate(
            date=TruncDate('updated_at')
        ).values('date').annotate(
            revenue=Sum('montant')
        ).order_by('date')

        revenue_7_days = []
        # Fill in missing days with 0
        revenue_dict = {item['date']: item['revenue'] for item in daily_revenue_qs}
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            revenue_7_days.append({
                'date': d.strftime('%Y-%m-%d'),
                'revenue': float(revenue_dict.get(d, 0.0))
            })

        # 6. Top 5 Dishes (overall or last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        top_dishes_qs = CommandeLigne.objects.filter(
            commande__statut__in=[Commande.Statut.PAYEE, Commande.Statut.PRETE],
            created_at__date__gte=thirty_days_ago,
            statut__in=[CommandeLigne.Statut.PRET, CommandeLigne.Statut.SERVI]
        ).values(
            'plat__nom'
        ).annotate(
            total_quantity=Sum('quantite')
        ).order_by('-total_quantity')[:5]

        top_dishes = [
            {
                'name': item['plat__nom'],
                'quantity': item['total_quantity']
            }
            for item in top_dishes_qs
        ]

        # 7. Live Activity Feed (last 10 orders/payments)
        recent_orders = Commande.objects.order_by('-created_at')[:10]
        live_feed = []
        for o in recent_orders:
            live_feed.append({
                'id': f"cmd_{o.id}",
                'type': 'ORDER',
                'message': f"Nouvelle commande #{o.id} ({o.get_statut_display()})",
                'time': o.created_at.isoformat()
            })
            
        recent_payments = Paiement.objects.order_by('-created_at')[:10]
        for p in recent_payments:
            live_feed.append({
                'id': f"pay_{p.id}",
                'type': 'PAYMENT',
                'message': f"Paiement de {p.montant} DH reçu ({p.get_methode_display()})",
                'time': p.created_at.isoformat()
            })
            
        # sort by time descending and take top 10
        live_feed.sort(key=lambda x: x['time'], reverse=True)
        live_feed = live_feed[:10]

        # 8. Sentiment stats (from analysed reviews)
        total_analysed = AnalyseSentiment.objects.count()
        pos_count = AnalyseSentiment.objects.filter(label=AnalyseSentiment.Label.POSITIF).count()
        neg_count = AnalyseSentiment.objects.filter(label=AnalyseSentiment.Label.NEGATIF).count()
        neu_count = AnalyseSentiment.objects.filter(label=AnalyseSentiment.Label.NEUTRE).count()
        sentiment_stats = {
            'total': total_analysed,
            'positif_pct': round((pos_count / total_analysed * 100) if total_analysed else 0.0, 1),
            'negatif_pct': round((neg_count / total_analysed * 100) if total_analysed else 0.0, 1),
            'neutre_pct':  round((neu_count / total_analysed * 100) if total_analysed else 0.0, 1),
        }

        data = {
            'todayRevenue': float(today_revenue),
            'activeTables': active_tables,
            'pendingOrders': pending_orders,
            'avgPrepTime': avg_prep_time_minutes,
            'revenue7Days': revenue_7_days,
            'topDishes': top_dishes,
            'liveFeed': live_feed,
            'sentimentStats': sentiment_stats,
        }

        return Response(data)

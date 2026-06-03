from datetime import timedelta

from celery import current_app
from django.db import transaction
from django.utils import timezone

from apps.commandes.models import Commande, CommandeLigne


class KdsOrchestrator:
    """
    Petit planificateur de cuisine.
    Son but est simple: lancer les plats au bon moment pour qu'ils soient prêts ensemble.
    """

    @classmethod
    def reorchestrate_order(cls, commande):
        from apps.commandes.tasks import launch_item_task

        # On planifie uniquement les commandes déjà envoyées en cuisine.
        if commande.statut != Commande.Statut.EN_CUISINE:
            return

        lignes_a_prevoir = []
        lignes_en_cours = []

        with transaction.atomic():
            lignes = (
                commande.lignes.select_related('plat')
                .select_for_update()
                .filter(
                    statut__in=[
                        CommandeLigne.Statut.EN_ATTENTE,
                        CommandeLigne.Statut.EN_PREPARATION,
                    ]
                )
            )

            for ligne in lignes:
                if ligne.statut == CommandeLigne.Statut.EN_ATTENTE:
                    lignes_a_prevoir.append(ligne)
                if ligne.statut == CommandeLigne.Statut.EN_PREPARATION:
                    lignes_en_cours.append(ligne)

            if not lignes_a_prevoir:
                return

            heure_fin_commune = cls._calculer_heure_fin_commune(
                lignes_a_prevoir,
                lignes_en_cours,
            )

            for ligne in lignes_a_prevoir:
                cls._programmer_ligne(ligne, heure_fin_commune, launch_item_task)

    @classmethod
    def schedule_reorchestration_after_commit(cls, commande_id):
        """
        Attend la fin de l'enregistrement en base avant de recalculer la cuisine.
        C'est plus sûr car la commande et ses lignes sont alors vraiment sauvegardées.
        """

        def recalculer():
            commande = Commande.objects.get(pk=commande_id)
            cls.reorchestrate_order(commande)

        transaction.on_commit(recalculer)

    @staticmethod
    def _calculer_heure_fin_commune(lignes_a_prevoir, lignes_en_cours):
        maintenant = timezone.now()
        temps_max = 0

        for ligne in lignes_a_prevoir:
            if ligne.plat.temps_preparation > temps_max:
                temps_max = ligne.plat.temps_preparation

        heure_fin_commune = maintenant + timedelta(minutes=temps_max)

        # Si un plat est déjà en préparation et finit plus tard, on s'aligne dessus.
        for ligne in lignes_en_cours:
            if ligne.heure_fin_estimee and ligne.heure_fin_estimee > heure_fin_commune:
                heure_fin_commune = ligne.heure_fin_estimee

        return heure_fin_commune

    @staticmethod
    def _programmer_ligne(ligne, heure_fin_commune, launch_item_task):
        # Si cette ligne avait déjà une tâche Celery, on l'annule avant d'en créer une nouvelle.
        if ligne.celery_task_id:
            try:
                current_app.control.revoke(ligne.celery_task_id)
            except Exception:
                pass

        heure_lancement = heure_fin_commune - timedelta(minutes=ligne.plat.temps_preparation)

        try:
            resultat = launch_item_task.apply_async(args=[ligne.id], eta=heure_lancement)
        except Exception:
            return

        ligne.heure_lancement = heure_lancement
        ligne.heure_fin_estimee = heure_fin_commune
        ligne.temps_preparation_snapshot = ligne.plat.temps_preparation
        ligne.celery_task_id = resultat.id
        ligne.save(
            update_fields=[
                'heure_lancement',
                'heure_fin_estimee',
                'temps_preparation_snapshot',
                'celery_task_id',
                'updated_at',
            ]
        )

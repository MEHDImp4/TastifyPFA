from django.db import models
from django.conf import settings

class Employe(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profil_employe'
    )
    poste = models.CharField(max_length=100)
    salaire = models.DecimalField(max_digits=10, decimal_places=2)
    date_embauche = models.DateField()
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.TextField(blank=True)
    cin = models.CharField(max_length=20, unique=True, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        ordering = ['-date_embauche']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.poste}"


class Shift(models.Model):
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='shifts')
    jour = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['jour', 'heure_debut']
        unique_together = ['employe', 'jour', 'heure_debut']

    def __str__(self):
        return f"Shift {self.employe.user.username} - {self.jour}"


class OffreEmploi(models.Model):
    class TypeContrat(models.TextChoices):
        CDI = 'CDI', 'CDI'
        CDD = 'CDD', 'CDD'
        SAISONNIER = 'SAISONNIER', 'Saisonnier'

    titre = models.CharField(max_length=200)
    description = models.TextField()
    type_contrat = models.CharField(max_length=20, choices=TypeContrat.choices, default=TypeContrat.CDI)
    salaire_propose = models.CharField(max_length=100, blank=True)
    est_publiee = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Offre d'emploi"
        verbose_name_plural = "Offres d'emploi"
        ordering = ['-created_at']

    def __str__(self):
        return self.titre


class Candidature(models.Model):
    class Statut(models.TextChoices):
        NOUVELLE = 'NOUVELLE', 'Nouvelle'
        ENTRETENUE = 'ENTRETENUE', 'Entretien'
        REFUSEE = 'REFUSEE', 'Refusée'
        RECRUTEE = 'RECRUTEE', 'Recrutée'

    offre = models.ForeignKey(OffreEmploi, on_delete=models.CASCADE, related_name='candidatures')
    nom_complet = models.CharField(max_length=200)
    email = models.EmailField()
    telephone = models.CharField(max_length=20)
    message_motivation = models.TextField()
    cv_url = models.URLField(blank=True, help_text="Lien vers le CV (ex: Google Drive, LinkedIn)")
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.NOUVELLE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Candidature {self.nom_complet} - {self.offre.titre}"


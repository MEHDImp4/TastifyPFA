from django.db import models

class RestaurantConfiguration(models.Model):
    nom = models.CharField(max_length=100, default="Tastify Restaurant")
    adresse = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    
    # JSON field for opening hours: {"lun": "09:00-22:00", ...}
    horaires = models.JSONField(default=dict, blank=True)
    
    devise = models.CharField(max_length=10, default="DH")
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration Restaurant"
        verbose_name_plural = "Configuration Restaurant"

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        # Singleton pattern: ensure only one record exists
        if not self.pk and RestaurantConfiguration.objects.exists():
            return
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

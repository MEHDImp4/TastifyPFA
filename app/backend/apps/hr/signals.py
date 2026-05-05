from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Employe

@receiver(post_delete, sender=Employe)
def deactivate_user_on_employee_delete(sender, instance, **kwargs):
    """
    When an Employe record is deleted, we deactivate the associated User account.
    This ensures soft-delete behavior even when deleted from the Admin or Shell.
    """
    if instance.user:
        instance.user.is_active = False
        instance.user.save()

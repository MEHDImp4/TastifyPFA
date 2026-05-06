from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.users.models import Utilisateur
from apps.reservations.models import Reservation
from apps.reservations.permissions import STAFF_ROLES
from apps.reservations.services import create_reservation, update_reservation

CLIENT_ALLOWED_STATUTS = {Reservation.Statut.ANNULEE}


class ReservationSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    client_details = serializers.SerializerMethodField(read_only=True)
    table_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'client',
            'client_details',
            'table',
            'table_details',
            'date_reservation',
            'heure_debut',
            'heure_fin',
            'nombre_personnes',
            'statut',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'client', 'client_details', 'table_details', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if not obj.client:
            return None
        return {
            'id': obj.client.id,
            'username': obj.client.username,
            'first_name': obj.client.first_name,
            'last_name': obj.client.last_name,
        }

    def get_table_details(self, obj):
        if not obj.table:
            return None
        return {
            'id': obj.table.id,
            'numero': obj.table.numero,
            'capacite': obj.table.capacite,
        }

    def _is_staff(self):
        request = self.context.get('request')
        return request and request.user and request.user.role in STAFF_ROLES

    def validate_statut(self, value):
        """
        Non-staff users cannot choose statut on create or set values outside CLIENT_ALLOWED_STATUTS
        on update — prevents privilege escalation on both paths (T-23-05, CR-01).
        """
        if not self._is_staff():
            if self.instance is None:
                raise serializers.ValidationError(
                    "Les clients ne peuvent pas choisir le statut initial."
                )
            if value not in CLIENT_ALLOWED_STATUTS:
                raise serializers.ValidationError(
                    "Les clients ne peuvent que annuler une reservation."
                )
        return value

    def create(self, validated_data):
        request = self.context['request']
        if request.user.role in STAFF_ROLES:
            client = validated_data.pop('client', request.user)
        else:
            validated_data.pop('client', None)
            client = request.user

        try:
            return create_reservation(client=client, **validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)

    def update(self, instance, validated_data):
        validated_data.pop('client', None)
        try:
            return update_reservation(instance, **validated_data)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)

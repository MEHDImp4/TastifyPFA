from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.users.permissions import IsGerant
from core.pagination import OptInPageNumberPagination
from .models import Employe, Shift, OffreEmploi, Candidature
from .serializers import EmployeSerializer, ShiftSerializer, OffreEmploiSerializer, CandidatureSerializer

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('user').all()
    serializer_class = EmployeSerializer
    pagination_class = OptInPageNumberPagination

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        if self.request.user.role == 'GERANT':
            queryset = self.queryset
        else:
            queryset = self.queryset.filter(user__is_active=True)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(user__username__icontains=search)
                | models.Q(user__first_name__icontains=search)
                | models.Q(user__last_name__icontains=search)
                | models.Q(user__email__icontains=search)
                | models.Q(poste__icontains=search)
                | models.Q(telephone__icontains=search)
                | models.Q(cin__icontains=search)
            )

        poste = self.request.query_params.get('poste')
        if poste:
            queryset = queryset.filter(
                models.Q(poste__iexact=poste)
                | models.Q(user__role__iexact=poste)
            )

        return queryset.order_by('-date_embauche', '-id')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'GERANT':
            return self.queryset
        return self.queryset.filter(employe__user=user)


class OffreEmploiViewSet(viewsets.ModelViewSet):
    queryset = OffreEmploi.objects.all()
    serializer_class = OffreEmploiSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]


class CandidatureViewSet(viewsets.ModelViewSet):
    queryset = Candidature.objects.all()
    serializer_class = CandidatureSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]


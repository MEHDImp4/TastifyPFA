from __future__ import annotations

from datetime import date, time, timedelta
from decimal import Decimal
from random import choice

from locust import HttpUser, between, task


STAFF_PASSWORD = "password123"
CLIENT_PASSWORD = "password123"


class BaseTastifyUser(HttpUser):
    abstract = True
    wait_time = between(1, 3)
    username = ""
    password = ""
    portal = "staff"

    def on_start(self):
        self.headers = {}
        self._login()

    def _login(self):
        request_headers = {}
        if self.portal == "client":
            request_headers["X-Tastify-Portal"] = "client"

        response = self.client.post(
            "/api/users/login/",
            json={"username": self.username, "password": self.password},
            headers=request_headers,
            name="auth.login",
        )
        if response.status_code == 200:
            token = response.json()["access"]
            self.headers = {"Authorization": f"Bearer {token}"}
            self.client.headers.update(self.headers)


class ManagerAnalyticsUser(BaseTastifyUser):
    weight = 3
    username = "gerant_test"
    password = STAFF_PASSWORD

    @task(4)
    def inspect_dashboard(self):
        self.client.get("/api/analytics/dashboard/", name="analytics.dashboard")

    @task(3)
    def browse_menu_catalog(self):
        self.client.get("/api/categories/", name="menu.categories")
        self.client.get("/api/plats/", name="menu.plats")
        self.client.get("/api/plats/top-recommendations/", name="menu.top_recommendations")


class ClientReservationUser(BaseTastifyUser):
    weight = 3
    username = "client_test"
    password = CLIENT_PASSWORD
    portal = "client"

    def _reservation_payload(self, table_id=1):
        reservation_day = (date.today() + timedelta(days=7)).isoformat()
        return {
            "table": table_id,
            "date_reservation": reservation_day,
            "heure_debut": time(hour=19, minute=0).isoformat(timespec="minutes"),
            "heure_fin": time(hour=20, minute=30).isoformat(timespec="minutes"),
            "nombre_personnes": 2,
            "notes": "Locust coverage booking",
        }

    def _find_available_table_id(self):
        reservation = self._reservation_payload()
        response = self.client.get(
            "/api/reservations/available_tables/",
            params={
                "date": reservation["date_reservation"],
                "heure_debut": reservation["heure_debut"],
                "heure_fin": reservation["heure_fin"],
                "nombre_personnes": reservation["nombre_personnes"],
            },
            name="reservations.available_tables",
        )
        if response.status_code >= 400:
            return None

        tables = response.json()
        available = [table["id"] for table in tables if table.get("est_disponible")]
        if not available:
            return None
        return choice(available)

    @task(2)
    def browse_menu_catalog(self):
        self.client.get("/api/categories/", name="menu.categories")
        self.client.get("/api/plats/", name="menu.plats")
        self.client.get("/api/plats/top-recommendations/", name="menu.top_recommendations")

    @task(2)
    def check_reservation_availability(self):
        self._find_available_table_id()

    @task(1)
    def create_reservation(self):
        table_id = self._find_available_table_id()
        if not table_id:
            return

        self.client.post(
            "/api/reservations/",
            json=self._reservation_payload(table_id=table_id),
            name="reservations.create",
        )


class StaffPaymentFlowUser(BaseTastifyUser):
    weight = 2
    username = "serveur_test"
    password = STAFF_PASSWORD

    def _get_payable_table_id(self):
        response = self.client.get("/api/tables/", name="tables.list")
        if response.status_code >= 400:
            return None

        tables = response.json()
        candidates = [
            table["id"]
            for table in tables
            if table.get("est_active", True)
            and table.get("statut_effectif") not in {"OCCUPEE", "RESERVEE"}
        ]
        if not candidates:
            return None
        return choice(candidates)

    def _get_available_plat_id(self):
        response = self.client.get("/api/plats/", name="menu.plats")
        if response.status_code >= 400:
            return None

        plats = response.json()
        available = [plat["id"] for plat in plats if plat.get("est_disponible", True)]
        if not available:
            return None
        return choice(available)

    def _create_order_for_payment(self):
        table_id = self._get_payable_table_id()
        plat_id = self._get_available_plat_id()
        if not table_id or not plat_id:
            return None

        order_response = self.client.post(
            "/api/commandes/",
            json={
                "table": table_id,
                "type": "SUR_PLACE",
                "lignes": [
                    {"plat": plat_id, "quantite": 1},
                ],
            },
            name="commandes.create",
        )
        if order_response.status_code >= 400:
            return None

        qr_response = self.client.get(f"/api/tables/{table_id}/qr/", name="tables.qr")
        if qr_response.status_code >= 400:
            return None

        return qr_response.json().get("token")

    @task(1)
    def resolve_and_pay_session(self):
        token = self._create_order_for_payment()
        if not token:
            return

        resolve_response = self.client.post(
            "/api/paiements/session/resolve/",
            json={"token": token},
            name="payments.session_resolve",
        )
        if resolve_response.status_code >= 400:
            return

        session = resolve_response.json()
        amount = Decimal(str(session.get("remaining_balance") or "0"))
        if amount <= 0:
            return

        self.client.post(
            "/api/paiements/session/pay/",
            json={
                "token": token,
                "montant": f"{amount:.2f}",
                "reference_transaction": f"LOCUST-{self.environment.runner.user_count}",
                "contributions": [],
            },
            name="payments.session_pay",
        )

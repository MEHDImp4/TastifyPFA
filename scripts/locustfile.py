from locust import HttpUser, task, between

class TastifyUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        """Login and get token."""
        response = self.client.post("/api/users/login/", json={
            "username": "admin",
            "password": "password"
        })
        if response.status_code == 200:
            token = response.json()["access"]
            self.client.headers.update({"Authorization": f"Bearer {token}"})

    @task(3)
    def view_menu(self):
        self.client.get("/api/menu/plats/")
        self.client.get("/api/menu/categories/")

    @task(2)
    def view_active_orders(self):
        self.client.get("/api/commandes/?scope=kitchen")

    @task(1)
    def create_order(self):
        self.client.post("/api/commandes/", json={
            "table": 1,
            "lignes": [
                {"plat": 1, "quantite": 2},
                {"plat": 2, "quantite": 1}
            ]
        })
